import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-reports',
  templateUrl: './reports.component.html',
  standalone: false,
})
export class ReportsComponent implements OnInit {
  stats: any = null;
  weakTopics: any[] = [];
  loading = false;

  constructor(private api: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.loading = true;
    Promise.all([
      this.api.get<any>('reports/my-stats').toPromise(),
      this.api.get<any[]>('reports/weakest-topics').toPromise(),
    ]).then(([stats, weak]) => {
      this.stats = stats;
      this.weakTopics = weak ?? [];
      this.loading = false;
      this.cdr.detectChanges();
    }).catch(() => { this.loading = false; this.cdr.detectChanges(); });
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
