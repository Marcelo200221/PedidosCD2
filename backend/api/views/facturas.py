# api/views/facturas.py
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from decimal import Decimal
from django.utils import timezone
from datetime import timedelta
from api.utils.invoices import build_invoice_pdf
from api.models import Pedidos

class GenerarFacturaPDF(APIView):
    permission_classes = [IsAuthenticated]  # o lo que uses

    def post(self, request, *args, **kwargs):
        data = request.data
        pdf_bytes = build_invoice_pdf(data)

        filename = f"factura-{data.get('factura_numero','SN')}.pdf"
        resp = HttpResponse(pdf_bytes, content_type="application/pdf")
        # Attachment para que se descargue; usa inline si quieres previsualizar
        resp['Content-Disposition'] = f'attachment; filename="{filename}"'
        return resp
    
class PreviewFacturaPDF(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        data = request.data
        pdf_bytes = build_invoice_pdf(data)
        resp = HttpResponse(pdf_bytes, content_type="application/pdf")
        # inline => el navegador no forza descarga
        resp['Content-Disposition'] = 'inline; filename="preview-factura.pdf"'
        resp['Cache-Control'] = 'no-store'
        return resp


class GenerarFacturaPorPedido(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pedido_id, *args, **kwargs):
        """
        Genera un PDF de factura a partir de un Pedido existente.
        Reglas: se factura por peso (kg) * precio del producto (CLP/kg).
        Aplica IVA 19% por defecto (puede sobreescribirse con query param o body opcional).
        """
        pedido = get_object_or_404(Pedidos.objects.select_related('cliente').prefetch_related('lineas__producto'), pk=pedido_id)

        impuesto_pct = request.data.get('impuesto_porcentaje', 19)
        descuento = request.data.get('descuento', 0)
        moneda = request.data.get('moneda', 'CLP')
        factura_numero = request.data.get('factura_numero', f"P{pedido.id}")
        fecha_factura = timezone.now().date()
        fecha_base = pedido.fecha_entrega or pedido.created_at
        fecha_entrega = fecha_base + timedelta(days=1)


        items = []
        for det in pedido.lineas.all():
            # cantidad en kg
            cantidad = Decimal(str(det.peso_total_producto or 0))
            precio_unitario = Decimal(str(det.producto.precio or 0))
            items.append({
                'descripcion': det.producto.nombre,
                'cantidad': cantidad,
                'precio_unitario': precio_unitario,
            })

        cliente = {}
        if pedido.cliente:
            cliente = {
                'nombre': pedido.cliente.nombre,
                'rut': pedido.cliente.rut,
                'razon_social': pedido.cliente.razon_social,
                'direccion': pedido.cliente.direccion,
            }

        data = {
            'cliente': cliente,
            'items': items,
            'factura_numero': factura_numero,
            'fecha_factura': fecha_factura.strftime("%d-%m-%Y"),
            'fecha_entrega': fecha_entrega.strftime("%d-%m-%Y") if fecha_entrega else "No especificada",
            'moneda': moneda,
            'descuento': descuento,
            'impuesto_porcentaje': impuesto_pct,
            'notas': request.data.get('notas', ''),
        }

        pdf_bytes = build_invoice_pdf(data)
        filename = f"factura-pedido-{pedido.id}.pdf"
        resp = HttpResponse(pdf_bytes, content_type="application/pdf")
        resp['Content-Disposition'] = f'attachment; filename="{filename}"'
        return resp
