import requests
from pathlib import Path
from app.conf.settings import Settings
# GeoServer config
GEOSERVER_URL = "http://geoserver:8080/geoserver/rest"
GEOSERVER_USER = "admin"
GEOSERVER_PASSWORD = "geoserver"
WORKSPACE = "dss_vector"
BASE_DIR= Settings().BASE_DIR
# Directory containing all shapefile ZIPs
ZIP_DIR = Path(BASE_DIR, "media", "gwa_data", "shp_zip")

def create_workspace():
    url = f"{GEOSERVER_URL}/workspaces"
    headers = {"Content-Type": "text/xml"}
    data = f"<workspace><name>{WORKSPACE}</name></workspace>"
    response = requests.post(url, auth=(GEOSERVER_USER, GEOSERVER_PASSWORD), headers=headers, data=data)
    
    if response.status_code in [201, 409]:
        print(f"[✓] Workspace '{WORKSPACE}' exists or created.")
    else:
        print(f"[!] Workspace error: {response.status_code} - {response.text}")

def upload_shapefile(zip_path):
    store_name = zip_path.stem
    url = f"{GEOSERVER_URL}/workspaces/{WORKSPACE}/datastores/{store_name}/file.shp"
    headers = {"Content-type": "application/zip"}

    with open(zip_path, 'rb') as f:
        response = requests.put(url, auth=(GEOSERVER_USER, GEOSERVER_PASSWORD), headers=headers, data=f)

    if response.status_code in [201, 202]:
        print(f"[✓] Uploaded and published: '{store_name}'")
    else:
        print(f"[!] Failed to upload '{store_name}': {response.status_code} - {response.text}")

if __name__ == "__main__":
    if not ZIP_DIR.exists():
        print(f"[!] Directory not found: {ZIP_DIR}")
    else:
        create_workspace()
        for zip_file in ZIP_DIR.glob("*.zip"):
            upload_shapefile(zip_file)
