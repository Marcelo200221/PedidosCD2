import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardHeader, 
  IonCardTitle, IonCardContent, IonGrid, IonRow, IonCol, IonButton, IonIcon,
  IonSpinner} from '@ionic/angular/standalone';
import { ApiService } from '../services/api.spec';
import { addIcons } from 'ionicons';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { pieChart, statsChart, refresh, hourglassOutline, checkmarkCircleOutline, timeOutline, checkmarkDoneOutline, 
  chevronUpCircle, pencil, addCircle, removeCircle, filter, menu, close, trashBin, checkmarkCircle, search,
  documentText, cube, calculator, scale, eye, closeCircle, send, logOut, barChart, people, personAdd, arrowUndo, 
  bag, person, trophy, ellipsisVertical, swapVertical, calendar, funnel, apps, podium } from 'ionicons/icons';
import { NotificacionService } from '../services/notificacion.service';

interface EstadisticaPedidos {
  estado: string;
  cantidad: number;
  porcentaje: number;
  color: string;
}

interface ProductoVendido {
  nombre: string;
  cantidad: number;
  porcentaje: number;
  color: string;
}

interface ClientePedidos {
  nombre: string;
  cantidad: number;
  porcentaje: number;
  color: string;
}

addIcons({ 
  pieChart, barChart, statsChart, refresh,
  'hourglass-outline': hourglassOutline,
  'checkmark-circle-outline': checkmarkCircleOutline,
  'time-outline': timeOutline,
  'checkmark-done-outline': checkmarkDoneOutline, chevronUpCircle, menu, pencil, removeCircle, addCircle, filter, close, 
  trashBin, checkmarkCircle, search, documentText, cube, calculator, scale, eye, send, closeCircle,
  logOut, people, personAdd, arrowUndo, bag, person, trophy, ellipsisVertical, swapVertical,
  calendar, funnel, apps, podium 
});

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent, IonCard, IonCardHeader,
    IonCardTitle, IonCardContent, IonIcon,
    IonSpinner
  ]
})
export class DashboardPage implements OnInit {

  //Grafico de pedidos
  estadisticas: EstadisticaPedidos[] = [];
  totalPedidos: number = 0;

  //Grafico de ventas
  productosVendidos: ProductoVendido[] = [];
  maxCantidadProducto: number = 0;

  //Grafico de clientes
  clientesPedidos: ClientePedidos[] = [];
  maxCantidadCliente: number = 0;

  cargando: boolean = true;

  //Variables del menú
  menuAbierto: boolean = false;
  nombreUsuario: string = '';
  apellidoUsuario: string = '';

  //Variables para el selector de dashboard
  menuDashboardAbierto: boolean = false;
  tipoDashboard: 'pedidos' | 'ventas' | 'clientes' | 'completo' = 'completo';

  //Variables del filtro de fechas
  filtroFechaInicio: string = '';
  filtroFechaFin: string = '';
  mostrarFiltroFechas: boolean = false;
  filtroActivo: boolean = false;

  //Colores para cada estado
  coloresEstados: { [key: string]: string } = {
    'pendiente_pesos': '#ffd93d',
    'listo_facturar': '#1976d2',
    'pendiente_confirmacion': '#f57c00',
    'completado': '#388e3c'
  };

  nombresEstados: { [key: string]: string } = {
    'pendiente_pesos': 'Pendiente de Pesos',
    'listo_facturar': 'Pendiente de Confirmación',
    'pendiente_confirmacion': 'Listo para Facturar',
    'completado': 'Completado'
  };

  constructor(private api: ApiService, private router: Router, private http: HttpClient, private notificaciones: NotificacionService) {}

  async ngOnInit() {
    //Solo cargar datos del usuario una vez
    this.notificaciones.start();
    await this.cargarDatosUsuario();
  }

  //Metodo para recargar cada vez que se entre a la pagina
  async ionViewWillEnter() {
    this.cargando = true;
    
    //Cargar todos los dashboards en paralelo
    try {
      await Promise.all([
        this.cargarEstadisticas(),
        this.cargarProductosMasVendidos(),
        this.cargarClientesConMasPedidos()
      ]);
    } catch (error) {
      console.error('Error cargando dashboards:', error);
    } finally {
      this.cargando = false;
    }
  }

  async cargarDatosUsuario() {
    const usuario = await this.api.getUsuarioActual();
    if (usuario) {
      this.nombreUsuario = usuario.nombre;
      this.apellidoUsuario = usuario.apellido;
      console.log('Usuario cargado:', usuario); 
    } else {
      console.warn('No hay usuario en IndexedDB, redirigiendo al login');
      this.router.navigate(['/login']);
    }
  }

  //Metodo Cargar productos más vendidos
  async cargarProductosMasVendidos() {
    try {
      console.log('Cargando productos más vendidos...');
      
      const pedidos = await this.api.listarPedidos();
      const pedidosCompletados = pedidos.filter((pedido: any) => pedido.estado === 'completado');
      const colores = ['#4CAF50', '#2196F3', '#FF9800', '#E91E63', '#9C27B0', '#00BCD4'];
      
      if (pedidosCompletados.length === 0) {
        console.log('No hay productos vendidos en pedidos completados');
        this.productosVendidos = [];
        this.maxCantidadProducto = 0;
        return;
      }
      
      //Contar productos por cantidad de cajas
      const conteoProductos: { [key: string]: { nombre: string, cantidad: number } } = {};

      pedidosCompletados.forEach((pedido: any) => {
        if (pedido.lineas && pedido.lineas.length > 0) {
          pedido.lineas.forEach((linea: any) => {
            const productoNombre = linea.producto.nombre;
            const productoId = linea.producto.id;
            
            if (!conteoProductos[productoId]) {
              conteoProductos[productoId] = {
                nombre: productoNombre,
                cantidad: 0
              };
            }
            conteoProductos[productoId].cantidad += linea.cantidad_cajas || 0;
          });
        }
      });

      // Convertir a array y ordenar
      const productosArray = Object.values(conteoProductos)
        .sort((a, b) => b.cantidad - a.cantidad);
      
      if (productosArray.length === 0) {
        this.productosVendidos = [];
        this.maxCantidadProducto = 0;
        return;
      }
      
      //Calcular el total de cajas vendidas
      const totalCajas = productosArray.reduce((sum, prod) => sum + prod.cantidad, 0);
      this.maxCantidadProducto = Math.max(...productosArray.map(p => p.cantidad));
      
      // Mapear los productos (máximo 6 para el gráfico)
      this.productosVendidos = productosArray.slice(0, 6).map((producto, index: number) => ({
        nombre: producto.nombre,
        cantidad: producto.cantidad,
        porcentaje: totalCajas > 0 ? Math.round((producto.cantidad / totalCajas) * 100) : 0,
        color: colores[index % colores.length]
      }));
      
      console.log('Productos más vendidos procesados:', this.productosVendidos);
      console.log('Total de cajas vendidas:', totalCajas);
      
    } catch (error) {
      console.error('Error cargando productos más vendidos:', error);
      this.productosVendidos = [];
      this.maxCantidadProducto = 0;
    }
  }

  //Metodo Cargar clientes con más pedidos
  async cargarClientesConMasPedidos() {
    try {
      console.log('Cargando clientes con más pedidos...');
      
      // Obtener todos los pedidos
      const pedidos = await this.api.listarPedidos();
      
      // Filtrar solo pedidos completados
      const pedidosCompletados = pedidos.filter((pedido: any) => pedido.estado === 'completado');
      
      console.log(`Pedidos completados: ${pedidosCompletados.length} de ${pedidos.length}`);
      
      //Colores para las barras
      const colores = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F'];
      
      if (pedidosCompletados.length === 0) {
        console.log('No hay pedidos completados todavía');
        this.clientesPedidos = [];
        this.maxCantidadCliente = 0;
        return;
      }
      
      //Contar pedidos por cliente
      const conteoClientes: { [key: string]: { nombre: string, cantidad: number } } = {};

      pedidosCompletados.forEach((pedido: any) => {
        const clienteNombre = pedido.cliente_nombre 
          || pedido.nombre_cliente 
          || (pedido.cliente && pedido.cliente.nombre)
          || pedido.cliente
          || 'Cliente sin nombre';
        
        if (!conteoClientes[clienteNombre]) {
          conteoClientes[clienteNombre] = {
            nombre: clienteNombre,
            cantidad: 0
          };
        }
        conteoClientes[clienteNombre].cantidad++;
      });

      //Convertir a array y ordenar
      const clientesArray = Object.values(conteoClientes)
        .sort((a, b) => b.cantidad - a.cantidad);
      
      if (clientesArray.length === 0) {
        this.clientesPedidos = [];
        this.maxCantidadCliente = 0;
        return;
      }
      
      //Calcular el total de pedidos
      const totalPedidos = clientesArray.reduce((sum, cliente) => sum + cliente.cantidad, 0);
      this.maxCantidadCliente = Math.max(...clientesArray.map(c => c.cantidad));
      
      //Mapear los clientes (máximo 6 para el gráfico)
      this.clientesPedidos = clientesArray.slice(0, 6).map((cliente, index: number) => ({
        nombre: cliente.nombre,
        cantidad: cliente.cantidad,
        porcentaje: totalPedidos > 0 ? Math.round((cliente.cantidad / totalPedidos) * 100) : 0,
        color: colores[index % colores.length]
      }));
      
      console.log('Clientes procesados para gráfico:', this.clientesPedidos);
      console.log('Total de pedidos:', totalPedidos);
      console.log('Máxima cantidad:', this.maxCantidadCliente);
      
    } catch (error) {
      console.error('Error cargando clientes con más pedidos:', error);
      this.clientesPedidos = [];
      this.maxCantidadCliente = 0;
    }
  }

 async cargarEstadisticas() {
    try {
      const pedidos = await this.api.listarPedidos();
      
      //Contar pedidos por estado
      const conteoEstados: { [key: string]: number } = {
        'pendiente_pesos': 0,
        'listo_facturar': 0,
        'pendiente_confirmacion': 0,
        'completado': 0
      };

      pedidos.forEach((pedido: any) => {
        const estado = pedido.estado || 'pendiente_pesos';
        conteoEstados[estado]++;
      });

      this.totalPedidos = pedidos.length;

      //Crear array de estadísticas - SIEMPRE mostrar todos los estados
      this.estadisticas = Object.keys(conteoEstados)
        .map(estado => ({
          estado: this.nombresEstados[estado],
          cantidad: conteoEstados[estado],
          porcentaje: this.totalPedidos > 0 
            ? Math.round((conteoEstados[estado] / this.totalPedidos) * 100) 
            : 0,
          color: this.coloresEstados[estado]
        }));

      console.log('Estadísticas cargadas:', this.estadisticas);
      
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
    }
  }

  async refrescarDatos() {
    if (this.filtroActivo) {
      await this.refrescarDatosConFiltro();
    } else {
      await Promise.all([
        this.cargarEstadisticas(),
        this.cargarProductosMasVendidos(),
        this.cargarClientesConMasPedidos()
      ]);
    }
  }

  toggleFiltroFechas() {
    this.mostrarFiltroFechas = !this.mostrarFiltroFechas;
  }

  cerrarFiltroFechas() {
    this.mostrarFiltroFechas = false;
  }

  async aplicarFiltro() {
    if (!this.filtroFechaInicio || !this.filtroFechaFin) {
      await this.notificaciones.showWarning('Por favor selecciona ambas fechas');
      return;
    }

    const inicio = new Date(this.filtroFechaInicio);
    const fin = new Date(this.filtroFechaFin);

    if (inicio > fin) {
      await this.notificaciones.showWarning('La fecha de inicio no puede ser mayor que la fecha de fin');
      return;
    }

    this.filtroActivo = true;
    this.cerrarFiltroFechas();
    
    console.log('Aplicando filtro de fechas:', {
      inicio: this.filtroFechaInicio,
      fin: this.filtroFechaFin
    });

    //Recargar todas las estadísticas con el filtro aplicado
    this.refrescarDatosConFiltro();
  }

  limpiarFiltro() {
    this.filtroFechaInicio = '';
    this.filtroFechaFin = '';
    this.filtroActivo = false;
    this.cerrarFiltroFechas();
    
    console.log('Limpiando filtro de fechas');

    //Recargar todas las estadísticas sin filtro
    this.refrescarDatos();
  }

  formatearFecha(fecha: string): string {
    if (!fecha) return '';
    const date = new Date(fecha + 'T00:00:00');
    return date.toLocaleDateString('es-ES', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    });
  }

  async refrescarDatosConFiltro() {
    this.cargando = true;
    try {
      await Promise.all([
        this.cargarEstadisticasConFiltro(),
        this.cargarProductosMasVendidosConFiltro(),
        this.cargarClientesConMasPedidosConFiltro()
      ]);
    } catch (error) {
      console.error('Error al refrescar datos con filtro:', error);
    } finally {
      this.cargando = false;
    }
  }

  async cargarEstadisticasConFiltro() {
    try {
      const pedidos = await this.api.listarPedidos();
      
      console.log('Filtro aplicado:', {
        fechaInicio: this.filtroFechaInicio,
        fechaFin: this.filtroFechaFin,
        totalPedidos: pedidos.length
      });
      
      //Filtrar pedidos por rango de fechas
      const pedidosFiltrados = pedidos.filter((pedido: any) => {
        const fechaPedido = new Date(pedido.fecha_entrega + 'T00:00:00');
        const fechaInicio = new Date(this.filtroFechaInicio + 'T00:00:00');
        const fechaFin = new Date(this.filtroFechaFin + 'T23:59:59');
        return fechaPedido >= fechaInicio && fechaPedido <= fechaFin;
      });

      console.log(`Pedidos filtrados: ${pedidosFiltrados.length} de ${pedidos.length}`);

      //Contar pedidos por estado
      const conteoEstados: { [key: string]: number } = {
        'pendiente_pesos': 0,
        'listo_facturar': 0,
        'pendiente_confirmacion': 0,
        'completado': 0
      };

      pedidosFiltrados.forEach((pedido: any) => {
        const estado = pedido.estado || 'pendiente_pesos';
        conteoEstados[estado]++;
      });

      this.totalPedidos = pedidosFiltrados.length;

      this.estadisticas = Object.keys(conteoEstados)
        .map(estado => ({
          estado: this.nombresEstados[estado],
          cantidad: conteoEstados[estado],
          porcentaje: this.totalPedidos > 0 
            ? Math.round((conteoEstados[estado] / this.totalPedidos) * 100) 
            : 0,
          color: this.coloresEstados[estado]
        }))
        .filter(stat => stat.cantidad > 0);

      //Si solo hay un estado setear a 100%
      if (this.estadisticas.length === 1) {
        this.estadisticas[0].porcentaje = 100;
      }

      console.log('Estadísticas filtradas:', this.estadisticas);

    } catch (error) {
      console.error('Error al cargar estadísticas con filtro:', error);
    }
  }

  async cargarProductosMasVendidosConFiltro() {
    try {
      console.log('Cargando productos más vendidos con filtro...');
      const pedidos = await this.api.listarPedidos();
      
      console.log('Filtro aplicado:', {
        fechaInicio: this.filtroFechaInicio,
        fechaFin: this.filtroFechaFin
      });
      
      //Filtrar pedidos por rango de fechas y estado completado
      const pedidosFiltrados = pedidos.filter((pedido: any) => {
        const fechaPedido = new Date(pedido.fecha_entrega + 'T00:00:00');
        const fechaInicio = new Date(this.filtroFechaInicio + 'T00:00:00');
        const fechaFin = new Date(this.filtroFechaFin + 'T23:59:59');
        const enRango = fechaPedido >= fechaInicio && fechaPedido <= fechaFin;
        const completado = pedido.estado === 'completado';
        
        console.log('Pedido:', {
          fecha: pedido.fecha_entrega,
          estado: pedido.estado,
          enRango,
          completado
        });
        
        return enRango && completado;
      });

      console.log(`Pedidos completados filtrados: ${pedidosFiltrados.length} de ${pedidos.length}`);

      //Contar productos por cantidad de cajas
      const conteoProductos: { [key: string]: { nombre: string, cantidad: number } } = {};

      pedidosFiltrados.forEach((pedido: any) => {
        if (pedido.lineas && pedido.lineas.length > 0) {
          pedido.lineas.forEach((linea: any) => {
            const productoNombre = linea.producto.nombre;
            const productoId = linea.producto.id;
            
            if (!conteoProductos[productoId]) {
              conteoProductos[productoId] = {
                nombre: productoNombre,
                cantidad: 0
              };
            }
            conteoProductos[productoId].cantidad += linea.cantidad_cajas || 0;
          });
        }
      });

      //Convertir a array y ordenar
      const productosArray = Object.values(conteoProductos)
        .sort((a, b) => b.cantidad - a.cantidad);

      const colores = ['#4CAF50', '#2196F3', '#FF9800', '#E91E63', '#9C27B0', '#00BCD4'];

      if (productosArray.length === 0) {
        console.log('No hay productos en el rango de fechas seleccionado');
        this.productosVendidos = [];
        this.maxCantidadProducto = 0;
        return;
      }

      const totalCajas = productosArray.reduce((sum, prod) => sum + prod.cantidad, 0);
      this.maxCantidadProducto = Math.max(...productosArray.map(p => p.cantidad));

      this.productosVendidos = productosArray.slice(0, 6).map((producto, index) => ({
        nombre: producto.nombre,
        cantidad: producto.cantidad,
        porcentaje: totalCajas > 0 ? Math.round((producto.cantidad / totalCajas) * 100) : 0,
        color: colores[index % colores.length]
      }));

      console.log('Productos procesados:', this.productosVendidos);

    } catch (error) {
      console.error('Error cargando productos con filtro:', error);
      this.productosVendidos = [];
      this.maxCantidadProducto = 0;
    }
  }

  async cargarClientesConMasPedidosConFiltro() {
    try {
      console.log('Cargando clientes con más pedidos con filtro...');
      const pedidos = await this.api.listarPedidos();
      
      if (pedidos.length > 0) {
        console.log('Estructura del primer pedido:', pedidos[0]);
        console.log('Cliente del primer pedido:', {
          cliente_nombre: pedidos[0].cliente_nombre,
          cliente: pedidos[0].cliente,
          nombre_cliente: pedidos[0].nombre_cliente
        });
      }
      
      //Filtrar pedidos por rango de fechas y estado completado
      const pedidosFiltrados = pedidos.filter((pedido: any) => {
        const fechaPedido = new Date(pedido.fecha_entrega + 'T00:00:00');
        const fechaInicio = new Date(this.filtroFechaInicio + 'T00:00:00');
        const fechaFin = new Date(this.filtroFechaFin + 'T23:59:59');
        const enRango = fechaPedido >= fechaInicio && fechaPedido <= fechaFin;
        const completado = pedido.estado === 'completado';
        return enRango && completado;
      });

      console.log(`Pedidos completados filtrados: ${pedidosFiltrados.length}`);

      //Contar pedidos por cliente
      const conteoClientes: { [key: string]: { nombre: string, cantidad: number } } = {};

      pedidosFiltrados.forEach((pedido: any) => {
        const clienteNombre = pedido.cliente_nombre 
          || pedido.nombre_cliente 
          || (pedido.cliente && pedido.cliente.nombre)
          || pedido.cliente
          || 'Cliente sin nombre';
        
        console.log('Nombre del cliente extraído:', clienteNombre, 'del pedido:', pedido);
        
        if (!conteoClientes[clienteNombre]) {
          conteoClientes[clienteNombre] = {
            nombre: clienteNombre,
            cantidad: 0
          };
        }
        conteoClientes[clienteNombre].cantidad++;
      });

      //Convertir a array y ordenar
      const clientesArray = Object.values(conteoClientes)
        .sort((a, b) => b.cantidad - a.cantidad);

      const colores = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F'];

      if (clientesArray.length === 0) {
        console.log('No hay clientes en el rango de fechas seleccionado');
        this.clientesPedidos = [];
        this.maxCantidadCliente = 0;
        return;
      }

      const totalPedidos = clientesArray.reduce((sum, cliente) => sum + cliente.cantidad, 0);
      this.maxCantidadCliente = Math.max(...clientesArray.map(c => c.cantidad));

      this.clientesPedidos = clientesArray.slice(0, 6).map((cliente, index) => ({
        nombre: cliente.nombre,
        cantidad: cliente.cantidad,
        porcentaje: totalPedidos > 0 ? Math.round((cliente.cantidad / totalPedidos) * 100) : 0,
        color: colores[index % colores.length]
      }));

      console.log('Clientes procesados:', this.clientesPedidos);

    } catch (error) {
      console.error('Error cargando clientes con filtro:', error);
      this.clientesPedidos = [];
      this.maxCantidadCliente = 0;
    }
  }

  calcularSegmento(index: number): string {
    const centerX = 200;
    const centerY = 200;
    const radius = 150;
    
    let startAngle = -90;
    for (let i = 0; i < index; i++) {
      startAngle += (this.estadisticas[i].porcentaje / 100) * 360;
    }
    
    const angle = (this.estadisticas[index].porcentaje / 100) * 360;
    const endAngle = startAngle + angle;
    
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;
    
    const x1 = centerX + radius * Math.cos(startRad);
    const y1 = centerY + radius * Math.sin(startRad);
    const x2 = centerX + radius * Math.cos(endRad);
    const y2 = centerY + radius * Math.sin(endRad);
    
    const largeArc = angle > 180 ? 1 : 0;
    
    return `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
  }

  getIconoEstado(estado: string): string {
    const iconos: { [key: string]: string } = {
      'Pendiente de Pesos': 'hourglass-outline',
      'Pendiente de confirmación': 'checkmark-circle-outline',
      'Listo para Facturar': 'time-outline',
      'Completado': 'checkmark-done-outline'
    };
    return iconos[estado] || 'ellipse-outline';
  }

  //Métodos para el selector de dashboard
  toggleMenuDashboard() {
    this.menuDashboardAbierto = !this.menuDashboardAbierto;
  }

  cerrarMenuDashboard() {
    this.menuDashboardAbierto = false;
  }

  cambiarTipoDashboard(tipo: 'pedidos' | 'ventas' | 'clientes' | 'completo') {
    this.tipoDashboard = tipo;
    this.cerrarMenuDashboard();
  }

  getTituloDashboard(): string {
    switch (this.tipoDashboard) {
      case 'pedidos': return 'Dashboard - Pedidos';
      case 'ventas': return 'Dashboard - Ventas';
      case 'clientes': return 'Dashboard - Clientes';
      case 'completo': return 'Dashboard';
      default: return 'Dashboard';
    }
  }

  //Métodos para mostrar/ocultar secciones
  mostrarSeccionPedidos(): boolean {
    return this.tipoDashboard === 'pedidos' || this.tipoDashboard === 'completo';
  }

  mostrarSeccionVentas(): boolean {
    return this.tipoDashboard === 'ventas' || this.tipoDashboard === 'completo';
  }

  mostrarSeccionClientes(): boolean {
    return this.tipoDashboard === 'clientes' || this.tipoDashboard === 'completo';
  }

  ngOnDestroy() {
    this.menuAbierto = false;
    this.menuDashboardAbierto = false;
    this.mostrarFiltroFechas = false;
  }

  toggleMenu() {
    this.menuAbierto = !this.menuAbierto;
  }

  cerrarMenu() {
    this.menuAbierto = false;
  }

  Irapedidosmenu() {
    this.cerrarMenu();
    this.router.navigate(['/pedidos']);
  }

  Irafacturasmenu() {
    this.cerrarMenu();
    this.router.navigate(['/facturacion']);
  }
  IrAPerfil() {
    this.cerrarMenu();
    this.router.navigate(['/perfil']);
  }
  IrAUsuarios() {
    this.cerrarMenu();
    this.router.navigate(['/usuarios']);
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

  cerrarSesion() {
    if (confirm('¿Estás seguro que deseas cerrar sesión?')) {
      this.api.logout();
      this.cerrarMenu();
    }
  }
}