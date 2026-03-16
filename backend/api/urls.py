from django.urls import path, include
from rest_framework.routers import DefaultRouter
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.authtoken.views import obtain_auth_token  # <--- Essential for login

# Import Views
from .views import (
    UserViewSet, 
    AutopsyCaseViewSet, 
    EvidenceViewSet, 
    ReportViewSet, 
    CustomLoginView, 
    RegisterUserView,
    generate_pdf,
    pathologists_list, 
    case_assignment_view,
    ConsentViewSet, 
    ObserverViewSet, 
    ChainOfCustodyViewSet, 
    EvidencePhotoViewSet,
    AuditLogViewSet,
    HistologyCassetteViewSet,
    OrganizationViewSet # Add Organization ViewSet
)

# --- ROUTER SETUP ---
router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'cases', AutopsyCaseViewSet)
router.register(r'evidence', EvidenceViewSet)
router.register(r'reports', ReportViewSet)
router.register(r'audit', AuditLogViewSet)
router.register(r'organizations', OrganizationViewSet) # Add organizations endpoint

# Extras
router.register(r'consents', ConsentViewSet)
router.register(r'observers', ObserverViewSet)
router.register(r'chain', ChainOfCustodyViewSet)
router.register(r'evidence-photos', EvidencePhotoViewSet)

# Nested route for cassettes (keeping your custom regex logic if needed, 
# though standard flat routes often simpler)
router.register(r'reports/(?P<report_id>[^/.]+)/cassettes', 
                HistologyCassetteViewSet, 
                basename='report-cassettes')

# --- URL PATTERNS ---
urlpatterns = [
    # 1. Router URLs (Standard API endpoints)
    path('', include(router.urls)),

    # 2. Authentication Endpoints
    # The frontend looks for 'api-token-auth/', so we MUST define it here.
    path('api-token-auth/', obtain_auth_token, name='api_token_auth'), 
    path('login/', CustomLoginView.as_view(), name='custom_login'), # Optional, if you have a custom view
    path('register/', RegisterUserView.as_view(), name='register'),

    # 3. Custom Function Views
    # PDF Generator
    path('cases/<str:case_id>/pdf/', generate_pdf, name='generate_pdf'),
    # Pathologist Assignment Tools
    path('pathologists/', pathologists_list, name='pathologists_list'),
    path('cases/<int:case_pk>/assignment/', case_assignment_view, name='case_assignment'),
]

# --- MEDIA SERVING (DEV MODE) ---
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)