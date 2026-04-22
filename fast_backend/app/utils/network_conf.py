from app.conf.settings import Settings
import os
from pathlib import Path
class GeoConfig:
    
    def __init__(self, settings=None):
        self.settings = settings or Settings()
        self.geoserver_url = self.settings.GEOSERVER_URL
        self.username = self.settings.GEOSERVER_USERNAME
        self.password = self.settings.GEOSERVER_PASSWORD
        self.geoserver_external_url = self.settings.GEOSERVER_EX_URL
        self.raster_workspace="raster_work"
        self.raster_store="stp_raster_store"
        self.base_dir = Path(self.settings.BASE_DIR )
        self.input_path = self.base_dir
        self.output_path = self.base_dir / "temp"
        self.constraint_raster_path = self.input_path /"media" / "Rajat_data" /"shape_stp" / "STP_pripority_raster" / "STP.tif"
        self.basin_shapefile = self.input_path /"media" / "Rajat_data"/ "shape_stp" / "STP_pripority_raster" / "Basin.shp"
        self.villages_shapefile = self.input_path /"media" / "Rajat_data"/ "shape_stp" / "villages" / "STP_Village.shp"
        self.cachement_shapefile=self.input_path /"media" / "Rajat_data"/ "shape_stp" / "Drain_stp" / "Catchment"/"Catchment.shp"
        self.drain_cachement_shapefile=self.input_path /"media" / "Rajat_data"/ "shape_stp" / "Drain_stp" / "Drain_Suitability"/"Drain_Suitability.shp"
        self.town_shapefile=self.input_path /"media" / "Rajat_data"/ "shape_stp" / "Drain_stp" / "Town"/"Town.shp"
        os.makedirs(self.output_path, exist_ok=True)

        self.target_crs = "EPSG:32644"
        self.target_resolution = (30, 30)
