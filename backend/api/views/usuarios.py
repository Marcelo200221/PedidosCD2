from rest_framework.decorators import api_view
from rest_framework.views import APIView
from django.shortcuts import render
from rest_framework.response import Response

from usuarios.models import Usuario
from usuarios.serializer import (
    UsuarioSerializer
)


class listarUsuarios(APIView):

    def get(self, request):
        usuarios = Usuario.objects.all()
        serializer = UsuarioSerializer(usuarios, many=True)
        return Response(serializer.data)

