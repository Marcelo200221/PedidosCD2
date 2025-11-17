import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonButton, IonIcon, IonInput} from '@ionic/angular/standalone';
import { ApiService } from '../services/api.spec';
import { getItem as ssGetItem, setItem as ssSetItem } from '../services/token-storage';
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
  selector: 'app-perfil',
  templateUrl: './perfil.page.html',
  styleUrls: ['./perfil.page.scss'],
  standalone: true,
  imports: [FormsModule, CommonModule, IonContent, IonButton, IonIcon, IonInput]
})
export class PerfilPage implements OnInit {
  constructor(private api: ApiService, private router: Router, private permisos: Perimisos, private notificaciones: NotificacionService) { }

  async ngOnInit() {
    await this.cargarUsuario();
    this.verProductos = await this.permisos.checkPermission('view_productos')
    this.puedeIr = await this.permisos.checkPermission('view_usuarios')
    this.verReportes = await this.permisos.checkPermission('view_reportes')
    this.cargarDatosUsuario();
    this.notificaciones.start();
  }

  //Pestañas
  tabActiva: 'perfil' | 'password' = 'perfil';

  cambiarTab(tab: 'perfil' | 'password') {
    this.tabActiva = tab;
    if (this.enableEdit) {
      this.cancelar();
    }
    if (this.enablePasswordEdit) {
      this.cancelarPassword();
    }
  }

  //Variables del menú
  menuAbierto: boolean = false;
  nombreUsuario: string = '';
  apellidoUsuario: string = '';
  private avisosVistos = new Set<number>();
  private avisosTimer: any;
  puedeIr = false;
  verReportes = false;
  verProductos = false;

  //Definicion de variables
  id: string = '';
  rut: string = '';
  nombre: string = '';
  apellido: string = '';
  correo: string = '';
  private original: any = null;

  //Variables de error
  rutError: string = '';
  nombreError: string = '';
  apellidoError: string = '';
  correoError: string = '';

  //Variables de color de las líneas
  underlineNombre = '#cccccc';
  underlineApellido = '#cccccc';
  underlineColor = '#cccccc';
  underlineCorreo = '#cccccc';

  //Control de edición
  enableEdit = false;
  enablePasswordEdit = false;

  //Campos para cambio de contraseña
  codigoPass: string = '';
  nuevaPass: string = '';
  confirmarPass: string = '';

  async cargarUsuario() {
    try {
      const uStr = await ssGetItem('user');
      const u = uStr ? JSON.parse(uStr) : null;
      if (!u) return;
      
      this.original = u;
      this.rut = u.rut ?? '';
      this.nombre = u.nombre ?? u.first_name ?? '';
      this.apellido = u.apellido ?? u.last_name ?? '';
      this.correo = u.email ?? '';
      this.id = String(u.id ?? '');
    } catch (e) {
      console.error('No se pudo cargar usuario actual', e);
    }
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

  //Editar perfil
  editar() {
    this.enableEdit = true;
  }

  cancelar() {
    this.enableEdit = false;
    if (this.original) {
      this.rut = this.original.rut ?? '';
      this.nombre = this.original.nombre ?? this.original.first_name ?? '';
      this.apellido = this.original.apellido ?? this.original.last_name ?? '';
      this.correo = this.original.email ?? '';
    }
    // Resetear colores de underline
    this.underlineNombre = '#cccccc';
    this.underlineApellido = '#cccccc';
    this.underlineCorreo = '#cccccc';
    this.nombreError = '';
    this.apellidoError = '';
    this.correoError = '';
  }

  //Validacion nombre
  onKeyPressNombre(event: KeyboardEvent) {
    const key = event.key;
    if (key.length > 1) return;
    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ]$/.test(key)) {
      event.preventDefault();
    }
  }

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

  //Validacion apellido
  actualizarApellido(event: any) {
    this.apellido = event.target.value;
    if (this.apellido.length === 0) {
      this.underlineApellido = '#cccccc';
      this.apellidoError = '';
    } else if (this.apellido.trim().length < 2) {
      this.underlineApellido = '#ff4d4d';
      this.apellidoError = 'El apellido debe tener al menos 2 letras';
    } else {
      this.underlineApellido = '#28a745';
      this.apellidoError = '';
    }
  }

  //Validacion rut
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

  actualizarRut(event: any) {
    this.rut = event.target.value;
    const isValid = /^\d{8}-[0-9kK]$/.test(this.rut);

    this.underlineColor = this.rut.length === 0 ? '#cccccc' : isValid ? '#28a745' : '#ff4d4d';
    this.rutError = !isValid && this.rut.length > 0
      ? 'Formato inválido: debe ser 8 números antes del guion y un dígito o K después'
      : '';
  }

  //Actualizar correo
  actualizarCorreo(event: any) {
    this.correo = event.target.value;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (this.correo.length === 0) {
      this.underlineCorreo = '#cccccc';
      this.correoError = '';
    } else if (!emailRegex.test(this.correo)) {
      this.underlineCorreo = '#ff4d4d';
      this.correoError = 'Ingresa un correo válido';
    } else {
      this.underlineCorreo = '#28a745';
      this.correoError = '';
    }
  }

  //Guardar perfil
  async guardarPerfil() {
    if (!this.enableEdit) return;
    
    if (!this.nombre || !this.apellido || !this.correo) {
      await this.notificaciones.showWarning('Por favor, completa nombre, apellido y correo.');
      return;
    }
    
    if (this.nombreError || this.apellidoError || this.correoError) {
      await this.notificaciones.showWarning('Por favor corrige los errores antes de continuar.');
      return;
    }

    try {
      const data = await this.api.actualizarPerfil({
        first_name: this.nombre,
        last_name: this.apellido,
        email: this.correo,
      });

      const uStr = await ssGetItem('user');
      const u = uStr ? JSON.parse(uStr) : {};
      const actualizado = {
        ...u,
        first_name: data.first_name ?? this.nombre,
        last_name: data.last_name ?? this.apellido,
        email: data.email ?? this.correo,
        rut: data.rut ?? this.rut,
        nombre: data.first_name ?? this.nombre,
        apellido: data.last_name ?? this.apellido,
        id: data.id ?? u.id,
        username: data.username ?? u.username,
      };
      
      await ssSetItem('user', JSON.stringify(actualizado));
      this.original = actualizado;
      this.enableEdit = false;
      
      await this.notificaciones.showSuccess('Perfil actualizado correctamente');
    } catch (e: any) {
      console.error('Error guardando perfil', e);
      const msg = e?.response?.data?.email || 'No se pudo guardar el perfil';
      await this.notificaciones.showError(typeof msg === 'string' ? msg : 'No se pudo guardar el perfil');
    }
  }

  //Cambio de contraseña
  activarEdicionPassword() {
    this.enablePasswordEdit = true;
  }

  cancelarPassword() {
    this.enablePasswordEdit = false;
    this.codigoPass = '';
    this.nuevaPass = '';
    this.confirmarPass = '';
  }

  async enviarCodigoPassword() {
    try {
      if (!this.correo) {
        await this.notificaciones.showWarning('No se encontró tu correo electrónico');
        return;
      }
      
      await this.api.recuperarPassword(this.correo);
      await this.notificaciones.showInfo('Se envió un código de verificación a tu correo');
      this.enablePasswordEdit = true; 
    } catch (e) {
      console.error(e);
      await this.notificaciones.showError('No se pudo enviar el código. Verifica tu correo.');
    }
  }

  async cambiarPassword() {
    if (!this.codigoPass || !this.nuevaPass || !this.confirmarPass) {
      await this.notificaciones.showWarning('Completa todos los campos de contraseña');
      return;
    }
    
    if (this.nuevaPass !== this.confirmarPass) {
      await this.notificaciones.showWarning('Las contraseñas no coinciden');
      return;
    }
    
    if (this.nuevaPass.length < 8) {
      await this.notificaciones.showWarning('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    try {
      await this.api.cambiarPassword(this.codigoPass, this.nuevaPass, this.confirmarPass);
      await this.notificaciones.showSuccess('Contraseña actualizada correctamente');
      this.cancelarPassword();
    } catch (e: any) {
      console.error(e);
      const msg = e?.message || 'No se pudo actualizar la contraseña';
      await this.notificaciones.showWarning(msg);
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
    this.enablePasswordEdit = false;
    this.enableEdit = false;
    this.cerrarMenu();
    this.router.navigate(['/pedidos']);
  }

  IrAPerfil(){    
    this.enablePasswordEdit = false;
    this.enableEdit = false;
    this.cerrarMenu();
    this.router.navigate(['/perfil'])
  }

  Irafacturasmenu() {    
    this.enablePasswordEdit = false;
    this.enableEdit = false;
    this.cerrarMenu();
    this.router.navigate(['/facturacion']);
  }

  Iradashboardsmenu() {    
    this.enablePasswordEdit = false;
    this.enableEdit = false;
    this.cerrarMenu();
    this.router.navigate(['/dashboard']);
  }
  
  IrMenu() {    
    this.enablePasswordEdit = false;
    this.enableEdit = false;
    this.cerrarMenu();
    this.router.navigate(['/hub']);
  }

  IrClientes() {    
    this.enablePasswordEdit = false;
    this.enableEdit = false;
    this.cerrarMenu();
    this.router.navigate(['/clientes']);
  }

  IrUsuarios(){    
    this.enablePasswordEdit = false;
    this.enableEdit = false;
    this.cerrarMenu();
    this.router.navigate(['usuarios'])
  }

  IrListarClientes() {
    this.enablePasswordEdit = false;
    this.enableEdit = false;
    this.cerrarMenu();
    this.router.navigate(['/lista-clientes']);
  }

  IraProductos() {
    this.enablePasswordEdit = false;
    this.enableEdit = false;
    this.cerrarMenu();
    this.router.navigate(['/productos']);
  }

  //Cerrar sesión
  async cerrarSesion() {
    const confirmar = await this.notificaciones.showConfirm(
      '¿Estás seguro que deseas cerrar sesión?',
      'Cerrar Sesión',
      'Sí, cerrar sesión',
      'Cancelar'
    );
    
    if (confirmar) {
      await this.api.logout();
      this.cerrarMenu();
      this.router.navigate(['/home']); 
    }
  }

    ngOnDestroy() {
    this.menuAbierto = false;
    }
}