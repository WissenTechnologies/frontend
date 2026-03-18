import { inject, Injectable } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Action, State, StateContext } from '@ngxs/store';
import { catchError, finalize, switchMap, tap, throwError } from 'rxjs';

import { TokenStorageService } from '../../../core/services';
import { AuthService } from '../../auth.service';
import { AuthStateModel, TokenStatus } from '../../models';

import { Login, Logout, RefreshToken, FetchAuthUser, Register, ResetPassword, VerifyRegistrationOtp } from './auth.actions';

const AUTH_FEATURE_KEY = 'auth';

const initialState: AuthStateModel = {
  isLoggedIn: false,
  user: undefined,
  accessTokenStatus: TokenStatus.PENDING,
  refreshTokenStatus: TokenStatus.PENDING,
  isLoadingLogin: false,
  hasLoginError: false,
};

@State<AuthStateModel>({
  name: AUTH_FEATURE_KEY,
  defaults: initialState,
})
@Injectable()
export class AuthState {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly tokenStorageService = inject(TokenStorageService);

  @Action(Login)
  login(ctx: StateContext<AuthStateModel>, action: Login) {
    ctx.patchState({
      accessTokenStatus: TokenStatus.VALIDATING,
      isLoadingLogin: true,
      hasLoginError: false,
    });

    return this.authService.login(action.username, action.password).pipe(
      switchMap(data => {
        this.tokenStorageService.saveTokens(data.access_token, data.refresh_token);

        ctx.patchState({
          isLoggedIn: true,
          isLoadingLogin: false,
          accessTokenStatus: TokenStatus.VALID,
          refreshTokenStatus: TokenStatus.VALID,
        });

        // Redirect to market (dashboard)
        const returnUrl = this.activatedRoute.snapshot.queryParams['returnUrl'] || '/market';
        this.router.navigateByUrl(returnUrl);

        return ctx.dispatch(new FetchAuthUser());
      }),
      catchError(error => {
        ctx.patchState({
          isLoadingLogin: false,
          accessTokenStatus: TokenStatus.INVALID,
          refreshTokenStatus: TokenStatus.INVALID,
          hasLoginError: true,
        });

        this.tokenStorageService.removeTokens();

        return throwError(() => error);
      })
    );
  }

  @Action(Logout)
  logout(ctx: StateContext<AuthStateModel>) {
    ctx.setState({ ...initialState });

    this.router.navigateByUrl('/');

    return this.authService
      .logout()
      .pipe(finalize(() => this.tokenStorageService.removeTokens()));
  }

  @Action(FetchAuthUser)
  authUserRequest(ctx: StateContext<AuthStateModel>) {
    return this.authService.getAuthUser().pipe(
      tap(user => ctx.patchState({ user })),
      catchError(error => {
        ctx.setState({ ...initialState });
        return throwError(() => error);
      })
    );
  }

  @Action(Register)
  register(ctx: StateContext<AuthStateModel>, action: Register) {
    ctx.patchState({
      isLoadingLogin: true,
      hasLoginError: false,
    });

    return this.authService.register(
      action.username, 
      action.email, 
      action.password
    ).pipe(
      tap(() => {
        ctx.patchState({ isLoadingLogin: false });
        // Handled by component: navigate to OTP verification or show message
      }),
      catchError(error => {
        ctx.patchState({
          isLoadingLogin: false,
          hasLoginError: true,
        });
        return throwError(() => error);
      })
    );
  }

  @Action(VerifyRegistrationOtp)
  verifyRegistrationOtp(ctx: StateContext<AuthStateModel>, action: VerifyRegistrationOtp) {
    ctx.patchState({
      isLoadingLogin: true,
      hasLoginError: false,
    });

    return this.authService.verifyRegistrationOtp(action.email, action.otp).pipe(
      switchMap(data => {
        this.tokenStorageService.saveTokens(data.access_token, data.refresh_token);

        ctx.patchState({
          isLoggedIn: true,
          isLoadingLogin: false,
          accessTokenStatus: TokenStatus.VALID,
          refreshTokenStatus: TokenStatus.VALID,
        });

        this.router.navigateByUrl('/market');

        return ctx.dispatch(new FetchAuthUser());
      }),
      catchError(error => {
        ctx.patchState({
          isLoadingLogin: false,
          hasLoginError: true,
        });
        return throwError(() => error);
      })
    );
  }

  @Action(ResetPassword)
  resetPassword(ctx: StateContext<AuthStateModel>, action: ResetPassword) {
    return this.authService.resetPassword(action.email).pipe(
      tap(() => {
        // Password reset email sent successfully
        // The component will handle the success message
      }),
      catchError(error => {
        ctx.patchState({
          hasLoginError: true,
        });

        return throwError(() => error);
      })
    );
  }

  @Action(RefreshToken)
  refreshTokenRequest(ctx: StateContext<AuthStateModel>) {
    ctx.patchState({ refreshTokenStatus: TokenStatus.VALIDATING });

    return this.authService.refreshToken().pipe(
      switchMap(data => {
        this.tokenStorageService.saveTokens(data.access_token, data.refresh_token);

        ctx.patchState({
          isLoggedIn: true,
          isLoadingLogin: false,
          accessTokenStatus: TokenStatus.VALID,
          refreshTokenStatus: TokenStatus.VALID,
        });

        return ctx.dispatch(new FetchAuthUser());
      }),
      catchError(error => {
        ctx.patchState({
          isLoadingLogin: false,
          accessTokenStatus: TokenStatus.INVALID,
          refreshTokenStatus: TokenStatus.INVALID,
        });

        this.tokenStorageService.removeTokens();

        return throwError(() => error);
      })
    );
  }
}
