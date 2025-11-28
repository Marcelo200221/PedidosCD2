import { Injectable } from '@angular/core';
import { ToastController, AlertController } from '@ionic/angular';
import { ApiService } from './api.spec';
import { getItem as ssGetItem } from './token-storage';

@Injectable({ providedIn: 'root' })
export class NotificacionService {

  private timer: any;
  private vistos = new Set<number>();

  // Cola de toasts
  private cola: Array<() => Promise<void>> = [];
  private mostrando = false;

  constructor(
    private api: ApiService,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController
  ) {}

  async start() {
    this.stop();

    const token = await ssGetItem('auth_token');
    if (!token) return;

    this.vistos.clear();
    await this.pull();
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  async checkNow() {
    await this.pull();
  }

  private async pull() {
    try {
      const avisos = await this.api.getAvisos();

      for (const aviso of avisos) {
        const id = Number((aviso as any).id);
        const mensaje = (aviso as any).mensaje ?? (aviso as any).message ?? '';

        if (id && mensaje && !this.vistos.has(id)) {
          this.vistos.add(id);
          this.mostrarAviso(mensaje);
        }
      }
    } catch (e) {
      console.error('Error al obtener avisos:', e);
    }
  }

  private enqueueToast(factory: () => Promise<void>) {
    this.cola.push(factory);
    this.procesarCola();
  }

  private async procesarCola() {
    if (this.mostrando) return;

    const siguiente = this.cola.shift();
    if (!siguiente) return;

    this.mostrando = true;

    try {
      await siguiente();
    } catch (err) {
      console.error('Error mostrando toast:', err);
    } finally {
      this.mostrando = false;

      if (this.cola.length > 0) {
        this.procesarCola();
      }
    }
  }

  private mostrarAviso(mensaje: string) {
  this.enqueueToast(async () => {
    const t = await this.toastCtrl.create({
      message: mensaje,
      duration: 3000,
      position: 'top',
      color: 'primary',
      cssClass: 'toast-info',
      buttons: [
        {
          icon: 'close-Circle',
          role: 'cancel'
        }
      ]
    });
    await t.present();
    await t.onDidDismiss();
  });
}

async showSuccess(message: string, duration: number = 3000) {
  this.enqueueToast(async () => {
    const t = await this.toastCtrl.create({
      message,
      duration,
      position: 'top',
      color: 'success',
      cssClass: 'toast-success',
      buttons: [
        {
          icon: 'close-Circle',
          role: 'cancel'
        }
      ]
    });
    await t.present();
    await t.onDidDismiss();
  });
}

async showError(message: string, duration: number = 3500) {
  this.enqueueToast(async () => {
    const t = await this.toastCtrl.create({
      message,
      duration,
      position: 'top',
      color: 'danger',
      cssClass: 'toast-error',
      buttons: [
        {
          icon: 'close-Circle',
          role: 'cancel'
        }
      ]
    });
    await t.present();
    await t.onDidDismiss();
  });
}

async showWarning(message: string, duration: number = 3000) {
  this.enqueueToast(async () => {
    const t = await this.toastCtrl.create({
      message,
      duration,
      position: 'top',
      color: 'warning',
      cssClass: 'toast-warning',
      buttons: [
        {
          icon: 'close-Circle',
          role: 'cancel'
        }
      ]
    });
    await t.present();
    await t.onDidDismiss();
  });
}

async showInfo(message: string, duration: number = 3000) {
  this.enqueueToast(async () => {
    const t = await this.toastCtrl.create({
      message,
      duration,
      position: 'top',
      color: 'primary',
      cssClass: 'toast-info',
      buttons: [
        {
          icon: 'close-Circle',
          role: 'cancel'
        }
      ]
    });
    await t.present();
    await t.onDidDismiss();
  });
}

async showCustom(message: string, duration: number = 3000) {
  this.enqueueToast(async () => {
    const t = await this.toastCtrl.create({
      message,
      duration,
      position: 'top',
      cssClass: 'toast-custom',
      buttons: [
        {
          icon: 'close-Circle',
          role: 'cancel'
        }
      ]
    });
    await t.present();
    await t.onDidDismiss();
  });
}

  async showConfirm(
    message: string,
    header: string = '¿Confirmar acción?',
    confirmText: string = 'Aceptar',
    cancelText: string = 'Cancelar'
  ): Promise<boolean> {
    return new Promise(async (resolve) => {
      const alert = await this.alertCtrl.create({
        header,
        message,
        cssClass: 'custom-alert',
        buttons: [
          {
            text: confirmText,
            cssClass: 'alert-button-confirm',
            handler: () => resolve(true),
          },
          {
            text: cancelText,
            role: 'cancel',
            cssClass: 'alert-button-cancel',
            handler: () => resolve(false),
          },
        ],
      });

      await alert.present();
    });
  }
}
