from django.urls import path
from .views import candidate_dashboard, hr_dashboard, super_admin_dashboard

urlpatterns = [
    path('candidate-dashboard/', candidate_dashboard, name='candidate_dashboard'),
    path('hr-dashboard/', hr_dashboard, name='hr_dashboard'),
    path('super-admin-dashboard/', super_admin_dashboard, name='super_admin_dashboard'),
]
