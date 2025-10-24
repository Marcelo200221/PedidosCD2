# Backend de PedidosCD

## Pasos de Instalación

0. Instalar Python 3.11.9

1. Instalar Virtualenv

```bash
$ pip install virtualenv
```

2. Crear entorno Virtual y activarlo

```bash
$ virtualenv <nombre_env> --python=3.11.9
$ source <nombre_env>/Scripts/activate
```

Es necesario tener la version de python instalada localmente

3. Instalar requerimientos y actualizar archivo requirements

```bash
$ pip install -r requirements.txt
```

4. Configurar .env en carpeta appPedidos (Las claves secretas las compartira Marcelo Darras de ser pedidas)

5. Instalar MySQL server desde: https://dev.mysql.com/downloads/mysql/?spm=a2ty_o01.29997173.0.0.49d1c921lFtyC1 (Descargar version 8.0, no la mas reciente)

6. (opcional) Descargar MySQL Workbench desde https://www.mysql.com/products/workbench

7. Entrar a mysql y crear base de datos

```bash
$ mysql -u root -p

CREATE DATABASE pedidos_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;
```
8. Ingresar a la carpeta backend (si no se ha hecho ya)

```bash
$ cd backend
```

9. Configurar settings.py y setear la base de datos (Marcelo Darras proveera la configuracion)

10. Crear migraciones

```bash
$ python manage.py makemigrations
```

11. Ejecutar migraciones

```bash
$ python manage.py migrate
```
12. Ejecutar creación de grupos y permisos

```bash
$ python manage.py cargar_grupos_permisos data/grupos_permisos.json

```

13. Crear un superuser

```bash
$ python manage.py createsuperuser
```

14. Correr Servidor

```bash
$ python maange.py runserver
```

NOTAS: 

1. Si mysql da problemas, verificar que se encuentra en PATH y que el servicio MySQL80 se encuentra activo

2. Se asume que todo lo que se realiza luego de encender el entorno virtual, se hace en el entorno virtual NO DESCARGUES NADA FUERA DEL ENTORNO.

