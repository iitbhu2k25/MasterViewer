from django.urls import path

from .views import (
    analysis_dem_slope,
    analysis_dem_slope_clip,
    analysis_groundwater,
    analysis_groundwater_clip,
    analysis_rainfall,
    analysis_rainfall_clip,
    analysis_tributary_drain,
    analysis_zone_raster,
    analysis_zone_raster_clip,
    location_district,
    location_state,
)

urlpatterns = [
    path("location/state", location_state, name="holistic-location-state"),
    path("location/district", location_district, name="holistic-location-district"),
    path("analysis/zone-raster", analysis_zone_raster, name="holistic-analysis-zone-raster"),
    path("analysis/zone-raster-clip", analysis_zone_raster_clip, name="holistic-analysis-zone-raster-clip"),
    path("analysis/rainfall", analysis_rainfall, name="holistic-analysis-rainfall"),
    path("analysis/groundwater", analysis_groundwater, name="holistic-analysis-groundwater"),
    path("analysis/tributary-drain", analysis_tributary_drain, name="holistic-analysis-tributary-drain"),
    path("analysis/dem-slope", analysis_dem_slope, name="holistic-analysis-dem-slope"),
    path("analysis/dem-slope-clip", analysis_dem_slope_clip, name="holistic-analysis-dem-slope-clip"),
    path("analysis/rainfall-clip", analysis_rainfall_clip, name="holistic-analysis-rainfall-clip"),
    path("analysis/groundwater-clip", analysis_groundwater_clip, name="holistic-analysis-groundwater-clip"),
]
