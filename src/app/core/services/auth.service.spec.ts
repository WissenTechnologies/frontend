import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';

import { AuthService } from './auth.service';
import { LoginRequest, RegisterRequest, AuthResponse, User } from '../models/user.model';
import { environment } from '../../../environments/environment';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let routerSpy: jasmine.SpyObj<Router>;

  const mockUser: User = {
    id: '1',
    email: 'test@example.com',
    name: 'Test User',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    isEmailVerified: true
  };

  const mockAuthResponse: AuthResponse = {
    user: mockUser,
    accessToken: 'access-token',
    refreshToken: 'refresh-token'
  };

  beforeEach(() => {
    const spy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AuthService,
        { provide: Router, useValue: spy }
      ]
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    routerSpy = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    
    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('login', () => {
    it('should login successfully and store tokens', () => {
      const loginData: LoginRequest = {
        email: 'test@example.com',
        password: 'password123'
      };

      service.login(loginData).subscribe(response => {
        expect(response).toEqual(mockAuthResponse);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(loginData);
      req.flush(mockAuthResponse);

      expect(localStorage.getItem('voldemort_access_token')).toBe('access-token');
      expect(localStorage.getItem('voldemort_refresh_token')).toBe('refresh-token');
      expect(localStorage.getItem('voldemort_user')).toBe(JSON.stringify(mockUser));
    });

    it('should handle login error', () => {
      const loginData: LoginRequest = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      service.login(loginData).subscribe({
        next: () => fail('should have failed'),
        error: error => {
          expect(error).toBeTruthy();
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
      req.flush('Invalid credentials', { status: 401, statusText: 'Unauthorized' });

      service.authState$.subscribe(state => {
        expect(state.isAuthenticated).toBeFalsy();
        expect(state.error).toBe('Invalid credentials');
      });
    });
  });

  describe('register', () => {
    it('should register successfully and store tokens', () => {
      const registerData: RegisterRequest = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password123'
      };

      service.register(registerData).subscribe(response => {
        expect(response).toEqual(mockAuthResponse);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/register`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(registerData);
      req.flush(mockAuthResponse);

      expect(localStorage.getItem('voldemort_access_token')).toBe('access-token');
      expect(localStorage.getItem('voldemort_refresh_token')).toBe('refresh-token');
      expect(localStorage.getItem('voldemort_user')).toBe(JSON.stringify(mockUser));
    });

    it('should handle registration error', () => {
      const registerData: RegisterRequest = {
        name: 'Test User',
        email: 'existing@example.com',
        password: 'password123',
        confirmPassword: 'password123'
      };

      service.register(registerData).subscribe({
        next: () => fail('should have failed'),
        error: error => {
          expect(error).toBeTruthy();
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/register`);
      req.flush('User already exists', { status: 409, statusText: 'Conflict' });

      service.authState$.subscribe(state => {
        expect(state.isAuthenticated).toBeFalsy();
        expect(state.error).toBe('User already exists');
      });
    });
  });

  describe('logout', () => {
    beforeEach(() => {
      localStorage.setItem('voldemort_access_token', 'access-token');
      localStorage.setItem('voldemort_refresh_token', 'refresh-token');
      localStorage.setItem('voldemort_user', JSON.stringify(mockUser));
    });

    it('should clear tokens and update auth state', () => {
      service.logout();

      expect(localStorage.getItem('voldemort_access_token')).toBeNull();
      expect(localStorage.getItem('voldemort_refresh_token')).toBeNull();
      expect(localStorage.getItem('voldemort_user')).toBeNull();

      service.authState$.subscribe(state => {
        expect(state.isAuthenticated).toBeFalsy();
        expect(state.user).toBeNull();
        expect(state.error).toBeNull();
      });
    });
  });

  describe('token management', () => {
    it('should get access token', () => {
      localStorage.setItem('voldemort_access_token', 'access-token');
      expect(service.getAccessToken()).toBe('access-token');
    });

    it('should get refresh token', () => {
      localStorage.setItem('voldemort_refresh_token', 'refresh-token');
      expect(service.getRefreshToken()).toBe('refresh-token');
    });

    it('should return null for non-existent tokens', () => {
      expect(service.getAccessToken()).toBeNull();
      expect(service.getRefreshToken()).toBeNull();
    });
  });

  describe('authentication state', () => {
    it('should initialize with stored user and token', () => {
      localStorage.setItem('voldemort_access_token', 'access-token');
      localStorage.setItem('voldemort_user', JSON.stringify(mockUser));

      service = TestBed.inject(AuthService);

      service.authState$.subscribe(state => {
        expect(state.isAuthenticated).toBeTruthy();
        expect(state.user).toEqual(mockUser);
      });
    });

    it('should return current user', () => {
      localStorage.setItem('voldemort_access_token', 'access-token');
      localStorage.setItem('voldemort_user', JSON.stringify(mockUser));

      service = TestBed.inject(AuthService);

      expect(service.getCurrentUser()).toEqual(mockUser);
    });

    it('should return authentication status', () => {
      localStorage.setItem('voldemort_access_token', 'access-token');
      localStorage.setItem('voldemort_user', JSON.stringify(mockUser));

      service = TestBed.inject(AuthService);

      expect(service.isAuthenticated()).toBeTruthy();
    });
  });
});
