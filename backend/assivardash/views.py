from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.utils import timezone
from django.db.models import Q, F
from .models import River, River_WorkflowPhase, River_Intervention, Fund_Department
from .serializers import RiverSerializer, River_WorkflowPhaseSerializer, River_InterventionSerializer

class RiverViewSet(viewsets.ModelViewSet):
    queryset = River.objects.all()
    serializer_class = RiverSerializer

class River_WorkflowViewSet(viewsets.ModelViewSet):
    queryset = River_WorkflowPhase.objects.all()
    serializer_class = River_WorkflowPhaseSerializer

    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        phase = self.get_object()
        new_status = request.data.get('status')
        
        if new_status not in ['pending', 'in-progress', 'completed']:
            return Response({'error': 'Invalid status'}, status=400)
        
        # Check if phase is locked
        if phase.is_locked():
            return Response({
                'error': 'This phase is locked. Complete previous phases first.'
            }, status=400)
        
        # Handle status transitions
        if new_status == 'in-progress':
            deadline = request.data.get('deadline')
            if not deadline:
                return Response({'error': 'Deadline required'}, status=400)
            phase.deadline = deadline
            phase.commenced = timezone.now()
            
        elif new_status == 'completed':
            phase.completed = timezone.now()
            
            # Create next phase workflow if it doesn't exist
            phase_order = ['techReport', 'dpr', 'workAwarded', 'finished']
            current_index = phase_order.index(phase.phase)
            
            if current_index < len(phase_order) - 1:  # Not the last phase
                next_phase = phase_order[current_index + 1]
                River_WorkflowPhase.objects.get_or_create(
                    intervention=phase.intervention,
                    phase=next_phase,
                    defaults={'status': 'pending'}
                )
        
        phase.status = new_status
        phase.save()
        return Response(River_WorkflowPhaseSerializer(phase).data)

    @action(detail=False, methods=['get'])
    def delayed(self, request):
        delayed_qs = River_WorkflowPhase.objects.filter(
            Q(status='completed', completed__gt=F('deadline')) |
            Q(status__in=['pending', 'in-progress'], deadline__lt=timezone.now())
        ).select_related('intervention__action__location__river')
        
        # Group delays by intervention
        delayed_interventions = {}
        
        for workflow in delayed_qs:
            intervention_id = workflow.intervention.id
            
            if intervention_id not in delayed_interventions:
                # Use Fund_Department for department and fund scheme names
                try:
                    fund_dept = workflow.intervention.fund_department
                    department_name = fund_dept.department_name or "Not Assigned"
                    fund_scheme_name = fund_dept.fund_scheme_name or "Not Assigned"
                except Fund_Department.DoesNotExist:
                    department_name = "Not Assigned"
                    fund_scheme_name = "Not Assigned"
                
                delayed_interventions[intervention_id] = {
                    'id': f'delay-{intervention_id}',
                    'interventionId': intervention_id,
                    'interventionName': workflow.intervention.name,
                    'location': workflow.intervention.action.location.name,
                    'action': workflow.intervention.action.name,
                    'river': workflow.intervention.action.location.river.name,
                    'department': department_name,
                    'fundScheme': fund_scheme_name,
                    'delayedPhases': []
                }
            
            # Calculate delay
            ref_date = workflow.completed if workflow.completed else timezone.now()
            days_delayed = (ref_date - workflow.deadline).days if workflow.deadline else 0
            
            delayed_interventions[intervention_id]['delayedPhases'].append({
                'phase': workflow.phase,
                'deadline': workflow.deadline,
                'completedAt': workflow.completed,
                'daysDelayed': days_delayed,
                'status': workflow.status
            })
        
        return Response(list(delayed_interventions.values()))

    @action(detail=False, methods=['get'])
    def dashboard_data(self, request):
        """Get complete dashboard data for a river"""
        river_id = request.query_params.get('river_id')
        if not river_id:
            return Response({'error': 'river_id parameter required'}, status=400)
        
        try:
            river = River.objects.prefetch_related(
                'locations__actions__interventions__workflows',
                'locations__actions__interventions__fund_department'
            ).get(id=river_id)
            
            data = RiverSerializer(river).data
            
            # Add workflow phase counts
            workflow_counts = {
                'techReport': {'pending': 0, 'in-progress': 0, 'completed': 0},
                'dpr': {'pending': 0, 'in-progress': 0, 'completed': 0},
                'workAwarded': {'pending': 0, 'in-progress': 0, 'completed': 0},
                'finished': {'pending': 0, 'in-progress': 0, 'completed': 0}
            }
            
            for location in river.locations.all():
                for action in location.actions.all():
                    for intervention in action.interventions.all():
                        for workflow in intervention.workflows.all():
                            workflow_counts[workflow.phase][workflow.status] += 1
            
            data['workflow_counts'] = workflow_counts
            return Response(data)
            
        except River.DoesNotExist:
            return Response({'error': 'River not found'}, status=404)

class River_InterventionViewSet(viewsets.ModelViewSet):
    queryset = River_Intervention.objects.all()
    serializer_class = River_InterventionSerializer

    @action(detail=True, methods=['post'])
    def assign(self, request, pk=None):
        """Assign department and fund scheme to intervention"""
        try:
            intervention = self.get_object()
            department_name = request.data.get('department_name')
            fund_scheme_name = request.data.get('fund_scheme_name')
            
            if not department_name or not fund_scheme_name:
                return Response({
                    'error': 'Both department_name and fund_scheme_name are required'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Create or update fund/department assignment
            fund_dept, created = Fund_Department.objects.get_or_create(
                intervention=intervention,
                defaults={
                    'department_name': department_name,
                    'fund_scheme_name': fund_scheme_name
                }
            )
            
            if not created:
                # Update existing assignment
                fund_dept.department_name = department_name
                fund_dept.fund_scheme_name = fund_scheme_name
                fund_dept.save()
            
            return Response({
                'success': True,
                'message': 'Assignment saved successfully',
                'fund_department': {
                    'department_name': fund_dept.department_name,
                    'fund_scheme_name': fund_dept.fund_scheme_name,
                    'is_fully_assigned': fund_dept.is_fully_assigned()
                }
            })
            
        except Exception as e:
            return Response({
                'success': False, 
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # NEW: Add reset action for intervention
    @action(detail=True, methods=['post'], url_path='reset')
    def reset(self, request, pk=None):
        intervention = self.get_object()
        intervention.workflows.update(
            status='pending',
            commenced=None,
            deadline=None,
            completed=None
        )
        return Response(River_InterventionSerializer(intervention).data)