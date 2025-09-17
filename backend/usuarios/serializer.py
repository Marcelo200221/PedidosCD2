from rest_framework import serializers
from .models import Usuario
from django.contrib.auth.models import Group, Permission

class UsuarioSerializer(serializers.ModelSerializer):
    class Meta:
        model: Usuario
        fields = [
            "email",
            "rut",
            "first_name",
            "last_name",
            
            
        ]