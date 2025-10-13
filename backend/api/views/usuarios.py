from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.views import APIView
from django.shortcuts import render
from rest_framework.response import Response
from django.core.mail import send_mail
from django.conf import settings

from usuarios.models import Usuario
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
                reset_code.is_used = True
                reset_code.save()
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
            return Response({'error': 'Código expirado'}, stauts=status.HTTP_400_BAD_REQUEST)
        except PasswordResetCode.DoesNotExist:
            return Response({'error': 'Código no valido'}, status=status.HTTP_404_NOT_FOUND)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)




