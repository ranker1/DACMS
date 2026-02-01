from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CustomLoginView
from django.conf import settings
from django.conf.urls.static import static
from .views import (
    UserViewSet, 
    AutopsyCaseViewSet, 
    EvidenceViewSet, 
    ReportViewSet, 
    CustomLoginView, 
    RegisterUserView,
    generate_pdf,
    cassette_list_create,
    cassette_detail,
)

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'cases', AutopsyCaseViewSet)
router.register(r'evidence', EvidenceViewSet)
router.register(r'reports', ReportViewSet)
router.register(r'reports/(?P<report_id>[^/.]+)/cassettes',
                # Register nested cassette viewset to support URLs like /reports/1/cassettes/
                # DRF router will pass `report_id` as a kwarg to the viewset.
                __import__('api.views', fromlist=['HistologyCassetteViewSet']).HistologyCassetteViewSet,
                basename='report-cassettes')
from .serializers import AuditLogSerializer
from .models import AuditLog
from .views import pathologists_list, case_assignment_view

from rest_framework import viewsets
from .views import ConsentViewSet, ObserverViewSet, ChainOfCustodyViewSet, EvidencePhotoViewSet


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AuditLog.objects.all().order_by('-timestamp')
    serializer_class = AuditLogSerializer

router.register(r'audit', AuditLogViewSet)
router.register(r'consents', ConsentViewSet)
router.register(r'observers', ObserverViewSet)
router.register(r'chain', ChainOfCustodyViewSet)
router.register(r'evidence-photos', EvidencePhotoViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('login/', CustomLoginView.as_view()),
    path('register/', RegisterUserView.as_view()),
    path('cases/<str:case_id>/pdf/', generate_pdf, name='generate_pdf'),
    path('pathologists/', pathologists_list, name='pathologists_list'),
    path('cases/<int:case_pk>/assignment/', case_assignment_view, name='case_assignment'),
    # Histology cassette endpoints (nested under reports)
    # Note: cassette routes are now provided by the router (nested style).
    
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)