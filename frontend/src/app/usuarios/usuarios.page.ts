import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonButton, IonList, IonItem, IonIcon, IonLabel} from '@ionic/angular/standalone';
import { ApiService } from '../services/api.spec';
import { Perimisos } from '../services/perimisos';
import { addIcons } from 'ionicons';
import { Router } from '@angular/router';
import { pieChart, statsChart, refresh, hourglassOutline, checkmarkCircleOutline, timeOutline, checkmarkDoneOutline, 
  chevronUpCircle, pencil, addCircle, removeCircle, filter, menu, close, trashBin, checkmarkCircle, search,
  documentText, cube, calculator, scale, eye, closeCircle, send, logOut, barChart, people, personAdd, arrowUndo, 
  bag, person, trophy, ellipsisVertical, swapVertical, calendar, funnel, apps, podium, checkmarkDone} from 'ionicons/icons';
import { NotificacionService } from '../services/notificacion.service';

//Iconos
addIcons({ 
 pieChart, statsChart, refresh, hourglassOutline, checkmarkCircleOutline, timeOutline, checkmarkDoneOutline, 
  chevronUpCircle, pencil, addCircle, removeCircle, filter, menu, close, trashBin, checkmarkCircle, search,
  documentText, cube, calculator, scale, eye, closeCircle, send, logOut, barChart, people, personAdd, arrowUndo, 
  bag, person, trophy, ellipsisVertical, swapVertical, calendar, funnel, apps, podium, checkmarkDone
});


@Component({
  selector: 'app-usuarios',
  templateUrl: './usuarios.page.html',
  styleUrls: ['./usuarios.page.scss'],
  standalone: true,
  imports: [FormsModule,
      CommonModule,
      IonContent, IonButton,
      IonList, IonItem, IonIcon, IonLabel]
})
export class UsuariosPage implements OnInit {

  //Variables del menú
  menuAbierto: boolean = false;
  nombreUsuario: string = '';
  apellidoUsuario: string = '';
  puedeIr = false;
  verReportes = false;
  verProductos = false;
  cargando: boolean = true;

  usuarios: any[] = [];

  constructor(private api: ApiService, public permisos: Perimisos, private router: Router, private notificaciones: NotificacionService) { }


  async darPermisos(id: string){
    this.api.darPermisos(id);
    await this.notificaciones.showSuccess('Permisos asignados correctamente');
  }
  
  esGerente(u: any): boolean {
    const g = u?.groups;
    if (!g) return false;
    // Puede venir como array de nombres, objetos o ids
    if (Array.isArray(g)) {
      return g.some((x: any) => x === 'gerente' || x?.name === 'gerente' || x === 1 || x === '1');
    }
    return false;
  }
  
  async cargarDatosUsuario() {
    const usuario = await this.api.getUsuarioActual();
    if (usuario) {
      this.nombreUsuario = usuario.nombre;
      this.apellidoUsuario = usuario.apellido;
    } else {
      //Si no hay usuario, redirigir al login
      console.warn('No hay usuario en IndexedDB, redirigiendo al login');
      this.router.navigate(['/login']);
    }
  }

  async ngOnInit() {
    const res = await this.api.getUsuarios()
    this.usuarios = res.data
    this.verProductos = await this.permisos.checkPermission('view_productos')
    this.puedeIr = await this.permisos.checkPermission('view_usuarios')
    this.verReportes = await this.permisos.checkPermission('view_reportes')
    this.cargarDatosUsuario();
    // Inicializa el servicio de avisos si hay sesión
    try { await this.notificaciones.start(); } catch {}
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
    this.cargarDatosUsuario()
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
  

}
