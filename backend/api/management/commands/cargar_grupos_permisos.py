import json
from django.core.management.base import BaseCommand
from django.contrib.auth.models import Group, Permission
from django.contrib.contenttypes.models import ContentType

class Command(BaseCommand):

    help = "Cargar grupos y permisos desdee un archivo JSON. Formato: { 'GroupName': ['app.codename', 'codename2', ...], ...}"

    def add_arguments(self, parser):
        parser.add_argument('path', type=str, help='Ruta al archivo JSON')

    def handle(self, *args, **options):
        path = options['path']
        with open(path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        for group_name, perms in data.items():
            group,_=Group.objects.get_or_create(name=group_name)
            permisos_asignar = []
            for p in perms:
                if '.' in p:
                    app_label, codename = p.split('.', 1)
                    perm = Permission.objects.filter(content_type__app_label=app_label, codename=codename).first()
                else:

                    perm = Permission.objects.filter(codename=p).first()

                if perm:
                    permisos_asignar.append(perm)
                else:
                    self.stdout.write(self.style.WARNING(f'Permiso NOT FOUND: {p} (grupo: {group_name})'))
            
            group.permissions.set(permisos_asignar)
            group.save()
            self.stdout.write(self.style.SUCCESS(f'Grupo "{group_name}" actualizado: {len(permisos_asignar)} permisos'))