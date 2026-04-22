from fastapi import APIRouter,status,Depends
from typing import Annotated
from app.database.config.dependency import db_dependency
from app.api.service.river_water_management.spt_service import Stp_service
from app.api.schema.stp_schema import STPSuitabilityVisualOutput,STPCatchmentInput,STPCatchmentOutput,StpsuitabilityAdminReport,StpsuitabilityDrainReport,STPsuitabilityOutput,STPPriorityOutput,STPsuitabilityInput,category_raster,StpPriorityDrainReport,StpPriorityAdminReport,celery_id, stp_area_resp
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


@router.post("/stp_suitability_visual_display",status_code=status.HTTP_201_CREATED,response_model=STPSuitabilityVisualOutput)
@validate
async def stp_priority_raster_dislay(db:db_dependency,payload:category_raster):
    """ It make the stp suitability visual raster for displaying"""
    return await STPsuitabilityMapper().visual_sutabilty_map(db,payload.clip,payload.place,payload.layer_name)

@router.post("/get_suitability_cachement",response_model=STPCatchmentOutput,status_code=status.HTTP_201_CREATED)
@validate
async def get_suitability_cachement(db:db_dependency,payload:STPCatchmentInput):
    """It make the stp suitability cachement """
    return await STPsuitabilityMapper().cachement_villages(db,payload.drain_nos)

    
@router.post("/stp_suitability",status_code=status.HTTP_201_CREATED,)
@validate
async def stp_classify(db:db_dependency,payload:STPsuitabilityInput,):
    """ It calculater the stp suitability """
    return await STPsuitabilityMapper().create_suitability_map(db,payload)