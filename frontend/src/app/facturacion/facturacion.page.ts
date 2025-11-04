import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonButton, IonSearchbar, IonItem, 
  IonLabel, IonIcon, IonCheckbox, IonSpinner, IonFab, IonFabList, IonFabButton, IonList,} from '@ionic/angular/standalone';
import { ApiService } from '../services/api.spec';
import { addIcons } from 'ionicons';
import { Router } from '@angular/router';
import { chevronUpCircle, pencil, addCircle, removeCircle, filter, menu, close, trashBin, checkmarkCircle, search,
  documentText, cube, calculator, scale, eye, closeCircle, send, download, people, personAdd  } from 'ionicons/icons';

// Interfaces
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
  estado?: 'pendiente_pesos' | 'listo_facturar' | 'pendiente_confirmacion' | 'completado';
}

//Iconos
addIcons({ 
  chevronUpCircle, menu, pencil, removeCircle, addCircle, filter, close, 
  trashBin, checkmarkCircle, search, documentText, cube, calculator, scale, eye, send, closeCircle, people, personAdd, download
});

@Component({
  selector: 'app-facturacion',
  templateUrl: './facturacion.page.html',
  styleUrls: ['./facturacion.page.scss'],
  standalone: true,
  imports: [
    FormsModule,
    CommonModule,
    IonContent, IonButton, IonSearchbar, IonList, IonItem,
    IonLabel, IonIcon, IonCheckbox, IonSpinner, IonFab, IonFabList, IonFabButton
  ]
})
export class FacturacionPage implements OnInit {
  
  pedidos: Pedido[] = [];
  pedidosFiltrados: Pedido[] = [];
  terminoBusqueda: string = '';
  cargando: boolean = true;
  
  mostrarDetallePesos: boolean = false;
  pedidoDetalle: Pedido | null = null;
  
  mostrarSeleccionMultiple: boolean = false;

  //Variables del menú
  menuAbierto: boolean = false;
  nombreUsuario: string = '';
  apellidoUsuario: string = '';

  constructor(private api: ApiService, 
    private router: Router) { }

  async ngOnInit() {
    await this.cargarPedidosPendientesConfirmacion();
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

  async cargarPedidosPendientesConfirmacion() {
    try {
      this.cargando = true;
      const todosPedidos = await this.api.listarPedidos();
      
      //Filtrar solo los que están en 'pendiente_confirmacion'
      this.pedidos = todosPedidos
        .filter((pedido: any) => pedido.estado === 'pendiente_confirmacion')
        .map((pedido: any) => this.mapearPedidoBackend(pedido));
      
      this.pedidosFiltrados = [...this.pedidos];
      console.log('Pedidos pendientes de confirmación:', this.pedidos);
      
    } catch (error) {
      console.error('Error al cargar pedidos:', error);
      alert('Error al cargar los pedidos de facturación');
    } finally {
      this.cargando = false;
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

    return {
      id: pedidosBackend.id,
      nombre: `pedido ${pedidosBackend.id}`,
      cliente: (pedidosBackend.cliente && (pedidosBackend.cliente.nombre || pedidosBackend.cliente.razon_social)) || 'Cliente por defecto',
      direccion: pedidosBackend.direccion,
      productos: productos,
      seleccionado: false,
      estado: pedidosBackend.estado || 'pendiente_confirmacion'
    };
  }

  //Busqueda
  buscarPedidos(event: any) {
    const termino = event.target.value.toLowerCase().trim();
    this.terminoBusqueda = termino;
    
    if (!termino) {
      this.pedidosFiltrados = [...this.pedidos];
      return;
    }
    
    this.pedidosFiltrados = this.pedidos.filter(pedido => {
      return pedido.nombre.toLowerCase().includes(termino) ||
             pedido.cliente.toLowerCase().includes(termino) ||
             pedido.direccion.toLowerCase().includes(termino) ||
             pedido.productos.some(prod => prod.nombre.toLowerCase().includes(termino));
    });
  }

  limpiarBusqueda() {
    this.terminoBusqueda = '';
    this.pedidosFiltrados = [...this.pedidos];
  }

  // Acciones de facturación
  async verFactura(pedido: Pedido) {
    try {
      await this.api.previsualizarFacturaPorPedido(pedido.id);
    } catch (error) {
      console.error('Error al previsualizar factura:', error);
      alert('No se pudo previsualizar la factura');
    }
  }

  async generarFacturasSeleccionadas() {
    const seleccionados = this.pedidos.filter(p => p.seleccionado);
    if (seleccionados.length === 0) {
      alert('Selecciona al menos un pedido');
      return;
    }
    try {
      for (const pedido of seleccionados) {
        await this.api.generarFacturaPorPedido(pedido.id);
      }
      alert(`Se generaron ${seleccionados.length} factura(s).`);
    } catch (error) {
      console.error('Error generando facturas:', error);
      alert('Ocurrió un error al generar alguna factura');
    }
  }

  //Detalle de pesos
  abrirDetallePesos(pedido: Pedido) {
    this.pedidoDetalle = pedido;
    this.mostrarDetallePesos = true;
  }

  cerrarDetallePesos() {
    this.mostrarDetallePesos = false;
    this.pedidoDetalle = null;
  }

  //Calculos
  getPesoTotal(producto: Producto): number {
    if (!producto.pesos || producto.pesos.length === 0) return 0;
    return producto.pesos.reduce((sum, peso) => sum + (peso || 0), 0);
  }

  calcularPesoTotalDelPedido(pedido: Pedido): number {
    let total = 0;
    pedido.productos.forEach(prod => {
      total += this.getPesoTotal(prod);
    });
    return total;
  }

  //Selección múltiple
  activarSeleccionMultiple() {
    if (this.pedidos.length === 0) {
      alert('No hay pedidos para seleccionar');
      return;
    }
    this.mostrarSeleccionMultiple = true;
    this.pedidos.forEach(pedido => pedido.seleccionado = false);
  }

  cancelarSeleccionMultiple() {
    this.mostrarSeleccionMultiple = false;
    this.pedidos.forEach(pedido => pedido.seleccionado = false);
  }

  toggleSeleccionPedido(pedido: Pedido) {
    pedido.seleccionado = !pedido.seleccionado;
  }

  get pedidosSeleccionados(): number {
    return this.pedidos.filter(p => p.seleccionado).length;
  }

  //Confirmar facturación
  async confirmarFacturacionSeleccionados() {
    const seleccionados = this.pedidos.filter(p => p.seleccionado);
    
    if (seleccionados.length === 0) {
      alert('Selecciona al menos un pedido para confirmar');
      return;
    }

    const confirmar = confirm(
      `¿Confirmar la facturación de ${seleccionados.length} pedido(s)?\n\n` +
      `Esto cambiará su estado a "Completado".`
    );
    
    if (!confirmar) return;
    
    try {
      //Cambiar estado a 'completado'
      for (const pedido of seleccionados) {
        await this.api.generarFacturaPorPedido(pedido.id);
        await this.api.actualizarEstadoPedido(pedido.id, 'completado');
      }

      this.pedidos = this.pedidos.filter(p => !p.seleccionado);
      this.pedidosFiltrados = [...this.pedidos];
      
      this.mostrarSeleccionMultiple = false;
      alert(`${seleccionados.length} pedido(s) confirmado(s) exitosamente`);
      
    } catch (error) {
      console.error('Error al confirmar facturación:', error);
      alert('Error al confirmar la facturación');
    }
  }

  async confirmarFacturacionIndividual(pedido: Pedido) {
    const confirmar = confirm(
      `¿Confirmar la facturación del ${pedido.nombre}?\n\n` +
      `Dirección: ${pedido.direccion}\n` +
      `Esto cambiará su estado a "Completado".`
    );
    
    if (!confirmar) return;
    
    try {
      await this.api.generarFacturaPorPedido(pedido.id);
      await this.api.actualizarEstadoPedido(pedido.id, 'completado');
      
      //Remover de la lista
      this.pedidos = this.pedidos.filter(p => p.id !== pedido.id);
      this.pedidosFiltrados = [...this.pedidos];
      
      alert(`${pedido.nombre} confirmado exitosamente`);
      
    } catch (error) {
      console.error('Error al confirmar facturación:', error);
      alert('Error al confirmar la facturación');
    }
  }

  ngOnDestroy() {
    this.menuAbierto = false;
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
