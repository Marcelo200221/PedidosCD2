from django.urls import path
from .views import views, usuarios

urlpatterns = [
    path('hello/', views.hello_api, name='hello_api'),
    path('password-reset-request/', usuarios.password_reset_request),
    path('password-reset-confirm/', usuarios.password_reset_confirm),
    path('password-reset-change/', usuarios.password_reset_change)
]