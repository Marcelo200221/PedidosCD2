import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
  },
  {
    path: '',
<<<<<<< HEAD
    redirectTo: 'home',
    pathMatch: 'full',
  },
];
=======
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
];
>>>>>>> d23bf4677673ad39805fb8a11a153cb77beb4245
