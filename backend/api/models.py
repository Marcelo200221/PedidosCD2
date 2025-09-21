from django.db import models

# Create your models here.

class Pedidos(models.Model):
    direccion = models.CharField(max_length=100)
    fecha_entrega = models.DateField()

