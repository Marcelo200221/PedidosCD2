import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from "@angular/common/http";
import { FormsModule } from '@angular/forms';
import { ApiService } from '../services/api.spec';
import { IonContent, IonButton, IonIcon, IonInput} from '@ionic/angular/standalone';
import { ActivatedRoute } from '@angular/router'
import { addIcons } from 'ionicons';
import { Router } from '@angular/router';
import { pieChart, statsChart, refresh, hourglassOutline, checkmarkCircleOutline, timeOutline, checkmarkDoneOutline, 
  chevronUpCircle, pencil, addCircle, removeCircle, filter, menu, close, trashBin, checkmarkCircle, search,
  documentText, cube, calculator, scale, eye, closeCircle, send, logOut, barChart, people, personAdd, arrowUndo, 
  bag, person, trophy, ellipsisVertical, swapVertical, calendar, funnel, apps, podium, checkmarkDone} from 'ionicons/icons';
import { Perimisos } from '../services/perimisos';
import { NotificacionService } from '../services/notificacion.service';

//Iconos
addIcons({ 
 pieChart, statsChart, refresh, hourglassOutline, checkmarkCircleOutline, timeOutline, checkmarkDoneOutline, 
  chevronUpCircle, pencil, addCircle, removeCircle, filter, menu, close, trashBin, checkmarkCircle, search,
  documentText, cube, calculator, scale, eye, closeCircle, send, logOut, barChart, people, personAdd, arrowUndo, 
  bag, person, trophy, ellipsisVertical, swapVertical, calendar, funnel, apps, podium, checkmarkDone
});

@Component({
  selector: 'app-clientes',
  templateUrl: './clientes.page.html',
  styleUrls: ['./clientes.page.scss'],
  standalone: true,
  imports: [FormsModule,
      CommonModule,
      IonContent, IonButton, IonIcon, IonInput]
})
export class ClientesPage implements OnInit {

  constructor(private api: ApiService, private activeRouter: ActivatedRoute, private router: Router, private permisos: Perimisos, private notificaciones: NotificacionService) { }
  
    //Definicion de variables
    id: string = '';
    rut: string = '';
    nombre: string = '';
    direccion: string = '';
    razonSocial: string = '';
    cliente = this.activeRouter.snapshot.params['id']

    
    //Variables del menú
    menuAbierto: boolean = false;
    nombreUsuario: string = '';
    apellidoUsuario: string = '';
    puedeIr = false;
    verReportes = false;
    verProductos = false;
    cargando: boolean = true;
  
    //Definicion de variables de error
    rutError: string = '';
    nombreError: string = '';
    direccionError: string = '';
    razonSocialError: string = '';
  
    //Definicion de variables de color
    underlineNombre = '#cccccc';
    underlineColor = '#cccccc';
    underlineDireccion = '#cccccc';
    underlineRazonSocial = '#cccccc';
  
    //Funcion de limites de input de nombre
    onKeyPressNombre(event: KeyboardEvent) {
      const key = event.key;
      if (key.length > 1) return; 
      if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ]$/.test(key)) {
        event.preventDefault(); 
      }
    }
  
    //Funcion de Validacion de nombre
    actualizarNombre(event: any) {
      this.nombre = event.target.value;
      if (this.nombre.length === 0) {
        this.underlineNombre = '#cccccc';
        this.nombreError = '';
      } else if (this.nombre.trim().length < 2) {
        this.underlineNombre = '#ff4d4d';
        this.nombreError = 'El nombre debe tener al menos 2 letras';
      } else {
        this.underlineNombre = '#28a745';
        this.nombreError = '';
      }
    }
  
    //Funcion de limites de input de rut
    onKeyPress(event: KeyboardEvent) {
      const key = event.key;
      if (key.length > 1) return;
      const current = this.rut || '';
      const hasDash = current.indexOf('-') !== -1;
      const parts = current.split('-');
      const before = parts[0] || '';
      const after = parts[1] || '';
  
      if (key === '-') {
        if (hasDash || before.length !== 8) {
          event.preventDefault();
        }
        return;
      }
  
      if (!hasDash) {
        if (!/^[0-9]$/.test(key) || before.length >= 8) {
          event.preventDefault();
        }
        return;
      }
      if (hasDash) {
        if (!/^[0-9kK]$/.test(key) || after.length >= 1) {
          event.preventDefault();
        }
        return;
      }
    }
  
    //Funcion de Validacion de rut
    actualizarRut(event: any) {
      this.rut = event.target.value;
      const isValid = /^\d{8}-[0-9kK]$/.test(this.rut);
  
      this.underlineColor = this.rut.length === 0 ? '#cccccc' : isValid ? '#28a745' : '#ff4d4d';
      this.rutError = !isValid && this.rut.length > 0
        ? 'Formato inválido: debe ser 8 números antes del guion y un dígito o K después'
        : '';
    }

    onKeyPressDireccion(event: KeyboardEvent) {
      const key = event.key;
      if (key.length > 1) return; 
      if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ]$/.test(key)) {
        event.preventDefault(); 
      }
    }

    actualizarDireccion(event: any) {
      this.direccion = event.target.value
      if (this.direccion.length === 0){
         this.underlineNombre = '#cccccc';
        this.direccionError = '';
      } else if (this.direccion.trim().length < 2) {
        this.underlineDireccion = '#ff4d4d';
        this.direccionError = 'El nombre debe tener al menos 2 letras';
      } else {
        this.underlineDireccion = '#28a745';
        this.direccionError = '';
      }
    }

    onKeyPressRazonSocial(event: KeyboardEvent) {
      const key = event.key;
      if (key.length > 1) return; 
      if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ]$/.test(key)) {
        event.preventDefault(); 
      }
    }

    actualizarRazonSocial(event: any) {
      this.razonSocial = event.target.value
      if (this.razonSocial.length === 0){
         this.underlineRazonSocial = '#cccccc';
        this.razonSocialError = '';
      } else if (this.razonSocial.trim().length < 2) {
        this.underlineRazonSocial = '#ff4d4d';
        this.razonSocialError = 'El nombre debe tener al menos 2 letras';
      } else {
        this.underlineRazonSocial = '#28a745';
        this.razonSocialError = '';
      }
    }

  
    async handleClick() {
    //Verificar que todos los campos tengan valor
    if (!this.nombre || !this.rut  || !this.direccion || !this.razonSocial) {
      await this.notificaciones.showWarning('Por favor, completa todos los campos.');
      return;
    }
  
  
    //Verificar errores individuales
    if (this.nombreError || this.rutError || this.direccionError || this.razonSocialError) {
      await this.notificaciones.showWarning('Por favor corrige los errores antes de continuar.');
      return;
    }

    this.id = (
      this.nombre.substring(0, 3) +
      this.rut.replace(/\D/g, '').substring(0, 4) +
      this.direccion.substring(0, 3)
    ).toUpperCase()

    if(this.cliente){
      try{
        this.api.editarCliente(this.cliente, this.rut,
          this.nombre,
          this.direccion,
          this.razonSocial);
        this.cargarDatosUsuario(),
        await this.notificaciones.showSuccess("Cliente editado correctamente")
        return;
      } catch(error){
        await this.notificaciones.showError("No se a podido editar el cliente")
        console.error(error)
      }
    }
  
    this.api.agregarCliente(
      this.id,
      this.rut,
      this.nombre,
      this.direccion,
      this.razonSocial
    )
    
  
    //Si todo esta bien
    console.log('Cliente ingresado con exito:', {
      nombre: this.nombre,
      rut: this.rut,
      direccion: this.direccion,
      razonSocial: this.razonSocial
    });
    await this.notificaciones.showSuccess('Cliente ingresado con éxito');
  }

    async cargarDatosUsuario() {
    const usuario = await this.api.getUsuarioActual();
    if (usuario) {
      this.nombreUsuario = usuario.nombre;
      this.apellidoUsuario = usuario.apellido;
      console.log('Usuario cargado:', usuario); 
    } else {
      //Si no hay usuario, redirigir al login
      console.warn('No hay usuario en IndexedDB, redirigiendo al login');
      this.router.navigate(['/login']);
    }
  }
  
    async ngOnInit() {
      this.verProductos = await this.permisos.checkPermission('view_productos')
      this.puedeIr = await this.permisos.checkPermission('view_usuarios')
      this.verReportes = await this.permisos.checkPermission('view_reportes')
      this.cargarDatosUsuario();
      // Inicializa el servicio de avisos si hay sesión
      try { await this.notificaciones.start(); } catch {}
      console.log("Data del usuario", this.activeRouter.snapshot.params['id'])
      if(this.cliente){
        const infoCliente = await this.api.infoCliente(this.cliente)

        this.id = infoCliente.id
        this.rut = infoCliente.rut
        this.nombre = infoCliente.nombre
        this.direccion = infoCliente.direccion
        this.razonSocial = infoCliente.razonSocial
      }
    }

  //Metodo para recargar cada vez que se entre a la pagina
  async ionViewWillEnter() {
    this.cargando = true;
    
    //Cargar todos los dashboards en paralelo
    try {
      await Promise.all([
      this.verProductos = await this.permisos.checkPermission('view_productos'),
      this.puedeIr = await this.permisos.checkPermission('view_usuarios'),
      this.verReportes = await this.permisos.checkPermission('view_reportes'),
      this.cargarDatosUsuario(),
      ]);
    } catch (error) {
      console.error('Error cargando dashboards:', error);
    } finally {
      this.cargando = false;
    }
  }
    
//Control del menú
  toggleMenu() {
    this.menuAbierto = !this.menuAbierto;
  }

  cerrarMenu() {
    this.menuAbierto = false;
  }

  //Navegación desde menú lateral
  Irapedidosmenu() {
    this.cerrarMenu();
    this.router.navigate(['/pedidos']);
  }

  IrAPerfil(){
    this.cerrarMenu();
    this.router.navigate(['/perfil'])
  }

  Irafacturasmenu() {
    this.cerrarMenu();
    this.router.navigate(['/facturacion']);
  }

  Iradashboardsmenu() {
    this.cerrarMenu();
    this.router.navigate(['/dashboard']);
  }
  
  IrMenu() {
    this.cerrarMenu();
    this.router.navigate(['/hub']);
  }

  IrClientes() {
    this.cerrarMenu();
    this.router.navigate(['/clientes']);
  }

  IrUsuarios(){
    this.cerrarMenu();
    this.router.navigate(['usuarios'])
  }

  IrListarClientes() {
    this.cerrarMenu();
    this.router.navigate(['/lista-clientes']);
  }

  IraProductos() {
    this.cerrarMenu();
    this.router.navigate(['/productos']);
  }

  //Cerrar sesión
  cerrarSesion() {
    if (confirm('¿Estás seguro que deseas cerrar sesión?')) {
      this.api.logout();
      this.cerrarMenu();
    }
  }

  cancelar() { 
  this.router.navigate(['/lista-clientes']);
  }
}
