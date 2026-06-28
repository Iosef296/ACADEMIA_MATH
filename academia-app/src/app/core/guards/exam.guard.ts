import { inject } from '@angular/core';
import { CanDeactivateFn } from '@angular/router';
import { Store } from '@ngrx/store';
import { map, take } from 'rxjs';
import { selectExamActive } from '../../store/exam/exam.selectors';

export interface CanExitExam {
  canExitExam(): boolean;
}

export const examGuard: CanDeactivateFn<CanExitExam> = (component) => {
  const store = inject(Store);

  return store.select(selectExamActive).pipe(
    take(1),
    map((active) => {
      if (!active) return true;
      return confirm('¿Seguro que quieres salir? Tu progreso en el examen se perderá.');
    }),
  );
};
