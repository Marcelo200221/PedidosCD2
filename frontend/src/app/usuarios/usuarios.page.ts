import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonList, IonItem, IonLabel, IonButton } from '@ionic/angular/standalone';
import { ApiService } from '../services/api.spec';
import { Perimisos } from '../services/perimisos';

@Component({
  selector: 'app-usuarios',
  templateUrl: './usuarios.page.html',
  styleUrls: ['./usuarios.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, IonList, IonItem, IonLabel, IonButton]
})
export class UsuariosPage implements OnInit {
  puedeEditar = false;

  usuarios: any[] = [];

  constructor(private api: ApiService) { }

  
  

  async ngOnInit() {
    const res = await this.api.getUsuarios()
    this.usuarios = res.data
    console.log(this.usuarios)
  }

}
