import { AsyncPipe } from '@angular/common';
import { Component, inject, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Router } from '@angular/router';
import { combineLatest } from 'rxjs';

import { AUTH_FACADE } from '../tokens';

@Component({
  selector: 'aa-reset-password',
  imports: [
    AsyncPipe,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
  ],
  templateUrl: './reset-password.component.html',
})
export class ResetPasswordComponent {
  private readonly authFacade = inject(AUTH_FACADE);
  readonly switch = output<'login' | 'register' | 'reset-password'>();

  readonly resetPasswordForm = new FormGroup({
    email: new FormControl('', {
      validators: [Validators.required, Validators.email],
      nonNullable: true,
    }),
  });

  readonly vm$ = combineLatest({
    isLoading: this.authFacade.isLoadingLogin$,
    showLoginError: this.authFacade.hasLoginError$,
  });

  isResetSent = false;

  submit() {
    if (this.resetPasswordForm.valid) {
      const { email } = this.resetPasswordForm.value;
      this.authFacade.resetPassword(email as string);
      this.isResetSent = true;
    }
  }

  goToLogin() {
    this.switch.emit('login');
  }
}
