import os
import time
from typing import List, Tuple
import geopandas as gpd
import rasterio
from rasterio.enums import Resampling
from rasterio.warp import  reproject
from rasterio.transform import from_origin
from rasterio.mask import mask
from shapely.geometry import mapping
import matplotlib.pyplot as plt
from tqdm import tqdm
from app.api.service.geoserver_svc.geoserver import Geoserver
from xml.dom import minidom
from xml.etree import ElementTree as ET
from app.utils.network_conf import GeoConfig
import uuid
from app.database.config.dependency import db_dependency
from pathlib import Path
from app.api.service.river_water_management.spt_service import Stp_service
from app.database.crud.stp_crud import STP_suitability_crud
from app.conf.settings import Settings
import zipfile
import tempfile
import geopandas as gpd
import numpy as np
import pandas as pd
from rasterstats import zonal_stats
from rasterio.enums import Resampling
from pyproj import Transformer
import pandas as pd
from rasterstats import zonal_stats
from rasterio.features import shapes
from app.api.schema.stp_schema import  STP_suitability_Area, STPCatchmentOutput, STPCategory, STPsuitabilityInput
from scipy.ndimage import label
from app.utils.name import Unique_name
from shapely.ops import unary_union
from app.conf.redis.redis_async_manager import async_redis_manager
from shapely.geometry import shape, LineString, Point
from app.api.exception.exceptions import CustomException

geo=Geoserver()

class RasterProcess:    
    def __init__(self, config: GeoConfig = GeoConfig()):
        super().__init__()
        self.output_dir=Path(config.output_path) / "SLD" 
        self.geoserver_url = config.geoserver_url
        self.username = config.username
        self.password = config.password
        self.geoserver_external_url = config.geoserver_external_url 
        self.raster_workspace="raster_work"
        self.raster_store="stp_raster_store"
        self.config = config
        self.aligned_arrays = []
        self.reference_profile = None
        os.makedirs(self.output_dir, exist_ok=True)
        
        
    def _calculate_common_extent(self, raster_paths: List[str]) -> Tuple[float, float, float, float, int, int]:
        all_bounds = []
        
        for path in raster_paths:
            with rasterio.open(path) as src:
                bounds = rasterio.warp.transform_bounds(
                    src.crs, self.config.target_crs, *src.bounds
                )
                all_bounds.append(bounds)
        
       
        minx = min(b[0] for b in all_bounds)
        miny = min(b[1] for b in all_bounds)
        maxx = max(b[2] for b in all_bounds)
        maxy = max(b[3] for b in all_bounds)
        
       
        width = int((maxx - minx) / self.config.target_resolution[0])
        height = int((maxy - miny) / self.config.target_resolution[1])
        
        return minx, miny, maxx, maxy, width, height
    
    def _normalize_array(self, array: np.ndarray) -> np.ndarray:
        array[array < 0] = 0
        min_val = np.nanmin(array)
        max_val = np.nanmax(array)
        norm_array = (array - min_val) / (max_val - min_val + 1e-6)
        return norm_array
    
    def align_rasters(self, raster_paths: List[str]) -> None:            
        minx, _, maxx, maxy, width, height = self._calculate_common_extent(raster_paths)
        transform = from_origin(minx, maxy, 
                               self.config.target_resolution[0], 
                               self.config.target_resolution[1])
        
 
        for path in tqdm(raster_paths, desc="Aligning rasters"):
            with rasterio.open(path) as src:
                dst_array = np.zeros((height, width), dtype=np.float32)
                reproject(
                    source=rasterio.band(src, 1),
                    destination=dst_array,
                    src_transform=src.transform,
                    src_crs=src.crs,
                    dst_transform=transform,
                    dst_crs=self.config.target_crs,
                    resampling=Resampling.bilinear
                )
                
                # Normalize
                norm_array = self._normalize_array(dst_array)
                self.aligned_arrays.append(norm_array)
                
                # Save reference profile from first raster
                if self.reference_profile is None:
                    self.reference_profile = src.meta.copy()
                    self.reference_profile.update({
                        "crs": self.config.target_crs,
                        "transform": transform,
                        "width": width,
                        "height": height,
                        "dtype": 'float32'
                    })
        
    def create_weighted_overlay(self, weights: List[float], output_name: str = "weighted_overlay.tif") -> str:
        
        if len(weights) != len(self.aligned_arrays):
            raise ValueError(f"Number of weights ({len(weights)}) must match number of rasters ({len(self.aligned_arrays)})")

        weighted_sum = self.aligned_arrays[0] * weights[0]
 
        for i in range(1, len(self.aligned_arrays)):
            weighted_sum += self.aligned_arrays[i] * weights[i]
    

        weighted_sum = np.nan_to_num(weighted_sum, nan=-9999.0)
        
        output_profile = self.reference_profile.copy()
        output_profile.update({
            'nodata': -9999,
            'dtype': 'float32'
        })
        
        return weighted_sum
    
    def apply_stp_constraint(self, weighted_sum: np.ndarray, constraint_path: str = None, 
                        output_name: str = "constrained_overlay.tif") -> str:
        constraint_path = self.config.constraint_raster_path if constraint_path is None else constraint_path
        constraint_aligned = np.zeros_like(weighted_sum, dtype=np.float32)
        
        with rasterio.open(constraint_path) as src:
            reproject(
                source=rasterio.band(src, 1),
                destination=constraint_aligned,
                src_transform=src.transform,
                src_crs=src.crs,
                dst_transform=self.reference_profile['transform'],
                dst_crs=self.reference_profile['crs'],
                resampling=Resampling.nearest
            )
        

        constraint_mask = np.where(constraint_aligned >= 1, 1, 0).astype("float32")
        final_priority = weighted_sum * constraint_mask
        output_path = os.path.join(self.config.output_path, output_name)
        with rasterio.open(output_path, 'w', **self.reference_profile) as dst:
            dst.write(final_priority, 1)
        return output_path
    
    def apply_constraints_new(self, weighted_sum: np.ndarray, constraint_paths: List[str] = None,
                        output_name: str = "constrained_overlay.tif") -> str:
       
       
        if len(constraint_paths) == 0:
            final_priority = weighted_sum
        else:
            combined_constraint_mask = np.ones_like(weighted_sum, dtype=np.float32)

            for path in constraint_paths:
                constraint_aligned = np.zeros_like(weighted_sum, dtype=np.float32)
                with rasterio.open(path) as src:
                    reproject(
                        source=rasterio.band(src, 1),
                        destination=constraint_aligned,
                        src_transform=src.transform,
                        src_crs=src.crs,
                        dst_transform=self.reference_profile['transform'],
                        dst_crs=self.reference_profile['crs'],
                        resampling=Resampling.nearest
                    )

                constraint_mask = np.where(constraint_aligned >= 1, 1, 0).astype("float32")
                combined_constraint_mask *= constraint_mask

            final_priority = combined_constraint_mask*weighted_sum

        # Save constrained overlay
        output_path = os.path.join(self.config.output_path, output_name)
        with rasterio.open(output_path, 'w', **self.reference_profile) as dst:
            dst.write(final_priority, 1)

        return output_path, final_priority
    
    def _saveraster(self,out_image,output_path:str,out_meta:dict):
        with rasterio.open(output_path, "w", **out_meta) as dest:
            dest.write(out_image)
       
    def _generate_colors(self,num_classes, color_ramp='blue_to_red'):
        colors = []
        if color_ramp == 'blue_to_red':
            for i in range(num_classes):
                # Calculate interpolation factor (0 to 1)
                t = i / max(1, num_classes - 1)
                
                if t < 0.5:
                    # Blue to Green transition (first half)
                    r = int(0 + t * 2 * 255)  # 0 to 255
                    g = int(0 + t * 2 * 255)  # 0 to 255
                    b = 255                   # Stay at 255
                else:
                    # Green to Red transition (second half)
                    r = 255                               # Stay at 255
                    g = int(255 - (t - 0.5) * 2 * 255)    # 255 to 0
                    b = int(255 - (t - 0.5) * 2 * 255)    # 255 to 0
                    
                hex_color = f"#{r:02x}{g:02x}{b:02x}"
                colors.append(hex_color.upper())
        
        elif color_ramp == 'orange_to_green':
            rgb_colors = [
                (204, 0, 0),    # Red
                (255, 128, 0),  # Orange
                (255, 255, 0),  # Yellow
                (50, 205, 50),  # Parrot Green
                (0, 100, 0)     # Deep Green
            ]
            
            for rgb in rgb_colors:
                r, g, b = rgb
                hex_color = f"#{r:02x}{g:02x}{b:02x}"
                colors.append(hex_color.upper())

        elif color_ramp == 'greenTOred':
            for i in range(num_classes):
        # Calculate interpolation factor (0 to 1)
                t = i / max(1, num_classes - 1)

                r = int(t * 255)           # 0 to 255
                g = int(255 * (1 - t))     # 255 to 0
                b = 0                      # Always 0
                    
                hex_color = f"#{r:02x}{g:02x}{b:02x}"
                colors.append(hex_color.upper())
        elif color_ramp == 'viridis':
            # Approximation of viridis colormap
            viridis_anchors = [
                (68, 1, 84),    # Dark purple
                (59, 82, 139),   # Purple
                (33, 144, 140),  # Teal
                (93, 201, 99),   # Green
                (253, 231, 37)   # Yellow
            ]
            
            for i in range(num_classes):
                t = i / max(1, num_classes - 1)
                idx = min(int(t * (len(viridis_anchors) - 1)), len(viridis_anchors) - 2)
                interp = t * (len(viridis_anchors) - 1) - idx
                
                r = int(viridis_anchors[idx][0] * (1 - interp) + viridis_anchors[idx + 1][0] * interp)
                g = int(viridis_anchors[idx][1] * (1 - interp) + viridis_anchors[idx + 1][1] * interp)
                b = int(viridis_anchors[idx][2] * (1 - interp) + viridis_anchors[idx + 1][2] * interp)
                
                hex_color = f"#{r:02x}{g:02x}{b:02x}"
                colors.append(hex_color.upper())
        
        elif color_ramp == 'terrain':
            # Approximation of terrain colormap
            terrain_anchors = [
                (0, 0, 92),      # Dark blue
                (0, 128, 255),   # Light blue
                (0, 255, 128),   # Light green
                (255, 255, 0),   # Yellow
                (128, 64, 0),    # Brown
                (255, 255, 255)  # White
            ]
            
            for i in range(num_classes):
                t = i / max(1, num_classes - 1)
                idx = min(int(t * (len(terrain_anchors) - 1)), len(terrain_anchors) - 2)
                interp = t * (len(terrain_anchors) - 1) - idx
                
                r = int(terrain_anchors[idx][0] * (1 - interp) + terrain_anchors[idx + 1][0] * interp)
                g = int(terrain_anchors[idx][1] * (1 - interp) + terrain_anchors[idx + 1][1] * interp)
                b = int(terrain_anchors[idx][2] * (1 - interp) + terrain_anchors[idx + 1][2] * interp)
                
                hex_color = f"#{r:02x}{g:02x}{b:02x}"
                colors.append(hex_color.upper())
                
        elif color_ramp == 'spectral':
            # Approximation of spectral colormap (red to blue)
            spectral_anchors = [
                (213, 62, 79),    # Red
                (253, 174, 97),   # Orange
                (254, 224, 139),  # Yellow
                (230, 245, 152),  # Light yellow-green
                (171, 221, 164),  # Light green
                (102, 194, 165),  # Teal
                (50, 136, 189)    # Blue
            ]
            
            for i in range(num_classes):
                t = i / max(1, num_classes - 1)
                idx = min(int(t * (len(spectral_anchors) - 1)), len(spectral_anchors) - 2)
                interp = t * (len(spectral_anchors) - 1) - idx
                
                r = int(spectral_anchors[idx][0] * (1 - interp) + spectral_anchors[idx + 1][0] * interp)
                g = int(spectral_anchors[idx][1] * (1 - interp) + spectral_anchors[idx + 1][1] * interp)
                b = int(spectral_anchors[idx][2] * (1 - interp) + spectral_anchors[idx + 1][2] * interp)
                
                hex_color = f"#{r:02x}{g:02x}{b:02x}"
                colors.append(hex_color.upper())
        
        else:
            return self._generate_colors(num_classes, 'blue_to_red')
        return colors

    def _generate_sld_xml(self, intervals, colors):
       
        # Create the XML document with proper namespaces
        root = ET.Element("sld:StyledLayerDescriptor")
        root.set("xmlns:sld", "http://www.opengis.net/sld")
        root.set("xmlns", "http://www.opengis.net/sld")
        root.set("xmlns:gml", "http://www.opengis.net/gml")
        root.set("xmlns:ogc", "http://www.opengis.net/ogc")
        root.set("version", "1.0.0")
        
        # Create the named layer
        named_layer = ET.SubElement(root, "sld:NamedLayer")
        layer_name = ET.SubElement(named_layer, "sld:Name")
        layer_name.text = "raster"
        
        # Create the user style
        user_style = ET.SubElement(named_layer, "sld:UserStyle")
        style_name = ET.SubElement(user_style, "sld:Name")
        style_name.text = "raster"
        
        title = ET.SubElement(user_style, "sld:Title")
        title.text = f"{len(colors)}-Class Raster Style with Ranges"
        
        abstract = ET.SubElement(user_style, "sld:Abstract")
        abstract.text = "SLD with explicit value ranges for raster styling"
        
        # Create feature type style
        feature_type_style = ET.SubElement(user_style, "sld:FeatureTypeStyle")
        rule = ET.SubElement(feature_type_style, "sld:Rule")
        
        # Create raster symbolizer
        raster_symbolizer = ET.SubElement(rule, "sld:RasterSymbolizer")
        
        # Create color map - using type="ramp" as in the example
        color_map = ET.SubElement(raster_symbolizer, "sld:ColorMap",
                              type="ramp", extended="True")
        color_map.set("type", "ramp")
        
        # Define class labels
        level_class = ["  Very low", "  Low", "  Moderate", "  High", "  Very high"]
        
        # Add color map entries
        for i in range(len(intervals)-1):
            entry = ET.SubElement(color_map, "sld:ColorMapEntry")
            entry.set("color", colors[i])
            entry.set("quantity", str(intervals[i]))
            
            # Use level class labels if available, otherwise use a default
            if i < len(level_class):
                entry.set("label", level_class[i])
            else:
                entry.set("label", f"class_{i+1}")
        
        # Convert to string with pretty printing
        rough_string = ET.tostring(root, 'utf-8')
        reparsed = minidom.parseString(rough_string)
        pretty_xml = reparsed.toprettyxml(indent="  ")
        
        # Clean up the XML to match the sample exactly
        # Remove XML declaration and add a custom one
        xml_lines = pretty_xml.split('\n')
        xml_lines[0] = '<?xml version="1.0" encoding="UTF-8"?>'
        pretty_xml = '\n'.join(xml_lines)
        
        return pretty_xml

    def _generate_dynamic_sld(self,raster_path:str,num_classes:int,color_ramp:str='blue_to_red',reverse:bool=False):
        with rasterio.open(raster_path) as src:
            data = src.read(1, masked=True)
            valid_data = data[~data.mask]
            if len(valid_data) == 0:
                raise ValueError("Raster contains no valid data")
            min_val = float(np.min(valid_data))
            max_val = max(float(np.max(valid_data)), 1.0)

        if min_val == max_val:
            intervals = [min_val] * num_classes
        else:
            intervals = np.linspace(min_val, max_val, num_classes+1)
        colors = self._generate_colors(num_classes, color_ramp)

        if reverse:
            colors = colors[::-1]
       
        sld_content = self._generate_sld_xml(intervals, colors)
        unique_name = f"style_{uuid.uuid4().hex}.sld"
        output_sld_path = os.path.join(self.output_dir, unique_name)        
        with open(output_sld_path, 'w', encoding='utf-8') as f:
            f.write(sld_content)
        return output_sld_path
    
    def processRaster(self,file_path:str,reverse:bool=False):
        try:
            #sld_path=self._generate_dynamic_sld(raster_path=file_path,num_classes=5,color_ramp='viridis')
            #sld_path=self._generate_dynamic_sld(raster_path=file_path,num_classes=5,color_ramp='blue_to_red')
            sld_path=self._generate_dynamic_sld(raster_path=file_path,num_classes=5,color_ramp='orange_to_green',reverse=reverse)
            #sld_path=self._generate_dynamic_sld(raster_path=file_path,num_classes=5,color_ramp='spectral')
            #sld_path=self._generate_dynamic_sld(raster_path=file_path,num_classes=5,color_ramp='terrain') #terrain
            #sld_path=self._generate_dynamic_sld(raster_path=file_path,num_classes=5,color_ramp="greenTOred")
            sld_name = os.path.basename(sld_path).split('.')[0]
            return sld_path,sld_name
        except Exception as e:
            print("exceprion",e)
            return False
    
    def clip_to_basin(self, raster_path: str, shapefile_path: str = None, 
                     output_name: str = "clipped_priority_map.tif") -> str:
        
        basin = gpd.read_file(shapefile_path)
        if basin.crs is None:
            basin.set_crs("EPSG:32644", inplace=True,allow_override=True) 
        try:
            basin = basin.to_crs("EPSG:32644")
        except Exception as e:
            print(e)

        with rasterio.open(raster_path) as src:
            out_image, out_transform = mask(dataset=src, shapes=basin.geometry, crop=True)
            out_meta = src.meta.copy()
        
        
        out_meta.update({
            "height": out_image.shape[1],
            "width": out_image.shape[2],
            "transform": out_transform
        })
        
        
        output_path = os.path.join(self.config.output_path, output_name)
        self._saveraster(out_image,output_path,out_meta)
        return output_path
   
    def clip_to_user_villages(self, raster_path: str,final_name:str,clip:List[int]=None,place:str=None  ) -> str:
        if place == "Drain":
            villages_vector=self.get_village(clip)
        else:
            villages_vector=self.get_sub_village(clip)
        with rasterio.open(raster_path) as src:
            out_image, out_transform = mask(dataset=src, shapes=villages_vector.geometry, crop=True)
            out_meta = src.meta.copy()
        out_meta.update({
            "driver": "GTiff",
            "height": out_image.shape[1],
            "width": out_image.shape[2],
            "transform": out_transform
        })
        output_path = os.path.join(self.config.output_path, final_name)
        with rasterio.open(output_path, "w", **out_meta) as dest:
            dest.write(out_image)
        return output_path

    def clip_to_town_buffer(self, raster_path: str,clip:List[int]=None  ) -> str:
            buffered_gdf =self.get_town_village(clip)
            geometry_for_mask = [mapping(geom) for geom in buffered_gdf.geometry]
            with rasterio.open(raster_path) as src:
                out_image, out_transform = mask(dataset=src, shapes=geometry_for_mask, crop=True)
                out_meta = src.meta.copy()
            out_meta.update({
                "height": out_image.shape[1],
                "width": out_image.shape[2],
                "transform": out_transform
            })
            output_name=Unique_name.unique_name_with_ext(raster_path.split('/')[-1].rsplit('.', 1)[0],"tif")
            output_path = os.path.join(self.config.output_path, output_name)
            self._saveraster(out_image,output_path,out_meta)
            return output_path
        
    def clip_to_drain_buffer(self, raster_path: str,clip:List[int]=None  ) -> str:
        try:
            buffered_gdf = self.get_drain_buffer(clip)
            geometry_for_mask = [mapping(geom) for geom in buffered_gdf.geometry]
            with rasterio.open(raster_path) as src:
                out_image, out_transform = mask(dataset=src, shapes=geometry_for_mask, crop=True)
                out_meta = src.meta.copy()
            out_meta.update({
                "height": out_image.shape[1],
                "width": out_image.shape[2],
                "transform": out_transform
            })
            output_name=Unique_name.unique_name_with_ext(raster_path.split('/')[-1].rsplit('.', 1)[0],"tif")
            output_path = os.path.join(self.config.output_path, output_name)
            self._saveraster(out_image,output_path,out_meta)
            return output_path
        except Exception as e:
            print(e)
    
    def _get_table_data(self,villages_vector:gpd.GeoDataFrame, stats:list):
        class_labels = {
                1: 'Very_Low',
                2: 'Low',
                3: 'Medium',
                4: 'High',
                5: 'Very_High'
                }
        results = []
        for i, counts in enumerate(stats):
            shape_name = villages_vector.iloc[i]['Name']
            total_pixels = sum([v for k, v in counts.items() if k in class_labels])
            result = {'Village_Name': shape_name}
            for class_val, label in class_labels.items():
                pixel_count = counts.get(class_val, 0)
                percent = (pixel_count / total_pixels * 100) if total_pixels > 0 else 0
                result[label] = round(percent, 2)
            results.append(result)
        return results
    def _classify_risk(self,value):
        if pd.isna(value): return "No Data" 
        elif 0 <= value < 0.2: return "Very Low" 
        elif 0.2 <= value < 0.4: return "Low" 
        elif 0.4 <= value < 0.6: return "Medium" 
        elif 0.6 <= value < 0.8: return "High" 
        elif 0.8 <= value <= 1.0: return "Very High" 
        else: return "No Data"         
    def clip_details(
        self,
        raster_path: str,          
        priority_raster: str,    
        villages_vector: gpd.GeoDataFrame,
    ):
    
        with rasterio.open(raster_path) as src:
            raster = src.read(1, masked=True)
            affine = src.transform

            min_val = raster.min()
            max_val = raster.max()
            bins = np.linspace(min_val, max_val, 6)

            reclass_raster = np.digitize(raster, bins[1:-1]) + 1
            reclass_raster = np.where(raster.mask, 0, reclass_raster)

        stats = zonal_stats(
            vectors=villages_vector,
            raster=reclass_raster,
            affine=affine,
            nodata=0,
            categorical=True,
            geojson_out=False,
            all_touched=True
        )


        results = self._get_table_data(villages_vector, stats)


        with rasterio.open(priority_raster) as src2:
            raster2 = src2.read(1, masked=True)
            affine2 = src2.transform
            nodata2 = src2.nodata
            crs2 = src2.crs

        # Match CRS if needed
        if villages_vector.crs != crs2:
            villages_vector = villages_vector.to_crs(crs2)

        mean_stats = zonal_stats(
            villages_vector,
            raster2,
            affine=affine2,
            stats=["mean"],
            nodata=nodata2,
            all_touched=True
        )

        # =========================
        # 🔹 Merge Results
        # =========================
        safe_len = min(len(results), len(mean_stats))

        for i in range(safe_len):
            mean_val = mean_stats[i].get("mean") if mean_stats[i] else None

            results[i]["mean"] = round(mean_val, 4) if mean_val is not None else None
            results[i]["Risk Factor"] = self._classify_risk(mean_val)


        return results

      
    
    async def save_vector(self,vector,name:str):
       
        unique_village_zip = f"{name}.zip"
        output_zip_path = self.config.output_path / unique_village_zip

        with tempfile.TemporaryDirectory() as temp_dir:
            temp_shp = Path(temp_dir) / f"{name}.shp"

            vector.to_file(temp_shp, driver='ESRI Shapefile', engine='fiona')
            
            # Create zip with all shapefile components
            with zipfile.ZipFile(output_zip_path, 'w') as zipf:
                for file in temp_shp.parent.glob(f"{name}.*"):
                    zipf.write(file, file.name)

        name_only = os.path.splitext(os.path.basename(output_zip_path))[0]
        await geo.upload_vector("vector_work",str(output_zip_path),name_only)
        return name_only

class STP_Area:
    def __init__(self):
        self.SUITABILITY_THRESHOLD = 0.417
        self.elivation_path=Settings().elivation_path
        self.TEMP_DIR=Settings().TEMP_DIR

    async def _temporory_vector(self,vector_temp_file:gpd.GeoDataFrame,name:str):
        unique_village_zip = f"{name}.zip"
        output_zip_path = self.TEMP_DIR+"/"+ unique_village_zip
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_shp = Path(temp_dir) / f"{name}.shp"
            vector_temp_file.to_file(temp_shp, driver='ESRI Shapefile', engine='fiona')
            with zipfile.ZipFile(output_zip_path, 'w') as zipf:
                for file in temp_shp.parent.glob(f"{name}.*"):
                    zipf.write(file, file.name)

            name_only = os.path.splitext(os.path.basename(output_zip_path))[0]
            await Geoserver().upload_vector("vector_work",output_zip_path,name_only)
        return name_only
    
    def _centroid_location(self,location:list):
        lon_sum = 0
        lat_sum = 0

        for lat, lon in location:
            lat_sum += lat
            lon_sum += lon

        n = len(location)
        centroid_lon = lon_sum / n
        centroid_lat = lat_sum / n

        return centroid_lon, centroid_lat

    async def _read_raster(self,layer_name:str):
        raster_path= await async_redis_manager.get(layer_name)
        if raster_path is None:
            raise CustomException(status_code=404, detail="Layer not found")
        with rasterio.open(raster_path) as src:
            data = src.read(1)
            transform = src.transform
            crs = src.crs
            nodata = src.nodata
            if nodata is not None:
                data = np.where(data == nodata, np.nan, data)
            data = np.where((data < 0) | (data > 1), np.nan, data)
            res_x = abs(transform[0])
            res_y = abs(transform[4])
        return data, res_x, res_y, transform, crs
    
    def _apply_threshold_classification(self,data, threshold):
        mask = (~np.isnan(data)) & (data >= threshold)
        out = np.zeros_like(data, dtype=np.uint8)
        out[mask] = 1
        return out
    
    def _calculate_required_pixels(self,required_area_m2, res_x, res_y):
        pixel_area = res_x * res_y
        pixels_needed = int(np.ceil(required_area_m2 / pixel_area))
        kernel_size = int(np.ceil(np.sqrt(pixels_needed)))
        return kernel_size, pixels_needed
    
    def _find_suitable_areas(self,reclassified, kernel_size, required_pixels):
        rows, cols = reclassified.shape
        mask = np.zeros_like(reclassified, dtype=np.uint8)

        for i in tqdm(range(rows - kernel_size + 1), desc="Finding suitable areas"):
            for j in range(cols - kernel_size + 1):
                window = reclassified[i:i+kernel_size, j:j+kernel_size]
                if np.sum(window) >= required_pixels:
                    mask[i:i+kernel_size, j:j+kernel_size] = 1
        return mask
    
    def _extract_clusters_as_polygons(self,mask, transform, crs):
        labeled, _ = label(mask)
        polygons = []

        for geom, val in shapes(labeled.astype(np.uint8), transform=transform):
            if val > 0:
                polygons.append(shape(geom))
        gdf = gpd.GeoDataFrame(geometry=polygons, crs=crs)
        gdf["cluster_id"] = range(len(gdf))
        gdf["area_ha"] = gdf.area / 10000
        return gdf
    
    async def _find_suitable_cluster(self,mld_capacity:float,treatment_technology:float,custom_land_per_mld:float,layer_name:str):
        req_ha=(mld_capacity*treatment_technology) +custom_land_per_mld
        req_m2=req_ha*10000
        data, rx, ry, transform, crs =  await self._read_raster(layer_name)
        threshold_mask = self._apply_threshold_classification(data, self.SUITABILITY_THRESHOLD)
        kernel_size, required_pixels = self._calculate_required_pixels(req_m2, rx, ry)
        suitable_mask = self._find_suitable_areas(threshold_mask, kernel_size, required_pixels)
        clusters_gdf = self._extract_clusters_as_polygons(suitable_mask, transform, crs)
        if clusters_gdf.empty:
            raise CustomException(status_code=404, detail="Suitable area not found")
        temp_cluster_path=Settings().TEMP_DIR+"/temp_cluster.shp"
        clusters_gdf.to_file(temp_cluster_path,driver="ESRI Shapefile")
        return clusters_gdf,crs

    def _read_elevation(self,longitude:float,latitude:float):
        with rasterio.open(self.elivation_path) as src:
            elev = src.read(1)
            etrans = src.transform
            ecrs = src.crs

        transformer = Transformer.from_crs("EPSG:4326", ecrs, always_xy=True)
        x, y = transformer.transform(longitude, latitude)

        row, col = rasterio.transform.rowcol(etrans, x, y)
        row = np.clip(row, 0, elev.shape[0] - 1)
        col = np.clip(col, 0, elev.shape[1] - 1)

        return elev,etrans,elev[row, col]
    
    def _cluster_mean_elev(self,geom, elev, transform):
        vals = []
        for x, y in geom.exterior.coords:
            if np.isnan(x) or np.isnan(y):
                continue
            r, c = rasterio.transform.rowcol(transform, x, y)
            if 0 <= r < elev.shape[0] and 0 <= c < elev.shape[1]:
                vals.append(elev[r, c])
        return np.mean(vals) if vals else np.nan
    
    def _filter_by_elevation(self,gdf, elev, transform, ref):
        out = []
        for row in tqdm(gdf.itertuples(), total=len(gdf), desc="Elevation filter"):
            m = self._cluster_mean_elev(row.geometry, elev, transform)
            if m < ref:
                d = row._asdict()
                d["mean_elev"] = m
                out.append(d)
        return gpd.GeoDataFrame(out, crs=gdf.crs) 
    
    def _nearest(self,G, pt):
        nodes = np.array(list(G.nodes))
        if len(nodes) == 0:
            return None

        pt = np.array(pt)
        if np.any(np.isnan(pt)):
            return None

        d = np.linalg.norm(nodes - pt, axis=1)
        return tuple(nodes[np.argmin(d)])
    

    def _find_suitable_path(self, clusters: gpd.GeoDataFrame, centroid):
        longitude, latitude = centroid.x, centroid.y
        elev, etrans, ref = self._read_elevation(longitude, latitude)
        clusters = self._filter_by_elevation(clusters, elev, etrans, ref)
        return clusters
    

class STPsuitabilityMapper(STP_Area):
    def __init__(self, config: GeoConfig = None):
        super().__init__()
        self.config = config or GeoConfig()
        self.processor = RasterProcess(self.config)
        self.BASE_DIR=Settings().BASE_DIR
        self.TEMP_DIR=Settings().TEMP_DIR+"/STP_suitability"
        os.makedirs(self.TEMP_DIR, exist_ok=True)

    
    def get_vector_file(self, vector_name: str)->str:
        if vector_name =="zone_A":
            return self.BASE_DIR+"/media/Rajat_data/shape_stp/area/zone_A/zone_A.shp"
        elif vector_name =="zone_B":
            return self.BASE_DIR+"/media/Rajat_data/shape_stp/area/zone_B/zone_B.shp"
        elif vector_name =="zone_C":
            return self.BASE_DIR+"/media/Rajat_data/shape_stp/area/zone_C/zone_C.shp"
        elif vector_name =="zone_D":
            return self.BASE_DIR+"/media/Rajat_data/shape_stp/area/zone_D/zone_D.shp"
        elif vector_name =="zone_E":
            return self.BASE_DIR+"/media/Rajat_data/shape_stp/area/zone_E/zone_E.shp"
        elif vector_name =="zone_F":
            return self.BASE_DIR+"/media/Rajat_data/shape_stp/area/zone_F/zone_F.shp"
        elif vector_name =="zone_G":
            return self.BASE_DIR+"/media/Rajat_data/shape_stp/area/zone_G/zone_G.shp"
    
    def _get_elivation_value(self, vector_name: str)->float:
        centroid_value=None
        vector_path=self.get_vector_file(vector_name)
        village_vector=gpd.read_file(vector_path)
        centroid= village_vector.centroid
        with rasterio.open(self.elivation_path) as src:
            coords = [(x,y) for x, y in zip(centroid.geometry.x, centroid.geometry.y)]
            centroid_value = [val[0] for val in src.sample(coords)]
        print("centroid",centroid," and centroid_value",centroid_value)
        return centroid_value,village_vector
    
    def temporary_raster(self,raster_path:str,elevation_value:float):
        with rasterio.open(raster_path) as src:
            raster_data = src.read()
            out_transform = src.transform
            out_meta = src.meta.copy()
            nodata_value = src.nodata
    

        processed_data = np.zeros_like(raster_data, dtype=np.float32)
        
        for band_idx in range(raster_data.shape[0]):
            band_data = raster_data[band_idx].astype(np.float32)
            
           
            if nodata_value is not None:
                valid_mask = band_data != nodata_value
            else:
                valid_mask = np.ones_like(band_data, dtype=bool)
            
            # Subtract elevation value only from valid pixels
            band_data[valid_mask] = elevation_value - band_data[valid_mask]
            
            # Normalize the valid data to 0-1 range
            if np.any(valid_mask):
                valid_data = band_data[valid_mask]
                min_val = np.min(valid_data)
                max_val = np.max(valid_data)
                
                # Avoid division by zero
                if max_val != min_val:
                    # Normalize to 0-1 range
                    band_data[valid_mask] = (valid_data - min_val) / (max_val - min_val)
                else:
                    # If all values are the same, set to 0
                    band_data[valid_mask] = 0.0
            
            # Set nodata pixels back to nodata value (or 0 if no nodata defined)
            if nodata_value is not None:
                band_data[~valid_mask] = 0.0  # Set invalid pixels to 0 after normalization
            
            processed_data[band_idx] = band_data
        
        # Update metadata for output
        out_meta.update({
            "driver": "GTiff",
            "height": processed_data.shape[1],
            "width": processed_data.shape[2],
            "transform": out_transform,
            "dtype": rasterio.float32,  # Use float32 for normalized data
            "nodata": 0.0 if nodata_value is not None else None
        })
        
        # Generate unique output filename
        output_name = f"{raster_path.split('/')[-1].rsplit('.', 1)[0]}_{uuid.uuid4().hex}.tif"
        output_path = os.path.join(self.config.output_path, output_name)
        
        self.processor._saveraster(processed_data,output_path,out_meta)
        return output_path

    def _get_operations_raster(self,db:db_dependency,payload:List):
        all_suitability_raster=STP_suitability_crud(db).get_all(True)
        payload_dict = {r.id: r.weight for r in payload.data}
        condition_raster = [
            [os.path.join(self.BASE_DIR, raster.file_path), payload_dict[raster.id],raster.layer_name]
            for raster in all_suitability_raster
            if raster.raster_category == 'condition' and raster.id in payload_dict
        ]
        constraintion_raster=[
            os.path.join(self.BASE_DIR, raster.file_path)
            for raster in all_suitability_raster
            if raster.raster_category == 'constraint' and raster.id in payload_dict
        ]
        return condition_raster,constraintion_raster
    
    def _get_overlay_raster(self,raster_path:List =None,constraintion_raster:List=None,raster_weights:List=None):
        self.processor.align_rasters(raster_path)
        overlay_name=Unique_name.unique_name_with_ext("overlay","tif")
        weighted_sum = self.processor.create_weighted_overlay(
                raster_weights, overlay_name
            )
        constraint_name=Unique_name.unique_name_with_ext("constraint","tif")
        constrained_path, _ = self.processor.apply_constraints_new(
                weighted_sum, constraint_paths=constraintion_raster, output_name=constraint_name
            )
        final_name = Unique_name.unique_name_with_ext("stp_suitability","tif")
        return constrained_path ,self.processor.clip_to_basin(constrained_path,shapefile_path=self.config.basin_shapefile , output_name=final_name)

    def _cliping_raster(self,raster_path:str,final_name:str,clip:gpd.GeoDataFrame):
        with rasterio.open(raster_path) as src:
            out_image, out_transform = mask(dataset=src, shapes=clip.geometry, crop=True)
            out_meta = src.meta.copy()
        out_meta.update({
            "driver": "GTiff",
            "height": out_image.shape[1],
            "width": out_image.shape[2],
            "transform": out_transform
        })
        output_path = os.path.join(self.config.output_path, final_name)
        with rasterio.open(output_path, "w", **out_meta) as dest:
            dest.write(out_image)
        return output_path
    
    def _get_raster_with_weight(self,db:db_dependency,payload:List):
        condition_raster,constraintion_raster=self._get_operations_raster(db,payload)
        raster_path=[]
        raster_weights=[]
        centroid_value,village_vector=self._get_elivation_value(payload.place)
        elevation_value=centroid_value
        
        for i in condition_raster:
            if i[2] == 'STP_Elevation_Raster':
                elevation_path=self.temporary_raster(i[0],elevation_value)
                raster_path.append(elevation_path)
            else:
                raster_path.append(i[0])
            raster_weights.append(i[1])

        return raster_path,raster_weights,constraintion_raster,village_vector
    
    async def create_suitability_map(self,db:db_dependency,payload:STPsuitabilityInput,reverse:bool=False):
        raster_path,raster_weights,constraintion_raster,village_vector=self._get_raster_with_weight(db,payload)
        _,final_path=self._get_overlay_raster(raster_path,constraintion_raster,raster_weights)
        final_name = Unique_name.unique_name_with_ext('STP_suitability','tif') 
        sld_path,sld_name=RasterProcess().processRaster(final_path,reverse=reverse)
        final_path=self._cliping_raster(final_path,final_name,village_vector)
        unique_store_name =Unique_name.unique_name(self.config.raster_store)
        _,layer_name=await geo.upload_raster(workspace_name=self.config.raster_workspace, store_name=unique_store_name, raster_path=final_path)
        await async_redis_manager.setex(layer_name, 10800, str(final_path))
        await geo.apply_sld_to_layer(workspace_name=self.config.raster_workspace, layer_name = layer_name,sld_content=sld_path, sld_name=layer_name)
        return {
                "workspace": self.config.raster_workspace,
                "layer_name": layer_name,
        }

    async def get_area(self,db:db_dependency,payload:STP_suitability_Area):
        cluster_gdf ,crs= await self._find_suitable_cluster(payload.mld_capacity,payload.treatment_technology,payload.custom_land_per_mld,payload.layer_name)
        vector_path=self.get_vector_file(payload.place)
        village_vector=gpd.read_file(vector_path)
        centroid= village_vector.centroid
        final_cluster=self._find_suitable_path(cluster_gdf,centroid)
        final_cluster_name=None
        if final_cluster is not None:
            final_cluster_name=Unique_name.unique_name("final_cluster")
            await self._temporory_vector(final_cluster,final_cluster_name)
        return{
            "cluster_name":final_cluster_name
        }
