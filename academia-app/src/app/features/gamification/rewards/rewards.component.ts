import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';

interface Reward {
  id: number;
  title: string;
  description: string;
  icon: string;
  used: boolean;
  used_at?: string;
  expires_at?: string;
}

@Component({
  selector: 'app-rewards',
  templateUrl: './rewards.component.html',
  standalone: false,
})
export class RewardsComponent implements OnInit {
  rewards: Reward[] = [];
  loading = false;
  using: number | null = null;
  successMsg = '';

  constructor(private api: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.api.get<Reward[]>('rewards/mine').subscribe({
      next: (data) => {
        this.rewards = data;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.loading = false; this.cdr.detectChanges(); },
    });
  }

  use(reward: Reward): void {
    if (reward.used) return;
    this.using = reward.id;
    this.api.post(`rewards/${reward.id}/use`, {}).subscribe({
      next: () => {
        reward.used = true;
        this.using = null;
        this.successMsg = `"${reward.title}" canjeada con éxito.`;
        setTimeout(() => (this.successMsg = ''), 3000);
      },
      error: () => { this.using = null; },
    });
  }

  get available(): Reward[] {
    return this.rewards.filter((r) => !r.used);
  }

  get used(): Reward[] {
    return this.rewards.filter((r) => r.used);
  }

  isExpired(r: Reward): boolean {
    return !!r.expires_at && new Date(r.expires_at) < new Date();
  }
}
