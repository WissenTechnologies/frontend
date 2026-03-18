import { AsyncPipe } from '@angular/common';
import { Component, inject, output } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Router } from '@angular/router';
import { combineLatest } from 'rxjs';

import { AUTH_FACADE } from '../tokens';

@Component({
  selector: 'aa-register',
  imports: [
    AsyncPipe,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
  ],
  templateUrl: './register.component.html',
})
export class RegisterComponent {
  private readonly authFacade = inject(AUTH_FACADE);
  readonly switch = output<'login' | 'register' | 'reset-password'>();
  isOtpStep = false;

  readonly registerForm = new FormGroup({
    username: new FormControl('', {
      validators: [Validators.required],
      nonNullable: true,
    }),
    email: new FormControl('', {
      validators: [Validators.required, Validators.email],
      nonNullable: true,
    }),
    password: new FormControl('', {
      validators: [Validators.required, Validators.minLength(6)],
      nonNullable: true,
    }),
    confirmPassword: new FormControl('', {
      validators: [Validators.required],
      nonNullable: true,
    }),
    otp: new FormControl('', {
      validators: [Validators.required, Validators.minLength(6)],
      nonNullable: true,
    }),
  }, { validators: this.passwordMatchValidator });

  readonly vm$ = combineLatest({
    isLoading: this.authFacade.isLoadingLogin$,
    showLoginError: this.authFacade.hasLoginError$,
    isLoggedIn: this.authFacade.isLoggedIn$,
  });

  passwordMatchValidator(control: AbstractControl) {
    const password = control.get('password')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  submit() {
    if (!this.isOtpStep) {
      if (this.registerForm.get('username')?.valid && 
          this.registerForm.get('email')?.valid && 
          this.registerForm.get('password')?.valid && 
          !this.registerForm.hasError('passwordMismatch')) {
        
        const { username, email, password } = this.registerForm.value;
        this.authFacade.register(username as string, email as string, password as string);
        this.isOtpStep = true; // Switch to OTP input
      }
    } else {
      if (this.registerForm.get('otp')?.valid) {
        const { email, otp } = this.registerForm.value;
        this.authFacade.verifyRegistrationOtp(email as string, otp as string);
      }
    }
  }

  goToLogin() {
    this.switch.emit('login');
  }
}
