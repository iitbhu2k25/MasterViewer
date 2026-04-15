import requests
from pathlib import Path

# ================= CONFIG =================
GEOSERVER_URL = "http://localhost:9090/geoserver/rest"
GEOSERVER_USER = "admin"
GEOSERVER_PASSWORD = "geoserver"

VECTOR_WORKSPACE = "dss_vector"
RASTER_WORKSPACE = "dss_raster"

# Paths
ZIP_DIR = Path("media/gwa_data/shp_zip")

TIFF_DIRS = [
    Path("media/files/aviral/Rainfall"),
    Path("media/files/aviral/Recharge"),
    Path("media/files/aviral/slope"),
]

# ================= WORKSPACE =================
def create_workspace(workspace):
    url = f"{GEOSERVER_URL}/workspaces"
    headers = {"Content-Type": "text/xml"}
    data = f"<workspace><name>{workspace}</name></workspace>"

    try:
        response = requests.post(
            url,
            auth=(GEOSERVER_USER, GEOSERVER_PASSWORD),
            headers=headers,
            data=data
        )

        if response.status_code in [201, 409]:
            print(f"[✓] Workspace '{workspace}' ready.")
        else:
            print(f"[!] Workspace error ({workspace}): {response.text}")
    except Exception as e:
        print(f"[!] Workspace exception: {e}")


# ================= SHAPEFILE =================
def upload_shapefile(zip_path):
    store_name = zip_path.stem

    url = f"{GEOSERVER_URL}/workspaces/{VECTOR_WORKSPACE}/datastores/{store_name}/file.shp"
    headers = {"Content-type": "application/zip"}

    try:
        with open(zip_path, 'rb') as f:
            response = requests.put(
                url,
                auth=(GEOSERVER_USER, GEOSERVER_PASSWORD),
                headers=headers,
                data=f
            )

        if response.status_code in [201, 202]:
            print(f"[✓] Shapefile uploaded: {store_name}")
        else:
            print(f"[!] Failed shapefile {store_name}: {response.text}")

    except Exception as e:
        print(f"[!] Error uploading shapefile {store_name}: {e}")


# ================= TIFF =================
def upload_tiff(tiff_path):
    folder_name = tiff_path.parent.name.lower()
    file_name = tiff_path.stem

    # 🔥 Maintain OLD naming for Rainfall & Recharge
    if folder_name in ["rainfall", "recharge"]:
        store_name = file_name   # rainfall_2015, recharge_gw
    else:
        store_name = f"{folder_name}_{file_name}"  # slope_Slope_aviral

    url = f"{GEOSERVER_URL}/workspaces/{RASTER_WORKSPACE}/coveragestores/{store_name}/file.geotiff"
    headers = {"Content-type": "image/tiff"}

    try:
        with open(tiff_path, 'rb') as f:
            response = requests.put(
                url,
                auth=(GEOSERVER_USER, GEOSERVER_PASSWORD),
                headers=headers,
                data=f
            )

        if response.status_code in [201, 202]:
            print(f"[✓] TIFF uploaded: {store_name}")
        else:
            print(f"[!] Failed TIFF {store_name}: {response.status_code} - {response.text}")

    except Exception as e:
        print(f"[!] Error uploading TIFF {store_name}: {e}")


# ================= MAIN =================
if __name__ == "__main__":

    print("\n========= STARTING UPLOAD =========")

    # -------- VECTOR --------
    if ZIP_DIR.exists():
        print("\n=== Uploading Shapefiles ===")
        create_workspace(VECTOR_WORKSPACE)

        zip_files = list(ZIP_DIR.glob("*.zip"))

        if not zip_files:
            print("[!] No shapefiles found.")
        else:
            for zip_file in zip_files:
                upload_shapefile(zip_file)
    else:
        print(f"[!] Shapefile directory not found: {ZIP_DIR}")

    # -------- RASTER --------
    print("\n=== Uploading TIFF Files ===")
    create_workspace(RASTER_WORKSPACE)

    for tiff_dir in TIFF_DIRS:
        if tiff_dir.exists():
            print(f"\n--- Processing folder: {tiff_dir} ---")

            tif_files = list(tiff_dir.glob("*.tif"))

            if not tif_files:
                print(f"[!] No TIFF files found in {tiff_dir}")
                continue

            for tif in tif_files:
                upload_tiff(tif)
        else:
            print(f"[!] TIFF directory not found: {tiff_dir}")

    print("\n========= UPLOAD COMPLETED =========")