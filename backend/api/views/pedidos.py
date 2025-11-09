from rest_framework.decorators import api_view, action, permission_classes
from rest_framework import status
from rest_framework.views import APIView
from django.shortcuts import render
from api.models import Pedidos, Productos
from api.serializers import PedidoSerializer, ProductoSerializer
from rest_framework import viewsets
from rest_framework.response import Response
from api.models import DetallePedido, Pedidos, Productos 
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum, Count

class PedidoViewSet(viewsets.ModelViewSet):
    queryset = Pedidos.objects.all()
    serializer_class = PedidoSerializer

    @action(detail=False, methods=['delete'])
    def eliminar_multiples(self, request):
        try:
            ids=request.data.get('ids', [])
            if not ids:
                return Response(
                    {'error': 'No se proporcionarion IDs'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            pedidos_a_eliminar = self.queryset.filter(id__in=ids)
            count = pedidos_a_eliminar.count()

            if count != len(ids):
                return Response(
                    {'error': 'Algunos pedidos no existen'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            pedidos_a_eliminar.delete()
            return Response(
                {'message': f'{count} pedido(s) eliminado(s) correctamente'},
                status=status.HTTP_200_OK
            )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

@api_view(["GET"])
def productos(request):
    productos = Productos.objects.all()
    serializer = ProductoSerializer(productos, many=True)

    return Response(serializer.data, status=status.HTTP_200_OK)

@api_view(["PUT"])
def asignar_precio_v2(request):
    try:
        data = request.data or {}
        pk = data.get("pk")
        nuevo_precio = data.get("precio")

        if pk is None or nuevo_precio is None:
            return Response({"error": "Se requieren 'pk' y 'precio'"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            p = Productos.objects.get(pk=pk)
        except Productos.DoesNotExist:
            return Response({"error": "El producto seleccionado no existe"}, status=status.HTTP_404_NOT_FOUND)

        try:
            valor = int(nuevo_precio)
        except (TypeError, ValueError):
            return Response({"error": "El precio debe ser un entero"}, status=status.HTTP_400_BAD_REQUEST)

        if valor < 0:
            return Response({"error": "El precio no puede ser negativo"}, status=status.HTTP_400_BAD_REQUEST)

        p.precio = valor
        p.save(update_fields=["precio"])

        return Response({"success": "Precio actualizado correctamente", "id": p.id, "precio": p.precio}, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(["PUT"])
def asignar_precio(request, pk):
    nuevo_precio = request.GET.get("precio")
    try:
        p = Productos.objects.get(pk=pk)
    except Productos.DoesNotExist:
        return Response(
            {"error": "El producto seleccionado no existe"},
            status=status.HTTP_404_NOT_FOUND
        )
    
    p.precio = nuevo_precio
    p.save()

    return Response(
        {"success": "Se cambió el precio correctamente"},
        status=status.HTTP_200_OK
    )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def productos_mas_vendidos(request):
    """
    Este metodo retorna los productos más vendidos por cantidad de cajas.
    Solo cuenta pedidos completados.
    """
    try:
        #Estados válidos para contar, se puede cambiar para contar estados especificos.
        estados_validos = ['completado']
        
        #Query para obtener productos más vendidos
        productos_vendidos = (
            DetallePedido.objects
            .filter(pedido__estado__in=estados_validos)  #Solo pedidos en estados válidos
            .values('producto__id', 'producto__nombre')  #Agrupar por producto
            .annotate(
                cantidad_cajas_total=Sum('cantidad_cajas')  #Sumar todas las cajas del producto
            )
            .order_by('-cantidad_cajas_total')  #Ordenar de mayor a menor
            [:10]  #Top 10 productos
        )
        
        resultado = [
            {
                'id': item['producto__id'],
                'nombre': item['producto__nombre'],
                'cantidad': item['cantidad_cajas_total'] or 0
            }
            for item in productos_vendidos
        ]
        
        print(f"Productos más vendidos encontrados: {len(resultado)}")
        print(f"Resultado: {resultado}")
        
        return Response(resultado)
        
    except Exception as e:
        print(f"Error en productos_mas_vendidos: {str(e)}")
        return Response(
            {"error": "Error al obtener productos más vendidos", "detail": str(e)}, 
            status=500
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def clientes_con_mas_pedidos(request):
    """
    Este método retorna los clientes con más pedidos realizados.
    Solo cuenta pedidos completados.
    """
    try:
        #Estados válidos para contar
        estados_validos = ['completado']
        
        #Query para obtener clientes con más pedidos
        clientes_pedidos = (
            Pedidos.objects
            .filter(estado__in=estados_validos, cliente__isnull=False)  #Solo pedidos completados con cliente asignado
            .values('cliente__id_cliente', 'cliente__nombre')  #Agrupar por cliente
            .annotate(
                cantidad_pedidos=Count('id')  #Contar cantidad de pedidos
            )
            .order_by('-cantidad_pedidos')  #Ordenar de mayor a menor
            [:10]  #Top 10 clientes
        )
        
        resultado = [
            {
                'id': item['cliente__id_cliente'],
                'nombre': item['cliente__nombre'] or 'Sin nombre',
                'cantidad': item['cantidad_pedidos']
            }
            for item in clientes_pedidos
        ]
        
        print(f"Clientes con más pedidos encontrados: {len(resultado)}")
        print(f"Resultado: {resultado}")
        
        return Response(resultado)
        
    except Exception as e:
        print(f"Error en clientes_con_mas_pedidos: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {"error": "Error al obtener clientes con más pedidos", "detail": str(e)}, 
            status=500
        )