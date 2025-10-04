import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonButton, IonSearchbar, IonFab, IonFabList, IonFabButton, IonList, IonItem, IonLabel, IonIcon, IonInput, IonCheckbox} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import {chevronUpCircle,pencil,addCircle,removeCircle,filter,menu,close,trashBin,checkmarkCircle,search,documentText} from 'ionicons/icons';

//Interfaces
export interface Producto {
  nombre: string;
  kg: number | null;
}

export interface Pedido {
  nombre: string;
  cliente: string;
  direccion: string;
  productos: Producto[];
  seleccionado?: boolean;
}

//Iconos
addIcons({ 
  chevronUpCircle, menu, pencil, removeCircle, addCircle, filter, close, 
  trashBin, checkmarkCircle, search, documentText 
});

@Component({
  selector: 'app-pedidos',
  templateUrl: './pedidos.page.html',
  styleUrls: ['./pedidos.page.scss'],
  standalone: true,
  imports: [
    FormsModule,CommonModule,IonContent, IonButton, IonSearchbar, IonFab, IonFabList, 
    IonFabButton,IonList, IonItem, IonLabel, IonIcon, IonInput, IonCheckbox]})

export class PedidosPage implements OnInit {

 //Definicion de variables
  pedidos: Pedido[] = [];
  pedidosFiltrados: Pedido[] = [];
  terminoBusqueda: string = '';

  nuevoPedido: Pedido = {
    nombre: '',
    cliente: '',
    direccion: '',
    productos: []
  };

  productosInputs: Producto[] = [{ nombre: '', kg: null }];

  //Definicion de pantallas
  mostrarAgregarPedido: boolean = false;
  mostrarAgregarProductos: boolean = false;
  mostrarEliminarPedido: boolean = false;
  mostrarEditarPedido: boolean = false;
  indiceEditando: number = -1;

  //Definicion de variables de error
  clienteError: string = '';
  productosErrors: string[] = [''];

  //Definicion de variables de color
  underlineNombrePedido: string = '#cccccc';
  underlineCliente: string = '#cccccc';
  underlineDireccion: string = '#cccccc';
  underlinesProductosNombre: string[] = ['#cccccc'];
  underlinesProductosKG: string[] = ['#cccccc'];

  constructor() { }

  ngOnInit() {
    this.pedidosFiltrados = [...this.pedidos];
  }

  //Modo: Agregar Pedidos
  abrirAgregarPedido() {
    this.mostrarAgregarPedido = true;
    this.mostrarAgregarProductos = false;
    this.mostrarEliminarPedido = false;
    this.mostrarEditarPedido = false;
    this.indiceEditando = -1;

    this.underlineNombrePedido = '#cccccc';
    this.underlineCliente = '#cccccc';
    this.underlineDireccion = '#cccccc';
    this.underlinesProductosNombre = ['#cccccc'];
    this.underlinesProductosKG = ['#cccccc'];
    this.clienteError = '';
    this.productosErrors = [''];
  }
  
  //Funcion agregar producto
  abrirAgregarProducto() {
    if (!this.nuevoPedido.nombre.trim() || !this.nuevoPedido.cliente.trim() || !this.nuevoPedido.direccion.trim()) {
      alert('Completa todos los campos del pedido antes de continuar');
      return;
    }
    
    if (this.nuevoPedido.cliente.trim().length < 3) {
      alert('El nombre del cliente debe tener al menos 3 letras');
      return;
    }
    
    this.mostrarAgregarProductos = true;
    this.mostrarAgregarPedido = false;
  }

  agregarCampoProducto() {
    this.productosInputs.push({ nombre: '', kg: null });
    this.productosErrors.push('');
    this.underlinesProductosNombre.push('#cccccc');
    this.underlinesProductosKG.push('#cccccc');
  }

  eliminarCampoProducto(index: number) {
    if (this.productosInputs.length > 1) {
      this.productosInputs.splice(index, 1);
      this.productosErrors.splice(index, 1);
      this.underlinesProductosNombre.splice(index, 1);
      this.underlinesProductosKG.splice(index, 1);
    } else {
      alert('Debe haber al menos un producto');
    }
  }

  //Funcion guardar pedido
  guardarPedido() {
    if (this.nuevoPedido.cliente.trim().length < 3) {
      alert('El nombre del cliente debe tener al menos 3 letras');
      return;
    }

    const productosValidos = this.productosInputs.filter(prod => {
      const kgNumber = Number(prod.kg);
      return prod.nombre.trim().length >= 2 && kgNumber > 0 && !isNaN(kgNumber);
    });

    if (productosValidos.length === 0) {
      alert('Agrega al menos un producto con nombre válido (mínimo 2 letras) y KG mayor a 0');
      return;
    }

    this.nuevoPedido.productos = productosValidos.map(prod => ({
      nombre: prod.nombre.trim(),
      kg: Number(prod.kg)
    }));

    if (this.indiceEditando >= 0) {
      this.pedidos[this.indiceEditando] = { ...this.nuevoPedido, seleccionado: false };
      alert('Pedido actualizado correctamente');
      this.indiceEditando = -1;
    } else {
      this.pedidos.push({ ...this.nuevoPedido, seleccionado: false });
    }
    
    this.pedidosFiltrados = [...this.pedidos];
    
    this.nuevoPedido = { nombre: '', cliente: '', direccion: '', productos: [] };
    this.productosInputs = [{ nombre: '', kg: null }];
    this.mostrarAgregarPedido = false;
    this.mostrarAgregarProductos = false;
    this.mostrarEditarPedido = false;
    
    this.underlineNombrePedido = '#cccccc';
    this.underlineCliente = '#cccccc';
    this.underlineDireccion = '#cccccc';
    this.underlinesProductosNombre = ['#cccccc'];
    this.underlinesProductosKG = ['#cccccc'];
    this.clienteError = '';
    this.productosErrors = [''];
  }

  //Funcion cancelar agregar
  cancelarAgregar() {
    this.mostrarAgregarPedido = false;
    this.mostrarAgregarProductos = false;
    this.mostrarEditarPedido = false;
    this.nuevoPedido = { nombre: '', cliente: '', direccion: '', productos: [] };
    this.productosInputs = [{ nombre: '', kg: null }];
    this.indiceEditando = -1;
    
    this.underlineNombrePedido = '#cccccc';
    this.underlineCliente = '#cccccc';
    this.underlineDireccion = '#cccccc';
    this.underlinesProductosNombre = ['#cccccc'];
    this.underlinesProductosKG = ['#cccccc'];
    this.clienteError = '';
    this.productosErrors = [''];
  }

  //Modo: Eliminar pedido
  activarModoEliminar() {
    if (this.pedidos.length === 0) {
      alert('No hay pedidos para eliminar');
      return;
    }
    this.mostrarEliminarPedido = true;
    this.mostrarEditarPedido = false;
    this.mostrarAgregarPedido = false;
    this.mostrarAgregarProductos = false;
    this.pedidos.forEach(pedido => pedido.seleccionado = false);
    this.pedidosFiltrados.forEach(pedido => pedido.seleccionado = false);
  }

  //Funcion cancelar eliminar pedido
  cancelarModoEliminar() {
    this.mostrarEliminarPedido = false;
    this.pedidos.forEach(pedido => pedido.seleccionado = false);
    this.pedidosFiltrados.forEach(pedido => pedido.seleccionado = false);
  }

  toggleSeleccionPedido(pedido: Pedido) {
    pedido.seleccionado = !pedido.seleccionado;
  }

  eliminarPedidosSeleccionados() {
    const seleccionados = this.pedidos.filter(p => p.seleccionado).length;
    
    if (seleccionados === 0) {
      alert('Selecciona al menos un pedido para eliminar');
      return;
    }

    if (confirm(`¿Estás seguro de eliminar ${seleccionados} pedido(s)?`)) {
      this.pedidos = this.pedidos.filter(p => !p.seleccionado);
      this.pedidosFiltrados = this.pedidos.filter(pedido => {
        if (!this.terminoBusqueda) return true;
        
        const termino = this.terminoBusqueda.toLowerCase();
        return pedido.nombre.toLowerCase().includes(termino) ||
               pedido.cliente.toLowerCase().includes(termino) ||
               pedido.direccion.toLowerCase().includes(termino) ||
               pedido.productos.some(prod => prod.nombre.toLowerCase().includes(termino));
      });
      this.mostrarEliminarPedido = false;
      alert(`${seleccionados} pedido(s) eliminado(s) correctamente`);
    }
  }

  get pedidosSeleccionados(): number {
    return this.pedidos.filter(p => p.seleccionado).length;
  }

  //Modo: Editar
  activarModoEditar() {
    if (this.pedidos.length === 0) {
      alert('No hay pedidos para editar');
      return;
    }
    this.mostrarEditarPedido = true;
    this.mostrarEliminarPedido = false;
    this.mostrarAgregarPedido = false;
    this.mostrarAgregarProductos = false;
    this.pedidos.forEach(pedido => pedido.seleccionado = false);
    this.pedidosFiltrados.forEach(pedido => pedido.seleccionado = false);
  }

  //Funcion cancelar modo editar
  cancelarModoEditar() {
    this.mostrarEditarPedido = false;
    this.pedidos.forEach(pedido => pedido.seleccionado = false);
    this.pedidosFiltrados.forEach(pedido => pedido.seleccionado = false);
  }

  toggleSeleccionPedidoEditar(pedido: Pedido) {
    this.pedidos.forEach(p => {
      if (p !== pedido) p.seleccionado = false;
    });
    this.pedidosFiltrados.forEach(p => {
      if (p !== pedido) p.seleccionado = false;
    });
    pedido.seleccionado = !pedido.seleccionado;
  }

  editarPedidoSeleccionado() {
    const pedidoSeleccionado = this.pedidos.find(p => p.seleccionado);
    
    if (!pedidoSeleccionado) {
      alert('Selecciona un pedido para editar');
      return;
    }

    this.indiceEditando = this.pedidos.findIndex(p => p.seleccionado);
    
    this.nuevoPedido = {
      nombre: pedidoSeleccionado.nombre,
      cliente: pedidoSeleccionado.cliente,
      direccion: pedidoSeleccionado.direccion,
      productos: []
    };

    this.productosInputs = pedidoSeleccionado.productos.map(prod => ({
      nombre: prod.nombre,
      kg: prod.kg
    }));

    this.productosErrors = new Array(this.productosInputs.length).fill('');
    this.underlinesProductosNombre = new Array(this.productosInputs.length).fill('#28a745');
    this.underlinesProductosKG = new Array(this.productosInputs.length).fill('#28a745');
    
    this.underlineNombrePedido = '#28a745';
    this.underlineCliente = '#28a745';
    this.underlineDireccion = '#28a745';

    this.mostrarEditarPedido = false;
    this.mostrarAgregarPedido = true;
  }

  get hayPedidoSeleccionadoEditar(): boolean {
    return this.pedidos.some(p => p.seleccionado);
  }
  
  //Funcion de busqueda de productos
  buscarPedidos(event: any) {
    const termino = event.target.value.toLowerCase().trim();
    this.terminoBusqueda = termino;

    if (!termino) {
      this.pedidosFiltrados = [...this.pedidos];
      return;
    }

    this.pedidosFiltrados = this.pedidos.filter(pedido => {
      if (pedido.nombre.toLowerCase().includes(termino)) return true;
      if (pedido.cliente.toLowerCase().includes(termino)) return true;
      if (pedido.direccion.toLowerCase().includes(termino)) return true;
      
      const encontradoEnProductos = pedido.productos.some(prod => 
        prod.nombre.toLowerCase().includes(termino)
      );
      return encontradoEnProductos;
    });
  }

  limpiarBusqueda() {
    this.terminoBusqueda = '';
    this.pedidosFiltrados = [...this.pedidos];
  }

  //Funcion para validar nombre de pedido
  actualizarNombrePedido(event: any) {
    this.nuevoPedido.nombre = event.target.value;
    this.underlineNombrePedido = this.nuevoPedido.nombre.length > 0 ? '#28a745' : '#cccccc';
  }

  onKeyPressCliente(event: KeyboardEvent) {
    const key = event.key;
    if (key.length > 1) return; 
    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]$/.test(key)) {
      event.preventDefault(); 
    }
  }

  //Funcion para validar el nombre del cliente
  actualizarCliente(event: any) {
    this.nuevoPedido.cliente = event.target.value;
    if (this.nuevoPedido.cliente.length === 0) {
      this.underlineCliente = '#cccccc';
      this.clienteError = '';
    } else if (this.nuevoPedido.cliente.trim().length < 3) {
      this.underlineCliente = '#ff4d4d';
      this.clienteError = 'El nombre del cliente debe tener al menos 3 letras';
    } else {
      this.underlineCliente = '#28a745';
      this.clienteError = '';
    }
  }

  //Funcion para la direccion del cliente
  actualizarDireccion(event: any) {
    this.nuevoPedido.direccion = event.target.value;
    this.underlineDireccion = this.nuevoPedido.direccion.length > 0 ? '#28a745' : '#cccccc';
  }

  onKeyPressProducto(event: KeyboardEvent) {
    const key = event.key;
    if (key.length > 1) return;
    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]$/.test(key)) {
      event.preventDefault();
    }
  }

  //Funcion para validar el producto
  actualizarNombreProducto(event: any, index: number) {
    this.productosInputs[index].nombre = event.target.value;
    while (this.productosErrors.length <= index) {
      this.productosErrors.push('');
    }
    while (this.underlinesProductosNombre.length <= index) {
      this.underlinesProductosNombre.push('#cccccc');
    }

    if (this.productosInputs[index].nombre.length === 0) {
      this.underlinesProductosNombre[index] = '#cccccc';
      this.productosErrors[index] = '';
    } else if (this.productosInputs[index].nombre.trim().length < 2) {
      this.underlinesProductosNombre[index] = '#ff4d4d';
      this.productosErrors[index] = 'El nombre del producto debe tener al menos 2 letras';
    } else {
      this.underlinesProductosNombre[index] = '#28a745';
      this.productosErrors[index] = '';
    }
  }

  //Funcion para validar el kg del producto
  actualizarKGProducto(event: any, index: number) {
    this.productosInputs[index].kg = event.target.value;
    while (this.underlinesProductosKG.length <= index) {
      this.underlinesProductosKG.push('#cccccc');
    }
    const kg = this.productosInputs[index].kg;
    if (kg === null || kg === undefined) {
      this.underlinesProductosKG[index] = '#cccccc';
    } else {
      const kgNumber = Number(kg);
      if (kgNumber < 0) {
        this.productosInputs[index].kg = 0;
        this.underlinesProductosKG[index] = '#ff4d4d';
      } else if (kgNumber > 0) {
        this.underlinesProductosKG[index] = '#28a745';
      } else {
        this.underlinesProductosKG[index] = '#cccccc';
      }
    }
  }
  
  validarKG(index: number) {
    this.actualizarKGProducto({ target: { value: this.productosInputs[index].kg } }, index);
  }

}