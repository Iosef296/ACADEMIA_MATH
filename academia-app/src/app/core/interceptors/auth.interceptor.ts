import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { BehaviorSubject, catchError, filter, from, switchMap, take, throwError } from 'rxjs';
import { StorageService } from '../services/storage.service';
import { logout, setUser } from '../../store/auth/auth.actions';
import { environment } from '../../../environments/environment';

let isRefreshing = false;
const refreshDone$ = new BehaviorSubject<string | null>(null);

function addToken(req: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
  return req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
}

async function doRefresh(refreshToken: string): Promise<any> {
  const res = await fetch(`${environment.apiUrl}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });
  if (!res.ok) throw new Error('refresh_failed');
  return res.json();
}

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const storage = inject(StorageService);
  const store = inject(Store);

  const token = storage.get<string>('access_token');
  const outgoing = token ? addToken(req, token) : req;

  return next(outgoing).pipe(
    catchError((err: HttpErrorResponse) => {
      const isAuthEndpoint = req.url.includes('/auth/');
      if ((err.status === 401 || err.status === 403) && !isAuthEndpoint) {
        const refresh = storage.get<string>('refresh_token');
        if (!refresh) {
          store.dispatch(logout());
          return throwError(() => err);
        }

        if (!isRefreshing) {
          isRefreshing = true;
          refreshDone$.next(null);

          return from(doRefresh(refresh)).pipe(
            switchMap((res) => {
              isRefreshing = false;
              storage.set('access_token', res.access_token);
              storage.set('refresh_token', res.refresh_token);
              store.dispatch(setUser({ user: res.user, access_token: res.access_token, refresh_token: res.refresh_token }));
              refreshDone$.next(res.access_token);
              return next(addToken(req, res.access_token));
            }),
            catchError((refreshErr) => {
              isRefreshing = false;
              refreshDone$.next(null);
              store.dispatch(logout());
              return throwError(() => refreshErr);
            }),
          );
        } else {
          return refreshDone$.pipe(
            filter((t) => t !== null),
            take(1),
            switchMap((newToken) => next(addToken(req, newToken!))),
          );
        }
      }
      return throwError(() => err);
    }),
  );
};
