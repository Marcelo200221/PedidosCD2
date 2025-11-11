from api.models import Cliente
from api.serializers import ClienteSerializer
from rest_framework.decorators import api_view, action
from rest_framework import status
from rest_framework.response import Response
from django.db import IntegrityError
from rest_framework.views import APIView


class ClienteVIew(APIView):
    def get(self, request, pk=None):
        if not pk:
            clientes = Cliente.objects.all()
            serializer = ClienteSerializer(clientes, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        try:
            cliente = Cliente.objects.get(pk=pk)
        except Cliente.DoesNotExist:
            return Response({"error": f"No existe cliente con id {pk}"}, status=status.HTTP_404_NOT_FOUND)
        serializer = ClienteSerializer(cliente)
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
    
@api_view(["PUT"])
def editar_cliente(request, pk):
    # Validar que se haya enviado un ID
    if not pk:
        return Response({"error": "No se proporcionó un ID válido"}, status=status.HTTP_400_BAD_REQUEST)

    # Buscar el cliente
    try:
        cliente = Cliente.objects.get(pk=pk)
    except Cliente.DoesNotExist:
        return Response({"error": f"No existe cliente con id {pk}"}, status=status.HTTP_404_NOT_FOUND)

    # Preparar datos y validar unicidad excluyendo el propio registro
    data = request.data.copy() if hasattr(request, 'data') else {}

    nuevo_rut = data.get('rut')
    if nuevo_rut is not None:
        if str(nuevo_rut) == str(cliente.rut):
            data.pop('rut', None)
        else:
            if Cliente.objects.exclude(pk=pk).filter(rut=nuevo_rut).exists():
                return Response({"rut": "Este RUT ya esta registrado"}, status=status.HTTP_400_BAD_REQUEST)

    nuevo_id = data.get('id_cliente')
    if nuevo_id is not None:
        if str(nuevo_id) == str(cliente.id_cliente):
            data.pop('id_cliente', None)
        else:
            if Cliente.objects.exclude(pk=pk).filter(id_cliente=nuevo_id).exists():
                return Response({"id_cliente": "Este ID ya existe"}, status=status.HTTP_400_BAD_REQUEST)

    # Enlazar el cliente existente con los nuevos datos
    serializer = ClienteSerializer(cliente, data=data, partial=True)  
    # 👆 'partial=True' permite editar solo algunos campos (no todos obligatorios)

    # Validar los datos enviados
    if serializer.is_valid():
        serializer.save()  # Guarda los cambios en la base de datos
        return Response(serializer.data, status=status.HTTP_200_OK)
    else:
        # Si hay errores de validación
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
