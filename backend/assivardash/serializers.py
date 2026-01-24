from rest_framework import serializers
from .models import River, River_Location, River_Action, River_Intervention, River_WorkflowPhase, Fund_Department

# NEW: Fund_Department serializer
class Fund_DepartmentSerializer(serializers.ModelSerializer):
    is_fully_assigned = serializers.ReadOnlyField()
    is_partially_assigned = serializers.ReadOnlyField()
    
    class Meta:
        model = Fund_Department
        fields = ['department_name', 'fund_scheme_name', 'created_at', 'updated_at', 'is_fully_assigned', 'is_partially_assigned']

class River_WorkflowPhaseSerializer(serializers.ModelSerializer):
    is_locked = serializers.ReadOnlyField()
    
    class Meta:
        model = River_WorkflowPhase
        fields = '__all__'

class River_InterventionSerializer(serializers.ModelSerializer):
    workflows = River_WorkflowPhaseSerializer(many=True, read_only=True)
    fund_department = Fund_DepartmentSerializer(read_only=True)  # NEW: Include fund_department
    
    # REMOVED: Old department/fund fields that used @property methods
    # department_name = serializers.ReadOnlyField()
    # fund_scheme_name = serializers.ReadOnlyField()
    
    class Meta:
        model = River_Intervention
        fields = '__all__'

class River_ActionSerializer(serializers.ModelSerializer):
    interventions = River_InterventionSerializer(many=True, read_only=True)
    
    class Meta:
        model = River_Action
        fields = '__all__'

class River_LocationSerializer(serializers.ModelSerializer):
    actions = River_ActionSerializer(many=True, read_only=True)
    
    class Meta:
        model = River_Location
        fields = '__all__'

class RiverSerializer(serializers.ModelSerializer):
    locations = River_LocationSerializer(many=True, read_only=True)
    
    class Meta:
        model = River
        fields = '__all__'