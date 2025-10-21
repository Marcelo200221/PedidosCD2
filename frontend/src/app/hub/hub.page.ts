import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButton } from '@ionic/angular/standalone';

@Component({
  selector: 'app-hub',
  templateUrl: './hub.page.html',
  styleUrls: ['./hub.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, IonButton, CommonModule, FormsModule]
})
export class HubPage implements OnInit {

 constructor(private router: Router) {}

  Irapedidos() {
    this.router.navigate(['/pedidos']);
  }

  Irafacturas() {
    this.router.navigate(['/facturas']);
  }

  Iradashboards() {
    this.router.navigate(['/dashboard']);
  }

  ngOnInit() {
  }

}
