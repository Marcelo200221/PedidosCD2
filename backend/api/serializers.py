from rest_framework import serializers
from usuarios.models import Usuario
from .models import PasswordResetCode

class PasswordResetRequestSerielizer(serializers.Serializer):
    email = serializers.EmailField()

class PasswordResetConfirmSerializer(serializers.Serializer):
    code = serializers.CharField(max_length=6)

class PasswordChangeConfirmSerializer(serializers.Serializer):
    code = serializers.CharField(max_length=6)
    new_password = serializers.CharField(min_length=6)