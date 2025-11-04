import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonList, IonItem, IonLabel, IonButton, IonInput } from '@ionic/angular/standalone';
import { ApiService } from '../services/api.spec';

@Component({
  selector: 'app-productos',
  templateUrl: './productos.page.html',
  styleUrls: ['./productos.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, IonList, IonItem, IonLabel, IonButton, IonInput, CommonModule, FormsModule]
})
export class ProductosPage implements OnInit {

  productos: { id: number; nombre: string; precio: number }[] = [];
  mostrarModal = false;
  productoSeleccionado: { id: number; nombre: string; precio: number } | null = null;
  nuevoPrecio: number | null = null;

  constructor(private api: ApiService) { }

  async ngOnInit() {
    this.productos = await this.api.productos();
  }

  abrirModal(producto: { id: number; nombre: string; precio: number }) {
    this.productoSeleccionado = { ...producto };
    this.nuevoPrecio = producto.precio;
    this.mostrarModal = true;
  }

  cerrarModal() {
    this.mostrarModal = false;
    this.productoSeleccionado = null;
    this.nuevoPrecio = null;
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

}
