import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ApiService } from '../../../core/services/api.service';

interface QuestionResult {
  id: number;
  order: number;
  exercise: { id: number; title: string; statement_latex: string };
  userAnswer: string;
  is_correct: boolean;
  hints_used: number;
  difficulty_rating: string | null;
}

interface ExamResult {
  exam: { id: number; title: string; topic?: { id: number; name: string } };
  score: number;
  total: number;
  percentage: number;
  time_spent: number;
  left_screen_count: number;
  questions: QuestionResult[];
}

@Component({
  selector: 'app-exam-results',
  templateUrl: './exam-results.component.html',
  standalone: false,
})
export class ExamResultsComponent implements OnInit, OnDestroy {
  examId!: number;
  attemptId!: number;
  result: ExamResult | null = null;
  loading = false;
  error = '';

  showAnswers = false;

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.examId = Number(this.route.snapshot.paramMap.get('examId'));
    this.attemptId = Number(this.route.snapshot.paramMap.get('attemptId'));
    this.load();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  load(): void {
    this.api
      .get<ExamResult>(`exams/${this.examId}/attempt/${this.attemptId}/result`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.result = data;
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.error = 'No se pudo cargar el resultado.';
          this.loading = false;
          this.cdr.detectChanges();
          console.error('Error loading exam result:', err);
        },
      });
  }

  get scoreColor(): string {
    if (!this.result) return 'text-gray-900';
    if (this.result.percentage >= 70) return 'text-green-600';
    if (this.result.percentage >= 50) return 'text-yellow-600';
    return 'text-red-600';
  }

  get scoreMessage(): string {
    if (!this.result) return '';
    if (this.result.percentage >= 90) return '¡Excelente!';
    if (this.result.percentage >= 70) return '¡Buen trabajo!';
    if (this.result.percentage >= 50) return 'Puedes mejorar';
    return 'Necesitas más práctica';
  }

  get timeFormatted(): string {
    if (!this.result) return '';
    const m = Math.floor(this.result.time_spent / 60);
    const s = this.result.time_spent % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  }

  retry(): void {
    this.router.navigate(['/exams', this.examId]);
  }
}
