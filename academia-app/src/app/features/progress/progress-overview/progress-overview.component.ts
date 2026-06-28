import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
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
export class ProgressOverviewComponent implements OnInit {
  summary: ProgressSummary | null = null;
  loading = false;

  constructor(private api: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    Promise.all([
      this.api.get<any>('progress').toPromise(),
      this.api.get<any[]>('progress/topics').toPromise(),
    ]).then(([general, topics]) => {
      this.summary = { ...general, topics: topics ?? [] };
      this.loading = false;
      this.cdr.detectChanges();
    }).catch(() => {
      this.loading = false;
      this.cdr.detectChanges();
    });
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
