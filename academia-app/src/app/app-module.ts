import { NgModule, LOCALE_ID, APP_INITIALIZER, provideBrowserGlobalErrorListeners } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient, withInterceptorsFromDi, HTTP_INTERCEPTORS } from '@angular/common/http';

registerLocaleData(localeEs);
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';

import { AppRoutingModule } from './app-routing-module';
import { App } from './app';
import { authReducer } from './store/auth/auth.reducer';
import { examReducer } from './store/exam/exam.reducer';
import { AuthEffects } from './store/auth/auth.effects';
import { AuthInterceptor } from './core/interceptors/auth.interceptor';
import { environment } from '../environments/environment';
import { LayoutModule } from './layout/layout.module';

function wakeUpBackend() {
  return () => fetch(environment.apiUrl + '/actuator/health', { mode: 'no-cors' }).catch(() => {});
}

@NgModule({
  declarations: [App],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    LayoutModule,
    StoreModule.forRoot({
      auth: authReducer,
      exam: examReducer,
    }),
    EffectsModule.forRoot([AuthEffects]),
    StoreDevtoolsModule.instrument({
      maxAge: 25,
      logOnly: environment.production,
    }),
  ],
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(withInterceptorsFromDi()),
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    { provide: LOCALE_ID, useValue: 'es' },
    { provide: APP_INITIALIZER, useFactory: wakeUpBackend, multi: true },
  ],
  bootstrap: [App],
})
export class AppModule {}
