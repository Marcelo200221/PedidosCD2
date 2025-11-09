import { Injectable } from '@angular/core';
import { ToastController } from '@ionic/angular';
import { ApiService } from './api.spec';
import { getItem as ssGetItem, setItem as ssSetItem } from './token-storage';

@Injectable({ providedIn: 'root' })
export class NotificacionService {
  private timer: any;
  private vistos = new Set<number>();
  private readonly STORAGE_KEY = 'avisos_vistos';

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

    // Cargar avisos vistos persistidos
    await this.cargarVistosPersistidos();

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
          await this.persistirVistos();
          await this.mostrar(mensaje);
        }
      }
    } catch (e) {
      // Silencioso para no molestar
      // console.error('Error al obtener avisos', e);
    }
  }

  private async cargarVistosPersistidos() {
    try {
      const raw = await ssGetItem(this.STORAGE_KEY);
      if (!raw) return;
      const arr: number[] = JSON.parse(raw);
      if (Array.isArray(arr)) {
        arr.forEach(id => this.vistos.add(Number(id)));
      }
    } catch (_) { /* noop */ }
  }

  private async persistirVistos() {
    try {
      const arr = Array.from(this.vistos.values());
      await ssSetItem(this.STORAGE_KEY, JSON.stringify(arr));
    } catch (_) { /* noop */ }
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
