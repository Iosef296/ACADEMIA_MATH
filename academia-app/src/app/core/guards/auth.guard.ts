import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { filter, map, switchMap, take, race, timer } from 'rxjs';
import { selectIsAuthenticated, selectInitialized } from '../../store/auth/auth.selectors';
import { StorageService } from '../services/storage.service';

export const authGuard: CanActivateFn = () => {
  const store = inject(Store);
  const router = inject(Router);
  const storage = inject(StorageService);

  // Fast path: if token in storage and store already initialized, skip waiting
  const token = storage.get<string>('access_token');

  const initialized$ = store.select(selectInitialized).pipe(
    filter((initialized) => initialized),
    take(1),
  );

  // Race: either store initializes within 3s, or we fall back to token check
  const withTimeout$ = race(
    initialized$,
    timer(3000).pipe(map(() => true)),
  );

  return withTimeout$.pipe(
    take(1),
    switchMap(() => store.select(selectIsAuthenticated).pipe(take(1))),
    map((authenticated) => {
      // If store says authenticated OR token exists in storage, allow
      if (authenticated || !!token) return true;
      return router.createUrlTree(['/auth/login']);
    }),
  );
};
