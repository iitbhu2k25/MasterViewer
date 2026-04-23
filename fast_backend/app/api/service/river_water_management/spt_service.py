from sqlalchemy.orm import Session
from app.database.crud.stp_crud import STP_suitability_crud
from app.conf.settings import Settings
from app.api.schema.stp_schema import STPCategory
import os

class Stp_service:

    def get_raster_suitability(db:Session,category:str,all_data:bool=False):
        return STP_suitability_crud(db).get_suitability_category(category,all_data)
