import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Router } from '@angular/router';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { of } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { StorageService } from '../../core/services/storage.service';
import * as AuthActions from './auth.actions';

@Injectable()
export class AuthEffects {
  private actions$ = inject(Actions);
  private api = inject(ApiService);
  private storage = inject(StorageService);
  private router = inject(Router);

  login$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.login),
      switchMap(({ email, password }) =>
        this.api.post<any>('auth/login', { email, password }).pipe(
          map((res) => {
            this.storage.set('access_token', res.access_token);
            this.storage.set('refresh_token', res.refresh_token);
            return AuthActions.loginSuccess({ user: res.user, access_token: res.access_token, refresh_token: res.refresh_token });
          }),
          catchError((err) => of(AuthActions.loginFailure({ error: err.error?.message ?? 'Error al iniciar sesión' }))),
        ),
      ),
    ),
  );

  register$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.register),
      switchMap(({ name, email, password, role }) =>
        this.api.post<any>('auth/register', { name, email, password, role }).pipe(
          map((res) => {
            this.storage.set('access_token', res.access_token);
            this.storage.set('refresh_token', res.refresh_token);
            return AuthActions.registerSuccess({ user: res.user, access_token: res.access_token, refresh_token: res.refresh_token });
          }),
          catchError((err) => of(AuthActions.registerFailure({ error: err.error?.message ?? 'Error al registrarse' }))),
        ),
      ),
    ),
  );

  loginSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.loginSuccess, AuthActions.registerSuccess),
      tap(() => this.router.navigate(['/dashboard'])),
    ),
    { dispatch: false },
  );

  logout$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.logout),
      tap(() => {
        this.storage.clear();
        this.router.navigate(['/auth/login']);
      }),
    ),
    { dispatch: false },
  );

  loadFromStorage$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.loadUserFromStorage),
      switchMap(() => {
        const token = this.storage.get<string>('access_token');
        const refresh = this.storage.get<string>('refresh_token');
        if (!token) return of(AuthActions.logout());
        return this.api.get<any>('users/me').pipe(
          map((user) => AuthActions.setUser({ user, access_token: token!, refresh_token: refresh! })),
          catchError(() => of(AuthActions.logout())),
        );
      }),
    ),
  );
}
