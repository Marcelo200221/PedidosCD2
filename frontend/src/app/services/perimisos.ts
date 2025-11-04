import { Injectable } from '@angular/core';
import axios from 'axios';
import { environment } from 'src/environments/environment';
import { Router } from '@angular/router';
import { getToken as ssGetToken, removeToken as ssRemoveToken } from './token-storage';

type UserInfo = {
  id: number;
  rut: string;
  email: string;
  first_name: string;
  last_name: string;
  groups: string[];
  permisos: string[];
};

const api = axios.create({
  baseURL: environment.apiUrl,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(
  async (config) => {
    const token = await ssGetToken();
    if (token) {
      config.headers = config.headers || {};
      (config.headers as any).Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) { ssRemoveToken(); }
    return Promise.reject(error);
  }
);

@Injectable({
  providedIn: 'root'
})
export class Perimisos {
  private userCache: UserInfo | null = null;
  constructor(private router: Router) {}

  async getUsuarioActual(forceRefresh = false): Promise<UserInfo> {
    if (this.userCache && !forceRefresh) return this.userCache;

    const { data } = await api.get<UserInfo>('usuarios/permisos');
    // Normaliza arrays por seguridad
    data.groups = Array.isArray(data.groups) ? data.groups : [];
    data.permisos = Array.isArray(data.permisos) ? data.permisos : [];
    this.userCache = data;
    return data;
  }

  async checkPermission(codename: string, forceRefresh = false, redirectIfDenied = false): Promise<boolean> {
    try {
      const user = await this.getUsuarioActual(forceRefresh);
      const allowed = Array.isArray(user.permisos) && user.permisos.includes(codename);
      if (!allowed && redirectIfDenied) {
        this.router.navigate(['/acceso-denegado']);
      }
      return allowed;
    } catch (err: any) {
      if (err?.response?.status === 401) {
        this.router.navigate(['/login']);
      }
      return false;
    }
  }

  clearCache() {
    this.userCache = null;
  }
}
