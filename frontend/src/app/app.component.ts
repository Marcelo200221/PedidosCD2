import { Component } from '@angular/core';
import { IonApp, IonRouterOutlet, IonToast } from '@ionic/angular/standalone';
import { LocalNotifications } from '@capacitor/local-notifications';
import { FileOpener } from '@awesome-cordova-plugins/file-opener/ngx';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ApiService } from './services/api.spec';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  standalone: true,
  imports: [IonApp, IonRouterOutlet, IonToast],  
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AppComponent {

  constructor(private fileOpener: FileOpener, private api: ApiService) {
    this.initializeNotifications();
  }

  async ngOnInit() {
    await this.api.solicitarPermisos();
  }

  initializeNotifications() {
    LocalNotifications.addListener(
      'localNotificationActionPerformed',
      (event: any) => {
        const fileUri = event.notification.extra?.fileUri;
        if (fileUri) {
          this.fileOpener.open(fileUri, 'application/pdf')
            .catch(err => console.error("NO se pudo abrir el PDF:", err));
        }
      }
    );
  }
}
