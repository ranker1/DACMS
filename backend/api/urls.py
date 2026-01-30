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
    generate_pdf
)

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'cases', AutopsyCaseViewSet)
router.register(r'evidence', EvidenceViewSet)
router.register(r'reports', ReportViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('login/', CustomLoginView.as_view()),
    path('register/', RegisterUserView.as_view()),
    path('cases/<str:case_id>/pdf/', generate_pdf, name='generate_pdf'),
    
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)