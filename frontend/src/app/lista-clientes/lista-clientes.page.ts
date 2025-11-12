import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../services/api.spec';
import { Router } from '@angular/router';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonLabel, IonItem, IonList, IonButton } from '@ionic/angular/standalone';
import { Perimisos } from '../services/perimisos';

@Component({
  selector: 'app-lista-clientes',
  templateUrl: './lista-clientes.page.html',
  styleUrls: ['./lista-clientes.page.scss'],
  standalone: true,
  imports: [IonContent, CommonModule, FormsModule, IonLabel, IonItem, IonList, IonButton]
})
export class ListaClientesPage implements OnInit {

  puedeEditar = false;

  clientes: any[] = [];

  constructor(private api: ApiService, private router: Router, public permisos: Perimisos) { }

  async ngOnInit() {
    this.puedeEditar = await this.permisos.checkPermission('editar_clientes')
    const response = await this.api.listarClientes()
    console.log("Respuesta del backend", response)
    this.clientes = response;
  }

  async eliminarCliente(id: string){
    this.api.eliminarCliente(id)
  }

  agregarCliente(){
    this.router.navigate(['/clientes']);
  }
  
  editarCliente(id: string){

    this.router.navigate(['/clientes', id])
  }
  

}
