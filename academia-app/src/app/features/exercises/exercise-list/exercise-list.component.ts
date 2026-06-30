import { ChangeDetectorRef, Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subject, switchMap, of } from 'rxjs';
import { timeout, catchError, takeUntil, debounceTime, distinctUntilChanged, tap } from 'rxjs/operators';
import { ApiService } from '../../../core/services/api.service';

interface Exercise {
  id: string;
  title: string;
  difficulty: 'basic' | 'intermediate' | 'advanced';
  isParametric: boolean;
  needsGraph: boolean;
  topic?: { id: string; name: string };
}

@Component({
  selector: 'app-exercise-list',
  templateUrl: './exercise-list.component.html',
  standalone: false,
})
export class ExerciseListComponent implements OnInit, OnDestroy {
  exercises: Exercise[] = [];
  loading = false;
  error = '';
  searchQuery = '';
  filterDifficulty = '';

  difficultyLabel: Record<string, string> = {
    basic: 'Básico',
    intermediate: 'Intermedio',
    advanced: 'Avanzado',
  };

  difficultyColor: Record<string, string> = {
    basic: 'bg-green-100 text-green-700',
    intermediate: 'bg-yellow-100 text-yellow-700',
    advanced: 'bg-red-100 text-red-700',
  };

  private destroy$ = new Subject<void>();

  constructor(private api: ApiService, private route: ActivatedRoute, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.route.queryParams.pipe(
      takeUntil(this.destroy$),
      distinctUntilChanged((a, b) => a['topicId'] === b['topicId'] && a['difficulty'] === b['difficulty']),
      tap(() => { this.loading = true; this.error = ''; }),
      switchMap((params) => {
        if (params['difficulty']) this.filterDifficulty = params['difficulty'];
        const p = params['topicId'] ? { topicId: params['topicId'] } : undefined;
        return this.api.get<Exercise[]>('exercises', p).pipe(
          timeout(15000),
          catchError((err) => {
            this.error = err?.name === 'TimeoutError'
              ? 'Backend no responde (15s). Verifica que esté corriendo en puerto 3000.'
              : `Error ${err?.status ?? ''}: ${err?.message ?? 'No se pudo cargar ejercicios'}`;
            return of([] as Exercise[]);
          }),
        );
      }),
    ).subscribe((data) => {
      this.exercises = Array.isArray(data) ? data : [];
      this.loading = false;
      this.cdr.detectChanges();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get filtered(): Exercise[] {
    return this.exercises.filter((e) => {
      const matchSearch =
        !this.searchQuery.trim() ||
        e.title.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        (e.topic?.name ?? '').toLowerCase().includes(this.searchQuery.toLowerCase());
      const matchDifficulty = !this.filterDifficulty || e.difficulty === this.filterDifficulty;
      return matchSearch && matchDifficulty;
    });
  }
}
