import { Component, OnInit } from '@angular/core';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { ResetPasswordComponent } from './reset-password/reset-password.component';

export type AuthMode = 'login' | 'register' | 'reset-password';

@Component({
  selector: 'aa-auth',
  standalone: true,
  imports: [LoginComponent, RegisterComponent, ResetPasswordComponent],
  template: `
    <div class="auth-container">
      @switch (mode) {
        @case ('login') {
          <aa-login (switch)="onSwitch($event)" />
        }
        @case ('register') {
          <aa-register (switch)="onSwitch($event)" />
        }
        @case ('reset-password') {
          <aa-reset-password (switch)="onSwitch($event)" />
        }
      }
    </div>
  `,
  styles: [`
    .auth-container {
      display: block;
      width: 100%;
    }
  `]
})
export class AuthComponent implements OnInit {
  mode: AuthMode = 'login';

  ngOnInit() {
    const path = window.location.pathname;
    if (path.includes('register')) {
      this.mode = 'register';
    } else if (path.includes('reset-password')) {
      this.mode = 'reset-password';
    }
  }

  onSwitch(newMode: AuthMode) {
    this.mode = newMode;
    // Optional: update URL without full navigation
    window.history.pushState({}, '', `/auth/${newMode}`);
  }
}
