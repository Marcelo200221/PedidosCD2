import { Injectable } from '@angular/core';
import { ToastController } from '@ionic/angular';
import { ApiService } from './api.spec';
import { getItem as ssGetItem } from './token-storage';

@Injectable({ providedIn: 'root' })
export class NotificacionService {
  private timer: any;
  private vistos = new Set<number>();
  private activos: any[] = [];

  constructor(
    private api: ApiService,
    private toast: ToastController
  ) {}

  async start() {
    // Detener cualquier polling previo
    this.stop();
    // Iniciar solo si hay token (sesión iniciada)
    const token = await ssGetItem('auth_token');
    if (!token) return;

    // Reiniciar vistos por sesión (sin persistir)
    this.vistos.clear();

    // Un único pull al iniciar sesión
    await this.pull();
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  // Exponer un chequeo manual para llamar tras acciones que podrían generar avisos
  async checkNow() {
    await this.pull();
  }

  private async pull() {
    try {
      const avisos = await this.api.getAvisos();
      for (const a of avisos) {
        const id = Number((a as any).id);
        const mensaje = (a as any).mensaje ?? (a as any).message ?? '';
        console.log("Mensaje: ", mensaje);
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

  // Persistencia de vistos eliminada para mostrar avisos al entrar a cada vista

  private async mostrar(mensaje: string) {
    const index = this.activos.length;
    const t = await this.toast.create({
      message: mensaje,
      duration: 3000,
      position: 'top',
      color: 'primary',
      cssClass: ['notif-toast', `notif-offset-${index}`]
    });
    await t.present();
    this.activos.push(t as any);
    t.onDidDismiss().then(() => {
      const i = this.activos.indexOf(t as any);
      if (i >= 0) this.activos.splice(i, 1);
      this.reordenarToasts();
    });
  }

  private reordenarToasts() {
    this.activos.forEach((el, i) => {
      try {
        const cl: DOMTokenList | undefined = (el as any).classList as DOMTokenList | undefined;
        if (!cl) return;
        const toRemove: string[] = [];
        cl.forEach((c: string) => { if (c.startsWith('notif-offset-')) toRemove.push(c); });
        toRemove.forEach((c) => cl.remove(c));
        cl.add(`notif-offset-${i}`);
      } catch (_) { /* noop */ }
    });
  }
}
