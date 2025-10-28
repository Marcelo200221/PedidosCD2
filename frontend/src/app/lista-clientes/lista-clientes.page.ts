import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../services/api.spec';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonLabel, IonItem, IonList } from '@ionic/angular/standalone';

@Component({
  selector: 'app-lista-clientes',
  templateUrl: './lista-clientes.page.html',
  styleUrls: ['./lista-clientes.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, IonLabel, IonItem, IonList]
})
export class ListaClientesPage implements OnInit {

  clientes: any[] = [];

  constructor(private api: ApiService) { }

  async ngOnInit() {
    const response = await this.api.listarClientes()
    console.log("Respuesta del backend", response)
    this.clientes = response;
  }

  async eliminarCliente(id: string){
    console.log("Funcion en desarrollo")
  }
  

}
