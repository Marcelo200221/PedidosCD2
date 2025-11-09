import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonContent, IonButton, IonSearchbar, IonItem, 
  IonLabel, IonIcon, IonCheckbox, IonSpinner, IonFab, IonFabList, IonFabButton, IonList } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { chevronUpCircle, pencil, addCircle, removeCircle, filter, menu, close, trashBin, checkmarkCircle, search,
  documentText, cube, calculator, scale, eye, closeCircle, send, logOut, barChart, arrowUndo, people, personAdd } from 'ionicons/icons';
import { ApiService } from '../services/api.spec';
import { ToastController } from '@ionic/angular';
import { NotificacionService } from '../services/notificacion.service';

//Iconos
addIcons({ 
  chevronUpCircle, menu, pencil, removeCircle, addCircle, filter, close, 
  trashBin, checkmarkCircle, search, documentText, cube, calculator, scale, eye, send, closeCircle, people, personAdd,
  logOut, barChart, arrowUndo
});

@Component({
  selector: 'app-hub',
  templateUrl: './hub.page.html',
  styleUrls: ['./hub.page.scss'],
  standalone: true,
  imports: [
    FormsModule,
    CommonModule,
    IonContent, IonButton, IonSearchbar, IonList, IonItem,
    IonLabel, IonIcon, IonCheckbox, IonSpinner, IonFab, IonFabList, IonFabButton
  ]
})
export class HubPage implements OnInit {

  //Variables del menú
  menuAbierto: boolean = false;
  nombreUsuario: string = '';
  apellidoUsuario: string = '';
  private avisosVistos = new Set<number>();
  private avisosTimer: any;

  constructor(
    private api: ApiService, 
    private router: Router,
    private toast: ToastController,
    private notificaciones: NotificacionService
  ) {}
  
  ngOnInit() {
    this.cargarDatosUsuario();
    this.iniciarAvisos();
  }

  iniciarAvisos() {
    this.notificaciones.start();
  }

  ngOnDestroy() {
    this.menuAbierto = false;
    // Detener avisos si están activos
    this.notificaciones.stop();
    if (this.avisosTimer) {
      clearInterval(this.avisosTimer);
      this.avisosTimer = null;
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

  //Control del menú
  toggleMenu() {
    this.menuAbierto = !this.menuAbierto;
  }

  cerrarMenu() {
    this.menuAbierto = false;
  }

  //Navegación desde botones principales
  Irapedidos() {
    this.router.navigate(['/pedidos']);
  }

  Irafacturas() {
    this.router.navigate(['/facturacion']);
  }

  Iradashboards() {
    this.router.navigate(['/dashboard']);
  }

  //Navegación desde menú lateral
  Irapedidosmenu() {
    this.cerrarMenu();
    this.router.navigate(['/pedidos']);
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

  IrListarClientes() {
    this.cerrarMenu();
    this.router.navigate(['/lista-clientes']);
  }

  //Cerrar sesión
  cerrarSesion() {
    if (confirm('¿Estás seguro que deseas cerrar sesión?')) {
      this.api.logout();
      this.cerrarMenu();
    }
  }
}
