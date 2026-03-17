import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { of } from 'rxjs';

import { LoginComponent } from './login.component';
import { AuthService } from '../../../core/services/auth.service';
import { LoginRequest } from '../../../core/models/user.model';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;

  const mockUser = {
    id: '1',
    email: 'test@example.com',
    name: 'Test User',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  };

  beforeEach(async () => {
    const authSpy = jasmine.createSpyObj('AuthService', ['login'], {
      authState$: of({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
      })
    });
    
    const routeSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, LoginComponent],
      providers: [
        FormBuilder,
        { provide: AuthService, useValue: authSpy },
        { provide: Router, useValue: routeSpy }
      ]
    })
    .compileComponents();

    authServiceSpy = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    routerSpy = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with empty fields', () => {
    expect(component.loginForm.value).toEqual({
      email: '',
      password: ''
    });
  });

  it('should validate required fields', () => {
    component.loginForm.setValue({ email: '', password: '' });
    expect(component.loginForm.invalid).toBeTruthy();
    expect(component.email?.errors?.['required']).toBeTruthy();
    expect(component.password?.errors?.['required']).toBeTruthy();
  });

  it('should validate email format', () => {
    component.loginForm.setValue({ email: 'invalid-email', password: 'password123' });
    expect(component.email?.errors?.['email']).toBeTruthy();
  });

  it('should validate password minimum length', () => {
    component.loginForm.setValue({ email: 'test@example.com', password: '123' });
    expect(component.password?.errors?.['minlength']).toBeTruthy();
  });

  it('should call authService.login when form is valid', () => {
    const loginData: LoginRequest = {
      email: 'test@example.com',
      password: 'password123'
    };

    component.loginForm.setValue(loginData);
    component.onSubmit();

    expect(authServiceSpy.login).toHaveBeenCalledWith(loginData);
  });

  it('should not call authService.login when form is invalid', () => {
    component.loginForm.setValue({ email: '', password: '' });
    component.onSubmit();

    expect(authServiceSpy.login).not.toHaveBeenCalled();
  });

  it('should toggle password visibility', () => {
    expect(component.hidePassword).toBeTrue();
    
    component.togglePasswordVisibility();
    expect(component.hidePassword).toBeFalse();
    
    component.togglePasswordVisibility();
    expect(component.hidePassword).toBeTrue();
  });

  it('should navigate to dashboard on successful authentication', () => {
    (authServiceSpy.authState$ as any).next({
      user: mockUser,
      isAuthenticated: true,
      isLoading: false,
      error: null
    });

    expect(routerSpy.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('should set loading state from auth service', () => {
    (authServiceSpy.authState$ as any).next({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      error: null
    });

    expect(component.isLoading).toBeTrue();
  });

  it('should display error message from auth service', () => {
    const errorMessage = 'Invalid credentials';
    
    (authServiceSpy.authState$ as any).next({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: errorMessage
    });

    expect(component.errorMessage).toBe(errorMessage);
  });

  it('should have proper form getters', () => {
    expect(component.email).toBeTruthy();
    expect(component.password).toBeTruthy();
  });

  it('should handle form submission with valid data', () => {
    const loginData: LoginRequest = {
      email: 'test@example.com',
      password: 'password123'
    };

    component.loginForm.setValue(loginData);
    expect(component.loginForm.valid).toBeTruthy();

    component.onSubmit();
    expect(authServiceSpy.login).toHaveBeenCalledWith(loginData);
  });
});
