from fastapi import APIRouter, File, HTTPException, UploadFile, status

from app.api.schema.location_schema import (
    DistrictRequest,
    SubdistrictRequest,
    VillageRequest,
   
)
from app.api.service.location.location_service import BasicService
from app.database.config.dependency import db_dependency

router = APIRouter()


@router.get("/state")
def states(db: db_dependency):
    return BasicService(db).get_states()


@router.post("/district")
def districts(payload: DistrictRequest, db: db_dependency):
    return BasicService(db).get_districts(payload.state_code)


@router.post("/subdistrict")
def subdistricts(payload: SubdistrictRequest, db: db_dependency):
    
    district_codes = payload.district_code if isinstance(payload.district_code, list) else [payload.district_code]
    return BasicService(db).get_subdistricts([int(x) for x in district_codes])


@router.post("/village")
def villages(payload: VillageRequest, db: db_dependency):
    subdistrict_codes = payload.subdistrict_code if isinstance(payload.subdistrict_code, list) else [payload.subdistrict_code]
    return BasicService(db).get_villages([int(x) for x in subdistrict_codes])


