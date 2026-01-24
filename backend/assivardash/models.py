from django.db import models

class River(models.Model):
    name = models.CharField(max_length=50, unique=True)
    image = models.CharField(max_length=255, blank=True, default='')
    description = models.TextField(blank=True)
    
    def __str__(self):
        return self.name

class River_Location(models.Model):
    river = models.ForeignKey(River, on_delete=models.CASCADE, related_name='locations')
    name = models.CharField(max_length=100)
    
    def __str__(self):
        return f"{self.name} ({self.river.name})"

class River_Action(models.Model):
    location = models.ForeignKey(River_Location, on_delete=models.CASCADE, related_name='actions')
    name = models.CharField(max_length=100)
    icon = models.CharField(max_length=10, blank=True)
    color = models.CharField(max_length=20, blank=True)
    
    def __str__(self):
        return self.name

class River_Intervention(models.Model):
    action = models.ForeignKey(River_Action, on_delete=models.CASCADE, related_name='interventions')
    name = models.CharField(max_length=100)
    
    # REMOVED: No more department/fund_scheme fields!
    # department = models.IntegerField(null=True, blank=True)
    # fund_scheme = models.IntegerField(null=True, blank=True)
    
    def __str__(self):
        return self.name

class River_WorkflowPhase(models.Model):
    PHASE_CHOICES = [
        ('techReport', 'Technical Report'),
        ('dpr', 'DPR'),
        ('workAwarded', 'Work Awarded'),
        ('finished', 'Finished'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('in-progress', 'In Progress'),
        ('completed', 'Completed'),
    ]
    
    intervention = models.ForeignKey(River_Intervention, on_delete=models.CASCADE, related_name='workflows')
    phase = models.CharField(max_length=20, choices=PHASE_CHOICES)
    status = models.CharField(max_length=20, default='pending', choices=STATUS_CHOICES)
    commenced = models.DateTimeField(null=True, blank=True)
    completed = models.DateTimeField(null=True, blank=True)
    deadline = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        unique_together = ('intervention', 'phase')
    
    def __str__(self):
        return f"{self.intervention} - {self.phase}"
    
    def is_locked(self):
        """Check if this phase should be locked based on previous phases"""
        phase_order = ['techReport', 'dpr', 'workAwarded', 'finished']
        current_index = phase_order.index(self.phase)
        
        if current_index == 0:  # techReport is never locked
            return False
            
        # Check if previous phase is completed
        previous_phase = phase_order[current_index - 1]
        try:
            previous_workflow = River_WorkflowPhase.objects.get(
                intervention=self.intervention, 
                phase=previous_phase
            )
            return previous_workflow.status != 'completed'
        except River_WorkflowPhase.DoesNotExist:
            return True  # If previous phase doesn't exist, this should be locked

# NEW MODEL: Fund and Department Assignment
class Fund_Department(models.Model):
    intervention = models.OneToOneField(
        River_Intervention, 
        on_delete=models.CASCADE, 
        related_name='fund_department'
    )
    department_name = models.CharField(max_length=255, null=True, blank=True)
    fund_scheme_name = models.CharField(max_length=255, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'assivardash_fund_department'
        verbose_name = 'Fund and Department Assignment'
        verbose_name_plural = 'Fund and Department Assignments'
    
    def __str__(self):
        dept = self.department_name or "No Department"
        fund = self.fund_scheme_name or "No Fund Scheme"
        return f"{self.intervention.name} - {dept} - {fund}"
    
    def is_fully_assigned(self):
        """Check if both department and fund scheme are assigned"""
        return bool(self.department_name and self.fund_scheme_name)
    
    def is_partially_assigned(self):
        """Check if only one of department or fund scheme is assigned"""
        return bool(self.department_name) != bool(self.fund_scheme_name)