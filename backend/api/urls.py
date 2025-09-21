from django.urls import path
from .views import views, usuarios

urlpatterns = [
    path('hello/', views.hello_api, name='hello_api'),
    path('usuarios/', usuarios.listarUsuarios.as_view(), name='listar-usuario' )
]