import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
  },
  {
    path: '',
    redirectTo: 'splash', 
    pathMatch: 'full',
  },
  {
    path: 'registro',
    loadComponent: () => import('./registro/registro.page').then( m => m.RegistroPage)
  },
  {
    path: 'login',
    loadComponent: () => import('./login/login.page').then( m => m.LoginPage)
  },
  {
    path: 'olvido',
    loadComponent: () => import('./olvido/olvido.page').then( m => m.OlvidoPage)
  },
  {
    path: 'splash',
    loadComponent: () => import('./splash/splash.page').then( m => m.SplashPage)
  },
  {
    path: 'hub',
    loadComponent: () => import('./hub/hub.page').then( m => m.HubPage)
  },
  {
    path: 'pedidos',
    loadComponent: () => import('./pedidos/pedidos.page').then( m => m.PedidosPage)
  },
  {
    path: 'clientes',
    loadComponent: () => import('./clientes/clientes.page').then( m => m.ClientesPage)
  },
  {
    path: 'lista-clientes',
    loadComponent: () => import('./lista-clientes/lista-clientes.page').then( m => m.ListaClientesPage)
  },

];
