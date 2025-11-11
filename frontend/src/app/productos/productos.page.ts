import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonList, IonItem, IonLabel, IonButton, IonInput, IonIcon } from '@ionic/angular/standalone';
import { ApiService } from '../services/api.spec';
import {mdiPencil} from '@mdi/js';
import { addIcons } from 'ionicons';
import { Router } from '@angular/router';
import { chevronUpCircle, pencil, addCircle, removeCircle, filter, menu, close, trashBin, checkmarkCircle, search,
  documentText, cube, calculator, scale, eye, closeCircle, send, logOut, barChart, arrowUndo, people, personAdd, bag, person} from 'ionicons/icons';
import { Perimisos } from '../services/perimisos';

//Iconos
addIcons({ 
  chevronUpCircle, menu, pencil, removeCircle, addCircle, filter, close, 
  trashBin, checkmarkCircle, search, documentText, cube, calculator, scale, eye, send, closeCircle, people, personAdd,
  logOut, barChart, arrowUndo, bag, person
});

@Component({
  selector: 'app-productos',
  templateUrl: './productos.page.html',
  styleUrls: ['./productos.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, IonList, IonItem, IonLabel, IonButton, IonInput, CommonModule, FormsModule, IonIcon]
})


export class ProductosPage implements OnInit {

  mdi = {edit: mdiPencil};

  productos: { id: number; nombre: string; precio: number; stock: number }[] = [];
  mostrarModal = false;
  mostrarModalStock = false;
  productoSeleccionado: { id: number; nombre: string; precio: number; stock: number } | null = null;
  nuevoPrecio: number | null = null;
  nuevoStock: number | null = null;
  editProductos = false;
  editStock = false;
  editPrecio = false;

  constructor(private api: ApiService, private router: Router, private permisos: Perimisos) { }

  async ngOnInit() {
    this.editPrecio = true;
    this.editProductos = await this.permisos.checkPermission('edit_productos')
    this.productos = await this.api.productos();
    this.cargarDatosUsuario();
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

  abrirModal(producto: { id: number; nombre: string; precio: number; stock: number }) {
    this.productoSeleccionado = { ...producto };
    this.nuevoPrecio = producto.precio;
    this.mostrarModal = true;
  }

  abrirModalStock(producto: { id: number; nombre: string; precio: number; stock: number }){
    this.productoSeleccionado = {...producto};
    this.nuevoStock = producto.stock;
    this.mostrarModalStock = true
  }

  editarStock(){
    this.editPrecio = false;
    this.editStock = true;
    console.log(this.editPrecio, this.editStock)
  }

  editarPrecio(){
    this.editPrecio = true;
    this.editStock = false;
    console.log(this.editPrecio, this.editStock)
  }

  cerrarModal() {
    this.mostrarModal = false;
    this.productoSeleccionado = null;
    this.nuevoPrecio = null;
  }

  cerrarModalStock() {
    this.mostrarModalStock = false;
    this.productoSeleccionado = null;
    this.nuevoStock = null;
  }

  async confirmarCambio() {
    if (!this.productoSeleccionado || this.nuevoPrecio == null) return;
    const id = this.productoSeleccionado.id;
    const precio = Number(this.nuevoPrecio);
    if (Number.isNaN(precio) || precio < 0) return;
    await this.api.actualizarPrecios(precio, id);
    const idx = this.productos.findIndex(p => p.id === id);
    if (idx >= 0) this.productos[idx] = { ...this.productos[idx], precio };
    this.cerrarModal();
  }

  async confirmarCambioStock() {
    if (!this.productoSeleccionado || this.nuevoStock == null) return;
    const id = this.productoSeleccionado.id;
    const stock = Number(this.nuevoStock);
    if (Number.isNaN(stock) || stock < 0) return;
    await this.api.actualizarStock(stock, id);
    const idx = this.productos.findIndex(p => p.id === id);
    if (idx >= 0) this.productos[idx] = { ...this.productos[idx], stock };
    this.cerrarModalStock();
  }

  //Variables del menú
  menuAbierto: boolean = false;
  nombreUsuario: string = '';
  apellidoUsuario: string = '';

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

  IrAUsuarios() {
    this.cerrarMenu();
    this.router.navigate(['/usuarios']);
  }

  IrAPerfil() {
    this.cerrarMenu();
    this.router.navigate(['/perfil']);
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
}

