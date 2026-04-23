from app.database.models import STP_suitability_raster
from app.database.crud.base import CrudBase
from sqlalchemy.orm import Session


class STP_suitability_crud(CrudBase):
    def __init__(self,db:Session,Model=STP_suitability_raster):
        super().__init__(db,Model)
        self.obj = None
    def get_suitability_category(self,category:str,all_data:bool=False):
        query=self.db.query(self.Model).filter(
            self.Model.raster_category==category)
        return self._pagination(query,all_data)
    
    def get_all(self,all_data:bool=False):
        query=self.db.query(self.Model).filter()
        return self._pagination(query,all_data)

