from fastapi import APIRouter,status,Depends
from typing import Annotated
from app.database.config.dependency import db_dependency
from app.api.service.river_water_management.spt_service import Stp_service
from app.api.schema.stp_schema import STP_suitability_Area, STPSuitabilityVisualOutput,STPCatchmentInput,STPCatchmentOutput,StpsuitabilityAdminReport,StpsuitabilityDrainReport,STPsuitabilityOutput,STPPriorityOutput,STPsuitabilityInput,category_raster,StpPriorityDrainReport,StpPriorityAdminReport,celery_id, stp_area_resp
from app.api.service.river_water_management.stp_operation import STPsuitabilityMapper
from app.utils.exception import validate
from pathlib import Path
from app.conf.logging import logger

router=APIRouter()

# stp suitability
@router.get("/get_suitability_by_category",status_code=status.HTTP_201_CREATED,response_model=list[STPsuitabilityOutput])
@validate
async def get_raster_suitability(db:db_dependency,category:str,all_data: bool = False):
    """ It return the suitability raster information"""
    return Stp_service.get_raster_suitability(db,category,all_data)


    
@router.post("/stp_suitability",status_code=status.HTTP_201_CREATED,)
@validate
async def stp_classify(db:db_dependency,payload:STPsuitabilityInput):
    """ It calculater the stp suitability """
    return await STPsuitabilityMapper().create_suitability_map(db,payload)

@router.post("/stp_area",status_code=status.HTTP_201_CREATED,)
@validate
async def stp_classify(db:db_dependency,payload:STP_suitability_Area):
    """ It calculater the stp suitability """
    return await STPsuitabilityMapper().get_area(db,payload)