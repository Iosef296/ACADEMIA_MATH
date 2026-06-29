import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse,
} from '@angular/common/http';
import { Store } from '@ngrx/store';
import { BehaviorSubject, Observable, from, throwError } from 'rxjs';
import { catchError, filter, switchMap, take } from 'rxjs/operators';
import { StorageService } from '../services/storage.service';
import { logout, setUser } from '../../store/auth/auth.actions';
import { environment } from '../../../environments/environment';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private refreshTokenSubject = new BehaviorSubject<string | null>(null);

  constructor(private storage: StorageService, private store: Store) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const token = this.storage.get<string>('access_token');
    const outgoing = token ? this.addToken(request, token) : request;

    return next.handle(outgoing).pipe(
      catchError((err: HttpErrorResponse) => {
        const isAuthEndpoint = request.url.includes('/auth/');
        if ((err.status === 401 || err.status === 403) && !isAuthEndpoint) {
          return this.handle401(request, next, err);
        }
        return throwError(() => err);
      }),
    );
  }

  private addToken(req: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
    return req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }

  private async doRefresh(refreshToken: string): Promise<any> {
    const res = await fetch(`${environment.apiUrl}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) throw new Error('refresh_failed');
    return res.json();
  }

  private handle401(
    request: HttpRequest<unknown>,
    next: HttpHandler,
    err: HttpErrorResponse,
  ): Observable<HttpEvent<unknown>> {
    const refresh = this.storage.get<string>('refresh_token');
    if (!refresh) {
      this.store.dispatch(logout());
      return throwError(() => err);
    }

    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      return from(this.doRefresh(refresh)).pipe(
        switchMap((res) => {
          this.isRefreshing = false;
          this.storage.set('access_token', res.access_token);
          this.storage.set('refresh_token', res.refresh_token);
          this.store.dispatch(
            setUser({ user: res.user, access_token: res.access_token, refresh_token: res.refresh_token }),
          );
          this.refreshTokenSubject.next(res.access_token);
          return next.handle(this.addToken(request, res.access_token));
        }),
        catchError((refreshErr) => {
          this.isRefreshing = false;
          this.store.dispatch(logout());
          return throwError(() => refreshErr);
        }),
      );
    } else {
      return this.refreshTokenSubject.pipe(
        filter((token) => token !== null),
        take(1),
        switchMap((token) => next.handle(this.addToken(request, token!))),
      );
    }
  }
}
