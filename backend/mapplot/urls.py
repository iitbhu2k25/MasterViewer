# mapplot/urls.py (app level)
from django.urls import path
from . import views



app_name = 'mapplot'

urlpatterns = [
    
    path('get_shapefile_data/', views.get_shapefile_data, name='get_data'),
    path('upload-shapefile/', views.upload_shapefile, name='upload_shapefile'),
    path('union-shapefiles/', views.union_shapefiles, name='union_shapefiles'),
]