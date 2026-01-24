from django.contrib import admin
from .models import River, River_Location, River_Action, River_Intervention, River_WorkflowPhase, Fund_Department

@admin.register(River)
class RiverAdmin(admin.ModelAdmin):
    list_display = ['name', 'description']
    search_fields = ['name']

@admin.register(River_Location)
class RiverLocationAdmin(admin.ModelAdmin):
    list_display = ['name', 'river']
    list_filter = ['river']
    search_fields = ['name', 'river__name']

@admin.register(River_Action)
class RiverActionAdmin(admin.ModelAdmin):
    list_display = ['name', 'location', 'color', 'icon']
    list_filter = ['location__river', 'color']
    search_fields = ['name', 'location__name']

# NEW: Fund_Department Inline for River_Intervention
class Fund_DepartmentInline(admin.StackedInline):
    model = Fund_Department
    fields = ['department_name', 'fund_scheme_name']
    extra = 0
    max_num = 1
    verbose_name = "Department & Fund Assignment"
    verbose_name_plural = "Department & Fund Assignment"

@admin.register(River_Intervention)
class RiverInterventionAdmin(admin.ModelAdmin):
    list_display = ['name', 'action', 'get_department_name', 'get_fund_scheme_name']
    list_filter = ['action__location__river']  # UPDATED: Removed old department/fund_scheme filters
    search_fields = ['name', 'action__name']
    inlines = [Fund_DepartmentInline]  # NEW: Add Fund_Department inline
    
    # UPDATED: Removed old department/fund_scheme fields from fieldsets
    fieldsets = (
        ('Basic Information', {
            'fields': ('action', 'name')
        }),
        # REMOVED: Assignment fieldset since it's now handled by inline
        # ('Assignment', {
        #     'fields': ('department', 'fund_scheme'),
        #     'description': 'Select the responsible department and funding scheme'
        # }),
    )
    
    # NEW: Custom methods to display department/fund info in list view
    def get_department_name(self, obj):
        """Display department name from Fund_Department model"""
        try:
            return obj.fund_department.department_name or "Not Assigned"
        except Fund_Department.DoesNotExist:
            return "Not Assigned"
    get_department_name.short_description = 'Department'
    get_department_name.admin_order_field = 'fund_department__department_name'
    
    def get_fund_scheme_name(self, obj):
        """Display fund scheme name from Fund_Department model"""
        try:
            return obj.fund_department.fund_scheme_name or "Not Assigned"
        except Fund_Department.DoesNotExist:
            return "Not Assigned"
    get_fund_scheme_name.short_description = 'Fund Scheme'
    get_fund_scheme_name.admin_order_field = 'fund_department__fund_scheme_name'

@admin.register(River_WorkflowPhase)
class RiverWorkflowPhaseAdmin(admin.ModelAdmin):
    list_display = ['intervention', 'phase', 'status', 'commenced', 'deadline', 'completed', 'is_locked']
    list_filter = ['phase', 'status', 'intervention__action__location__river']
    search_fields = ['intervention__name', 'intervention__action__name']
    readonly_fields = ['is_locked']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('intervention', 'phase', 'status')
        }),
        ('Timeline', {
            'fields': ('commenced', 'deadline', 'completed'),
            'description': 'Workflow timeline information'
        }),
        ('System Information', {
            'fields': ('is_locked',),
            'description': 'System-calculated fields'
        }),
    )
    
    def get_readonly_fields(self, request, obj=None):
        readonly_fields = list(self.readonly_fields)
        
        # Make phase readonly after creation to maintain data integrity
        if obj:  # editing an existing object
            readonly_fields.append('intervention')
            readonly_fields.append('phase')
            
        return readonly_fields

# NEW: Standalone Fund_Department admin
@admin.register(Fund_Department)
class Fund_DepartmentAdmin(admin.ModelAdmin):
    list_display = ['intervention', 'department_name', 'fund_scheme_name', 'is_fully_assigned', 'created_at']
    list_filter = [
        'department_name', 
        'fund_scheme_name', 
        'created_at',
        'intervention__action__location__river'
    ]
    search_fields = [
        'intervention__name', 
        'intervention__action__name',
        'department_name', 
        'fund_scheme_name'
    ]
    readonly_fields = ['is_fully_assigned', 'is_partially_assigned', 'created_at', 'updated_at']
    
    fieldsets = (
        ('Intervention', {
            'fields': ('intervention',)
        }),
        ('Assignment', {
            'fields': ('department_name', 'fund_scheme_name'),
            'description': 'Assign department and funding scheme for this intervention'
        }),
        ('Status', {
            'fields': ('is_fully_assigned', 'is_partially_assigned'),
            'classes': ('collapse',),
            'description': 'Assignment status (automatically calculated)'
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',),
            'description': 'Creation and modification timestamps'
        }),
    )