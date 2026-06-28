import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { Store } from '@ngrx/store';
import { map, take } from 'rxjs';
import { selectCurrentUser } from '../../store/auth/auth.selectors';

export const rolesGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const store = inject(Store);
  const router = inject(Router);
  const allowedRoles: string[] = route.data['roles'] ?? [];

  return store.select(selectCurrentUser).pipe(
    take(1),
    map((user) => {
      if (!user || !allowedRoles.includes(user.role)) {
        return router.createUrlTree(['/dashboard']);
      }
      return true;
    }),
  );
};
