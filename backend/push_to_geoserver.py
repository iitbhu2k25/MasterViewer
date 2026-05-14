import requests
from pathlib import Path

# ================= CONFIG =================
GEOSERVER_URL = "http://localhost:9090/geoserver/rest"
GEOSERVER_USER = "admin"
GEOSERVER_PASSWORD = "geoserver"

VECTOR_WORKSPACE = "dss_vector"
RASTER_WORKSPACE = "dss_raster"

# ================= MULTIPLE ZIP DIRECTORIES =================
ZIP_DIRS = [
    Path("media/gwa_data/shp_zip"),
    Path("media/shape_file/nirmal"),
    Path("media/shape_file/jan"),
]

# ================= TIFF DIRECTORIES =================
TIFF_DIRS = [
    Path("media/files/aviral/Rainfall"),
    Path("media/files/aviral/Recharge"),
    Path("media/files/aviral/slope"),
    Path("media/files/aviral/flow_direction"),
    Path("media/files/aviral/river_flow"),
    Path("media/files/aviral/drain_flow"),
    Path("media/files/aviral/channel"),
    Path("media/files/nirmal"),
    Path("media/files/arth"),
    Path("media/files/gyan"),
    Path("media/files/jeevant"),
    Path("media/files/jan"),
]

# ================= WORKSPACE =================
def create_workspace(workspace):
    url = f"{GEOSERVER_URL}/workspaces"

    headers = {
        "Content-Type": "text/xml"
    }

    data = f"""
    <workspace>
        <name>{workspace}</name>
    </workspace>
    """

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
            print(f"[!] Workspace error ({workspace}):")
            print(response.text)

    except Exception as e:
        print(f"[!] Workspace exception: {e}")


# ================= SHAPEFILE ZIP UPLOAD =================
def upload_shapefile(zip_path):

    store_name = zip_path.stem

    url = (
        f"{GEOSERVER_URL}/workspaces/"
        f"{VECTOR_WORKSPACE}/datastores/"
        f"{store_name}/file.shp"
    )

    headers = {
        "Content-type": "application/zip"
    }

    try:
        with open(zip_path, "rb") as f:

            response = requests.put(
                url,
                auth=(GEOSERVER_USER, GEOSERVER_PASSWORD),
                headers=headers,
                data=f
            )

        if response.status_code in [201, 202]:
            print(f"[✓] Shapefile uploaded: {store_name}")

        else:
            print(f"[!] Failed shapefile: {store_name}")
            print(f"Status: {response.status_code}")
            print(response.text)

    except Exception as e:
        print(f"[!] Error uploading shapefile {store_name}: {e}")


# ================= TIFF UPLOAD =================
def upload_tiff(tiff_path):

    folder_name = tiff_path.parent.name.lower()
    file_name = tiff_path.stem

    # Keep old naming for rainfall & recharge
    if folder_name in ["rainfall", "recharge"]:
        store_name = file_name

    else:
        store_name = f"{folder_name}_{file_name}"

    url = (
        f"{GEOSERVER_URL}/workspaces/"
        f"{RASTER_WORKSPACE}/coveragestores/"
        f"{store_name}/file.geotiff"
    )

    headers = {
        "Content-type": "image/tiff"
    }

    try:
        with open(tiff_path, "rb") as f:

            response = requests.put(
                url,
                auth=(GEOSERVER_USER, GEOSERVER_PASSWORD),
                headers=headers,
                data=f
            )

        if response.status_code in [201, 202]:
            print(f"[✓] TIFF uploaded: {store_name}")

        else:
            print(f"[!] Failed TIFF: {store_name}")
            print(f"Status: {response.status_code}")
            print(response.text)

    except Exception as e:
        print(f"[!] Error uploading TIFF {store_name}: {e}")


# ================= MAIN =================
if __name__ == "__main__":

    print("\n========= STARTING GEOSERVER UPLOAD =========")

    # =====================================================
    # VECTOR DATA (MULTIPLE ZIP DIRECTORIES)
    # =====================================================

    print("\n=== Uploading Shapefiles ===")

    create_workspace(VECTOR_WORKSPACE)

    for zip_dir in ZIP_DIRS:

        if zip_dir.exists():

            print(f"\n--- Processing ZIP Folder: {zip_dir} ---")

            zip_files = list(zip_dir.glob("*.zip"))

            if not zip_files:
                print(f"[!] No ZIP files found in {zip_dir}")
                continue

            for zip_file in zip_files:
                upload_shapefile(zip_file)

        else:
            print(f"[!] ZIP directory not found: {zip_dir}")

    # =====================================================
    # RASTER DATA (MULTIPLE TIFF DIRECTORIES)
    # =====================================================

    print("\n=== Uploading TIFF Files ===")

    create_workspace(RASTER_WORKSPACE)

    for tiff_dir in TIFF_DIRS:

        if tiff_dir.exists():

            print(f"\n--- Processing TIFF Folder: {tiff_dir} ---")

            tif_files = list(tiff_dir.glob("*.tif"))

            if not tif_files:
                print(f"[!] No TIFF files found in {tiff_dir}")
                continue

            for tif in tif_files:
                upload_tiff(tif)

        else:
            print(f"[!] TIFF directory not found: {tiff_dir}")

    print("\n========= UPLOAD COMPLETED =========")