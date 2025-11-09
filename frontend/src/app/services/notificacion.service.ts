import { Injectable } from '@angular/core';
import { ToastController } from '@ionic/angular';
import { ApiService } from './api.spec';

@Injectable({ providedIn: 'root' })
export class NotificacionService {
  private timer: any;
  private vistos = new Set<number>();

  constructor(
    private api: ApiService,
    private toast: ToastController
  ) {}

  start() {
    if (this.timer) return;
    // Primer pull inmediato
    this.pull();
    // Luego cada 15s
    this.timer = setInterval(() => this.pull(), 15000);
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private async pull() {
    try {
      const avisos = await this.api.getAvisos();
      for (const a of avisos) {
        const id = Number((a as any).id);
        const mensaje = (a as any).mensaje ?? (a as any).message ?? '';
        if (id && mensaje && !this.vistos.has(id)) {
          this.vistos.add(id);
          await this.mostrar(mensaje);
        }
      }
    } catch (e) {
      // Silencioso para no molestar
      // console.error('Error al obtener avisos', e);
    }
  }

  private async mostrar(mensaje: string) {
    const t = await this.toast.create({
      message: mensaje,
      duration: 3000,
      position: 'top',
      color: 'primary',
      icon: 'alert-circle'
    });
    await t.present();
  }
}

