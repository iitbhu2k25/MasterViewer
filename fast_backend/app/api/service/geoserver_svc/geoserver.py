import aiohttp
import os

from fastapi import HTTPException,status
from app.conf.settings import Settings
import requests
import numpy as np
import rasterio
from xml.dom import minidom
from xml.etree import ElementTree as ET
from datetime import datetime
from app.utils.network_conf import GeoConfig
import time
import aiofiles

input_path = f"{Settings().BASE_DIR}" + "/temp/input"
output_path = f"{Settings().BASE_DIR}" + "/temp/output"
raster_workspace = "vector_work"



class Geoserver:
    def __init__(self, config: GeoConfig = GeoConfig()):
        self.geoserver_url = config.geoserver_url
        self.username = config.username
        self.password = config.password
        self.geoserver_external_url = config.geoserver_external_url
        self.wcs_url = f"{self.geoserver_url}/wcs"
        self.wms_url = f"{self.geoserver_url}/wms"
        self.wfs_url = f"{self.geoserver_url}/wfs"
        self.temp_dir = config.output_path

    def update_raster_min_max(self, tif_path):
        """Synchronous operation - rasterio doesn't have async support"""
        with rasterio.open(tif_path, "r+") as ds:
            band = ds.read(1, masked=True)

            min_val = float(band.min())
            max_val = float(band.max())

            ds.update_tags(
                1,
                STATISTICS_MINIMUM=min_val,
                STATISTICS_MAXIMUM=max_val,
                STATISTICS_MEAN=float(band.mean()),
                STATISTICS_STDDEV=float(band.std())
            )

            # THIS is the key part for QGIS
            ds.update_tags(STATISTICS_APPROXIMATE="FALSE")

        print("Stats written — QGIS compatible")

    def celery_raster_download(self, temp_path, layer_name, workspace: str = "raster_work"):
        sld_file_path = None
        geoserver_wcs_url = (
            f"{self.wcs_url}"
            f"?service=WCS"
            f"&version=2.0.1"
            f"&request=GetCoverage"
            f"&coverageId={workspace}:{layer_name}"
            f"&format=image/tiff"
            f"&resample=nearest"
            f"&ScaleFactor=1"
        )

        auth = (self.username, self.password)

        with requests.Session() as session:
            # Step 1: Download the raster
            r = session.get(geoserver_wcs_url, auth=auth)
            name_part = "_".join(layer_name.split("_")[:-1])
            filename = name_part + ".tif"
            file_path = os.path.join(temp_path, filename)

            if r.status_code == 200:
                with open(file_path, "wb") as f:
                    f.write(r.content)
                self.update_raster_min_max(file_path)

            # Step 2: Get the SLD
            layer_info_url = f"{self.geoserver_url}/rest/workspaces/{workspace}/layers/{layer_name}.json"
            resp = session.get(layer_info_url, auth=auth)
            resp.raise_for_status()
            layer_json = resp.json()

            style_href = layer_json["layer"]["defaultStyle"]["href"]
            style_resp = session.get(style_href, auth=auth)
            style_json = style_resp.json()
            sld_filename = style_json["style"]["filename"]

            # Step 3: Download the SLD
            sld_url = f"{self.geoserver_url}/rest/workspaces/{workspace}/styles/{sld_filename}"
            sld_resp = session.get(sld_url, auth=auth)
            sld_resp.raise_for_status()
            sld_file_path = os.path.join(temp_path, sld_filename)
            with open(sld_file_path, "wb") as f:
                f.write(sld_resp.content)

        return {"raster_path": file_path, "sld_path": sld_file_path}  
    
    async def _make_workspace(self,workspace_name: str):
        auth = aiohttp.BasicAuth(self.username, self.password)
        async with aiohttp.ClientSession() as session:
                check_workspace_url = f"{self.geoserver_url}/rest/workspaces/{workspace_name}"
                async with session.get(check_workspace_url, auth=auth) as check_workspace_response:
                    workspace_exists = check_workspace_response.status == 200

                if not workspace_exists:
                    create_workspace_url = f"{self.geoserver_url}/rest/workspaces"
                    create_workspace_data = {"workspace": {"name": workspace_name}}

                    async with session.post(
                        create_workspace_url,
                        auth=auth,
                        json=create_workspace_data,
                        headers={"Content-type": "application/json"},
                    ) as create_workspace_response:
                        if create_workspace_response.status not in (200, 201):
                            return False

                    # Ensure WMS service is enabled for the workspace
                    wms_settings_url = (
                        f"{self.geoserver_url}/rest/services/wms/workspaces/{workspace_name}/settings"
                    )
                    wms_settings_data = {"wms": {"enabled": True, "name": f"{workspace_name}_wms"}}

                    async with session.put(
                        wms_settings_url,
                        auth=auth,
                        json=wms_settings_data,
                        headers={"Content-type": "application/json"},
                    ) as wms_settings_response:
                        if wms_settings_response.status not in (200, 201):
                            response_text = await wms_settings_response.text()
                            print(f"Failed to enable WMS for workspace: {wms_settings_response.status}, {response_text}")
                            raise HTTPException(
                                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                                detail=f"Failed to enable WMS for workspace. Status code: {wms_settings_response.status}",
                                headers={"WWW-Authenticate": "Bearer"},
                            )
    
    async def _make_store(self,workspace_name: str,store_name: str,store_type: str):
        auth = aiohttp.BasicAuth(self.username, self.password)
        async with aiohttp.ClientSession() as session:
            check_store_url = (
                    f"{self.geoserver_url}/rest/workspaces/{workspace_name}/coveragestores/{store_name}"
                )
            async with session.get(check_store_url, auth=auth) as check_store_response:
                store_exists = check_store_response.status == 200

            # If store exists, delete it completely to avoid duplicates
            if store_exists:
                delete_store_url = f"{self.geoserver_url}/rest/workspaces/{workspace_name}/coveragestores/{store_name}?recurse=true"
                async with session.delete(delete_store_url, auth=auth) as delete_store_response:
                    if delete_store_response.status != 200:
                        raise HTTPException(
                            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                            detail=f"Failed to delete existing coverage store. Status code: {delete_store_response.status}",
                            headers={"WWW-Authenticate": "Bearer"},
                        )

            # Create coverage store
            create_store_url = f"{self.geoserver_url}/rest/workspaces/{workspace_name}/coveragestores"
            create_store_data = {
                "coverageStore": {
                    "name": store_name,
                    "type": store_type,
                    "enabled": True,
                    "workspace": {"name": workspace_name},
                }
            }

            async with session.post(
                create_store_url,
                auth=auth,
                json=create_store_data,
                headers={"Content-type": "application/json"},
            ) as create_response:
                if create_response.status not in (200, 201):
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail=f"Failed to create coverage store. Status code: {create_response.status}",
                        headers={"WWW-Authenticate": "Bearer"},
                    )
    
    async def _geoserver_raster(self,workspace_name: str,store_name: str,raster_path: str,layer_name: str,api_extension: str, content_type: str):
        auth = aiohttp.BasicAuth(self.username, self.password)
        async with aiohttp.ClientSession() as session:
            upload_url = f"{self.geoserver_url}/rest/workspaces/{workspace_name}/coveragestores/{store_name}/{api_extension}?configure=first"
            headers = {"Content-type": content_type}
            async with aiofiles.open(raster_path, "rb") as f:
                data = await f.read()

            async with session.put(upload_url, auth=auth, data=data, headers=headers) as response:
                if response.status in (200, 201):
                    print(f"Raster file uploaded successfully to store '{store_name}'")

                    # Now create the coverage/layer explicitly
                    configure_url = f"{self.geoserver_url}/rest/workspaces/{workspace_name}/coveragestores/{store_name}/coverages"

                    coverage_data = {
                        "coverage": {
                            "name": layer_name,
                            "title": layer_name,
                            "enabled": True,
                            "metadata": {
                                "entry": [{"@key": "wms.published", "$": "true"}]
                            },
                        }
                    }

                    async with session.post(
                        configure_url,
                        auth=auth,
                        json=coverage_data,
                        headers={"Content-type": "application/json"},
                    ) as configure_response:
                        if configure_response.status in (200, 201):
                            print(f"Coverage layer '{layer_name}' created and configured successfully")
                        else:
                            response_text = await configure_response.text()
                            print(
                                f"Warning: Failed to create coverage layer. Status code: {configure_response.status}"
                            )
                            print(f"Response: {response_text}")

                            # Try to get automatically created coverage if manual creation failed
                            auto_coverage_url = f"{self.geoserver_url}/rest/workspaces/{workspace_name}/coveragestores/{store_name}/coverages"
                            async with session.get(
                                auto_coverage_url, auth=auth
                            ) as auto_coverage_response:
                                if auto_coverage_response.status == 200:
                                    coverages = await auto_coverage_response.json()
                                    if "coverage" in coverages or "coverages" in coverages:
                                        print(
                                            f"Found automatically created coverage in store '{store_name}'"
                                        )

                    # Verify the layer exists and is accessible
                    verify_url = f"{self.geoserver_url}/rest/layers/{workspace_name}:{layer_name}"
                    async with session.get(verify_url, auth=auth) as verify_response:
            
                        if verify_response.status == 200:
                    
                            wms_url = f"{self.geoserver_url}/wms?service=WMS&version=1.1.0&request=GetMap&layers={workspace_name}:{layer_name}"

                            return True, layer_name
                        else:
                            print(
                                f"Warning: Could not verify layer configuration: {verify_response.status}"
                            )
                            return True, layer_name  # Upload was successful even if verification failed

                else:
                    response_text = await response.text()
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail=f"Failed to upload raster file. Status code: {response.status}, Response: {response_text}",
                        headers={"WWW-Authenticate": "Bearer"},
                    )

    async def _geoserver_vector(self,workspace_name: str,store_name: str,vector_path: str,layer_name: str, content_type: str):
        auth = aiohttp.BasicAuth(self.username, self.password)

        async with aiohttp.ClientSession() as session:
            headers = {"Content-type": content_type}

            # Delete the entire store if it exists (GeoServer shapefile stores are 1-to-1 with a file)
            check_url = f"{self.geoserver_url}/rest/workspaces/{workspace_name}/datastores/{store_name}"
            async with session.get(check_url, auth=auth) as check_resp:
                if check_resp.status == 200:
                    delete_url = f"{check_url}?recurse=true"
                    async with session.delete(delete_url, auth=auth) as del_resp:
                        if del_resp.status in (200, 201):
                            print(f"Existing store '{store_name}' deleted for overwrite")

            upload_url = f"{self.geoserver_url}/rest/workspaces/{workspace_name}/datastores/{store_name}/file.shp?configure=first"
            if layer_name:
                upload_url += f"&name={layer_name}"

            with open(vector_path, 'rb') as f:
                data = f.read()
            async with session.put(upload_url, auth=auth, data=data, headers=headers) as response:
                if response.status in (200, 201):
                    print(f"Shapefile uploaded successfully to store '{store_name}'")
                else:
                    response_text = await response.text()
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail=f"Failed to upload shapefile. Status code: {response.status}, Response: {response_text}",
                        headers={"WWW-Authenticate": "Bearer"},
                    )

    async def raster_download(self, temp_path, layer_name, workspace: str = "raster_work"):
        sld_file_path = None
        geoserver_wcs_url = (
            f"{self.wcs_url}"
            f"?service=WCS"
            f"&version=2.0.1"
            f"&request=GetCoverage"
            f"&coverageId={workspace}:{layer_name}"
            f"&format=image/tiff"
            f"&resample=nearest"
            f"&ScaleFactor=1"
        )

        auth = aiohttp.BasicAuth(self.username, self.password)

        async with aiohttp.ClientSession() as session:
            # Step 1: Download the raster
            async with session.get(geoserver_wcs_url, auth=auth) as r:
                name_part = "_".join(layer_name.split("_")[:-1])
                filename = name_part + ".tif"
                file_path = os.path.join(temp_path, filename)

                if r.status == 200:
                    content = await r.read()
                    async with aiofiles.open(file_path, "wb") as f:
                        await f.write(content)
                    self.update_raster_min_max(file_path)

            # Step 2: Get the SLD
            layer_info_url = f"{self.geoserver_url}/rest/workspaces/{workspace}/layers/{layer_name}.json"
            async with session.get(layer_info_url, auth=auth) as resp:
                resp.raise_for_status()
                layer_json = await resp.json()

            style_href = layer_json["layer"]["defaultStyle"]["href"]
            async with session.get(style_href, auth=auth) as style_resp:
                style_json = await style_resp.json()
            sld_filename = style_json["style"]["filename"]

            # Step 3: Download the SLD
            sld_url = f"{self.geoserver_url}/rest/workspaces/{workspace}/styles/{sld_filename}"
            async with session.get(sld_url, auth=auth) as sld_resp:
                sld_resp.raise_for_status()
                sld_content = await sld_resp.read()
                sld_file_path = os.path.join(temp_path, sld_filename)
                async with aiofiles.open(sld_file_path, "wb") as f:
                    await f.write(sld_content)

            return {"raster_path": file_path, "sld_path": sld_file_path}

    async def apply_sld_to_layer(self, workspace_name, layer_name, sld_content, sld_name=None):
        if sld_name is None:
            sld_name = layer_name + datetime.now().strftime("%Y%m%d%H%M%S")

        async with aiofiles.open(sld_content, "r") as f:
            new_sld_content = await f.read()

        auth = aiohttp.BasicAuth(self.username, self.password)

        async with aiohttp.ClientSession() as session:
            styles_url = f"{self.geoserver_url}/rest/workspaces/{workspace_name}/styles"
            style_data = {"style": {"name": sld_name, "filename": f"{sld_name}.sld"}}

            style_url = f"{styles_url}/{sld_name}"

            # Check if style exists
            async with session.get(style_url, auth=auth) as check_response:
                style_exists = check_response.status == 200

            if not style_exists:
                # Create style metadata
                async with session.post(
                    styles_url,
                    json=style_data,
                    auth=auth,
                    headers={"Content-Type": "application/json"},
                ) as create_response:
                    if create_response.status not in [200, 201]:
                        response_text = await create_response.text()
                        print(f"Failed to create style metadata: {create_response.status}, {response_text}")
                        return False

            # Upload SLD content
            async with session.put(
                style_url,
                data=new_sld_content,
                auth=auth,
                headers={"Content-Type": "application/vnd.ogc.sld+xml"},
            ) as upload_response:
                if upload_response.status not in [200, 201]:
                    response_text = await upload_response.text()
                    print(f"Failed to upload SLD content: {upload_response.status}, {response_text}")
                    return False

            # Apply the style to the layer
            layer_url = f"{self.geoserver_url}/rest/workspaces/{workspace_name}/layers/{layer_name}"
            payload = {"layer": {"defaultStyle": {"name": sld_name}}}

            async with session.put(
                layer_url, json=payload, auth=auth, headers={"Content-Type": "application/json"}
            ) as apply_response:
                if apply_response.status not in [200, 201]:
                    response_text = await apply_response.text()
                    print(f"Failed to apply style to layer: {apply_response.status}, {response_text}")
                    return False

            return True

    async def apply_sld_content(self, workspace_name, layer_name, sld_content, sld_name=None):
        if sld_name is None:
            sld_name = layer_name + datetime.now().strftime("%Y%m%d%H%M%S")
        print("layer_name", layer_name)
        print("sld_name", sld_name)
        auth = aiohttp.BasicAuth(self.username, self.password)

        async with aiohttp.ClientSession() as session:
            styles_url = f"{self.geoserver_url}/rest/workspaces/{workspace_name}/styles"
            style_data = {"style": {"name": sld_name, "filename": f"{sld_name}.sld"}}

            style_url = f"{styles_url}/{sld_name}"

            # Check if style exists
            async with session.get(style_url, auth=auth) as check_response:
                style_exists = check_response.status == 200

            if not style_exists:
                # Create style metadata
                async with session.post(
                    styles_url,
                    json=style_data,
                    auth=auth,
                    headers={"Content-Type": "application/json"},
                ) as create_response:
                    if create_response.status not in [200, 201]:
                        response_text = await create_response.text()
                        print(f"Failed to create style metadata: {create_response.status}, {response_text}")
                        return False

            # Upload SLD content
            async with session.put(
                style_url,
                data=sld_content,
                auth=auth,
                headers={"Content-Type": "application/vnd.ogc.sld+xml"},
            ) as upload_response:
                if upload_response.status not in [200, 201]:
                    response_text = await upload_response.text()
                    print(f"Failed to upload SLD content: {upload_response.status}, {response_text}")
                    return False

            # Apply the style to the layer
            layer_url = f"{self.geoserver_url}/rest/workspaces/{workspace_name}/layers/{layer_name}"
            payload = {"layer": {"defaultStyle": {"name": sld_name}}}

            async with session.put(
                layer_url, json=payload, auth=auth, headers={"Content-Type": "application/json"}
            ) as apply_response:
                if apply_response.status not in [200, 201]:
                    response_text = await apply_response.text()
                    print(f"Failed to apply style to layer: {apply_response.status}, {response_text}")
                    return False

            return True
    
    async def remove_sld_from_layer(self, workspace_name, layer_name):
        auth = aiohttp.BasicAuth(self.username, self.password)

        async with aiohttp.ClientSession() as session:
            layer_url = f"{self.geoserver_url}/rest/workspaces/{workspace_name}/layers/{layer_name}"
            payload = {"layer": {"defaultStyle": {"name": "raster"}}}

            async with session.put(
                layer_url,
                json=payload,
                auth=auth,
                headers={"Content-Type": "application/json"},
            ) as response:
                if response.status not in [200, 201]:
                    response_text = await response.text()
                    print(f"Failed to reset style on layer: {response.status}, {response_text}")
                    return False

            return True

    async def upload_raster(self, workspace_name, store_name, raster_path, layer_name=None):
        try:
            if layer_name is None:
                layer_name = os.path.splitext(os.path.basename(raster_path))[0]
            layer_name = layer_name.replace(" ", "_")

            content_type = "image/tiff"
            store_type = "GeoTIFF"
            api_extension = "file.geotiff"
            await self._make_workspace(workspace_name)
            await self._make_store(workspace_name, store_name, store_type)
            return await self._geoserver_raster(workspace_name, store_name, raster_path, layer_name, api_extension, content_type)
            

        except Exception as e:
            print(f"Error uploading raster file: {str(e)}")
            return False
        
    async def upload_vector(self,workspace_name:str,shapefile_path:str, layer_name:str):
        try:
            await self._make_workspace(workspace_name)
            return await self._geoserver_vector(workspace_name, layer_name, shapefile_path, layer_name, "application/zip")
            
        except Exception as e:
            print(f"Error uploading raster file: {str(e)}")
            return False