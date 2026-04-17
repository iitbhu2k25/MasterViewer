from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import RiverViewSet, River_WorkflowViewSet, River_InterventionViewSet

router = DefaultRouter()
router.register(r'rivers', RiverViewSet)
router.register(r'river_workflows', River_WorkflowViewSet)
router.register(r'river_interventions', River_InterventionViewSet)

urlpatterns = [
    path('', include(router.urls)),
]