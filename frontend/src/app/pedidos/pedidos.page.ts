import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonButton, IonSearchbar, IonFab, IonFabList, IonFabButton, IonList, IonItem, IonLabel, IonIcon, IonInput, 
  IonCheckbox, IonSelect, IonSelectOption, IonSpinner} from '@ionic/angular/standalone';
import { ApiService } from '../services/api.spec';
import { addIcons } from 'ionicons';
import { chevronUpCircle, pencil, addCircle, removeCircle, filter, menu, close, trashBin, checkmarkCircle, search,
  documentText, cube, calculator, scale, eye, closeCircle, send } from 'ionicons/icons';

//Interfaces
export interface Producto {
  id: number;
  nombre: string;
  cajas: number | null;
  pesos?: number[]; 
}

export interface Pedido {
  id: number;
  nombre: string;
  cliente: string;
  direccion: string;
  productos: Producto[];
  seleccionado?: boolean;
  estado?: 'pendiente_pesos' | 'listo_facturar' | 'pendiente_confirmacion' | 'completado'; // ← AGREGAR
}

//Iconos
addIcons({ 
  chevronUpCircle, menu, pencil, removeCircle, addCircle, filter, close, 
  trashBin, checkmarkCircle, search, documentText, cube, calculator, scale, eye, send, closeCircle
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
    IonList, IonItem, IonLabel, IonIcon, IonInput, IonCheckbox, IonSelect, IonSelectOption, IonSpinner
  ]
})
export class PedidosPage implements OnInit {

  //Definición de variables 
  //Arrays de datos principales
  pedidos: Pedido[] = [];
  pedidosFiltrados: Pedido[] = [];
  productosInputs: Producto[] = [{ id: 0,nombre: '', cajas: null }];

  pedidoEditandoId?: number;
  
  productosDisponibles: any[] = [];

  //Variable de busqueda
  terminoBusqueda: string = '';
  mostrarMenuFiltro: boolean = false;
  filtroEstadoActivo: string | null = null; // null = sin filtro, 'pendiente_pesos', 'listo_facturar', etc.
  
  //Variables de nuevo pedido
  nuevoPedido: Pedido = {
    id: 0,
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

  constructor(private api: ApiService) { }

  async ngOnInit() {
    this.pedidosFiltrados = [...this.pedidos];
    await this.cargarProductosDisponibles();
    await this.cargarPedidosDesdeBackend();
  }

  async cargarPedidosDesdeBackend(){
    try{
      const pedidosBackend = await this.api.listarPedidos();
      console.log('Pedidos cargados desde backend:', pedidosBackend);

      this.pedidos = pedidosBackend.map((pedido: any) => this.mapearPedidoBackend(pedido));
      this.pedidosFiltrados = [...this.pedidos];

      console.log('Pedidos transformados:', this.pedidos);
    } catch(error) {
      console.error('Erro al cargar pedidos:', error);
      alert('Error al cargar los pedidos');
    }
  }

  private mapearPedidoBackend(pedidosBackend: any): Pedido {
    const productos: Producto[] = pedidosBackend.lineas.map((linea: any) => {
      const pesos = linea.cajas ? linea.cajas
        .map((caja: any) => caja.peso)
        .filter((peso: number) => peso > 0) 
        : [];

      return {
        id: linea.producto.id,
        nombre: linea.producto.nombre,
        cajas: linea.cantidad_cajas,
        pesos: pesos.length > 0 ? pesos : undefined 
      };
    });

    // Determinar el estado
    let estado: 'pendiente_pesos' | 'listo_facturar' | 'pendiente_confirmacion' | 'completado';
    
    if (pedidosBackend.estado) {
      estado = pedidosBackend.estado;
    } else {
      const todosTienenPesos = productos.every(p => 
        p.pesos && 
        p.pesos.length === p.cajas && 
        p.pesos.length > 0 &&        
        p.pesos.every(peso => peso > 0) 
      );
      estado = todosTienenPesos ? 'listo_facturar' : 'pendiente_pesos';
    }

    console.log(`Pedido ${pedidosBackend.id} - Estado: ${estado} - Productos:`, productos);

    return {
      id: pedidosBackend.id,
      nombre: `pedido ${pedidosBackend.id}`,
      cliente: 'Cliente por defecto',
      direccion: pedidosBackend.direccion,
      productos: productos,
      seleccionado: false,
      estado: estado
    };
  }


  async cargarProductosDisponibles() {
    try{
      this.productosDisponibles = await this.api.productos();
      console.log('Productos cargados: ', this.productosDisponibles)
    } catch(error){
      console.error("Error al cargar productos: ", error);
      alert("Error al cargar productos disponibles");
    }
  }

  //Funcion de busqueda
  buscarPedidos(event: any) {
    const termino = event.target.value.toLowerCase().trim();
    this.terminoBusqueda = termino;
    
    if (!termino) {
      this.aplicarFiltros();
      return;
    }
    
    //Palabras clave para estados
    const palabrasClave: { [key: string]: string[] } = {
      'pendiente_pesos': ['pendiente', 'pesos', 'amarillo', 'sin pesos', 'falta pesar'],
      'listo_facturar': ['listo', 'facturar', 'verde', 'completo', 'facturacion'],
      'pendiente_confirmacion': ['confirmacion', 'naranja', 'facturado', 'confirmar'],
      'completado': ['completado', 'finalizado', 'terminado', 'gris', 'entregado']
    };
    
    //Buscar por estado usando palabras clave
    let estadoBuscado: string | null = null;
    for (const [estado, palabras] of Object.entries(palabrasClave)) {
      if (palabras.some(palabra => termino.includes(palabra))) {
        estadoBuscado = estado;
        break;
      }
    }
    
    //Filtrar pedidos
    this.pedidosFiltrados = this.pedidos.filter(pedido => {
      const estado = pedido.estado || 'pendiente_pesos';
      
      //Buscar por estado
      if (estadoBuscado && estado === estadoBuscado) {
        return true;
      }
      
      //Buscar por ID/nombre del pedido
      if (pedido.nombre.toLowerCase().includes(termino)) {
        return true;
      }
      
      //Buscar por cliente
      if (pedido.cliente.toLowerCase().includes(termino)) {
        return true;
      }
      
      //Buscar por dirección
      if (pedido.direccion.toLowerCase().includes(termino)) {
        return true;
      }
      
      //Buscar por nombre del estado
      const textoEstado = this.getTextoEstado(estado).toLowerCase();
      if (textoEstado.includes(termino)) {
        return true;
      }
      
      //Buscar por productos
      const encontradoEnProductos = pedido.productos.some(prod => 
        prod.nombre.toLowerCase().includes(termino)
      );
      if (encontradoEnProductos) {
        return true;
      }
      
      //Buscar por número de pedido
      const numeroPedido = pedido.id.toString();
      if (numeroPedido.includes(termino)) {
        return true;
      }
      
      return false;
    });
  }

  //Funcion de limpiar busqueda
  limpiarBusqueda() {
    this.terminoBusqueda = '';
    this.pedidosFiltrados = [...this.pedidos];
    this.aplicarFiltros();
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
    const productoId = parseInt(event.detail.value);
    
    const yaSeleccionado = this.productosInputs.some((prod, i) => 
      i !== index && prod.id === productoId
    );
    
    if (yaSeleccionado) {
      alert('Este producto ya fue seleccionado. Por favor, elige otro.');
      this.productosInputs[index].id = 0;
      this.productosInputs[index].nombre = '';
      this.underlinesProductosNombre[index] = '#ff4d4d';
      return;
    }
    
    const productoSeleccionado = this.productosDisponibles.find(
      prod => prod.id === productoId
    );

    if(productoSeleccionado){
      this.productosInputs[index].id = productoSeleccionado.id;
      this.productosInputs[index].nombre = productoSeleccionado.nombre;
    }
    
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
    this.productosInputs.push({id: 0, nombre: '', cajas: null });
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

  async guardarPedido() {
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

    const payload = {
      direccion: this.nuevoPedido.direccion,
      fecha_entrega: new Date().toISOString().split('T')[0],
      lineas: productosValidos.map(prod => ({
        producto_id: prod.id,
        cajas: Array.from({length: prod.cajas || 0}, () => ({
          peso: 0,
          etiqueta: ''
        }))
      }))
    }

    try{
      if(this.pedidoEditandoId){
        console.log("Editando pedido con ID:", this.pedidoEditandoId);
        const res = await this.api.editarPedido(this.pedidoEditandoId, payload);
        console.log("Pedido editado exitosamente: ", res);
        
        await this.cargarPedidosDesdeBackend(); 
        
        this.nuevoPedido = { id: 0, nombre: '', cliente: '', direccion: '', productos: [] };
        this.productosInputs = [{ id: 0, nombre: '', cajas: null }];
        this.pedidoEditandoId = undefined; 
        this.indiceEditando = -1;


        this.mostrarAgregarPedido = false;
        this.underlineNombrePedido = '#cccccc';
        this.underlineCliente = '#cccccc';
        this.underlineDireccion = '#cccccc';
        this.underlinesProductosNombre = ['#cccccc'];
        this.underlinesProductosCajas = ['#cccccc'];
        this.clienteError = '';
        this.productosErrors = [''];
        
      }else{
        console.log("Enviando pedido al backend:", payload);
        const res = await this.api.crearPedido(
          payload.direccion,
          payload.fecha_entrega,
          payload.lineas
        );

        console.log("Pedido creado exitosamente: ", res );

        await this.cargarPedidosDesdeBackend();

        this.nuevoPedido = { id: 0, nombre: '', cliente: '', direccion: '', productos: [] };
        this.productosInputs = [{ id: 0, nombre: '', cajas: null }];
        this.mostrarAgregarPedido = false;
        
        this.underlineNombrePedido = '#cccccc';
        this.underlineCliente = '#cccccc';
        this.underlineDireccion = '#cccccc';
        this.underlinesProductosNombre = ['#cccccc'];
        this.underlinesProductosCajas = ['#cccccc'];
        this.clienteError = '';
        this.productosErrors = [''];
        
      }
    } catch(error) {
      console.error("Error al guardar pedido:", error);
      alert("Error al guardar el pedido");
    }
  }

  cancelarAgregar() {
    this.mostrarAgregarPedido = false;
    this.mostrarEditarPedido = false;
    this.nuevoPedido = {id: 0, nombre: '', cliente: '', direccion: '', productos: [] };
    this.productosInputs = [{id: 0,  nombre: '', cajas: null }];
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
    
    const pedidosEliminables = this.pedidos.filter(p => this.puedeEliminar(p));
    if (pedidosEliminables.length === 0) {
      alert('No hay pedidos disponibles para eliminar. Solo se pueden eliminar pedidos en estado "Pendiente de Pesos"');
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
    if (!this.puedeEliminar(pedido)) {
      alert('Este pedido no se puede eliminar porque ya tiene pesos asignados o está en proceso de facturación');
      return;
    }
    pedido.seleccionado = !pedido.seleccionado;
  }
  async eliminarPedidosSeleccionados() {
    const seleccionados = this.pedidos.filter(p => p.seleccionado);
    
    if (seleccionados.length === 0) {
      alert('Selecciona al menos un pedido para eliminar');
      return;
    }

    if (confirm(`¿Estás seguro de eliminar ${seleccionados} pedido(s)?`)) {
      const ids = seleccionados.map(pedido => pedido.id);
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
      await this.api.eliminarPedidos(ids);
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
    
    const pedidosEditables = this.pedidos.filter(p => this.puedeEditar(p));
    if (pedidosEditables.length === 0) {
      alert('No hay pedidos disponibles para editar. Solo se pueden editar pedidos en estado "Pendiente de Pesos"');
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
    if (!this.puedeEditar(pedido)) {
      alert('Este pedido no se puede editar porque ya tiene pesos asignados o está en proceso de facturación');
      return;
    }
    this.pedidos.forEach(p => {
      if (p !== pedido) p.seleccionado = false;
    });
    this.pedidosFiltrados.forEach(p => {
      if (p !== pedido) p.seleccionado = false;
    });
    pedido.seleccionado = !pedido.seleccionado;
  }

  async editarPedidoSeleccionado() {
    const pedidoSeleccionado = this.pedidos.find(p => p.seleccionado);
    
    if (!pedidoSeleccionado) {
      alert('Selecciona un pedido para editar');
      return;
    }

    this.pedidoEditandoId = pedidoSeleccionado.id;
    this.indiceEditando = this.pedidos.findIndex(p => p.seleccionado);
    this.nuevoPedido = {
      id: pedidoSeleccionado.id,
      nombre: pedidoSeleccionado.nombre,
      cliente: pedidoSeleccionado.cliente,
      direccion: pedidoSeleccionado.direccion,
      productos: []
    };

    this.productosInputs = pedidoSeleccionado.productos.map(prod => ({
      id: prod.id,
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
    
    const pedidosConPesosAsignables = this.pedidos.filter(p => this.puedeAsignarPesos(p));
    if (pedidosConPesosAsignables.length === 0) {
      alert('No hay pedidos disponibles para asignar pesos. Solo se pueden asignar pesos a pedidos en estado "Pendiente de Pesos"');
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
    if (!this.puedeAsignarPesos(pedido)) {
      alert('Este pedido no se puede modificar porque ya está en proceso de facturación');
      return;
    }
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

  async guardarPesos() {
    if (!this.pedidoParaPesos || !this.pedidoParaPesos.id){ 
      alert('No se puede guardar: Pedido sin ID');
      return;
    }

    const pedidoId = this.pedidoParaPesos.id;

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
    try{
      const productosConPesos = this.pedidoParaPesos.productos.map((prod, index) => ({
        id: prod.id,
        pesos: this.pesosTemporales[index]
      }))
      await this.api.guardarPesosPedido(pedidoId, this.pedidoParaPesos, productosConPesos);
    

      this.pedidoParaPesos.productos.forEach((prod, index) => {
        prod.pesos = this.pesosTemporales[index];
      });

      this.pedidoParaPesos.estado = 'listo_facturar';

      this.pedidos[this.indiceParaPesos] = this.pedidoParaPesos;
      this.pedidosFiltrados = [...this.pedidos];

      this.pedidoEditandoId = this.pedidoParaPesos.id

      alert('Pesos asignados correctamente');

      this.pedidoParaPesos = null;
      this.indiceParaPesos = -1;
      this.pesosTemporales = {};
      this.mostrarAsignarPesos = false;
    } catch(error) {
      console.error('Error al guardar pesos', error);
      alert('Error al guardar los pesos. Por favor, intenta nuevamente.')
    }
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
  
  getClaseEstado(pedido: Pedido): string {
    const estado = pedido.estado || 'pendiente_pesos';
    return `pedido-postit-${estado.replace(/_/g, '-')}`;
  }

  getTextoEstado(estado: string): string {
    const textos: { [key: string]: string } = {
      'pendiente_pesos': 'Pendiente de Pesos',
      'listo_facturar': 'Listo para Facturar',
      'pendiente_confirmacion': 'Pendiente de Confirmación',
      'completado': 'Completado'
    };
    return textos[estado] || 'Sin estado';
  }

  //Validaciones de estado
  puedeEditar(pedido: Pedido): boolean {
    return !pedido.estado || pedido.estado === 'pendiente_pesos';
  }

  puedeEliminar(pedido: Pedido): boolean {
    return !pedido.estado || pedido.estado === 'pendiente_pesos';
  }

  puedeAsignarPesos(pedido: Pedido): boolean {
    return !pedido.estado || pedido.estado === 'pendiente_pesos';
  }

  //Filtro por estado
  toggleMenuFiltro() {
    this.mostrarMenuFiltro = !this.mostrarMenuFiltro;
  }

  aplicarFiltroEstado(estado: string | null) {
    this.filtroEstadoActivo = estado;
    this.mostrarMenuFiltro = false;
    this.aplicarFiltros();
  }

  aplicarFiltros() {
    let pedidosFiltrados = [...this.pedidos];
    
    //Filtrar por búsqueda
    if (this.terminoBusqueda) {
      const termino = this.terminoBusqueda.toLowerCase();
      pedidosFiltrados = pedidosFiltrados.filter(pedido => {
        return pedido.nombre.toLowerCase().includes(termino) ||
              pedido.cliente.toLowerCase().includes(termino) ||
              pedido.direccion.toLowerCase().includes(termino) ||
              pedido.productos.some(prod => prod.nombre.toLowerCase().includes(termino));
      });
    }
    
    //Filtrar por estado
    if (this.filtroEstadoActivo) {
      pedidosFiltrados = pedidosFiltrados.filter(pedido => {
        const estado = pedido.estado || 'pendiente_pesos';
        return estado === this.filtroEstadoActivo;
      });
    }
    
    this.pedidosFiltrados = pedidosFiltrados;
  }

  limpiarFiltros() {
    this.filtroEstadoActivo = null;
    this.terminoBusqueda = '';
    this.mostrarMenuFiltro = false;
    this.pedidosFiltrados = [...this.pedidos];
  }

  getContadorPorEstado(estado: string): number {
    return this.pedidos.filter(p => (p.estado || 'pendiente_pesos') === estado).length;
  }

  //Enviar a Facturación

  async enviarAFacturacion(pedido: Pedido) {
    if (pedido.estado !== 'listo_facturar') {
      alert('Solo se pueden enviar a facturación pedidos con estado "Listo para Facturar"');
      return;
    }
    
    const confirmar = confirm(`¿Deseas enviar el ${pedido.nombre} a facturación?\n\nDirección: ${pedido.direccion}`);
    
    if (!confirmar) {
      return;
    }
    
    try {
      //Cambiar el estado a 'pendiente_confirmacion' o 'facturado'
      pedido.estado = 'pendiente_confirmacion';
      
      //Actualizar en el backend
      await this.api.actualizarEstadoPedido(pedido.id, pedido.estado);
      
      //Actualizar la lista localmente
      const index = this.pedidos.findIndex(p => p.id === pedido.id);
      if (index !== -1) {
        this.pedidos[index] = pedido;
      }
      
      this.pedidosFiltrados = [...this.pedidos];
      this.aplicarFiltros();
      
      alert(`${pedido.nombre} enviado a facturación exitosamente`);
      
      console.log('Pedido enviado a facturación:', pedido);
      
    } catch (error) {
      console.error('Error al enviar a facturación:', error);
      alert('Error al enviar el pedido a facturación');
    }
  }

  getProductosDisponiblesParaIndice(indice: number): any[] {
    const idsSeleccionados = this.productosInputs
      .map((prod, i) => i !== indice ? prod.id : null)
      .filter(id => id !== null && id !== 0);
    return this.productosDisponibles.filter(
      prod => !idsSeleccionados.includes(prod.id)
    );
  }
} 