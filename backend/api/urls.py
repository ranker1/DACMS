from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CustomLoginView
from .views import UserViewSet, AutopsyCaseViewSet, EvidenceViewSet, ReportViewSet

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'cases', AutopsyCaseViewSet)
router.register(r'evidence', EvidenceViewSet)
router.register(r'reports', ReportViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('login/', CustomLoginView.as_view()),
]