from __future__ import annotations

from datetime import timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone
from django.db.models import F, Q

from api.models import Productos
from api.utils.inventario import chequear_y_notificar_stock_bajo


class Command(BaseCommand):
    help = "Chequea productos con stock bajo y emite mensajes broadcast del bot"

    def add_arguments(self, parser):
        parser.add_argument(
            "--throttle-horas",
            type=int,
            default=4,
            help="Horas mínimas entre alertas del mismo producto (default: 4)",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Muestra qué productos alertaría sin crear mensajes ni actualizar marcas",
        )

    def handle(self, *args, **options):
        throttle_horas: int = options["throttle_horas"]
        dry_run: bool = options["dry_run"]

        if dry_run:
            now = timezone.now()
            ventana = now - timedelta(hours=throttle_horas)
            candidatos = (
                Productos.objects.filter(stock__lte=F("umbral_minimo"))
                .filter(Q(ultima_alerta_astock_bajo__isnull=True) | Q(ultima_alerta_astock_bajo__lt=ventana))
                .order_by("id")
            )

            total = candidatos.count()
            self.stdout.write(self.style.WARNING(f"[dry-run] {total} producto(s) generarían alerta:"))
            for p in candidatos:
                self.stdout.write(
                    f" - ID {p.id} | {p.nombre} | stock={p.stock} | umbral={p.umbral_minimo}"
                )
            return

        resultados = chequear_y_notificar_stock_bajo(throttle_horas=throttle_horas)

        creados = [r for r in resultados if r[1] is not None]
        omitidos = len(resultados) - len(creados)

        self.stdout.write(self.style.SUCCESS(f"Mensajes creados: {len(creados)}"))
        self.stdout.write(self.style.NOTICE(f"Omitidos por throttle: {omitidos}"))

        # Mostrar breve resumen de los creados
        for prod, msg in creados:
            self.stdout.write(f" - Producto {prod.id} | mensaje {msg.id}")

