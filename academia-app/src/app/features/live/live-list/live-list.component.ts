import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ApiService } from '../../../core/services/api.service';

interface LiveSession {
  id: number;
  title: string;
  topic: { id: number; name: string } | null;
  host: { id: number; name: string };
  started_at: string;
  ended_at: string | null;
}

@Component({
  selector: 'app-live-list',
  templateUrl: './live-list.component.html',
  standalone: false,
})
export class LiveListComponent implements OnInit, OnDestroy {
  sessions: LiveSession[] = [];
  loading = false;

  private destroy$ = new Subject<void>();

  constructor(private api: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.api.get<LiveSession[]>('live/sessions')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.sessions = data;
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.loading = false;
          this.cdr.detectChanges();
        },
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get active(): LiveSession[] {
    return this.sessions.filter((s) => !s.ended_at);
  }

  get past(): LiveSession[] {
    return this.sessions.filter((s) => !!s.ended_at);
  }

  timeAgo(dateStr: string): string {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60) return 'hace un momento';
    if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `hace ${Math.floor(diff / 3600)}h`;
    return `hace ${Math.floor(diff / 86400)}d`;
  }
}
