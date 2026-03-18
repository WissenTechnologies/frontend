import { inject } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  createUrlTreeFromSnapshot,
} from '@angular/router';
import { filter, map, take } from 'rxjs/operators';

import { AUTH_FACADE } from '../tokens';

export const adminGuard = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const authFacade = inject(AUTH_FACADE);

  return authFacade.authUser$.pipe(
    filter(user => user !== undefined),
    take(1),
    map(user => {
      if (user && user.role === 'admin') {
        return true;
      }
      // Redirect to home/market if not admin
      return createUrlTreeFromSnapshot(route, ['/market']);
    })
  );
};
