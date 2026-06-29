import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ApiService } from '../../../core/services/api.service';

interface RankingEntry {
  position: number;
  user: { id: number; name: string };
  xp_total: number;
  streak_current: number;
  is_me: boolean;
}

@Component({
  selector: 'app-ranking',
  templateUrl: './ranking.component.html',
  standalone: false,
})
export class RankingComponent implements OnInit, OnDestroy {
  entries: RankingEntry[] = [];
  loading = false;
  visibilityUpdating = false;
  rankingVisible = true;
  private destroy$ = new Subject<void>();

  constructor(private api: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.api.get<RankingEntry[]>('gamification/ranking')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.entries = data;
          const me = data.find((e) => e.is_me);
          if (me) this.rankingVisible = true;
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

  toggleVisibility(): void {
    this.visibilityUpdating = true;
    this.rankingVisible = !this.rankingVisible;
    this.api
      .put('gamification/ranking/visibility', { visible: this.rankingVisible })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => { this.visibilityUpdating = false; },
        error: () => {
          this.rankingVisible = !this.rankingVisible;
          this.visibilityUpdating = false;
        },
      });
  }

  medalFor(pos: number): string {
    if (pos === 1) return '🥇';
    if (pos === 2) return '🥈';
    if (pos === 3) return '🥉';
    return '';
  }
}
