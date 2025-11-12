import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButton } from '@ionic/angular/standalone';
import { Router } from '@angular/router';

@Component({
  selector: 'app-acceso-denegado',
  templateUrl: './acceso-denegado.page.html',
  styleUrls: ['./acceso-denegado.page.scss'],
  standalone: true,
  imports: [IonContent, IonButton, CommonModule, FormsModule]
})
export class AccesoDenegadoPage implements OnInit {

  constructor(private router: Router) { }

  ngOnInit() {
  }

  volverInicio() {
    this.router.navigate(['/hub']);
  }

}
