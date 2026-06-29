import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, of } from 'rxjs';
import { timeout, catchError, takeUntil } from 'rxjs/operators';
import { ApiService } from '../../../core/services/api.service';

interface Topic {
  id: string;
  name: string;
  description: string;
  order: number;
  is_locked: boolean;
  children?: Topic[];
}

@Component({
  selector: 'app-topic-list',
  templateUrl: './topic-list.component.html',
  standalone: false,
})
export class TopicListComponent implements OnInit, OnDestroy {
  topics: Topic[] = [];
  loading = false;
  error = '';
  searchQuery = '';

  private destroy$ = new Subject<void>();

  constructor(private api: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.loading = true;
    this.api.get<Topic[]>('topics').pipe(
      takeUntil(this.destroy$),
      timeout(15000),
      catchError((err) => {
        this.error = err?.name === 'TimeoutError'
          ? 'Backend no responde. Verifica puerto 3000.'
          : `Error ${err?.status ?? ''}: ${err?.message ?? 'Error cargando temas'}`;
        this.cdr.detectChanges();
        return of([] as Topic[]);
      }),
    ).subscribe({
      next: (data) => {
        this.topics = Array.isArray(data) ? data : [];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error loading topics:', err),
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get filtered(): Topic[] {
    if (!this.searchQuery.trim()) return this.topics;
    const q = this.searchQuery.toLowerCase();
    return this.topics.filter(
      (t) => t.name.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q)
    );
  }
}
