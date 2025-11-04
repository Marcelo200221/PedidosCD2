import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { Perimisos } from '../services/perimisos';

// Guard de autorización: valida un permiso requerido definido en route.data.permiso
export const authzGuard: CanActivateFn = async (route, state): Promise<boolean | UrlTree> => {
  const permisos = inject(Perimisos);
  const router = inject(Router);

  const required: string | undefined = route.data?.['permiso'];
  if (!required) return true; // si no se especifica permiso, se permite

  const allowed = await permisos.checkPermission(required, false, false);
  if (allowed) return true;

  // Redirige a 403 si no posee permiso
  return router.createUrlTree(['/acceso-denegado']);
};

