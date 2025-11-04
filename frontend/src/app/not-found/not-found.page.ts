import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent, IonButton } from '@ionic/angular/standalone';
import { Router } from '@angular/router';

@Component({
  selector: 'app-not-found',
  templateUrl: './not-found.page.html',
  styleUrls: ['./not-found.page.scss'],
  standalone: true,
  imports: [IonContent, IonButton, CommonModule]
})
export class NotFoundPage {
  constructor(private router: Router) {}

  volverInicio() {
    this.router.navigate(['/hub']);
  }
}

