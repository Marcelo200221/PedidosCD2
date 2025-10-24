from rest_framework import serializers
from .models import Usuario
from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.models import Group, Permission
from dj_rest_auth.serializers import LoginSerializer
from dj_rest_auth.registration.serializers import RegisterSerializer
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()

print("🚀 CustomLoginSerializer cargado")

class CustomLoginSerializer(LoginSerializer):
    username = None
    rut = serializers.CharField(required=True)

    def validate(self, attrs):
       print("DEBUG: Datos recibidos en validate:", attrs)

        # Toma el rut y lo asigna como username (que es lo que espera Django)
       rut = attrs.get('rut')
       password = attrs.get('password')

       if rut and password:
            # Intenta autenticar usando rut como username
          user = authenticate(username=rut, password=password)

          if user:
              if not user.is_active:
                raise serializers.ValidationError("Usuario desactivado.")

                attrs['user'] = user
                return attrs
              else:
                   raise serializers.ValidationError("Credenciales incorrectas.")
          else:
               raise serializers.ValidationError("Debe proporcionar rut y contraseña.")
          
class UserRegistrationSerializer(RegisterSerializer):
    username= None
    first_name = serializers.CharField(required=True)
    last_name = serializers.CharField(required=True)
    rut = serializers.CharField(required=True)
    email = serializers.EmailField(required=True)

    def validate_rut(self, value):
        if Usuario.objects.filter(rut=value).exists():
            raise serializers.ValidationError("Este RUT ya está registrado")
        return value

    def validate_email(self, value):
        if Usuario.objects.filter(email=value).exists():
            raise serializers.ValidationError("Este email ya está registrado")
        return value

    def get_cleaned_data(self):
        data = super().get_cleaned_data()
        data['first_name'] = self.validated_data.get('first_name', '')
        data['last_name'] = self.validated_data.get('last_name', '')
        data['rut'] = self.validated_data.get('rut', '')
        data['email'] = self.validated_data.get('email', '')
        return data
    def save(self, request):
        cleaned_data = self.get_cleaned_data()
        user = Usuario.objects.create_user(
            rut=cleaned_data['rut'],
            username=cleaned_data['rut'],  
            email=cleaned_data['email'],
            first_name=cleaned_data['first_name'],
            last_name=cleaned_data['last_name'],
            password=cleaned_data['password1']
        )
        try:
            grupo_base = Group.objects.get(name="repartidor")
            user.groups.add(grupo_base)
        except Group.DoesNotExist:
            print("Grupo 'repartidor' inexistente")
        return user
    
class JWTSerializer(serializers.Serializer):
    user = serializers.SerializerMethodField()
    token = serializers.SerializerMethodField()

    def get_user(self, obj):
        user = obj.get("user")
        return {
            'id': user.id,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'rut': user.rut,
        }
    def get_token(sefl, obj):
        user = obj.get("user")
        refresh = RefreshToken.for_user(user)
        return {
            'refresh': str(refresh),
            'access': str(refresh.access_token)
        }
    
class UsuarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuario
        fields = ['id', 'rut', 'email', 'first_name', 'last_name', 'username']
    

