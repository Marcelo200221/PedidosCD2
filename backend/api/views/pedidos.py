from rest_framework.decorators import api_view, action
from rest_framework import status, viewsets
from rest_framework.response import Response
from django.db import transaction
from django.utils import timezone
from datetime import timedelta
from django.db.models import Sum, Count

from api.models import Pedidos, Productos, DetallePedido
from api.serializers import PedidoSerializer, ProductoSerializer
from api.utils.inventario import crear_mensaje_stock_bajo, eliminar_mensaje_stock_bajo


class PedidoViewSet(viewsets.ModelViewSet):
    queryset = Pedidos.objects.all()
    serializer_class = PedidoSerializer

    def partial_update(self, request, *args, **kwargs):
        """PATCH dispara la misma lógica que PUT."""
        kwargs["partial"] = True
        return self.update(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        """Al pasar a 'completado' descuenta stock y genera avisos."""
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        pedido = serializer.save()

        if pedido.estado == 'completado' and not pedido.facturado_en:
            ahora = timezone.now()
            throttle_ventana = ahora - timedelta(minutes=5)
            afectados = []
            try:
                with transaction.atomic():
                    for det in pedido.lineas.select_related('producto').all():
                        det.recompute_peso_total()
                        prod = det.producto
                        cajas = det.cantidad_cajas or det.cajas.count()
                        nuevo_stock = max(0, (prod.stock or 0) - (cajas or 0))
                        if nuevo_stock != prod.stock:
                            prod.stock = nuevo_stock
                            prod.save(update_fields=["stock"])
                            afectados.append(prod)
                    pedido.facturado_en = ahora
                    pedido.save(update_fields=["facturado_en"])
            except Exception as e:
                return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            for prod in afectados:
                if prod.stock <= (prod.umbral_minimo or 0):
                    if not prod.ultima_alerta_astock_bajo or prod.ultima_alerta_astock_bajo < throttle_ventana:
                        crear_mensaje_stock_bajo(prod)
                        prod.ultima_alerta_astock_bajo = ahora
                        prod.save(update_fields=["ultima_alerta_astock_bajo"])

            if not afectados:
                for det in pedido.lineas.select_related('producto').all():
                    prod = det.producto
                    if not prod:
                        continue
                    if prod.stock <= (prod.umbral_minimo or 0):
                        if not prod.ultima_alerta_astock_bajo or prod.ultima_alerta_astock_bajo < throttle_ventana:
                            crear_mensaje_stock_bajo(prod)
                            prod.ultima_alerta_astock_bajo = ahora
                            prod.save(update_fields=["ultima_alerta_astock_bajo"])

        return Response(self.get_serializer(pedido).data)

    @action(detail=False, methods=['delete'])
    def eliminar_multiples(self, request):
        try:
            ids = request.data.get('ids', [])
            if not ids:
                return Response({'error': 'No se proporcionarion IDs'}, status=status.HTTP_400_BAD_REQUEST)
            pedidos_a_eliminar = self.queryset.filter(id__in=ids)
            count = pedidos_a_eliminar.count()
            if count != len(ids):
                return Response({'error': 'Algunos pedidos no existen'}, status=status.HTTP_404_NOT_FOUND)
            pedidos_a_eliminar.delete()
            return Response({'message': f'{count} pedido(s) eliminado(s) correctamente'}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'])
    def facturar(self, request, pk=None):
        """Marca como facturado, descuenta stock y genera avisos cuando corresponda."""
        pedido = self.get_object()
        if pedido.facturado_en:
            return Response({"detail": "El pedido ya fue facturado"}, status=status.HTTP_400_BAD_REQUEST)

        ahora = timezone.now()
        throttle_ventana = ahora - timedelta(minutes=5)
        afectados = []
        try:
            with transaction.atomic():
                for det in pedido.lineas.select_related('producto').all():
                    det.recompute_peso_total()
                    prod = det.producto
                    cajas = det.cantidad_cajas or det.cajas.count()
                    nuevo_stock = max(0, (prod.stock or 0) - (cajas or 0))
                    if nuevo_stock != prod.stock:
                        prod.stock = nuevo_stock
                        prod.save(update_fields=["stock"])
                        afectados.append(prod)
                pedido.facturado_en = ahora
                pedido.estado = 'completado'
                pedido.save(update_fields=["facturado_en", "estado"])
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        for prod in afectados:
            if prod.stock <= (prod.umbral_minimo or 0):
                if not prod.ultima_alerta_astock_bajo or prod.ultima_alerta_astock_bajo < throttle_ventana:
                    crear_mensaje_stock_bajo(prod)
                    prod.ultima_alerta_astock_bajo = ahora
                    prod.save(update_fields=["ultima_alerta_astock_bajo"])

        if not afectados:
            for det in pedido.lineas.select_related('producto').all():
                prod = det.producto
                if not prod:
                    continue
                if prod.stock <= (prod.umbral_minimo or 0):
                    if not prod.ultima_alerta_astock_bajo or prod.ultima_alerta_astock_bajo < throttle_ventana:
                        crear_mensaje_stock_bajo(prod)
                        prod.ultima_alerta_astock_bajo = ahora
                        prod.save(update_fields=["ultima_alerta_astock_bajo"])

        serializer = self.get_serializer(pedido)
        return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(["GET"])
def productos(request):
    productos = Productos.objects.all()
    serializer = ProductoSerializer(productos, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(["PUT"])
def asignar_precio_v2(request):
    try:
        data = request.data or {}
        pk = data.get("pk")
        nuevo_precio = data.get("precio")
        if pk is None or nuevo_precio is None:
            return Response({"error": "Se requieren 'pk' y 'precio'"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            p = Productos.objects.get(pk=pk)
        except Productos.DoesNotExist:
            return Response({"error": "El producto seleccionado no existe"}, status=status.HTTP_404_NOT_FOUND)
        try:
            valor = int(nuevo_precio)
        except (TypeError, ValueError):
            return Response({"error": "El precio debe ser un entero"}, status=status.HTTP_400_BAD_REQUEST)
        if valor < 0:
            return Response({"error": "El precio no puede ser negativo"}, status=status.HTTP_400_BAD_REQUEST)
        p.precio = valor
        p.save(update_fields=["precio"])
        return Response({"success": "Precio actualizado correctamente", "id": p.id, "precio": p.precio}, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["PUT"])
def editar_stock(request):
    try:
        data = request.data or {}
        pk = data.get("pk")
        nuevo_stock = data.get("stock")
        if pk is None or nuevo_stock is None:
            return Response({"error": "Se requieren 'pk' y 'precio'"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            p = Productos.objects.get(pk=pk)
        except Productos.DoesNotExist:
            return Response({"error": "El producto seleccionado no existe"}, status=status.HTTP_404_NOT_FOUND)
        try:
            valor = int(nuevo_stock)
        except (TypeError, ValueError):
            return Response({"error": "El precio debe ser un entero"}, status=status.HTTP_400_BAD_REQUEST)
        if valor < 0:
            return Response({"error": "El precio no puede ser negativo"}, status=status.HTTP_400_BAD_REQUEST)
        p.stock = valor
        p.save(update_fields=["stock"])
        if p.stock > p.umbral_minimo:
            eliminar_mensaje_stock_bajo(p)
        return Response({"success": "Stock actualizado correctamente", "id": p.id, "stock": p.stock}, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["GET"])
def productos_mas_vendidos(request):
    qs = (
        DetallePedido.objects.values("producto__id", "producto__nombre")
        .annotate(total_cajas=Sum("cantidad_cajas"))
        .order_by("-total_cajas")[:10]
    )
    data = [
        {"id": r["producto__id"], "nombre": r["producto__nombre"], "total_cajas": r["total_cajas"] or 0}
        for r in qs
    ]
    return Response(data)


@api_view(["GET"])
def clientes_con_mas_pedidos(request):
    qs = (
        Pedidos.objects.values("cliente__id_cliente", "cliente__nombre")
        .annotate(total=Count("id"))
        .order_by("-total")[:10]
    )
    data = [
        {"id": r["cliente__id_cliente"], "nombre": r["cliente__nombre"], "total_pedidos": r["total"] or 0}
        for r in qs
    ]
    return Response(data)
