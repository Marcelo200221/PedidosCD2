import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { getToken } from '../services/token-storage';

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
    setTimeout(async () => {
        this.fadeOut = true;
        await new Promise(res => setTimeout(res, 800));
        const token = await getToken();

        if (token) {
          this.router.navigate(['/hub'], { replaceUrl: true });
        } else {
          this.router.navigate(['/home'], { replaceUrl: true });
        }

      }, 1500); 
    }
  }
