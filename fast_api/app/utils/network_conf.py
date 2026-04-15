from app.conf.settings import Settings
from pathlib import Path
class GeoConfig:
    
    def __init__(self, settings=None):
        self.settings = settings or Settings()
        self.geoserver_url = self.settings.GEOSERVER_URL
        self.username = self.settings.GEOSERVER_USERNAME
        self.password = self.settings.GEOSERVER_PASSWORD
        self.raster_workspace=self.settings.GEOSERVER_WORKSPACE
        self.raster_store="diango_store"
        self.base_dir = Path(self.settings.BASE_DIR)
        self.input_path = self.base_dir
        self.output_path = Path(self.settings.TEMP_DIR)

        self.target_crs = "EPSG:32644"
        self.target_resolution = (30, 30)
