from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import views, usuarios, pedidos, clientes

router = DefaultRouter()
router.register(r'pedidos', pedidos.PedidoViewSet, basename='pedidos')

urlpatterns = [
    path('hello/', views.hello_api, name='hello_api'),
    path('lista/usuarios', usuarios.lista_usuarios, name="lista-usuarios"),
    path('password-reset-request/', usuarios.password_reset_request),
    path('password-reset-confirm/', usuarios.password_reset_confirm),
    path('password-reset-change/', usuarios.password_reset_change),
    path('usuarios/lista', usuarios.usuario_lista, name="usuario-lista"),
    path('productos/', pedidos.productos, name="productos"),
    path('lista/clientes', clientes.listar_clientes, name="lista_clientes"),
    path("agregar-cliente/", clientes.agregar_cliente, name="agregar-cliente"),
    path("eliminar/cliente/<str:pk>/", clientes.eliminar_cliente, name="eliminar-cliente")
] + router.urls
