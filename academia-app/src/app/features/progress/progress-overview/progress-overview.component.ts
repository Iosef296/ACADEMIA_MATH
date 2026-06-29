import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { firstValueFrom, Subject } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';

interface TopicProgress {
  topic: { id: number; name: string };
  completed: number;
  total: number;
  percentage: number;
  errors: number;
}

interface ProgressSummary {
  xp_total: number;
  streak_current: number;
  streak_max: number;
  exercises_done: number;
  exercises_total: number;
  time_total: number;
  topics: TopicProgress[];
}

@Component({
  selector: 'app-progress-overview',
  templateUrl: './progress-overview.component.html',
  standalone: false,
})
export class ProgressOverviewComponent implements OnInit, OnDestroy {
  summary: ProgressSummary | null = null;
  loading = false;
  private destroy$ = new Subject<void>();

  constructor(private api: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    Promise.all([
      firstValueFrom(this.api.get<any>('progress')),
      firstValueFrom(this.api.get<any[]>('progress/topics')),
    ]).then(([general, topics]) => {
      this.summary = { ...general, topics: topics ?? [] };
      this.loading = false;
      this.cdr.detectChanges();
    }).catch(() => {
      this.loading = false;
      this.cdr.detectChanges();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get timeFormatted(): string {
    if (!this.summary) return '0h';
    const h = Math.floor(this.summary.time_total / 3600);
    const m = Math.floor((this.summary.time_total % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  }

  barColor(pct: number): string {
    if (pct >= 75) return 'bg-green-500';
    if (pct >= 40) return 'bg-yellow-500';
    return 'bg-blue-500';
  }
}
