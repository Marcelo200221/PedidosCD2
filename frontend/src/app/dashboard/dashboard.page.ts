import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardHeader, 
  IonCardTitle, IonCardContent, IonGrid, IonRow, IonCol, IonButton, IonIcon,
  IonSpinner } from '@ionic/angular/standalone';
import { ApiService } from '../services/api.spec';
import { addIcons } from 'ionicons';
import { pieChart, barChart, statsChart, refresh, hourglassOutline, checkmarkCircleOutline, timeOutline, checkmarkDoneOutline } from 'ionicons/icons';

interface EstadisticaPedidos {
  estado: string;
  cantidad: number;
  porcentaje: number;
  color: string;
}

addIcons({ 
  pieChart, barChart, statsChart, refresh,
  'hourglass-outline': hourglassOutline,
  'checkmark-circle-outline': checkmarkCircleOutline,
  'time-outline': timeOutline,
  'checkmark-done-outline': checkmarkDoneOutline
});

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardHeader,
    IonCardTitle, IonCardContent, IonGrid, IonRow, IonCol, IonButton, IonIcon,
    IonSpinner
  ]
})
export class DashboardPage implements OnInit {
  
  estadisticas: EstadisticaPedidos[] = [];
  totalPedidos: number = 0;
  cargando: boolean = true;

  // Colores para cada estado
  coloresEstados: { [key: string]: string } = {
    'pendiente_pesos': '#ffd93d',
    'listo_facturar': '#1976d2',
    'pendiente_confirmacion': '#f57c00',
    'completado': '#388e3c'
  };

  nombresEstados: { [key: string]: string } = {
    'pendiente_pesos': 'Pendiente de Pesos',
    'listo_facturar': 'Listo para Facturar',
    'pendiente_confirmacion': 'Pendiente de Confirmación',
    'completado': 'Completado'
  };

  constructor(private api: ApiService) {}

  async ngOnInit() {
    await this.cargarEstadisticas();
  }

  async cargarEstadisticas() {
    this.cargando = true;
    try {
      const pedidos = await this.api.listarPedidos();
      
      // Contar pedidos por estado
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

      // Crear array de estadísticas
      this.estadisticas = Object.keys(conteoEstados).map(estado => ({
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
    } finally {
      this.cargando = false;
    }
  }

  async refrescarDatos() {
    await this.cargarEstadisticas();
  }

  // Agregar estos métodos a la clase DashboardPage

  calcularSegmento(index: number): string {
    const centerX = 200;
    const centerY = 200;
    const radius = 150;
    
    // Calcular el ángulo inicial acumulado
    let startAngle = -90; // Empezar desde arriba
    for (let i = 0; i < index; i++) {
      startAngle += (this.estadisticas[i].porcentaje / 100) * 360;
    }
    
    const angle = (this.estadisticas[index].porcentaje / 100) * 360;
    const endAngle = startAngle + angle;
    
    // Convertir ángulos a radianes
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;
    
    // Calcular puntos
    const x1 = centerX + radius * Math.cos(startRad);
    const y1 = centerY + radius * Math.sin(startRad);
    const x2 = centerX + radius * Math.cos(endRad);
    const y2 = centerY + radius * Math.sin(endRad);
    
    // Determinar si el arco es mayor a 180 grados
    const largeArc = angle > 180 ? 1 : 0;
    
    // Crear el path del segmento
    return `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
  }

  getIconoEstado(estado: string): string {
    const iconos: { [key: string]: string } = {
      'Pendiente de Pesos': 'hourglass-outline',
      'Listo para Facturar': 'checkmark-circle-outline',
      'Pendiente de Confirmación': 'time-outline',
      'Completado': 'checkmark-done-outline'
    };
    return iconos[estado] || 'ellipse-outline';
  }
}