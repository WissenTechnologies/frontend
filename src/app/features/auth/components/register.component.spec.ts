import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { of } from 'rxjs';

import { RegisterComponent } from './register.component';
import { AuthService } from '../../../core/services/auth.service';
import { RegisterRequest } from '../../../core/models/user.model';

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;
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
    const authSpy = jasmine.createSpyObj('AuthService', ['register'], {
      authState$: of({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
      })
    });
    
    const routeSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, RegisterComponent],
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
    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with empty fields', () => {
    expect(component.registerForm.value).toEqual({
      name: '',
      email: '',
      password: '',
      confirmPassword: ''
    });
  });

  it('should validate required fields', () => {
    component.registerForm.setValue({
      name: '',
      email: '',
      password: '',
      confirmPassword: ''
    });
    expect(component.registerForm.invalid).toBeTruthy();
    expect(component.name?.errors?.['required']).toBeTruthy();
    expect(component.email?.errors?.['required']).toBeTruthy();
    expect(component.password?.errors?.['required']).toBeTruthy();
    expect(component.confirmPassword?.errors?.['required']).toBeTruthy();
  });

  it('should validate name minimum length', () => {
    component.registerForm.setValue({
      name: 'A',
      email: 'test@example.com',
      password: 'password123',
      confirmPassword: 'password123'
    });
    expect(component.name?.errors?.['minlength']).toBeTruthy();
  });

  it('should validate email format', () => {
    component.registerForm.setValue({
      name: 'Test User',
      email: 'invalid-email',
      password: 'password123',
      confirmPassword: 'password123'
    });
    expect(component.email?.errors?.['email']).toBeTruthy();
  });

  it('should validate password minimum length', () => {
    component.registerForm.setValue({
      name: 'Test User',
      email: 'test@example.com',
      password: '123',
      confirmPassword: '123'
    });
    expect(component.password?.errors?.['minlength']).toBeTruthy();
  });

  it('should validate password matching', () => {
    component.registerForm.setValue({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      confirmPassword: 'different-password'
    });
    expect(component.confirmPassword?.errors?.['passwordMismatch']).toBeTruthy();
  });

  it('should pass validation when passwords match', () => {
    component.registerForm.setValue({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      confirmPassword: 'password123'
    });
    expect(component.registerForm.valid).toBeTruthy();
    expect(component.confirmPassword?.errors?.['passwordMismatch']).toBeUndefined();
  });

  it('should call authService.register when form is valid', () => {
    const registerData: RegisterRequest = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      confirmPassword: 'password123'
    };

    component.registerForm.setValue(registerData);
    component.onSubmit();

    expect(authServiceSpy.register).toHaveBeenCalledWith(registerData);
  });

  it('should not call authService.register when form is invalid', () => {
    component.registerForm.setValue({
      name: '',
      email: '',
      password: '',
      confirmPassword: ''
    });
    component.onSubmit();

    expect(authServiceSpy.register).not.toHaveBeenCalled();
  });

  it('should toggle password visibility', () => {
    expect(component.hidePassword).toBeTrue();
    
    component.togglePasswordVisibility();
    expect(component.hidePassword).toBeFalse();
    
    component.togglePasswordVisibility();
    expect(component.hidePassword).toBeTrue();
  });

  it('should toggle confirm password visibility', () => {
    expect(component.hideConfirmPassword).toBeTrue();
    
    component.toggleConfirmPasswordVisibility();
    expect(component.hideConfirmPassword).toBeFalse();
    
    component.toggleConfirmPasswordVisibility();
    expect(component.hideConfirmPassword).toBeTrue();
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
    const errorMessage = 'User already exists';
    
    (authServiceSpy.authState$ as any).next({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: errorMessage
    });

    expect(component.errorMessage).toBe(errorMessage);
  });

  it('should have proper form getters', () => {
    expect(component.name).toBeTruthy();
    expect(component.email).toBeTruthy();
    expect(component.password).toBeTruthy();
    expect(component.confirmPassword).toBeTruthy();
  });

  it('should handle form submission with valid data', () => {
    const registerData: RegisterRequest = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      confirmPassword: 'password123'
    };

    component.registerForm.setValue(registerData);
    expect(component.registerForm.valid).toBeTruthy();

    component.onSubmit();
    expect(authServiceSpy.register).toHaveBeenCalledWith(registerData);
  });

  it('should validate password match dynamically', () => {
    component.registerForm.setValue({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      confirmPassword: 'different'
    });

    expect(component.registerForm.errors?.['passwordMismatch']).toBeTruthy();

    component.registerForm.patchValue({ confirmPassword: 'password123' });
    
    expect(component.registerForm.errors?.['passwordMismatch']).toBeUndefined();
  });
});
