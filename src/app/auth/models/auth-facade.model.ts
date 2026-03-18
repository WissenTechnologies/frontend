import { Observable } from 'rxjs';

import { AuthUser } from './auth-user.model';

export interface IAuthFacade {
  readonly authUser$: Observable<AuthUser | undefined>;
  readonly isLoggedIn$: Observable<boolean>;
  readonly isLoadingLogin$: Observable<boolean>;
  readonly hasLoginError$: Observable<boolean>;

  login(username: string, password: string): void;
  logout(): void;
  getAuthUser(): void;
  register(username: string, email: string, password: string): void;
  verifyRegistrationOtp(email: string, otp: string): void;
  resetPassword(email: string): void;
}
