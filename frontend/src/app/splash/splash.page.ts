import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';

@Component({
  selector: 'app-splash',
  templateUrl: './splash.page.html',
  styleUrls: ['./splash.page.scss'],
  standalone: true,
  imports: [IonContent, CommonModule, FormsModule]
})
export class SplashPage implements OnInit {

   fadeOut = false;

  constructor(private router: Router) { }

  ngOnInit() {
    setTimeout(() => {
      this.fadeOut = true;
      setTimeout(() => {
        this.router.navigate(['/home']);
      }, 1000);
    }, 3000); 
  }


}
