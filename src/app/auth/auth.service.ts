import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, throwError } from 'rxjs';

import { ConfigService, TokenStorageService } from '../core/services';

import { AuthUser } from './models';

export interface AccessData {
  token_type: 'Bearer';
  expires_in: number;
  access_token: string;
  refresh_token: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly configService = inject(ConfigService);
  private readonly tokenStorageService = inject(TokenStorageService);

  private readonly hostUrl = this.configService.getAPIUrl();
  private readonly clientId = this.configService.getAuthSettings().clientId;
  private readonly clientSecret = this.configService.getAuthSettings().secretId;

  /**
   * Performs a request with user credentials
   * in order to get auth tokens
   *
   * @param {string} username
   * @param {string} password
   * @returns Observable<AccessData>
   */
  login(username: string, password: string): Observable<AccessData> {
    return this.http.post<AccessData>(`${this.hostUrl}/auth/login`, {
      username,
      password,
    });
  }

  logout(): Observable<void> {
    return this.http.post<void>(`${this.hostUrl}/auth/logout`, {});
  }

  refreshToken(): Observable<AccessData> {
    const refreshToken = this.tokenStorageService.getRefreshToken();
    if (!refreshToken) {
      return throwError(() => new Error('Refresh token does not exist'));
    }

    return this.http.post<AccessData>(`${this.hostUrl}/auth/refresh-token`, {
      refresh_token: refreshToken,
    });
  }

  register(username: string, email: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.hostUrl}/auth/register`, {
      username,
      email,
      password,
    });
  }

  verifyRegistrationOtp(email: string, otp: string): Observable<AccessData> {
    return this.http.post<AccessData>(`${this.hostUrl}/auth/verify-registration-otp`, {
      email,
      otp
    });
  }

  resetPassword(email: string): Observable<void> {
    return this.http.post<void>(`${this.hostUrl}/auth/send-otp`, {
      email,
    });
  }

  getAuthUser(): Observable<AuthUser> {
    return this.http.get<any>(`${this.hostUrl}/auth/me`).pipe(
      map(raw => {
        const email = (raw?.email ?? raw?.username ?? '').toString();
        const username = (raw?.username ?? '').toString();
        const roleRaw = (raw?.role ?? '').toString();

        const role = roleRaw.toLowerCase() === 'admin' ? 'admin' : 'user';

        const nameSource = username || email;
        const nameParts = nameSource
          .replace(/@.*$/, '')
          .replace(/[._-]+/g, ' ')
          .trim()
          .split(' ')
          .filter(Boolean);

        const firstName = nameParts[0] ?? '';
        const lastName = nameParts.slice(1).join(' ');

        return {
          id: Number(raw?.id ?? 0),
          firstName,
          lastName,
          email,
          role,
        } satisfies AuthUser;
      })
    );
  }
}
