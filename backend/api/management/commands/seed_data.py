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
            {"id_cliente": "XIN75654ALA","rut":"75654678-0", "nombre": "XIN XAN PUO", "direccion": "Los alamos 234", "razon_social": "XINXAN SPA"},
            {"id_cliente": "JES2577LOA","rut":"25777977-7", "nombre": "JESUS DELGADO", "direccion": "Los acacios 456", "razon_social": "JESUS SPA"},
            {"id_cliente": "MAR2095LOS","rut":"20959469-2", "nombre": "MARCELO DARRAS", "direccion": "Los aromos 983", "razon_social": "MARCELO LTDA"},
            {"id_cliente": "ZHI7545LOS","rut":"75456789-3", "nombre": "ZHIN LUO", "direccion": "Los alamos 543", "razon_social": "ZHINLUO SPA"},
            {"id_cliente": "DEG7612VIC","rut":"76123456-k", "nombre": "DEGUO ZHOU", "direccion": "Vicuña Mackena 5344", "razon_social": "DEGUO ZHOU LTDA"},
        ]

        for data in productos:
            Productos.objects.get_or_create(id=data["id"], defaults=data)
        for data in clientes:
            Cliente.objects.get_or_create(id_cliente=data["id_cliente"], defaults=data)
        self.stdout.write(self.style.SUCCESS("Datos creados correctamente"))