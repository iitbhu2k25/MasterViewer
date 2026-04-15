from fastapi import APIRouter, HTTPException, Query, status

from app.api.service.holistic.holistic_service import HolisticService

router = APIRouter()


@router.get("/locations")
def district_locations(
    state: str | None = Query(default=None),
    district: str | None = Query(default=None),
):
    try:
        return HolisticService().district_locations(state=state, district=district)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
