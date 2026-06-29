import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ApiService } from '../../../core/services/api.service';

interface Exam {
  id: number;
  title: string;
  topic?: { id: number; name: string };
  is_adaptive: boolean;
  time_limit: number | null;
  lock_screen: boolean;
  question_count: number;
}

@Component({
  selector: 'app-exam-list',
  templateUrl: './exam-list.component.html',
  standalone: false,
})
export class ExamListComponent implements OnInit, OnDestroy {
  exams: Exam[] = [];
  loading = false;
  searchQuery = '';

  private destroy$ = new Subject<void>();

  constructor(private api: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.api.get<Exam[]>('exams')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.exams = data;
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.loading = false;
          this.cdr.detectChanges();
          console.error('Error loading exams:', err);
        },
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get filtered(): Exam[] {
    const q = this.searchQuery.toLowerCase().trim();
    if (!q) return this.exams;
    return this.exams.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        e.topic?.name.toLowerCase().includes(q)
    );
  }
}
