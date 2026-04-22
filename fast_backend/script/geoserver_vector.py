import sys
import os
from app.api.service.script_svc.geoserver_svc import create_workspace,create_vector_stores,upload_shapefile
from app.api.service.geoserver_svc.geoserver import Geoserver
import pandas as pd
import uuid
import asyncio


BASE_DIR=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BASE_DIRR = os.path.join(BASE_DIR,'media', 'Rajat_data')
sys.path.append(BASE_DIRR)
state_zip = os.path.join(BASE_DIRR, 'shape_stp', 'state', 'STP_State.zip')
district_zip = os.path.join(BASE_DIRR,  'shape_stp', 'district', 'STP_district.zip')
subdistrict_zip = os.path.join(BASE_DIRR,  'shape_stp', 'subdistrict', 'STP_subdistrict.zip')
villages_zip = os.path.join(BASE_DIRR,  'shape_stp', 'villages', 'STP_Village.zip')
river_zip = os.path.join(BASE_DIRR,  'shape_stp','Drain_stp', 'River', 'Rivers.zip')
stretch_zip = os.path.join(BASE_DIRR,  'shape_stp','Drain_stp', 'Stretches', 'Stretches.zip')
drain_zip = os.path.join(BASE_DIRR,  'shape_stp','Drain_stp', 'Drains', 'Drain.zip')
drain_buffer_zip = os.path.join(BASE_DIRR,  'shape_stp','Drain_stp', 'Drain_Suitability', 'Drain_Suitability.zip')
boundry_zip = os.path.join(BASE_DIRR,  'shape_stp','Drain_stp', 'Boundary', 'Boundary.zip')
town_zip = os.path.join(BASE_DIRR,  'shape_stp','Drain_stp', 'Town', 'Town.zip')

stp_priority = os.path.join(BASE_DIRR, "csv_file_stp", "stp_priority_visual_raster.csv")
stp_suitability = os.path.join(BASE_DIRR,  "csv_file_stp", "stp_suitability_visual_raster.csv")
groundwater_location = os.path.join(BASE_DIRR,  "csv_file_stp", "gwpl_visual.csv")
groundwater_zone = os.path.join(BASE_DIRR,  "csv_file_stp", "gwz_visual.csv")
mar_suitability = os.path.join(BASE_DIRR,  "csv_file_stp", "mar_suitability_visual_raster.csv")

csv_files = [
    mar_suitability,
    groundwater_zone,
    stp_priority,
    stp_suitability,
    groundwater_location,

]
async def geoserverScript():
    visual_raster=Geoserver()
    try:
        create_workspace("vector_work")
        create_workspace("raster_visualization")
        create_vector_stores("vector_work","stp_vector_store")
        upload_shapefile("vector_work","stp_vector_store",state_zip,"STP_state_layers")
        upload_shapefile("vector_work","stp_vector_store",district_zip,"STP_district_layers")
        upload_shapefile("vector_work","stp_vector_store",subdistrict_zip,"STP_subdistrict_layers")
        upload_shapefile("vector_work","stp_vector_store",villages_zip,"STP_villages_layers")
        upload_shapefile("vector_work","stp_vector_store",river_zip,"Rivers")
        upload_shapefile("vector_work","stp_vector_store",stretch_zip,"Stretches")
        upload_shapefile("vector_work","stp_vector_store",drain_zip,"Drain")
        upload_shapefile("vector_work","stp_vector_store",boundry_zip,"Boundary")
        upload_shapefile("vector_work","stp_vector_store",town_zip,"Town")
        upload_shapefile("vector_work","stp_vector_store",drain_buffer_zip,"Drain_Suitability")
        all_layers = pd.concat(
        (
            pd.read_csv(f)[["layer_name", "file_path", "sld_path"]]
            .assign(
                file_path=lambda df: df["file_path"].apply(lambda x: os.path.join(BASE_DIR, x.lstrip("/"))),
                sld_path=lambda df: df["sld_path"].apply(lambda x: os.path.join(BASE_DIR, x.lstrip("/")))
            )
            for f in csv_files
        ),
        ignore_index=True
        )
        all_layers = all_layers.drop_duplicates(subset=["layer_name"], keep="first")
        for i in all_layers.iterrows():
            await visual_raster.upload_raster(workspace_name="raster_visualization", store_name=uuid.uuid4().hex, raster_path=i[1]["file_path"],layer_name=i[1]["layer_name"])
            await visual_raster.apply_sld_to_layer(workspace_name="raster_visualization", layer_name=i[1]["layer_name"], sld_content=i[1]["sld_path"], sld_name=uuid.uuid4().hex)

    except Exception as e:
        print(e)


if __name__ == "__main__":
    asyncio.run(geoserverScript())
