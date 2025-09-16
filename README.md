Descargas importantes

Para backend

Abrir Terminal tipo bash en visual studio

1. pip install virtualenv (para poder crear un ambiente virtual y no descargar todas las dependencias de forma local)
2. El entorno virtual "env_pedidoscd" ya está creado pero por si acaso, dentro de la carpeta del proyecto: python -m venv env_pedidoscd
3. source env_pedidoscd/Scripts/activate para activar el entorno
4. pip install django djangorestframework mysqlclient
5. pip install django-cors-headers
6. Instalar MySQL server desde https://dev.mysql.com/downloads/mysql/?spm=a2ty_o01.29997173.0.0.49d1c921lFtyC1 (OJO: descargar la versión 8.0, la versión 9,4 no funcionará)
7. Instalar MySQL Workbench desde https://www.mysql.com/products/workbench
8. mysql -u root -p
9. *en mysql* CREATE DATABASE miapp_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;
11. cd addPedidos (para entrar al backend, cambiaré el nombre pronto)
12. python manage.py makemigrations
13. python manage.py migrate
14. python manage.py createsuperuser
15. python manage.py runserver

NOTA: si mysql da problemas, verificar que se encuentra en PATH y que el servicio MySQL80 se encuentra activo.

Para frontend:

Abrir un bash nuevo dentro de visual studio

1.source env_pedidoscd/Scripts/activate
2.Descargar node.js
3.npm install -g @ionic/cli
4.cd pedidoscd (para entrar al frontend, cambiaré el nombre pronto)
5.ionic serve


Con todo esto el programa debería iniciar con un mensaje en pantalla que dirá "Hola desde django REST FrameworK", y se podrá empezar a trabajar
