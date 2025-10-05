from django.db import models
from django.contrib.auth.models import AbstractUser, Permission
from django.core.validators import MinLengthValidator
# Create your models here.

class Usuario(AbstractUser):
    
    rut = models.CharField(
            max_length=10,
            validators=[MinLengthValidator(9)],
            unique=True
        )
    email = models.EmailField(unique=True)
    
    USERNAME_FIELD = 'rut'
    REQUIRED_FIELDS = ['first_name', 'last_name', 'email', 'username']

    @property
    def permisos(self):
        permisos = self.user_permissions.all() | Permission.objects.filter(group__user=self)
        return [permiso.codename for permiso in permisos]
    
    @property
    def label(self):
        return f"{self.first_name} {self.last_name}"
    
    
    def __str__(self):
        return self.email
    
