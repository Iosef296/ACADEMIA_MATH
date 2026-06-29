import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { firstValueFrom, Subject } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-reports',
  templateUrl: './reports.component.html',
  standalone: false,
})
export class ReportsComponent implements OnInit, OnDestroy {
  stats: any = null;
  weakTopics: any[] = [];
  loading = false;
  private destroy$ = new Subject<void>();

  constructor(private api: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.loading = true;
    Promise.all([
      firstValueFrom(this.api.get<any>('reports/my-stats')),
      firstValueFrom(this.api.get<any[]>('reports/weakest-topics')),
    ]).then(([stats, weak]) => {
      this.stats = stats;
      this.weakTopics = weak ?? [];
      this.loading = false;
      this.cdr.detectChanges();
    }).catch(() => { this.loading = false; this.cdr.detectChanges(); });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get accuracy(): number {
    return this.stats ? Math.round(this.stats.accuracyRate) : 0;
  }

  accuracyColor(rate: number): string {
    if (rate >= 70) return 'text-green-600';
    if (rate >= 50) return 'text-yellow-600';
    return 'text-red-600';
  }

  barWidth(errorRate: number): string {
    return Math.min(errorRate, 100) + '%';
  }
}
