from api.models import Cliente
from api.serializers import ClienteSerializer
from rest_framework.decorators import api_view, action
from rest_framework import status
from rest_framework.response import Response
from django.db import IntegrityError

@api_view(["GET"])
def listar_clientes(request):
    clientes = Cliente.objects.all()
    serializer = ClienteSerializer(clientes, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)

@api_view(["POST"])
def agregar_cliente(request):
    serializer = ClienteSerializer(data=request.data)

    if serializer.is_valid():
        try:
            serializer.save()
            return Response({"messagge": "Cliente creado exitosamente", "cliente": serializer.data})
        except IntegrityError:
            return Response({"error": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)
    else:
        return Response({"errors": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)
    
@api_view(["DELETE"])
def eliminar_cliente(request, pk):
    if not pk:
        return Response({"error": "No se proporcionó un id"})
    
    try:
        cliente = Cliente.objects.get(pk=pk)
    except Cliente.DoesNotExist:
        return Response({
            "error": f"No existe un cliente con id '{pk}'"

        }, status=status.HTTP_404_NOT_FOUND)
    
    try:
        cliente.delete()
        return Response(
            {"messagge": f"Cliente '{pk}' eliminado exitosamente."},
            status=status.HTTP_200_OK
        )
    except Exception as e:
        return Response(
            {"error": f"Ocurrió un error al eliminar el cliente: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )