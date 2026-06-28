import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';

interface Badge {
  id: number;
  name: string;
  description: string;
  icon: string;
  earned: boolean;
  earned_at?: string;
}

@Component({
  selector: 'app-badges',
  templateUrl: './badges.component.html',
  standalone: false,
})
export class BadgesComponent implements OnInit {
  badges: Badge[] = [];
  loading = false;

  constructor(private api: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    Promise.all([
      this.api.get<Badge[]>('badges').toPromise(),
      this.api.get<Badge[]>('badges/mine').toPromise(),
    ]).then(([all, mine]) => {
      const earnedIds = new Set((mine ?? []).map((b) => b.id));
      this.badges = (all ?? []).map((b) => ({
        ...b,
        earned: earnedIds.has(b.id),
        earned_at: (mine ?? []).find((m) => m.id === b.id)?.earned_at,
      }));
      this.loading = false;
      this.cdr.detectChanges();
    }).catch(() => {
      this.loading = false;
      this.cdr.detectChanges();
    });
  }

  get earned(): Badge[] {
    return this.badges.filter((b) => b.earned);
  }

  get pending(): Badge[] {
    return this.badges.filter((b) => !b.earned);
  }
}
