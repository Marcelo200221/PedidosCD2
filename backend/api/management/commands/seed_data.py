from django.core.management import BaseCommand
from api.models import Productos, Cliente

class Command(BaseCommand):
    help = "Crea productos y clientes"

    def handle(self, *args, **kwargs):
        productos = [
            {"id": 6, "nombre": "Posta Rosada"},
            {"id": 5, "nombre": "Posta Negra"},
            {"id": 4, "nombre": "Filete de pollo"},
            {"id": 2, "nombre": "Pulta de cerdo"},
        ]

        clientes = [
            {"id_cliente": "XIN75654ALA","rut":"75654678-0", "nombre": "XIN XAN PUO", "direccion": "Los alamos 234", "razon_social": "XINXAN SPA"}
        ]

        for data in productos:
            Productos.objects.get_or_create(id=data["id"], defaults=data)
        for data in clientes:
            Cliente.objects.get_or_create(id_cliente=data["id_cliente"], defaults=data)
        self.stdout.write(self.style.SUCCESS("Datos creados correctamente"))