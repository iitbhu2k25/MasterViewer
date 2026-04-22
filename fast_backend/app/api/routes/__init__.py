from fastapi import APIRouter
from app.api.routes.stp_operation import router as  stp_operation
app_router = APIRouter()


app_router.include_router(
    stp_operation,
    prefix="/stp_operation",
    tags=["Stp operations"]
)
