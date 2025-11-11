from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.views import APIView
from django.shortcuts import render
from rest_framework.response import Response
from django.core.mail import send_mail
from django.conf import settings
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth.models import Group

from usuarios.models import Usuario
from usuarios.serializer import UsuarioSerializer
from api.models import PasswordResetCode
from api.serializers import PasswordResetConfirmSerializer, PasswordResetRequestSerielizer, PasswordChangeConfirmSerializer

@api_view(['POST'])
def password_reset_request(request):
    serializer = PasswordResetRequestSerielizer(data=request.data)
    if serializer.is_valid():
        email = serializer.validated_data['email']
        try:
            user = Usuario.objects.get(email=email)
            reset_code = PasswordResetCode.objects.create(user=user)
            
            # Texto sin caracteres especiales para prueba
            subject = 'Codigo de Recuperacion'
            message = f'Tu codigo de verificacion es: {reset_code.code}'
            
            try:
                send_mail(
                    subject=subject,
                    message=message,
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[email],
                    fail_silently=False,
                )
                return Response({'message': 'Código enviado'}, status=status.HTTP_200_OK)
            except Exception as e:
                print(f"Error enviando email: {e}")
                return Response({'error': 'Error enviando el código'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        except Usuario.DoesNotExist:
            return Response({'error': 'Usuario no encontrado'}, status=status.HTTP_404_NOT_FOUND)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
def password_reset_confirm(request):
    serializer = PasswordResetConfirmSerializer(data=request.data)
    if serializer.is_valid():
        code = serializer.validated_data['code']

        try:
            reset_code = PasswordResetCode.objects.get(code=code, is_used=False)
            if reset_code.is_valid():
                return Response({'message': 'Codigo valido, se procede al cambio de contraseña'}, status=status.HTTP_200_OK)
            return Response({'error': 'Codigo expirado'}, status=status.HTTP_400_BAD_REQUEST)
        except PasswordResetCode.DoesNotExist:
            return Response({'error': 'Código inválido'}, status=status.HTTP_404_NOT_FOUND)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
def password_reset_change(request):
    serializer = PasswordChangeConfirmSerializer(data=request.data)
    if serializer.is_valid():
        code = serializer.validated_data['code']
        new_password = serializer.validated_data['new_password']

        try:
            reset_code = PasswordResetCode.objects.get(code=code, is_used=False)
            if reset_code.is_valid():
                user = reset_code.user
                user.set_password(new_password)
                user.save()

                reset_code.is_used = True
                reset_code.save()
                return Response({'message': 'Contraseña actualizada exitosamente'}, status=status.HTTP_200_OK)
            return Response({'error': 'Código expirado'}, status=status.HTTP_400_BAD_REQUEST)  # Corregido: stauts -> status
        except PasswordResetCode.DoesNotExist:
            return Response({'error': 'Código no valido'}, status=status.HTTP_404_NOT_FOUND)
    
    # IMPORTANTE: Mostrar los errores del serializer
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
def usuario_lista(request):
    rut = request.query_params.get("rut", None)

    if rut:
        try:
            usuario = Usuario.objects.get(rut=rut)
            serializer = UsuarioSerializer(usuario)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Usuario.DoesNotExist:
            return Response({'exists': False}, status=status.HTTP_404_NOT_FOUND)      

    else:
        usuarios = Usuario.objects.all()
        serializer = UsuarioSerializer(usuarios, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

@api_view(['GET'])
def lista_usuarios(request):
    usuarios = Usuario.objects.all()
    serializer = UsuarioSerializer(usuarios, many=True)

    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def permisos_usuario(request):
    user = request.user
    if not user.is_authenticated:
        return Response({'detail': 'Authentication credentials were not provided.'}, status=status.HTTP_401_UNAUTHORIZED)

    grupos = [g.name for g in user.groups.all()]
    try:
        permisos = getattr(user, 'permisos', [])
    except Exception:
        permisos = []

    return Response({
        'id': user.id,
        'rut': getattr(user, 'rut', None),
        'email': user.email,
        'first_name': user.first_name,
        'last_name': user.last_name,
        'groups': grupos,
        'permisos': permisos,
    }, status=status.HTTP_200_OK)


@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def perfil_actual(request):
    """Devuelve y permite actualizar el perfil del usuario autenticado.

    PATCH acepta: first_name, last_name, email. No permite cambiar rut.
    """
    user: Usuario = request.user

    if request.method == 'GET':
        serializer = UsuarioSerializer(user)
        return Response(serializer.data, status=status.HTTP_200_OK)

    data = request.data or {}
    first_name = data.get('first_name') or data.get('nombre')
    last_name = data.get('last_name') or data.get('apellido')
    email = data.get('email') or data.get('correo')

    # Validación de email único si cambia
    if email and email != user.email:
        if Usuario.objects.exclude(pk=user.pk).filter(email=email).exists():
            return Response({'email': 'Este email ya está registrado'}, status=status.HTTP_400_BAD_REQUEST)

    if first_name is not None:
        user.first_name = first_name
    if last_name is not None:
        user.last_name = last_name
    if email is not None:
        user.email = email

    user.save()
    serializer = UsuarioSerializer(user)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(["PUT"])
@permission_classes([IsAuthenticated])
def dar_permisos(request, pk):
    """
    Asigna el grupo 'gerente' al usuario indicado, sobrescribiendo grupos previos.
    Si ya lo tiene, mantiene solo ese grupo. Opcionalmente podría marcar is_staff.
    """
    try:
        user = Usuario.objects.get(pk=pk)
    except Usuario.DoesNotExist:
        return Response({"error": f"Usuario no encontrado para id {pk}"}, status=status.HTTP_404_NOT_FOUND)

    try:
        grupo_gerente = Group.objects.get(name="gerente")
    except Group.DoesNotExist:
        return Response({"error": "Grupo 'gerente' no existe"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # Sobrescribir grupos del usuario con solo 'gerente'
    user.groups.set([grupo_gerente])
    # Opcional: elevar flag staff si aplica
    if not getattr(user, "is_staff", False):
        user.is_staff = True
    user.save()

    return Response({"success": True, "id": user.id, "grupos": [g.name for g in user.groups.all()]}, status=status.HTTP_200_OK)





