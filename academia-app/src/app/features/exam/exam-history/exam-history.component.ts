import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { environment } from '../../../../environments/environment';
import { HttpClient } from '@angular/common/http';

interface AttemptHistory {
  attemptId: string;
  examId: string;
  examTitle: string;
  score: number | null;
  startedAt: string;
  submittedAt: string | null;
  passed: boolean;
}

@Component({
  selector: 'app-exam-history',
  templateUrl: './exam-history.component.html',
  standalone: false,
})
export class ExamHistoryComponent implements OnInit {
  history: AttemptHistory[] = [];
  loading = false;
  downloadingId: string | null = null;

  constructor(
    private api: ApiService,
    private router: Router,
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.loading = true;
    this.api.get<AttemptHistory[]>('exams/my-history').subscribe({
      next: (data) => { this.history = data; this.loading = false; this.cdr.detectChanges(); },
      error: () => { this.loading = false; this.cdr.detectChanges(); },
    });
  }

  downloadCertificate(attemptId: string): void {
    this.downloadingId = attemptId;
    this.http.get(`${environment.apiUrl}/exams/attempts/${attemptId}/certificate`, { responseType: 'blob' })
      .subscribe({
        next: (blob) => {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'certificado.pdf';
          a.click();
          URL.revokeObjectURL(url);
          this.downloadingId = null;
        },
        error: () => { this.downloadingId = null; alert('No tienes certificado para este examen (puntaje insuficiente).'); },
      });
  }

  viewResults(examId: string, attemptId: string): void {
    this.router.navigate(['/exams', examId, 'results', attemptId]);
  }

  formatDate(d: string | null): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }
}
