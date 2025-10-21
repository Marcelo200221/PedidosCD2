from rest_framework import serializers
from usuarios.models import Usuario
from api.models import Pedidos, DetallePedido, Caja, Productos
from .models import PasswordResetCode

class PasswordResetRequestSerielizer(serializers.Serializer):
    email = serializers.EmailField()

class PasswordResetConfirmSerializer(serializers.Serializer):
    code = serializers.CharField(max_length=6)

class PasswordChangeConfirmSerializer(serializers.Serializer):
    code = serializers.CharField(max_length=6)
    new_password = serializers.CharField(min_length=8)  # Cambiado de 6 a 8 para coincidir con tu validación frontend
    confirm_password = serializers.CharField(min_length=8)  # AGREGAR ESTE CAMPO
    
    def validate(self, data):
        """Validar que ambas contraseñas coincidan"""
        if data['new_password'] != data['confirm_password']:
            raise serializers.ValidationError({
                'confirm_password': 'Las contraseñas no coinciden'
            })
        return data

class ProductoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Productos
        fields = ['id', 'nombre']

class CajaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Caja
        fields = ['id', 'peso', 'etiqueta']

class DetallePedidoSerializer(serializers.ModelSerializer):
    producto = ProductoSerializer(read_only=True)
    producto_id = serializers.PrimaryKeyRelatedField(
        queryset=Productos.objects.all(),
        source='producto',
        write_only=True
    )

    cajas = CajaSerializer(many=True, required=False)
    cantidad_cajas = serializers.IntegerField(read_only=True)

    class Meta:
        model = DetallePedido
        fields = [
            'id',
            'producto',
            'producto_id',
            'cantidad_cajas',
            'peso_total_producto',
            'cajas'
        ]
    
    def create(self, validated_data):
        cajas_data = validated_data.pop('cajas', [])
        detalle = DetallePedido.objects.create(**validated_data)
        detalle.cantidad_cajas = len(cajas_data)
        for caja_data in cajas_data:
            Caja.objects.create(pedido_producto=detalle, **caja_data)
        detalle.recompute_peso_total()
        return detalle

    def update(self, instance, validated_data):
        cajas_data = validated_data.pop('cajas', None)
        instance.producto = validated_data.get('producto', instance.producto)
        instance.save()

        if cajas_data is not None:
            instance.cantidad_cajas = len(cajas_data)
            instance.cajas.all().delete()
            for caja_data in cajas_data:
                Caja.objects.create(pedido_producto=instance, **caja_data)
            instance.recompute_peso_total()
        return instance


class PedidoSerializer(serializers.ModelSerializer):
    lineas = DetallePedidoSerializer(many=True)

    class Meta:
        model = Pedidos
        fields = ['id', 'direccion', 'fecha_entrega', 'lineas']
    
    def create(self, validated_data):
        lineas_data = validated_data.pop('lineas', [])
        pedido = Pedidos.objects.create(**validated_data)
        for linea_data in lineas_data:
            cajas_data = linea_data.pop('cajas', [])

            linea_data['cantidad_cajas'] = len(cajas_data)
            detalle = DetallePedido.objects.create(pedido=pedido, **linea_data)
            for caja_data in cajas_data:
                Caja.objects.create(pedido_producto=detalle, **caja_data)
            detalle.recompute_peso_total()
        return pedido
    
    def update(self, instance, validated_data):
        lineas_data = validated_data.pop('lineas', None)
        instance.direccion = validated_data.get('direccion', instance.direccion)
        instance.fecha_entrega = validated_data.get('fecha_entrega', instance.fecha_entrega)
        instance.save()

        if lineas_data is not None:
            instance.lineas.all().delete()
            for linea_data in lineas_data:
                cajas_data = linea_data.pop('cajas', [])

                linea_data['cantidad_cajas'] = len(cajas_data)
                detalle = DetallePedido.objects.create(pedido=instance, **linea_data)
                for caja_data in cajas_data:
                    Caja.objects.create(pedido_producto=detalle, **caja_data)
                detalle.recompute_peso_total()
        return instance

