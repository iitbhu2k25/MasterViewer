import logging
from importlib import import_module

from fastapi import APIRouter

from app.api.routes.location.location import router as location
from app.api.routes.holistic.holistic import router as holistic_router


app_router = APIRouter()

app_router.include_router(location, prefix="/location", tags=["area"])
app_router.include_router(holistic_router, prefix="/holistic", tags=["Holistic"])

