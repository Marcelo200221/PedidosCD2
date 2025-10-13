import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonButton, IonSearchbar, IonFab, IonFabList, IonFabButton, IonList, IonItem, IonLabel, IonIcon, IonInput, 
  IonCheckbox, IonSelect, IonSelectOption} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import { chevronUpCircle, pencil, addCircle, removeCircle, filter,  menu,  close, trashBin, checkmarkCircle, search,
  documentText, cube, calculator, scale, eye } from 'ionicons/icons';

//Interfaces
export interface Producto {
  nombre: string;
  cajas: number | null;
  pesos?: number[]; 
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
  trashBin, checkmarkCircle, search, documentText, cube, calculator, scale, eye 
});

@Component({
  selector: 'app-pedidos',
  templateUrl: './pedidos.page.html',
  styleUrls: ['./pedidos.page.scss'],
  standalone: true,
  imports: [
    FormsModule,
    CommonModule,
    IonContent, IonButton, IonSearchbar, IonFab, IonFabList, IonFabButton,
    IonList, IonItem, IonLabel, IonIcon, IonInput, IonCheckbox, IonSelect, IonSelectOption
  ]
})
export class PedidosPage implements OnInit {

  //Definición de variables 
  //Arrays de datos principales
  pedidos: Pedido[] = [];
  pedidosFiltrados: Pedido[] = [];
  productosInputs: Producto[] = [{ nombre: '', cajas: null }];
  
  //Variable de busqueda
  terminoBusqueda: string = '';
  
  //Variables de nuevo pedido
  nuevoPedido: Pedido = {
    nombre: '',
    cliente: '',
    direccion: '',
    productos: []
  };
  
  //Variables de control de vistas
  mostrarAgregarPedido: boolean = false;
  mostrarEliminarPedido: boolean = false;
  mostrarEditarPedido: boolean = false;
  mostrarAsignarPesos: boolean = false;
  mostrarDetallePesos: boolean = false;
  
  //Variables de indices
  indiceEditando: number = -1;
  indiceParaPesos: number = -1;
  
  //Variables de pedidos temporales
  pedidoParaPesos: Pedido | null = null;
  pedidoDetalle: Pedido | null = null;
  pesosTemporales: { [productoIndex: number]: number[] } = {};
  
  //Carnes disponibles
  tiposCarne: string[] = [
    'Posta negra',
    'Posta rosada',
    'Filete de pollo',
    'Pulpa de cerdo'
  ];
  
  //Variables de color
  underlineNombrePedido: string = '#cccccc';
  underlineCliente: string = '#cccccc';
  underlineDireccion: string = '#cccccc';
  underlinesProductosNombre: string[] = ['#cccccc'];
  underlinesProductosCajas: string[] = ['#cccccc'];
  underlinesPesos: { [productoIndex: number]: string[] } = {};
  
  //Variables de error
  clienteError: string = '';
  productosErrors: string[] = [''];
  pesosErrors: { [productoIndex: number]: string[] } = {};

  constructor() { }

  ngOnInit() {
    this.pedidosFiltrados = [...this.pedidos];
  }

  //Funcion de busqueda
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

  //Funcion de limpiar busqueda
  limpiarBusqueda() {
    this.terminoBusqueda = '';
    this.pedidosFiltrados = [...this.pedidos];
  }

  //Funcion de validacion
  //Validacion: Nombre pedido
  actualizarNombrePedido(event: any) {
    this.nuevoPedido.nombre = event.target.value;
    this.underlineNombrePedido = this.nuevoPedido.nombre.length > 0 ? '#28a745' : '#cccccc';
  }

  //Validacion: Cliente
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

  onKeyPressCliente(event: KeyboardEvent) {
    const key = event.key;
    if (key.length > 1) return; 
    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]$/.test(key)) {
      event.preventDefault(); 
    }
  }

  //Validacion: Direccion
  actualizarDireccion(event: any) {
    this.nuevoPedido.direccion = event.target.value;
    this.underlineDireccion = this.nuevoPedido.direccion.length > 0 ? '#28a745' : '#cccccc';
  }

  //Validacion: Producto
  actualizarNombreProducto(event: any, index: number) {
    this.productosInputs[index].nombre = event.target.value;
    
    while (this.productosErrors.length <= index) {
      this.productosErrors.push('');
    }
    while (this.underlinesProductosNombre.length <= index) {
      this.underlinesProductosNombre.push('#cccccc');
    }

    if (!this.productosInputs[index].nombre || this.productosInputs[index].nombre === '') {
      this.underlinesProductosNombre[index] = '#cccccc';
      this.productosErrors[index] = '';
    } else {
      this.underlinesProductosNombre[index] = '#28a745';
      this.productosErrors[index] = '';
    }
  }

  actualizarCajasProducto(event: any, index: number) {
    let valor = event.target.value;
    if (valor && (valor.includes('.') || valor.includes(','))) {
      valor = Math.floor(Number(valor));
      this.productosInputs[index].cajas = valor;
    } else {
      this.productosInputs[index].cajas = valor;
    }
    
    while (this.underlinesProductosCajas.length <= index) {
      this.underlinesProductosCajas.push('#cccccc');
    }

    const cajas = this.productosInputs[index].cajas;
    if (cajas === null || cajas === undefined) {
      this.underlinesProductosCajas[index] = '#cccccc';
    } else {
      const cajasNumber = Number(cajas);
      if (cajasNumber < 1) {
        this.underlinesProductosCajas[index] = '#ff4d4d';
      } else if (cajasNumber >= 1 && Number.isInteger(cajasNumber)) {
        this.underlinesProductosCajas[index] = '#28a745';
      } else {
        this.underlinesProductosCajas[index] = '#ff4d4d';
      }
    }
  }

  //Validacion: Cajas
  validarCajas(index: number) {
    this.actualizarCajasProducto({ target: { value: this.productosInputs[index].cajas } }, index);
  }

  onKeyPressCajas(event: KeyboardEvent) {
    const key = event.key;
    if (key.length > 1) return; 
    if (!/^[0-9]$/.test(key)) {
      event.preventDefault();
    }
  }

  onKeyPressPeso(event: KeyboardEvent) {
    const key = event.key;
  
    if (key.length > 1) return;
    const input = event.target as HTMLInputElement;
    const currentValue = input.value || '';
    const cursorPos = input.selectionStart || 0;
    
    if (!/^[0-9.]$/.test(key)) {
      event.preventDefault();
      return;
    }
    
    if (key === '.' && currentValue.includes('.')) {
      event.preventDefault();
      return;
    }
  
    if (key === '.' && currentValue === '') {
      event.preventDefault();
      return;
    }
    
    if (currentValue.includes('.')) {
      const partes = currentValue.split('.');
      const posPunto = currentValue.indexOf('.');
      
      if (cursorPos > posPunto && partes[1] && partes[1].length >= 3) {
        const selectionLength = (input.selectionEnd || 0) - (input.selectionStart || 0);
        if (selectionLength === 0) {
          event.preventDefault();
          return;
        }
      }
    }
  }

  //modo: Agregar pedido
  abrirAgregarPedido() {
    this.mostrarAgregarPedido = true;
    this.mostrarEliminarPedido = false;
    this.mostrarEditarPedido = false;
    this.mostrarAsignarPesos = false;
    this.pedidoParaPesos = null;
    this.indiceEditando = -1;
    
    this.underlineNombrePedido = '#cccccc';
    this.underlineCliente = '#cccccc';
    this.underlineDireccion = '#cccccc';
    this.underlinesProductosNombre = ['#cccccc'];
    this.underlinesProductosCajas = ['#cccccc'];
    this.clienteError = '';
    this.productosErrors = [''];
  }

  agregarCampoProducto() {
    this.productosInputs.push({ nombre: '', cajas: null });
    this.productosErrors.push('');
    this.underlinesProductosNombre.push('#cccccc');
    this.underlinesProductosCajas.push('#cccccc');
  }

  eliminarCampoProducto(index: number) {
    if (this.productosInputs.length > 1) {
      this.productosInputs.splice(index, 1);
      this.productosErrors.splice(index, 1);
      this.underlinesProductosNombre.splice(index, 1);
      this.underlinesProductosCajas.splice(index, 1);
    } else {
      alert('Debe haber al menos un producto');
    }
  }

  guardarPedido() {
    if (!this.nuevoPedido.nombre.trim()) {
      alert('Ingresa el nombre del pedido');
      return;
    }

    if (this.nuevoPedido.cliente.trim().length < 3) {
      alert('El nombre del cliente debe tener al menos 3 letras');
      return;
    }

    if (!this.nuevoPedido.direccion.trim()) {
      alert('Ingresa la dirección de envío');
      return;
    }

    const productosValidos = this.productosInputs.filter(prod => {
      const cajasNumber = Number(prod.cajas);
      return prod.nombre && prod.nombre !== '' && cajasNumber >= 1 && !isNaN(cajasNumber);
    });

    if (productosValidos.length === 0) {
      alert('Agrega al menos un producto con tipo de carne seleccionado y cantidad de cajas mayor o igual a 1');
      return;
    }

    this.nuevoPedido.productos = productosValidos.map(prod => ({
      nombre: prod.nombre,
      cajas: Number(prod.cajas)
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
    this.productosInputs = [{ nombre: '', cajas: null }];
    this.mostrarAgregarPedido = false;
    
    this.underlineNombrePedido = '#cccccc';
    this.underlineCliente = '#cccccc';
    this.underlineDireccion = '#cccccc';
    this.underlinesProductosNombre = ['#cccccc'];
    this.underlinesProductosCajas = ['#cccccc'];
    this.clienteError = '';
    this.productosErrors = [''];
  }

  cancelarAgregar() {
    this.mostrarAgregarPedido = false;
    this.mostrarEditarPedido = false;
    this.nuevoPedido = { nombre: '', cliente: '', direccion: '', productos: [] };
    this.productosInputs = [{ nombre: '', cajas: null }];
    this.indiceEditando = -1;
    
    this.underlineNombrePedido = '#cccccc';
    this.underlineCliente = '#cccccc';
    this.underlineDireccion = '#cccccc';
    this.underlinesProductosNombre = ['#cccccc'];
    this.underlinesProductosCajas = ['#cccccc'];
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
    this.mostrarAsignarPesos = false;
    this.pedidoParaPesos = null;
    this.pedidos.forEach(pedido => pedido.seleccionado = false);
    this.pedidosFiltrados.forEach(pedido => pedido.seleccionado = false);
  }

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

  //Modo: Editar pedido
  activarModoEditar() {
    if (this.pedidos.length === 0) {
      alert('No hay pedidos para editar');
      return;
    }
    this.mostrarEditarPedido = true;
    this.mostrarEliminarPedido = false;
    this.mostrarAgregarPedido = false;
    this.mostrarAsignarPesos = false; 
    this.pedidoParaPesos = null; 
    this.pedidos.forEach(pedido => pedido.seleccionado = false);
    this.pedidosFiltrados.forEach(pedido => pedido.seleccionado = false);
  }


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
      cajas: prod.cajas,
      pesos: prod.pesos ? [...prod.pesos] : undefined
    }));

    this.productosErrors = new Array(this.productosInputs.length).fill('');
    this.underlinesProductosNombre = new Array(this.productosInputs.length).fill('#28a745');
    this.underlinesProductosCajas = new Array(this.productosInputs.length).fill('#28a745');
    
    this.underlineNombrePedido = '#28a745';
    this.underlineCliente = '#28a745';
    this.underlineDireccion = '#28a745';

    this.mostrarEditarPedido = false;
    this.mostrarAgregarPedido = true;
  }

  get hayPedidoSeleccionadoEditar(): boolean {
    return this.pedidos.some(p => p.seleccionado);
  }

  //Modo: Asignar peso
  activarModoAsignarPesos() {
    if (this.pedidos.length === 0) {
      alert('No hay pedidos para asignar pesos');
      return;
    }
    this.mostrarAsignarPesos = true;
    this.mostrarEditarPedido = false;
    this.mostrarEliminarPedido = false;
    this.mostrarAgregarPedido = false;
    this.pedidos.forEach(pedido => pedido.seleccionado = false);
    this.pedidosFiltrados.forEach(pedido => pedido.seleccionado = false);
  }

  cancelarModoAsignarPesos() {
    this.mostrarAsignarPesos = false;
    this.pedidos.forEach(pedido => pedido.seleccionado = false);
    this.pedidosFiltrados.forEach(pedido => pedido.seleccionado = false);
    this.pedidoParaPesos = null;
    this.indiceParaPesos = -1;
    this.pesosTemporales = {};
    this.underlinesPesos = {};
    this.pesosErrors = {};
  }

  toggleSeleccionPedidoPesos(pedido: Pedido) {
    this.pedidos.forEach(p => {
      if (p !== pedido) p.seleccionado = false;
    });
    this.pedidosFiltrados.forEach(p => {
      if (p !== pedido) p.seleccionado = false;
    });
    pedido.seleccionado = !pedido.seleccionado;
  }

  abrirFormularioPesos() {
    const pedidoSeleccionado = this.pedidos.find(p => p.seleccionado);
    
    if (!pedidoSeleccionado) {
      alert('Selecciona un pedido para asignar pesos');
      return;
    }

    this.indiceParaPesos = this.pedidos.findIndex(p => p.seleccionado);
    this.pedidoParaPesos = { ...pedidoSeleccionado };
    this.pesosTemporales = {};
    this.underlinesPesos = {};
    this.pesosErrors = {};
    
    this.pedidoParaPesos.productos.forEach((prod, index) => {
      const numCajas = prod.cajas || 0;
      this.pesosTemporales[index] = prod.pesos && prod.pesos.length === numCajas 
        ? [...prod.pesos] 
        : new Array(numCajas).fill(0);
      
      this.underlinesPesos[index] = prod.pesos && prod.pesos.length === numCajas
        ? new Array(numCajas).fill('#28a745')
        : new Array(numCajas).fill('#cccccc');
      
      this.pesosErrors[index] = new Array(numCajas).fill('');
    });

    this.mostrarAsignarPesos = false;
  }

  actualizarPesoCaja(productoIndex: number, cajaIndex: number, event: any) {
    let peso = event.target.value;
    if (peso && peso.includes('.')) {
      const partes = peso.split('.');
      if (partes[1] && partes[1].length > 3) {
        peso = partes[0] + '.' + partes[1].substring(0, 3);
        event.target.value = peso;
      }
    }
    
    if (!this.pesosTemporales[productoIndex]) {
      this.pesosTemporales[productoIndex] = [];
    }
    if (!this.underlinesPesos[productoIndex]) {
      this.underlinesPesos[productoIndex] = [];
    }
    if (!this.pesosErrors[productoIndex]) {
      this.pesosErrors[productoIndex] = [];
    }
    
    const pesoNum = peso ? Number(peso) : 0;
    this.pesosTemporales[productoIndex][cajaIndex] = pesoNum;
    
    if (!peso || peso === '' || peso === '0') {
      this.underlinesPesos[productoIndex][cajaIndex] = '#cccccc';
      this.pesosErrors[productoIndex][cajaIndex] = '';
    } else if (pesoNum <= 0) {
      this.underlinesPesos[productoIndex][cajaIndex] = '#ff4d4d';
      this.pesosErrors[productoIndex][cajaIndex] = 'Debe añadir un peso válido';
    } else {
      this.underlinesPesos[productoIndex][cajaIndex] = '#28a745';
      this.pesosErrors[productoIndex][cajaIndex] = '';
    }
  }

  guardarPesos() {
    if (!this.pedidoParaPesos) return;

    for (let i = 0; i < this.pedidoParaPesos.productos.length; i++) {
      const pesos = this.pesosTemporales[i];
      const numCajas = this.pedidoParaPesos.productos[i].cajas || 0;
      
      if (!pesos || pesos.length !== numCajas) {
        alert(`Complete los pesos de todas las cajas del producto ${this.pedidoParaPesos.productos[i].nombre}`);
        return;
      }

      for (let j = 0; j < pesos.length; j++) {
        if (pesos[j] === null || pesos[j] <= 0) {
          alert(`Ingrese un peso válido para la caja ${j + 1} del producto ${this.pedidoParaPesos.productos[i].nombre}`);
          return;
        }
      }
    }

    this.pedidoParaPesos.productos.forEach((prod, index) => {
      prod.pesos = this.pesosTemporales[index];
    });

    this.pedidos[this.indiceParaPesos] = this.pedidoParaPesos;
    this.pedidosFiltrados = [...this.pedidos];

    alert('Pesos asignados correctamente');

    this.pedidoParaPesos = null;
    this.indiceParaPesos = -1;
    this.pesosTemporales = {};
    this.mostrarAsignarPesos = false;
  }

  cancelarAsignacionPesos() {
    this.pedidoParaPesos = null;
    this.indiceParaPesos = -1;
    this.pesosTemporales = {};
    this.underlinesPesos = {};
    this.pesosErrors = {};
    this.mostrarAsignarPesos = true;
  }

  get hayPedidoSeleccionadoPesos(): boolean {
    return this.pedidos.some(p => p.seleccionado);
  }

  //Modo: Detalle peso
  abrirDetallePesos(pedido: Pedido) {
    this.pedidoDetalle = pedido;
    this.mostrarDetallePesos = true;
  }

  cerrarDetallePesos() {
    this.mostrarDetallePesos = false;
    this.pedidoDetalle = null;
  }

  //Funciones: Calculos
  tienePesosAsignados(pedido: Pedido): boolean {
    return pedido.productos.some(prod => prod.pesos && prod.pesos.length > 0);
  }

  getPesoTotal(producto: Producto): number {
    if (!producto.pesos || producto.pesos.length === 0) return 0;
    return producto.pesos.reduce((sum, peso) => sum + (peso || 0), 0);
  }

  calcularPesoTotal(pesos: number[]): number {
    if (!pesos || pesos.length === 0) return 0;
    return pesos.reduce((sum, p) => sum + (p || 0), 0);
  }

  calcularPesoTotalDelPedido(pedido: Pedido): number {
    let total = 0;
    pedido.productos.forEach(prod => {
      total += this.getPesoTotal(prod);
    });
    return total;
  }

  calcularPesoTotalPedido(): number {
    if (!this.pedidoParaPesos) return 0;
    
    let total = 0;
    this.pedidoParaPesos.productos.forEach((prod, index) => {
      if (this.pesosTemporales[index]) {
        total += this.calcularPesoTotal(this.pesosTemporales[index]);
      }
    });
    return total;
  }
}
