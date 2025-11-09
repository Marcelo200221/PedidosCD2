from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import views, usuarios, pedidos, clientes
from .views.facturas import GenerarFacturaPDF, PreviewFacturaPDF, GenerarFacturaPorPedido
from .views.pedidos import clientes_con_mas_pedidos


router = DefaultRouter()
router.register(r'pedidos', pedidos.PedidoViewSet, basename='pedidos')

urlpatterns = [
    path('hello/', views.hello_api, name='hello_api'),
    path('lista/usuarios', usuarios.lista_usuarios, name="lista-usuarios"),
    path('password-reset-request/', usuarios.password_reset_request),
    path('password-reset-confirm/', usuarios.password_reset_confirm),
    path('password-reset-change/', usuarios.password_reset_change),
    path('usuarios/lista', usuarios.usuario_lista, name="usuario-lista"),
    path('usuarios/permisos', usuarios.permisos_usuario, name="usuario-permisos"),
    path('productos/', pedidos.productos, name="productos"),
    path('lista/clientes', clientes.listar_clientes, name="lista_clientes"),
    path("agregar-cliente/", clientes.agregar_cliente, name="agregar-cliente"),
    path("eliminar/cliente/<str:pk>/", clientes.eliminar_cliente, name="eliminar-cliente"),
    path('facturas/preview', PreviewFacturaPDF.as_view(), name='facturas-preview'),
    path('facturas/generar', GenerarFacturaPDF.as_view(), name='facturas-generar'),
    path('facturas/generar-por-pedido/<int:pedido_id>', GenerarFacturaPorPedido.as_view(), name='facturas-generar-por-pedido'),
    path('asignar/precio', pedidos.asignar_precio_v2, name="asignar-precio"),
    path('productos/mas-vendidos/', pedidos.productos_mas_vendidos, name='productos-mas-vendidos'),
    path('clientes-mas-pedidos/', clientes_con_mas_pedidos, name='clientes-mas-pedidos'),
] + router.urls
