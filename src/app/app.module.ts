import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule, provideHttpClient, withInterceptors } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { NgxsModule } from '@ngxs/store';

import { AppComponent } from './app.component';
import { HeaderComponent } from './shared/ui/header/header.component';
import { FooterComponent } from './shared/ui/footer/footer.component';

// Auth Components
import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';
import { ResetPasswordComponent } from './auth/reset-password/reset-password.component';

// Feature Components
import { MarketComponent } from './features/market/market.component';
import { TerminalComponent } from './features/terminal/terminal.component';

// Guards
import { authGuard } from './auth/guards/auth.guard';

// Interceptors
import { authInterceptor } from './auth/interceptors/auth.interceptor';
import { fakeApiInterceptor } from './core/fake-api/fake-api.interceptor';

import { environment } from '../environments/environment';

// Services
import { ConfigService } from './core/services/config.service';
import { GoogleAnalyticsService } from './core/services/google-analytics.service';
import { TokenStorageService } from './core/services/token-storage.service';

// Store
import { provideAuthInit } from './auth/store/ngxs/index';
import { NgxsAuthFacade } from './auth/store/ngxs/auth.facade';
import { AuthState } from './auth/store/ngxs/auth.state';
import { AUTH_FACADE } from './auth/tokens';

@NgModule({
  declarations: [],
  imports: [
    BrowserModule,
    HttpClientModule,
    RouterModule,
    NgxsModule.forRoot([AuthState]),
    AppComponent,
    HeaderComponent,
    FooterComponent,
    LoginComponent,
    RegisterComponent,
    ResetPasswordComponent,
    MarketComponent,
    TerminalComponent
  ],
  providers: [
    provideAuthInit(),
    provideHttpClient(
      withInterceptors([
        authInterceptor,
        ...(environment.apiUrl ? [] : [fakeApiInterceptor])
      ])
    ),
    ConfigService,
    GoogleAnalyticsService,
    TokenStorageService,
    NgxsAuthFacade,
    { provide: AUTH_FACADE, useClass: NgxsAuthFacade }
  ]
})
export class AppModule {
}
