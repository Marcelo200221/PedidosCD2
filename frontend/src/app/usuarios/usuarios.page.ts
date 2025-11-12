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
  imports: [IonContent, CommonModule, FormsModule, IonList, IonItem, IonLabel, IonButton]
})
export class UsuariosPage implements OnInit {
  puedeEditar = false;

  usuarios: any[] = [];

  constructor(private api: ApiService, public permisos: Perimisos) { }


  darPermisos(id: string){
    this.api.darPermisos(id);
  }
  
  esGerente(u: any): boolean {
    const g = u?.groups;
    if (!g) return false;
    // Puede venir como array de nombres, objetos o ids
    if (Array.isArray(g)) {
      return g.some((x: any) => x === 'gerente' || x?.name === 'gerente' || x === 1 || x === '1');
    }
    return false;
  }
  
  

  async ngOnInit() {
    const res = await this.api.getUsuarios()
    this.usuarios = res.data
    console.log(this.usuarios)
  }

}
