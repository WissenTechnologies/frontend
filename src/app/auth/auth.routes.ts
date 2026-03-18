import { Routes } from '@angular/router';

import { noAuthGuard } from './guards';

export const authRoutes: Routes = [
  {
    path: '',
    canActivate: [noAuthGuard],
    loadComponent: () => import('./auth.component').then(c => c.AuthComponent),
  },
  { path: 'login', redirectTo: '' },
  { path: 'register', redirectTo: '' },
  { path: 'reset-password', redirectTo: '' },
  { path: '**', redirectTo: '' }
];
