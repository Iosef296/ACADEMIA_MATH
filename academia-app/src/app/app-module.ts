import { NgModule, LOCALE_ID, provideBrowserGlobalErrorListeners } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

registerLocaleData(localeEs);
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';

import { AppRoutingModule } from './app-routing-module';
import { App } from './app';
import { authReducer } from './store/auth/auth.reducer';
import { examReducer } from './store/exam/exam.reducer';
import { AuthEffects } from './store/auth/auth.effects';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { environment } from '../environments/environment';
import { LayoutModule } from './layout/layout.module';

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
    provideHttpClient(withInterceptors([authInterceptor])),
    { provide: LOCALE_ID, useValue: 'es' },
  ],
  bootstrap: [App],
})
export class AppModule {}
