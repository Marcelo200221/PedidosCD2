from django.db import models
from django.db.models import Sum
from django.core.validators import MinValueValidator
from django.db.models.signals import pre_save
from django.dispatch import receiver
from usuarios.models import Usuario
from django.utils import timezone
from datetime import timedelta
import secrets

# Create your models here.

class Productos(models.Model):
    id = models.IntegerField(primary_key=True)
    nombre = models.CharField(max_length=200)
    precio = models.IntegerField(default=0)
    stock = models.IntegerField(default=0)

    def __str__(self):
        return f"{self.id} - {self.nombre} - {self.precio} - {self.stock}"

class Pedidos(models.Model):
    ESTADO_CHOICES = [
        ('pendiente_pesos', 'Pendiente de Pesos'),
        ('listo_facturar', 'Listo para Facturar'),
        ('pendiente_confirmacion', 'Pendiente de Confirmación'),
        ('completado', 'Completado'), #Estados
    ]
    
    direccion = models.CharField(max_length=200)
    fecha_entrega = models.DateField()
    # Relación al cliente que realiza el pedido
    cliente = models.ForeignKey('Cliente', on_delete=models.PROTECT, related_name='pedidos', null=True, blank=True)

    ESTADO_CHOICES = [
        ('pendiente_pesos', 'Pendiente de Pesos'),
        ('listo_facturar', 'Listo para Facturar'),
        ('pendiente_confirmacion', 'Pendiente de Confirmación'),
        ('completado', 'Completado'),
    ]
    estado = models.CharField(max_length=50, choices=ESTADO_CHOICES, default='pendiente_pesos')

    def __str__(self):
        return f"Pedido {self.id} - {self.fecha_entrega} - {self.get_estado_display()}"
    
class DetallePedido(models.Model):
    pedido = models.ForeignKey(Pedidos, on_delete=models.CASCADE, related_name="lineas")
    producto = models.ForeignKey(Productos, on_delete=models.PROTECT)

    cantidad_cajas = models.PositiveIntegerField(default=0)
    peso_total_producto = models.FloatField(default=0.0, validators=[MinValueValidator(0.0)])

    class Meta:
        unique_together = ("pedido", "producto")

    def __str__(self):
        return f"Pedido {self.pedido.id} - {self.producto.nombre} - {self.cantidad_cajas} - {self.peso_total_producto}"
    
    def recompute_peso_total(self):
        agg = self.cajas.aggregate(total=Sum("peso"))
        total = agg["total"] or 0.0
        self.peso_total_producto = float(total)
        self.cantidad_cajas = self.cajas.count()

        DetallePedido.objects.filter(pk=self.pk).update(
            peso_total_producto = self.peso_total_producto,
            cantidad_cajas = self.cantidad_cajas
        )

class Caja(models.Model):
    pedido_producto = models.ForeignKey(
        DetallePedido, on_delete=models.CASCADE, related_name="cajas"
    )
    peso = models.FloatField(validators=[MinValueValidator(0.0)])
    etiqueta = models.CharField(max_length=100, blank=True, null=True)

    def __str__(self):
        return f"Caja {self.id} - {self.pedido_producto.producto.nombre} - {self.peso}kg"
    

class PasswordResetCode(models.Model):
    user = models.ForeignKey(Usuario, on_delete=models.CASCADE)
    code = models.CharField(max_length=6, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    is_used = models.BooleanField(default=False)

    def save(self, *args, **kwargs):
        if not self.code:
            self.code = secrets.randbelow(1000000)
        super().save(*args, **kwargs)
    
    def is_valid(self):
        return not self.is_used and (
            timezone.now() - self.created_at < timedelta(hours=1)
        )
    
    @classmethod
    def clean_expired_codes(cls):
        expiration_time = timezone.now() - timedelta(days=1)
        cls.objects.filter(
            models.Q(created_at__lt=expiration_time) |
            models.Q(is_used=True, created_at__lt=expiration_time)
        ).delete()

@receiver(pre_save, sender=PasswordResetCode)
def cleanup_codes(sender, **kwargs):
    PasswordResetCode.clean_expired_codes()


class Cliente(models.Model):
    id_cliente = models.CharField(max_length=200, primary_key=True)
    rut = models.CharField(max_length=10)
    nombre = models.CharField(max_length=200)
    direccion = models.CharField(max_length=200)
    razon_social = models.CharField(max_length=200)

    def __str__(self):
        return f"{self.nombre} - {self.rut} - {self.razon_social} - {self.direccion}"


