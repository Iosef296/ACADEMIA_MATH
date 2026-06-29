import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ApiService } from '../../../core/services/api.service';

interface Challenge {
  id: number;
  title: string;
  description: string;
  goal: number;
  progress: number;
  xp_reward: number;
  ends_at: string;
  completed: boolean;
  submitted: boolean;
}

@Component({
  selector: 'app-challenges',
  templateUrl: './challenges.component.html',
  standalone: false,
})
export class ChallengesComponent implements OnInit, OnDestroy {
  challenges: Challenge[] = [];
  loading = false;
  submitting: number | null = null;
  private destroy$ = new Subject<void>();

  constructor(private api: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.api.get<Challenge[]>('gamification/challenges')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.challenges = data;
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: () => { this.loading = false; this.cdr.detectChanges(); },
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  submit(challenge: Challenge): void {
    if (challenge.submitted || challenge.completed) return;
    this.submitting = challenge.id;
    this.api.post(`gamification/challenges/${challenge.id}/submit`, {})
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          challenge.submitted = true;
          challenge.completed = true;
          this.submitting = null;
        },
        error: () => { this.submitting = null; },
      });
  }

  daysLeft(endsAt: string): number {
    return Math.max(0, Math.ceil((new Date(endsAt).getTime() - Date.now()) / 86400000));
  }

  pct(challenge: Challenge): number {
    return challenge.goal > 0
      ? Math.min(100, Math.round((challenge.progress / challenge.goal) * 100))
      : 0;
  }
}
