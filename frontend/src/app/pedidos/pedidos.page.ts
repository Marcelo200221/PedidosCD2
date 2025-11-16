import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonButton, IonSearchbar, IonFab, IonFabList, IonFabButton, IonList, IonItem, IonLabel, IonIcon, IonInput, 
  IonCheckbox, IonSelect, IonSelectOption, IonSpinner} from '@ionic/angular/standalone';
import { ApiService } from '../services/api.spec';
import { addIcons } from 'ionicons';
import { Router } from '@angular/router';
import { pieChart, statsChart, refresh, hourglassOutline, checkmarkCircleOutline, timeOutline, checkmarkDoneOutline, 
  chevronUpCircle, pencil, addCircle, removeCircle, filter, menu, close, trashBin, checkmarkCircle, search,
  documentText, cube, calculator, scale, eye, closeCircle, send, logOut, barChart, people, personAdd, arrowUndo, 
  bag, person, trophy, ellipsisVertical, swapVertical, calendar, funnel, apps, podium, checkmarkDone} from 'ionicons/icons';
import { Perimisos } from '../services/perimisos';
import { NotificacionService } from '../services/notificacion.service';
import { AlertController } from '@ionic/angular';

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
  clienteId?: string;
  direccion: string;
  productos: Producto[];
  seleccionado?: boolean;
  estado?: 'pendiente_pesos' | 'listo_facturar' | 'pendiente_confirmacion' | 'completado';
}

//Iconos
addIcons({ 
 pieChart, statsChart, refresh, hourglassOutline, checkmarkCircleOutline, timeOutline, checkmarkDoneOutline, 
  chevronUpCircle, pencil, addCircle, removeCircle, filter, menu, close, trashBin, checkmarkCircle, search,
  documentText, cube, calculator, scale, eye, closeCircle, send, logOut, barChart, people, personAdd, arrowUndo, 
  bag, person, trophy, ellipsisVertical, swapVertical, calendar, funnel, apps, podium, checkmarkDone
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
    IonList, IonItem, IonIcon, IonInput, IonCheckbox, IonSelect, IonSelectOption, IonSpinner
  ]
})
export class PedidosPage implements OnInit {

  //Definición de variables 
  //Arrays de datos principales
  pedidos: Pedido[] = [];
  pedidosFiltrados: Pedido[] = [];
  productosInputs: Producto[] = [{ id: 0,nombre: '', cajas: null }];
  clientesDisponibles: any[] = [];

  //Variables del menú
  menuAbierto: boolean = false;
  nombreUsuario: string = '';
  apellidoUsuario: string = '';

  puedeIr = false;

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

  constructor(private api: ApiService, private router: Router, private permisos: Perimisos, private notificaciones: NotificacionService,
              private alertController: AlertController) { }

async ngOnInit() {
  this.puedeIr = await this.permisos.checkPermission('view_usuarios')
  this.pedidosFiltrados = [...this.pedidos];
  await this.cargarProductosDisponibles();
  await this.cargarClientesDisponibles(); // AGREGAR ESTA LÍNEA
  await this.cargarPedidosDesdeBackend();
  this.cargarDatosUsuario();
  // Disparar chequeo de avisos solo al entrar a pedidos
  this.notificaciones.start();
}

async cargarClientesDisponibles() {
  try {
    this.clientesDisponibles = await this.api.listarClientes();
    console.log('Clientes cargados: ', this.clientesDisponibles);
  } catch(error) {
    console.error("Error al cargar clientes: ", error);
    await this.notificaciones.showError("Error al cargar clientes disponibles");
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

  ngOnDestroy() {
    this.menuAbierto = false;
    this.notificaciones.stop();
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

  IrAPerfil(){
    this.cerrarMenu();
    this.router.navigate(['/perfil']);
  }

  IrAUsuarios(){
    this.cerrarMenu();
    this.router.navigate(['/usuarios']);
  }

  IrClientes() {
    this.cerrarMenu();
    this.router.navigate(['/clientes']);
  }

  IrListarClientes() {
    this.cerrarMenu();
    this.router.navigate(['/lista-clientes']);
  }

  IraProductos(){
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
      this.api.logout();
      this.cerrarMenu();
    }
  }
  
  async cargarPedidosDesdeBackend(){
    try{
      const pedidosBackend = await this.api.listarPedidos();
      console.log('Pedidos cargados desde backend:', pedidosBackend);

      this.pedidos = pedidosBackend.map((pedido: any) => this.mapearPedidoBackend(pedido));
      
      //Orden
      this.pedidos = this.ordenarPedidosPorEstado(this.pedidos);
      
      this.pedidosFiltrados = [...this.pedidos];

      console.log('Pedidos transformados y ordenados:', this.pedidos);
    } catch(error) {
      console.error('Error al cargar pedidos:', error);
      await this.notificaciones.showError('Error al cargar los pedidos');
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
      cliente: (pedidosBackend.cliente && (pedidosBackend.cliente.nombre || pedidosBackend.cliente.razon_social)) || 'Cliente por defecto',
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
      await this.notificaciones.showError('Error al cargar productos disponibles');
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
    const clienteId = event.detail.value;
    const clienteSeleccionado = this.clientesDisponibles.find(
      cliente => cliente.id_cliente === clienteId || cliente.id === clienteId
    );
    
    if (clienteSeleccionado) {
      //Asignar datos del cliente
      this.nuevoPedido.cliente = clienteSeleccionado.nombre || clienteSeleccionado.razon_social || '';
      this.nuevoPedido.clienteId = clienteSeleccionado.id_cliente || clienteSeleccionado.id;
      
      //Autocompletar dirección
      this.nuevoPedido.direccion = clienteSeleccionado.direccion || '';
      
      //Actualizar estilos
      this.underlineCliente = '#28a745';
      this.underlineDireccion = this.nuevoPedido.direccion.length > 0 ? '#28a745' : '#cccccc';
      this.clienteError = '';
      
      console.log('Cliente seleccionado:', clienteSeleccionado);
    } else {
      this.underlineCliente = '#cccccc';
      this.clienteError = '';
    }
  }

  //Validacion: Direccion
  actualizarDireccion(event: any) {
    const direccionSeleccionada = event.detail.value;
    const clienteEncontrado = this.clientesDisponibles.find(
      cliente => cliente.direccion === direccionSeleccionada
    );
    
    if (clienteEncontrado) {
      //Asignar datos del cliente encontrado
      this.nuevoPedido.cliente = clienteEncontrado.nombre || clienteEncontrado.razon_social || '';
      this.nuevoPedido.clienteId = clienteEncontrado.id_cliente || clienteEncontrado.id;
      this.nuevoPedido.direccion = direccionSeleccionada;
      
      //Actualizar estilos
      this.underlineCliente = '#28a745';
      this.underlineDireccion = '#28a745';
      this.clienteError = '';
      
      console.log('Cliente encontrado por dirección:', clienteEncontrado);
    } else {
      //Si no se encuentra cliente, solo actualizar dirección
      this.nuevoPedido.direccion = direccionSeleccionada;
      this.underlineDireccion = direccionSeleccionada.length > 0 ? '#28a745' : '#cccccc';
    }
  }

  //Validacion: Producto
  actualizarNombreProducto(event: any, index: number) {
    const productoId = parseInt(event.detail.value);
    
    const yaSeleccionado = this.productosInputs.some((prod, i) => 
      i !== index && prod.id === productoId
    );
    
    if (yaSeleccionado) {
      this.notificaciones.showWarning('Este producto ya fue seleccionado. Por favor, elige otro.');
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
      this.notificaciones.showWarning('Debe haber al menos un producto');
    }
  }

  async guardarPedido() {
    if (!this.nuevoPedido.nombre.trim()) {
      await this.notificaciones.showWarning('Ingresa el nombre del pedido');
      return;
    }
    
    if (!this.nuevoPedido.cliente || this.nuevoPedido.cliente.trim().length < 3) {
      await this.notificaciones.showWarning('Selecciona un cliente válido'); 
      return;
    }

    if (!this.nuevoPedido.direccion.trim()) {
      await this.notificaciones.showWarning('La dirección de envío es requerida'); 
      return;
    }

    const productosValidos = this.productosInputs.filter(prod => {
      const cajasNumber = Number(prod.cajas);
      return prod.nombre && prod.nombre !== '' && cajasNumber >= 1 && !isNaN(cajasNumber);
    });

    if (productosValidos.length === 0) {
      await this.notificaciones.showWarning('Agrega al menos un producto válido'); 
      return;
    }

    const payload = {
      cliente: this.nuevoPedido.cliente,
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
        await this.notificaciones.showSuccess('Pedido editado correctamente');
        
      }else{
        console.log("Enviando pedido al backend:", payload);
        const res = await this.api.crearPedido(
          payload.cliente,
          payload.direccion,
          payload.fecha_entrega,
          payload.lineas
        );

        await this.notificaciones.showSuccess('Pedido creado con éxito');

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
      await this.notificaciones.showError("Error al guardar el pedido");
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
    this.pedidosFiltrados = [...this.pedidos];
    this.aplicarFiltros();
  }

  //Modo: Eliminar pedido
  activarModoEliminar() {
    const pedidosActivos = this.pedidos.filter(p => p.estado !== 'completado');

    if (pedidosActivos.length === 0) {
      this.notificaciones.showInfo('No hay pedidos activos para eliminar');
      return;
    }
    
    const pedidosEliminables = pedidosActivos.filter(p => this.puedeEliminar(p));
    if (pedidosEliminables.length === 0) {
      this.notificaciones.showWarning('No hay pedidos disponibles para eliminar');
      return;
    }
        
    this.mostrarEliminarPedido = true;
    this.mostrarEditarPedido = false;
    this.mostrarAgregarPedido = false;
    this.mostrarAsignarPesos = false;
    this.pedidoParaPesos = null;
    this.pedidos.forEach(pedido => pedido.seleccionado = false);
    this.pedidosFiltrados.forEach(pedido => pedido.seleccionado = false);
    this.pedidosFiltrados = pedidosActivos;
  }

  cancelarModoEliminar() {
    this.mostrarEliminarPedido = false;
    this.pedidos.forEach(pedido => pedido.seleccionado = false);
    this.pedidosFiltrados.forEach(pedido => pedido.seleccionado = false);
    this.pedidosFiltrados = [...this.pedidos];
    this.aplicarFiltros();
  }

  toggleSeleccionPedido(pedido: Pedido) {
    if (!this.puedeEliminar(pedido)) {
      this.notificaciones.showWarning('Este pedido no se puede eliminar');
      return;
    }
    pedido.seleccionado = !pedido.seleccionado;
  }

  async eliminarPedidosSeleccionados() {
    const seleccionados = this.pedidos.filter(p => p.seleccionado);
    
    if (seleccionados.length === 0) {
      await this.notificaciones.showWarning('Selecciona al menos un pedido para eliminar');
      return;
    }

    const confirmar = await this.notificaciones.showConfirm(
      `Se eliminarán ${seleccionados.length} pedido(s) de forma permanente.`,
      '¿Confirmar eliminación?',
      'Sí, eliminar',
      'Cancelar'
    );

    if (confirmar) {
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
      await this.notificaciones.showSuccess(`${seleccionados.length} pedido(s) eliminado(s)`);
    }
  }

  get pedidosSeleccionados(): number {
    return this.pedidos.filter(p => p.seleccionado).length;
  }

  //Modo: Editar pedido
  activarModoEditar() {
  const pedidosActivos = this.pedidos.filter(p => p.estado == 'pendiente_pesos');
  
  if (pedidosActivos.length === 0) {
    this.notificaciones.showInfo('No hay pedidos activos para editar');
    return;
  }
  
  const pedidosEditables = pedidosActivos.filter(p => this.puedeEditar(p));
  if (pedidosEditables.length === 0) {
    this.notificaciones.showWarning('No hay pedidos disponibles para editar');
    return;
  }
    
    this.mostrarEditarPedido = true;
    this.mostrarEliminarPedido = false;
    this.mostrarAgregarPedido = false;
    this.mostrarAsignarPesos = false; 
    this.pedidoParaPesos = null; 
    this.pedidos.forEach(pedido => pedido.seleccionado = false);
    this.pedidosFiltrados.forEach(pedido => pedido.seleccionado = false);
    this.pedidosFiltrados = pedidosActivos;
  }


  cancelarModoEditar() {
    this.mostrarEditarPedido = false;
    this.pedidos.forEach(pedido => pedido.seleccionado = false);
    this.pedidosFiltrados.forEach(pedido => pedido.seleccionado = false);
    this.pedidosFiltrados = [...this.pedidos];
    this.aplicarFiltros();
  }


  toggleSeleccionPedidoEditar(pedido: Pedido) {
    if (!this.puedeEditar(pedido)) {
      this.notificaciones.showWarning('Este pedido no se puede editar');
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
      await this.notificaciones.showWarning('Selecciona un pedido para Editar');
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
  const pedidosActivos = this.pedidos.filter(p => p.estado == 'pendiente_pesos');
    
    if (pedidosActivos.length === 0) {
      this.notificaciones.showInfo('No hay pedidos activos para asignar pesos');
      return;
    }
    
    const pedidosConPesosAsignables = pedidosActivos.filter(p => this.puedeAsignarPesos(p));
    if (pedidosConPesosAsignables.length === 0) {
      this.notificaciones.showWarning('No hay pedidos disponibles para asignar pesos');
      return;
    }
    
    this.mostrarAsignarPesos = true;
    this.mostrarEditarPedido = false;
    this.mostrarEliminarPedido = false;
    this.mostrarAgregarPedido = false;
    this.pedidos.forEach(pedido => pedido.seleccionado = false);
    this.pedidosFiltrados.forEach(pedido => pedido.seleccionado = false);
    this.pedidosFiltrados = pedidosActivos;
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
    this.pedidosFiltrados = [...this.pedidos];
    this.aplicarFiltros();
  }

  toggleSeleccionPedidoPesos(pedido: Pedido) {
    if (!this.puedeAsignarPesos(pedido)) {
      this.notificaciones.showWarning('Este pedido no se puede modificar');
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
      this.notificaciones.showWarning('Selecciona un pedido para asignar pesos'); 
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
      await this.notificaciones.showError('No se puede guardar: Pedido sin ID');
      return;
    }

    const pedidoId = this.pedidoParaPesos.id;

    for (let i = 0; i < this.pedidoParaPesos.productos.length; i++) {
      const pesos = this.pesosTemporales[i];
      const numCajas = this.pedidoParaPesos.productos[i].cajas || 0;
      
      if (!pesos || pesos.length !== numCajas) {
        await this.notificaciones.showWarning(`Complete los pesos de ${this.pedidoParaPesos.productos[i].nombre}`); 
        return;
      }

      for (let j = 0; j < pesos.length; j++) {
        if (pesos[j] === null || pesos[j] <= 0) {
          await this.notificaciones.showWarning(`Peso inválido en caja ${j + 1} de ${this.pedidoParaPesos.productos[i].nombre}`);
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

      await this.notificaciones.showSuccess('Pesos asignados correctamente');

      this.pedidoParaPesos = null;
      this.indiceParaPesos = -1;
      this.pesosTemporales = {};
      this.mostrarAsignarPesos = false;
    } catch(error) {
      console.error('Error al guardar pesos', error);
      await this.notificaciones.showError('Error al guardar los pesos');
    }
  }

  cancelarAsignacionPesos() {
    this.pedidoParaPesos = null;
    this.indiceParaPesos = -1;
    this.pesosTemporales = {};
    this.underlinesPesos = {};
    this.pesosErrors = {};
    this.mostrarAsignarPesos = false;
    this.pedidosFiltrados = [...this.pedidos];
    this.aplicarFiltros();
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
    // Solo se pueden editar pedidos en estado 'pendiente_pesos'
    return !pedido.estado || pedido.estado === 'pendiente_pesos';
  }

  puedeEliminar(pedido: Pedido): boolean {
    // Se pueden eliminar pedidos en 'pendiente_pesos' y 'pendiente_confirmacion'
    return !pedido.estado || 
          pedido.estado === 'pendiente_pesos' || 
          pedido.estado === 'pendiente_confirmacion' ||
          pedido.estado === 'listo_facturar';
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
      await this.notificaciones.showWarning('Solo pedidos listos para facturar');
      return;
    }
    
    const confirmar = await this.notificaciones.showConfirm(
      `Dirección: ${pedido.direccion}`,
      `¿Deseas enviar el ${pedido.nombre} a facturación?`,
      'Sí, enviar',
      'Cancelar'
    );
    
    if (!confirmar) {
      return;
    }
    
    try {
      pedido.estado = 'pendiente_confirmacion';
      await this.api.actualizarEstadoPedido(pedido.id, pedido.estado);
      
      const index = this.pedidos.findIndex(p => p.id === pedido.id);
      if (index !== -1) {
        this.pedidos[index] = pedido;
      }
      
      this.pedidosFiltrados = [...this.pedidos];
      this.aplicarFiltros();
      
      await this.notificaciones.showSuccess(`${pedido.nombre} enviado a facturación`);
      
      console.log('Pedido enviado a facturación:', pedido);
      
    } catch (error) {
      console.error('Error al enviar a facturación:', error);
      await this.notificaciones.showError('Error al enviar a facturación');
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
  // Función de ordenamiento por estado
ordenarPedidosPorEstado(pedidos: Pedido[]): Pedido[] {
  const ordenEstados = {
    'pendiente_pesos': 1,
    'listo_facturar': 2,
    'pendiente_confirmacion': 3,
    'completado': 4
  };
  
  return pedidos.sort((a, b) => {
    const estadoA = a.estado || 'pendiente_pesos';
    const estadoB = b.estado || 'pendiente_pesos';
    
    const prioridadA = ordenEstados[estadoA] || 999;
    const prioridadB = ordenEstados[estadoB] || 999;
    
    // Si tienen el mismo estado, ordenar por ID descendente (más reciente primero)
    if (prioridadA === prioridadB) {
      return b.id - a.id;
    }
    
    return prioridadA - prioridadB;
  });
}

async ionViewWillEnter() {
  await this.cargarPedidosDesdeBackend();
  this.aplicarFiltros();
   this.puedeIr = await this.permisos.checkPermission('view_usuarios')
  this.pedidosFiltrados = [...this.pedidos];
  await this.cargarProductosDisponibles();
  await this.cargarClientesDisponibles(); 
  await this.cargarPedidosDesdeBackend();
  this.cargarDatosUsuario();
}

} 
