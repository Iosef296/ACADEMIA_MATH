import { ChangeDetectorRef, Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';

interface Question {
  id: number;
  order: number;
  exercise: {
    id: number;
    title: string;
    statement_latex: string;
    needs_graph: boolean;
  };
  // runtime
  userAnswer: string;
  answered: boolean;
  hintShown: boolean;
  hint?: string;
}

interface ExamMeta {
  id: number;
  title: string;
  time_limit: number | null;
  lock_screen: boolean;
  randomize_order: boolean;
}

@Component({
  selector: 'app-exam-session',
  templateUrl: './exam-session.component.html',
  standalone: false,
})
export class ExamSessionComponent implements OnInit, OnDestroy {
  examId!: number;
  attemptId: number | null = null;
  exam: ExamMeta | null = null;
  questions: Question[] = [];

  currentIndex = 0;
  loading = false;
  submitting = false;
  error = '';

  // Timer
  timeLeft = 0;
  private timerInterval: any = null;

  // Ping (heartbeat every 30s)
  private pingInterval: any = null;
  leftScreenCount = 0;

  // Confirm submit modal
  showConfirmSubmit = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.examId = Number(this.route.snapshot.paramMap.get('id'));
    this.startExam();
  }

  ngOnDestroy(): void {
    this.clearIntervals();
    if (this.exam?.lock_screen) {
      document.exitFullscreen().catch(() => {});
    }
  }

  private startExam(): void {
    this.api.post<any>(`exams/${this.examId}/start`, {}).subscribe({
      next: (res) => {
        this.exam = res.exam;
        this.attemptId = res.attemptId;
        this.questions = (res.questions ?? []).map((q: any) => ({
          ...q,
          userAnswer: '',
          answered: false,
          hintShown: false,
        }));

        if (this.exam?.time_limit) {
          this.timeLeft = this.exam.time_limit * 60;
          this.startTimer();
        }

        if (this.exam?.lock_screen) {
          document.documentElement.requestFullscreen().catch(() => {});
        }

        this.startPing();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.error = 'No se pudo iniciar el examen.';
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  private startTimer(): void {
    this.timerInterval = setInterval(() => {
      this.timeLeft--;
      if (this.timeLeft <= 0) {
        clearInterval(this.timerInterval);
        this.submit(true);
      }
    }, 1000);
  }

  private startPing(): void {
    this.pingInterval = setInterval(() => {
      if (this.attemptId) {
        this.api
          .post(`exams/${this.examId}/attempt/${this.attemptId}/ping`, {})
          .subscribe();
      }
    }, 30000);
  }

  private clearIntervals(): void {
    if (this.timerInterval) clearInterval(this.timerInterval);
    if (this.pingInterval) clearInterval(this.pingInterval);
  }

  // Detect tab/window blur (leaving screen)
  @HostListener('window:blur')
  onWindowBlur(): void {
    if (this.exam?.lock_screen && this.attemptId) {
      this.leftScreenCount++;
      this.api
        .post(`exams/${this.examId}/attempt/${this.attemptId}/ping`, {
          leftScreen: true,
        })
        .subscribe();
    }
  }

  get currentQuestion(): Question | null {
    return this.questions[this.currentIndex] ?? null;
  }

  get answeredCount(): number {
    return this.questions.filter((q) => q.answered).length;
  }

  get timeFormatted(): string {
    const m = Math.floor(this.timeLeft / 60);
    const s = this.timeLeft % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  get timeIsLow(): boolean {
    return this.exam?.time_limit != null && this.timeLeft <= 120;
  }

  goTo(index: number): void {
    this.currentIndex = index;
  }

  markAnswered(): void {
    if (this.currentQuestion) {
      this.currentQuestion.answered = true;
    }
  }

  next(): void {
    this.markAnswered();
    if (this.currentIndex < this.questions.length - 1) {
      this.currentIndex++;
    }
  }

  prev(): void {
    if (this.currentIndex > 0) {
      this.currentIndex--;
    }
  }

  submit(auto = false): void {
    if (!auto && this.answeredCount < this.questions.length) {
      this.showConfirmSubmit = true;
      return;
    }
    this.doSubmit();
  }

  confirmSubmit(): void {
    this.showConfirmSubmit = false;
    this.doSubmit();
  }

  private doSubmit(): void {
    this.submitting = true;
    this.clearIntervals();

    const answers = this.questions.map((q) => ({
      questionId: q.id,
      content_latex: q.userAnswer,
    }));

    this.api
      .post(`exams/${this.examId}/attempt/${this.attemptId}/submit`, { answers })
      .subscribe({
        next: () => {
          this.submitting = false;
          if (this.exam?.lock_screen) {
            document.exitFullscreen().catch(() => {});
          }
          this.router.navigate(['/exams', this.examId, 'results', this.attemptId]);
        },
        error: () => {
          this.submitting = false;
          this.error = 'Error al enviar. Intenta de nuevo.';
        },
      });
  }
}
