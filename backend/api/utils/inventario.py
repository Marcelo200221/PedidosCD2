from __future__ import annotations

from datetime import timedelta
from typing import Iterable, List, Tuple

from django.db import transaction
from django.utils import timezone
from django.db.models import F

# Importa modelos desde la app `api`
from api.models import Productos, MensajeBot


def _formatear_texto_stock_bajo(producto: Productos) -> str:
    return (
        f"Stock bajo: {producto.nombre} (ID {producto.id}). "
        f"Stock actual: {producto.stock}."
    )


def crear_mensaje_stock_bajo(producto: Productos, meta_extra: dict | None = None) -> MensajeBot:
    """Crea un MensajeBot de stock bajo como broadcast (audiencia='all')."""
    meta = {
        "producto_id": producto.id,
        "stock": producto.stock,
        "umbral_minimo": producto.umbral_minimo,
    }
    if meta_extra:
        meta.update(meta_extra)

    mensaje = MensajeBot.objects.create(
        tipo="low_stock",
        texto=_formatear_texto_stock_bajo(producto),
        producto=producto,
        audiencia="all",
        meta=meta,
    )
    return mensaje

def eliminar_mensaje_stock_bajo(producto: Productos, meta_extra: dict | None = None) -> int:
    """
    Elimina mensajes de tipo "low_stock" asociados al producto indicado.
    Devuelve la cantidad de filas afectadas.

    Nota: `meta_extra` queda reservado por compatibilidad, pero no se usa.
    """
    try:
        deleted, _ = MensajeBot.objects.filter(producto=producto, tipo="low_stock").delete()
        return deleted
    except Exception:
        return 0


@transaction.atomic
def chequear_y_notificar_stock_bajo(
    *,
    ahora=None,
    throttle_minutos: int = 5,
    throttle_horas: int | None = None,
) -> List[Tuple[Productos, MensajeBot | None]]:
    """
    Recorre productos con stock <= umbral_minimo y genera mensajes broadcast.
    Aplica throttling usando `ultima_alerta_astock_bajo` para evitar spam.

    Retorna lista de tuplas (producto, mensaje_creado | None).
    """
    now = ahora or timezone.now()
    if throttle_horas is not None:
        ventana = now - timedelta(hours=throttle_horas)
    else:
        ventana = now - timedelta(minutes=throttle_minutos)

    resultados: List[Tuple[Productos, MensajeBot | None]] = []

    # Selecciona candidatos (stock en o bajo umbral)
    candidatos = Productos.objects.filter(stock__lte=F("umbral_minimo"))

    for prod in candidatos.select_for_update():
        # Throttling: si ya enviamos hace poco, saltamos
        if prod.ultima_alerta_astock_bajo and prod.ultima_alerta_astock_bajo >= ventana:
            resultados.append((prod, None))
            continue

        mensaje = crear_mensaje_stock_bajo(prod)
        prod.ultima_alerta_astock_bajo = now
        prod.save(update_fields=["ultima_alerta_astock_bajo"])
        resultados.append((prod, mensaje))

    return resultados


def productos_bajo_umbral() -> Iterable[Productos]:
    """Convenience: queryset de productos con stock <= umbral."""
    return Productos.objects.filter(stock__lte=F("umbral_minimo"))
