import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';

import { PublicGuard } from './public.guard';
import { AuthService } from '../services/auth.service';
import { User } from '../models/user.model';

describe('PublicGuard', () => {
  let guard: PublicGuard;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;

  const mockUser: User = {
    id: '1',
    email: 'test@example.com',
    name: 'Test User',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  };

  beforeEach(() => {
    const authSpy = jasmine.createSpyObj('AuthService', [], {
      authState$: of({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
      })
    });
    
    const routeSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        PublicGuard,
        { provide: AuthService, useValue: authSpy },
        { provide: Router, useValue: routeSpy }
      ]
    });

    guard = TestBed.inject(PublicGuard);
    authServiceSpy = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    routerSpy = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });

  it('should allow access when user is not authenticated', () => {
    (authServiceSpy.authState$ as any).next({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null
    });

    const result = guard.canActivate();
    
    result.subscribe(canActivate => {
      expect(canActivate).toBeTruthy();
      expect(routerSpy.navigate).not.toHaveBeenCalled();
    });
  });

  it('should deny access and redirect to dashboard when user is authenticated', () => {
    (authServiceSpy.authState$ as any).next({
      user: mockUser,
      isAuthenticated: true,
      isLoading: false,
      error: null
    });

    const result = guard.canActivate();
    
    result.subscribe(canActivate => {
      expect(canActivate).toBeFalsy();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/dashboard']);
    });
  });

  it('should allow access when auth state is loading but not authenticated', () => {
    (authServiceSpy.authState$ as any).next({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      error: null
    });

    const result = guard.canActivate();
    
    result.subscribe(canActivate => {
      expect(canActivate).toBeTruthy();
      expect(routerSpy.navigate).not.toHaveBeenCalled();
    });
  });

  it('should allow access when there is an auth error', () => {
    (authServiceSpy.authState$ as any).next({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: 'Authentication error'
    });

    const result = guard.canActivate();
    
    result.subscribe(canActivate => {
      expect(canActivate).toBeTruthy();
      expect(routerSpy.navigate).not.toHaveBeenCalled();
    });
  });
});
