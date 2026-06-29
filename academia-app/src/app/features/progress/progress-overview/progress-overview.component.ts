import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { firstValueFrom, Subject } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';

interface TopicProgress {
  topic: { id: string; name: string };
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
  loading = true;
  private destroy$ = new Subject<void>();

  constructor(private api: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    Promise.all([
      firstValueFrom(this.api.get<any[]>('progress')),
      firstValueFrom(this.api.get<any>('progress/streak')).catch(() => ({ current: 0, max: 0 })),
    ]).then(([progressList, streak]) => {
      const topics: TopicProgress[] = (progressList ?? []).map((p: any) => {
        const total = (p.exercisesSolved ?? 0) + (p.errorCount ?? 0);
        return {
          topic: { id: p.topicId, name: p.topicName ?? 'Sin tema' },
          completed: p.exercisesSolved ?? 0,
          total: Math.max(total, 1),
          percentage: total > 0 ? Math.round(((p.exercisesSolved ?? 0) / total) * 100) : 0,
          errors: p.errorCount ?? 0,
        };
      });
      this.summary = {
        xp_total: (progressList ?? []).reduce((s: number, p: any) => s + (p.xp ?? 0), 0),
        streak_current: streak?.current ?? 0,
        streak_max: streak?.max ?? 0,
        exercises_done: (progressList ?? []).reduce((s: number, p: any) => s + (p.exercisesSolved ?? 0), 0),
        exercises_total: (progressList ?? []).reduce((s: number, p: any) => s + (p.exercisesSolved ?? 0) + (p.errorCount ?? 0), 0),
        time_total: (progressList ?? []).reduce((s: number, p: any) => s + (p.timeSpent ?? 0), 0),
        topics,
      };
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
