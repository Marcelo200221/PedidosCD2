from rest_framework import serializers
from usuarios.models import Usuario
from api.models import Pedidos, DetallePedido, Caja, Productos, Cliente
from .models import PasswordResetCode

class PasswordResetRequestSerielizer(serializers.Serializer):
    email = serializers.EmailField()

class PasswordResetConfirmSerializer(serializers.Serializer):
    code = serializers.CharField(max_length=6)

class PasswordChangeConfirmSerializer(serializers.Serializer):
    code = serializers.CharField(max_length=6)
    new_password = serializers.CharField(min_length=8)
    confirm_password = serializers.CharField(min_length=8)
    
    def validate(self, data):
        """Validar que ambas contraseñas coincidan"""
        if data['new_password'] != data['confirm_password']:
            raise serializers.ValidationError({
                'confirm_password': 'Las contraseñas no coinciden'
            })
        return data

class ClienteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cliente
        fields = [
            "id_cliente",
            "rut",
            "nombre",
            "direccion",
            "razon_social"
        ]

    def validate_rut(self, value):
        if Cliente.objects.filter(rut=value).exists():
            raise serializers.ValidationError("Este RUT ya está registrado")
        return value
    
    def validate_id_cliente(self, value):
        if Cliente.objects.filter(id_cliente=value).exists():
            raise serializers.ValidationError("Este ID ya existe")
        return value

class ProductoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Productos
        fields = ['id', 'nombre', 'precio']

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
    cliente = ClienteSerializer(read_only=True)
    cliente_id = serializers.PrimaryKeyRelatedField(
        queryset=Cliente.objects.all(),
        source='cliente',
        write_only=True,
        required=False,
        allow_null=True,
    )

    class Meta:
        model = Pedidos
        fields = ['id', 'direccion', 'fecha_entrega', 'estado', 'cliente', 'cliente_id', 'lineas']
    
    def create(self, validated_data):
        lineas_data = validated_data.pop('lineas', [])
        pedido = Pedidos.objects.create(**validated_data)
        # Compatibilidad: si no vino cliente_id pero sí 'cliente' (texto) en el payload,
        # intentar resolverlo por id_cliente, rut o nombre.
        if not pedido.cliente:
            raw_cliente = (self.initial_data or {}).get('cliente')
            if raw_cliente:
                cli = (
                    Cliente.objects.filter(id_cliente=raw_cliente).first()
                    or Cliente.objects.filter(rut=raw_cliente).first()
                    or Cliente.objects.filter(nombre=raw_cliente).first()
                )
                if cli:
                    pedido.cliente = cli
                    pedido.save(update_fields=['cliente'])
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
        if 'estado' in validated_data:
            instance.estado = validated_data.get('estado', instance.estado)
        if 'cliente' in validated_data:
            instance.cliente = validated_data.get('cliente')
        else:
            # Compatibilidad: permitir 'cliente' en texto en updates
            raw_cliente = (self.initial_data or {}).get('cliente')
            if raw_cliente:
                cli = (
                    Cliente.objects.filter(id_cliente=raw_cliente).first()
                    or Cliente.objects.filter(rut=raw_cliente).first()
                    or Cliente.objects.filter(nombre=raw_cliente).first()
                )
                if cli:
                    instance.cliente = cli
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
    

