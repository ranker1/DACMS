from django.contrib import admin
from .models import CustomUser, AutopsyCase, AutopsyReport, HistologyCassette, Evidence
from .models import CaseAssignment, AuditLog
from .models import Consent, Observer, ChainOfCustody, EvidencePhoto


@admin.register(CustomUser)
class CustomUserAdmin(admin.ModelAdmin):
	list_display = ('username', 'email', 'role', 'is_staff', 'is_superuser')


@admin.register(AutopsyCase)
class AutopsyCaseAdmin(admin.ModelAdmin):
	list_display = ('case_id', 'deceased_name', 'case_type', 'status', 'date_of_arrival')
	search_fields = ('case_id', 'deceased_name', 'ob_number')


@admin.register(AutopsyReport)
class AutopsyReportAdmin(admin.ModelAdmin):
	list_display = ('case', 'pathologist', 'exam_date')


@admin.register(HistologyCassette)
class HistologyCassetteAdmin(admin.ModelAdmin):
	list_display = ('cassette_id', 'report', 'tissue_type')


@admin.register(Evidence)
class EvidenceAdmin(admin.ModelAdmin):
	list_display = ('item_name', 'case', 'location', 'collected_at')
	search_fields = ('item_name', 'description')


@admin.register(CaseAssignment)
class CaseAssignmentAdmin(admin.ModelAdmin):
	list_display = ('case', 'assignee', 'assigned_at')


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
	list_display = ('timestamp', 'user', 'action', 'model_name', 'object_pk')
	readonly_fields = ('timestamp',)
	
@admin.register(Consent)
class ConsentAdmin(admin.ModelAdmin):
	list_display = ('case', 'consent_given', 'signer_name', 'signed_at')

@admin.register(Observer)
class ObserverAdmin(admin.ModelAdmin):
	list_display = ('case', 'name', 'role', 'present', 'added_at')

@admin.register(ChainOfCustody)
class ChainOfCustodyAdmin(admin.ModelAdmin):
	list_display = ('case', 'evidence', 'event_type', 'from_user', 'to_user', 'timestamp')

@admin.register(EvidencePhoto)
class EvidencePhotoAdmin(admin.ModelAdmin):
	list_display = ('id', 'case', 'evidence', 'is_exhibit', 'uploaded_at')
