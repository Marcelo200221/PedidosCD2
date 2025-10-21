from rest_framework.decorators import api_view, action
from rest_framework import status
from rest_framework.views import APIView
from django.shortcuts import render
from api.models import Pedidos, Productos
from api.serializers import PedidoSerializer, ProductoSerializer
from rest_framework import viewsets
from rest_framework.response import Response

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


