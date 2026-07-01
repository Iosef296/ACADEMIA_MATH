import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { Subject, firstValueFrom } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ApiService } from '../../../core/services/api.service';
import { selectUserRole } from '../../../store/auth/auth.selectors';

interface Exercise {
  id: string;
  title: string;
  difficulty: 'basic' | 'intermediate' | 'advanced';
  is_parametric: boolean;
  needs_graph: boolean;
}

interface Topic {
  id: string;
  name: string;
  description: string;
  is_locked: boolean;
  difficulty?: string;
  estimated_minutes?: number;
  children?: Topic[];
}

interface Progress {
  xp: number;
  level: number;
  exercises_solved: number;
  error_count: number;
}

@Component({
  selector: 'app-topic-detail',
  templateUrl: './topic-detail.component.html',
  standalone: false,
})
export class TopicDetailComponent implements OnInit, OnDestroy {
  topicId = '';
  topic: Topic | null = null;
  exercises: Exercise[] = [];
  progress: Progress | null = null;
  loading = false;
  error = '';
  success = '';
  userRole: string | undefined;

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

  // Create child topic modal
  showCreate = false;
  createForm = { name: '', description: '', difficulty: 'basico', estimated_minutes: 0 };
  creating = false;

  difficulties = [
    { value: 'basico', label: 'Básico' },
    { value: 'intermedio', label: 'Intermedio' },
    { value: 'avanzado', label: 'Avanzado' },
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private api: ApiService,
    private store: Store,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.topicId = this.route.snapshot.paramMap.get('id') ?? '';
    this.store.select(selectUserRole).pipe(takeUntil(this.destroy$)).subscribe(role => {
      this.userRole = role;
    });
    this.loadTopic();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get canManage(): boolean {
    return this.userRole === 'admin' || this.userRole === 'teacher';
  }

  get isCourse(): boolean { return !!(this.topic?.children?.length); }

  get xpToNextLevel(): number {
    if (!this.progress) return 100;
    return 100 - (this.progress.xp % 100);
  }

  get xpPercent(): number {
    if (!this.progress) return 0;
    return this.progress.xp % 100;
  }

  loadTopic(): void {
    this.loading = true;
    Promise.all([
      firstValueFrom(this.api.get<Topic>(`topics/${this.topicId}`)),
      firstValueFrom(this.api.get<Exercise[]>(`exercises?topicId=${this.topicId}`)),
      firstValueFrom(this.api.get<Progress>(`progress/topics/${this.topicId}`)),
    ]).then(([topic, exercises, progress]) => {
      this.topic = topic ?? null;
      this.exercises = exercises ?? [];
      this.progress = progress ?? null;
      this.loading = false;
      this.cdr.detectChanges();
    }).catch(() => {
      this.loading = false;
      this.cdr.detectChanges();
    });
  }

  createTopic(): void {
    if (!this.createForm.name.trim()) return;
    this.creating = true;
    this.api.post<Topic>('topics', {
      name: this.createForm.name.trim(),
      description: this.createForm.description.trim() || null,
      difficulty: this.createForm.difficulty,
      estimated_minutes: this.createForm.estimated_minutes || 0,
      prerequisite_ids: [],
      parent_id: this.topicId,
    }).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.creating = false;
          this.showCreate = false;
          this.createForm = { name: '', description: '', difficulty: 'basico', estimated_minutes: 0 };
          this.success = 'Tema añadido.';
          setTimeout(() => (this.success = ''), 3000);
          this.loadTopic();
        },
        error: () => {
          this.creating = false;
          this.error = 'Error al crear el tema.';
          setTimeout(() => (this.error = ''), 3000);
        },
      });
  }
}
