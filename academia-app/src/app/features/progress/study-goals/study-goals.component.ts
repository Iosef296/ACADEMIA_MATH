import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
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
export class StudyGoalsComponent implements OnInit {
  goals: StudyGoal[] = [];
  loading = false;
  showForm = false;
  saving = false;
  error = '';

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

  load(): void {
    this.loading = true;
    this.api.get<StudyGoal[]>('study-goals').subscribe({
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

    this.api.post<StudyGoal>('study-goals', body).subscribe({
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
    this.api.put(`study-goals/${id}`, { isActive: false }).subscribe(() => this.load());
  }

  delete(id: string): void {
    if (!confirm('¿Eliminar esta meta?')) return;
    this.api.delete(`study-goals/${id}`).subscribe(() => this.load());
  }
}
