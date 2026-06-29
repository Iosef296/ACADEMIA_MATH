import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ApiService } from '../../../core/services/api.service';

interface StudyGoal {
  id: string;
  description: string;
  hoursPerWeek: number;
  targetDate: string | null;
  targetScore: number | null;
  isActive: boolean;
  createdAt: string;
}

@Component({
  selector: 'app-study-goals',
  templateUrl: './study-goals.component.html',
  standalone: false,
})
export class StudyGoalsComponent implements OnInit, OnDestroy {
  goals: StudyGoal[] = [];
  loading = false;
  showForm = false;
  saving = false;
  error = '';
  private destroy$ = new Subject<void>();

  form = {
    description: '',
    hoursPerWeek: 5,
    targetDate: '',
    targetScore: null as number | null,
  };

  constructor(private api: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.load();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  load(): void {
    this.loading = true;
    this.api.get<StudyGoal[]>('study-goals')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => { this.goals = data; this.loading = false; this.cdr.detectChanges(); },
        error: () => { this.loading = false; this.cdr.detectChanges(); },
      });
  }

  save(): void {
    if (!this.form.description.trim()) { this.error = 'Descripción requerida.'; return; }
    this.saving = true;
    this.error = '';
    const body: any = {
      description: this.form.description,
      hoursPerWeek: this.form.hoursPerWeek,
    };
    if (this.form.targetDate) body.targetDate = this.form.targetDate;
    if (this.form.targetScore !== null) body.targetScore = this.form.targetScore;

    this.api.post<StudyGoal>('study-goals', body)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.saving = false;
          this.showForm = false;
          this.form = { description: '', hoursPerWeek: 5, targetDate: '', targetScore: null };
          this.load();
        },
        error: () => { this.saving = false; this.error = 'Error guardando meta.'; },
      });
  }

  deactivate(id: string): void {
    this.api.put(`study-goals/${id}`, { isActive: false })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => this.load(),
        error: (err) => console.error('Error updating goal:', err),
      });
  }

  delete(id: string): void {
    if (!confirm('¿Eliminar esta meta?')) return;
    this.api.delete(`study-goals/${id}`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => this.load(),
        error: (err) => console.error('Error deleting goal:', err),
      });
  }
}
