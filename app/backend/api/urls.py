# api/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from . import views

router = DefaultRouter()
router.register(r'appointments', views.AppointmentViewSet, basename='appointment')

urlpatterns = [
    path('', views.api_root, name='api-root'),
    # Placer les routes spécifiques avant include(router.urls)
    path('appointments/stats/', views.appointment_stats, name='appointment-stats'),
    path('register/', views.register_user, name='register'),
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    # Placer le router.urls en dernier
    path('', include(router.urls)),
]