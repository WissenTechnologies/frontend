import { Routes } from '@angular/router';

import { authGuard, adminGuard } from './auth';

export const routes: Routes = [
  // Redirect to market if root path
  { path: '', redirectTo: 'market', pathMatch: 'full' },

  {
    path: 'market',
    canActivate: [authGuard],
    loadComponent: () => import('./features/market').then(c => c.MarketComponent),
  },
  {
    path: 'terminal',
    canActivate: [authGuard, adminGuard],
    loadComponent: () => import('./features/terminal').then(c => c.TerminalComponent),
  },
  {
    path: 'portfolios',
    canActivate: [authGuard],
    loadComponent: () => import('./features/portfolios/portfolios.component').then(c => c.PortfoliosComponent),
  },
  {
    path: 'balance',
    canActivate: [authGuard],
    loadComponent: () => import('./features/balance/balance.component').then(c => c.BalanceComponent),
  },
  {
    path: 'auth',
    loadChildren: () => import('./auth/auth.routes').then(c => c.authRoutes),
  },

  // Redirect to market if no route found
  { path: '**', redirectTo: 'market' },
];
