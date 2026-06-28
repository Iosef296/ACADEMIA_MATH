import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
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
export class ExamListComponent implements OnInit {
  exams: Exam[] = [];
  loading = false;
  searchQuery = '';

  constructor(private api: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.api.get<Exam[]>('exams').subscribe({
      next: (data) => {
        this.exams = data;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
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
