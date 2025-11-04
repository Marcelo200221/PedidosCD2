import { Routes } from '@angular/router';
import { authzGuard } from './guards/authz-guard';

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
    loadComponent: () => import('./registro/registro.page').then((m) => m.RegistroPage),
  },
  {
    path: 'login',
    loadComponent: () => import('./login/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'olvido',
    loadComponent: () => import('./olvido/olvido.page').then((m) => m.OlvidoPage),
  },
  {
    path: 'splash',
    loadComponent: () => import('./splash/splash.page').then((m) => m.SplashPage),
  },
  {
    path: 'hub',
    loadComponent: () => import('./hub/hub.page').then((m) => m.HubPage),
  },
  {
    path: 'pedidos',
    canActivate: [authzGuard],
    data: { permiso: 'view_pedidos' },
    loadComponent: () => import('./pedidos/pedidos.page').then((m) => m.PedidosPage),
  },
  {
    path: 'dashboard',
    canActivate: [authzGuard],
    data: { permiso: 'view_reportes' },
    loadComponent: () => import('./dashboard/dashboard.page').then((m) => m.DashboardPage),
  },
  {
    path: 'facturacion',
    loadComponent: () => import('./facturacion/facturacion.page').then( m => m.FacturacionPage)
  },
  {
    path: 'clientes',
    canActivate: [authzGuard],
    data: { permiso: 'agregar_clientes' },
    loadComponent: () => import('./clientes/clientes.page').then((m) => m.ClientesPage),
  },
  {
    path: 'lista-clientes',
    canActivate: [authzGuard],
    data: { permiso: 'view_clientes' },
    loadComponent: () => import('./lista-clientes/lista-clientes.page').then((m) => m.ListaClientesPage),
  },
  {
    path: 'productos',
    loadComponent: () => import('./productos/productos.page').then( m => m.ProductosPage)
  },
  {
    path: 'acceso-denegado',
    loadComponent: () => import('./acceso-denegado/acceso-denegado.page').then((m) => m.AccesoDenegadoPage),
  },
  // 404 catch-all
  {
    path: '**',
    loadComponent: () => import('./not-found/not-found.page').then((m) => m.NotFoundPage),
  },
];

