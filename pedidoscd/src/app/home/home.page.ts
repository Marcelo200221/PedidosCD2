import { Component } from '@angular/core';
import { ApiService } from '../services/api.spec';
import { IonHeader, IonToolbar, IonTitle, IonContent } from '@ionic/angular/standalone';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [IonHeader, IonToolbar, IonTitle, IonContent],
})
export class HomePage {

  message: string='';
  constructor(private apiService: ApiService) {}

  ionViewDidEnter(){
    this.apiService.getHello().subscribe(
      (data) => {
        this.message = data.message;
      },
      (error) => {
        console.error('Error: ', error);
      }
    );
  }
}
