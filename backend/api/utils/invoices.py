# utils/invoices.py
from io import BytesIO
from datetime import datetime
from decimal import Decimal
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle

def _fmt_moneda(v, moneda="CLP"):
    # Ajusta a tu gusto (separadores, símbolo, etc.)
    v = Decimal(v).quantize(Decimal("1")) if moneda == "CLP" else Decimal(v).quantize(Decimal("0.01"))
    return f"{moneda} {v:,.0f}".replace(",", ".")

def build_invoice_pdf(data: dict) -> bytes:
    """
    Construye un PDF de factura y devuelve bytes.
    data: dict con llaves como en el payload de ejemplo.
    """
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, leftMargin=18*mm, rightMargin=18*mm, topMargin=18*mm, bottomMargin=18*mm)

    styles = getSampleStyleSheet()
    story = []

    cliente = data.get("cliente", {})
    items = data.get("items", [])
    factura_numero = data.get("factura_numero", "S/N")
    fecha = data.get("fecha", datetime.now().date().isoformat())
    moneda = data.get("moneda", "CLP")
    descuento = Decimal(str(data.get("descuento", 0) or 0))
    impuesto_pct = Decimal(str(data.get("impuesto_porcentaje", 19)))  # IVA por defecto 19%
    notas = data.get("notas", "")

    # HEADER
    story.append(Paragraph(f"<b>Carnes Darras</b>", styles['Title']))
    header_lines = ["RUT: 77.835.910-3", "Dirección: Bascuñan Guerrero 2102", "Teléfono: +56950100045", "Email: marcelo.darras35@gmail.com"]
    story.append(Paragraph("<br/>".join(header_lines), styles['Normal']))
    story.append(Spacer(1, 6))

    # FACTURA INFO
    story.append(Paragraph(f"<b>Factura:</b> {factura_numero}", styles['Heading3']))
    fecha_factura = data.get("fecha_factura")  # viene desde la view
    story.append(Paragraph(f"<b>Factura realizada el:</b> {fecha_factura}", styles['Normal']))
    fecha_entrega = data.get("fecha_entrega", "No especificada")
    story.append(Paragraph(f"<b>Fecha de entrega:</b> {fecha_entrega}", styles['Normal']))
    story.append(Spacer(1, 6))

    # CLIENTE
    story.append(Paragraph("<b>Datos del cliente</b>", styles['Heading3']))
    cliente_lines = []
    if cliente.get("nombre"): cliente_lines.append(cliente['nombre'])
    if cliente.get("rut"): cliente_lines.append(f"RUT: {cliente['rut']}")
    if cliente.get("razon_social"): cliente_lines.append(f"Giro: {cliente['razon_social']}")
    if cliente.get("direccion"): cliente_lines.append(cliente['direccion'])
    story.append(Paragraph("<br/>".join(cliente_lines), styles['Normal']))
    story.append(Spacer(1, 10))

    # ITEMS TABLE
    tabla_data = [["Descripción", "Cant.", "P. Unit.", "Total"]]
    subtotal = Decimal("0")
    for it in items:
      cant = Decimal(str(it.get("cantidad", 0) or 0))
      precio = Decimal(str(it.get("precio_unitario", 0) or 0))
      total = cant * precio
      subtotal += total
      tabla_data.append([
          it.get("descripcion", ""),
          f"{cant}",
          _fmt_moneda(precio, moneda),
          _fmt_moneda(total, moneda),
      ])

    table = Table(tabla_data, colWidths=[90*mm, 20*mm, 35*mm, 35*mm])
    table.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,0), colors.HexColor("#F0F0F0")),
        ("TEXTCOLOR", (0,0), (-1,0), colors.black),
        ("ALIGN", (1,1), (-1,-1), "RIGHT"),
        ("ALIGN", (0,0), (0,-1), "LEFT"),
        ("FONTNAME", (0,0), (-1,0), "Helvetica-Bold"),
        ("BOTTOMPADDING", (0,0), (-1,0), 8),
        ("GRID", (0,0), (-1,-1), 0.5, colors.grey),
    ]))
    story.append(table)
    story.append(Spacer(1, 10))

    # TOTALES
    lineas_totales = []
    lineas_totales.append(("Subtotal", subtotal))
    if descuento and descuento > 0:
        subtotal_desc = subtotal - descuento
        lineas_totales.append(("Descuento", -descuento))
        base = subtotal_desc
    else:
        base = subtotal

    impuesto = (base * impuesto_pct / Decimal("100")).quantize(Decimal("0.01"))
    total = (base + impuesto).quantize(Decimal("0.01"))

    lineas_totales.append((f"Impuesto ({impuesto_pct}%)", impuesto))
    lineas_totales.append(("Total", total))

    tot_rows = []
    for label, val in lineas_totales:
        tot_rows.append([Paragraph(f"<b>{label}</b>", styles['Normal']), Paragraph(f"<b>{_fmt_moneda(val, moneda)}</b>", styles['Normal'])])

    tot_table = Table(tot_rows, colWidths=[110*mm, 70*mm], hAlign="RIGHT")
    tot_table.setStyle(TableStyle([
        ("ALIGN", (1,0), (1,-1), "RIGHT"),
        ("LINEABOVE", (0,0), (-1,0), 0.5, colors.grey),
        ("LINEABOVE", (0,-1), (-1,-1), 0.8, colors.black),
    ]))
    story.append(tot_table)
    story.append(Spacer(1, 10))

    # NOTAS
    if notas:
        story.append(Paragraph("<b>Notas</b>", styles['Heading4']))
        story.append(Paragraph(notas, styles['Normal']))

    doc.build(story)
    return buffer.getvalue()
