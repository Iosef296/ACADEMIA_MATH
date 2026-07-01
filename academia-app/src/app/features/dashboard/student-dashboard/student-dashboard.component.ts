import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, Subject, forkJoin, of } from 'rxjs';
import { catchError, takeUntil } from 'rxjs/operators';
import { ApiService } from '../../../core/services/api.service';
import { selectCurrentUser } from '../../../store/auth/auth.selectors';
import { User } from '../../../store/auth/auth.state';

interface ProgressSummary {
  topic_name: string;
  xp: number;
  level: number;
  exercises_solved: number;
  error_count: number;
}

interface Challenge {
  id: number;
  title: string;
  description: string;
  reward_xp: number;
  end_date: string;
}

interface DailyMission {
  id: number;
  title: string;
  emoji: string;
  missionType: string;
  targetValue: number;
  rewardXp: number;
  active: boolean;
}

interface LevelReward {
  id: number;
  level: number;
  title: string;
  description: string;
  emoji: string;
  bonusXp: number;
}

@Component({
  selector: 'app-student-dashboard',
  templateUrl: './student-dashboard.component.html',
  standalone: false,
})
export class StudentDashboardComponent implements OnInit, OnDestroy {
  user$!: Observable<User | null>;
  streak = 0;
  topicXp = 0;
  bonusXp = 0;
  progressList: ProgressSummary[] = [];
  activeChallenge: Challenge | null = null;
  missions: DailyMission[] = [];
  claimedMissionIds: Set<number> = new Set();
  levelRewards: LevelReward[] = [];
  levelUpReward: LevelReward | null = null;
  loading = false;
  today = new Date();

  moods = [
    { value: 'motivated', label: 'Motivado', emoji: '💪', difficulty: 'advanced' },
    { value: 'neutral',   label: 'Normal',   emoji: '😐', difficulty: 'intermediate' },
    { value: 'stressed',  label: 'Estresado', emoji: '😰', difficulty: 'basic' },
  ];
  selectedMood: string | null = null;
  moodSaved = false;
  showMoodModal = localStorage.getItem('moodAnsweredDate') !== new Date().toDateString();
  Math = Math;

  private destroy$ = new Subject<void>();
  private prevLevel = 0;

  constructor(private store: Store, private api: ApiService, private cdr: ChangeDetectorRef, private router: Router) {}

  ngOnInit(): void {
    this.user$ = this.store.select(selectCurrentUser);
    this.user$.pipe(takeUntil(this.destroy$)).subscribe(user => {
      if (user) this.loadDashboard();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadDashboard(): void {
    forkJoin({
      streakRes:    this.api.get<{ current: number }>('progress/streak').pipe(catchError(() => of(null))),
      progress:     this.api.get<ProgressSummary[]>('progress').pipe(catchError(() => of([]))),
      challenges:   this.api.get<Challenge[]>('gamification/challenges').pipe(catchError(() => of([]))),
      missions:     this.api.get<DailyMission[]>('missions').pipe(catchError(() => of([]))),
      claimed:      this.api.get<number[]>('missions/claimed').pipe(catchError(() => of([]))),
      bonusXpRes:   this.api.get<{ bonusXp: number }>('missions/bonus-xp').pipe(catchError(() => of({ bonusXp: 0 }))),
      levelRewards: this.api.get<LevelReward[]>('level-rewards').pipe(catchError(() => of([]))),
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ streakRes, progress, challenges, missions, claimed, bonusXpRes, levelRewards }) => {
          this.streak = (streakRes as any)?.current ?? 0;
          this.progressList = (progress as ProgressSummary[]) ?? [];
          this.topicXp = this.progressList.reduce((sum, p) => sum + p.xp, 0);
          this.bonusXp = (bonusXpRes as any)?.bonusXp ?? 0;
          this.activeChallenge = (challenges as Challenge[])?.[0] ?? null;
          this.missions = (missions as DailyMission[]) ?? [];
          this.claimedMissionIds = new Set(claimed as number[]);
          this.levelRewards = (levelRewards as LevelReward[]) ?? [];
          this.cdr.detectChanges();
        },
        error: (err) => console.error('Error loading dashboard:', err),
      });
  }

  get totalXp(): number {
    return this.topicXp + this.bonusXp;
  }

  claimMission(mission: DailyMission): void {
    this.api.post<{ bonusXp: number; earned: number }>(`missions/${mission.id}/claim`, {})
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          const prevLevel = this.currentLevel;
          this.claimedMissionIds = new Set([...this.claimedMissionIds, mission.id]);
          this.bonusXp = res.bonusXp;
          const newLevel = this.currentLevel;
          if (newLevel > prevLevel) {
            this.levelUpReward = this.levelRewards.find(r => r.level === newLevel) ?? null;
          }
          this.cdr.detectChanges();
        },
      });
  }

  dismissLevelUp(): void {
    this.levelUpReward = null;
    this.cdr.detectChanges();
  }

  saveMood(mood: string): void {
    if (this.moodSaved) return;
    this.selectedMood = mood;
    this.moodSaved = true;
    this.showMoodModal = false;
    localStorage.setItem('moodAnsweredDate', new Date().toDateString());
    const difficulty = this.moods.find(m => m.value === mood)?.difficulty ?? 'intermediate';
    localStorage.setItem('exerciseDifficulty', difficulty);
    this.api.post('mood', { mood }).pipe(takeUntil(this.destroy$)).subscribe({ error: () => {} });
    this.cdr.detectChanges();
  }

  closeMoodModal(): void {
    this.showMoodModal = false;
    localStorage.setItem('moodAnsweredDate', new Date().toDateString());
  }

  get topTopics(): ProgressSummary[] {
    return [...this.progressList].sort((a, b) => b.xp - a.xp).slice(0, 5);
  }

  get errorTopics(): ProgressSummary[] {
    return [...this.progressList]
      .filter(p => p.error_count > 0)
      .sort((a, b) => b.error_count - a.error_count)
      .slice(0, 3);
  }

  get totalExercisesSolved(): number {
    return this.progressList.reduce((sum, p) => sum + (p.exercises_solved ?? 0), 0);
  }

  xpForLevel(n: number): number {
    return 50 * n * (n - 1);
  }

  get currentLevel(): number {
    if (this.totalXp <= 0) return 1;
    return Math.max(1, Math.floor((1 + Math.sqrt(1 + 4 * this.totalXp / 50)) / 2));
  }

  get xpInCurrentLevel(): number {
    return this.totalXp - this.xpForLevel(this.currentLevel);
  }

  get xpNeededForNextLevel(): number {
    return this.currentLevel * 100;
  }

  get xpProgressPercent(): number {
    return Math.min((this.xpInCurrentLevel / this.xpNeededForNextLevel) * 100, 100);
  }

  get currentLevelReward(): LevelReward | null {
    return [...this.levelRewards]
      .filter(r => r.level <= this.currentLevel)
      .sort((a, b) => b.level - a.level)[0] ?? null;
  }

  get nextLevelReward(): LevelReward | null {
    return [...this.levelRewards]
      .filter(r => r.level > this.currentLevel)
      .sort((a, b) => a.level - b.level)[0] ?? null;
  }

  getLevelGradient(level: number): string {
    if (level >= 100) return 'linear-gradient(135deg,#FFD700,#FF6B35,#FF1744)';
    if (level >= 50)  return 'linear-gradient(135deg,#FF1744,#D500F9)';
    if (level >= 30)  return 'linear-gradient(135deg,#FF8F00,#FFD600)';
    if (level >= 20)  return 'linear-gradient(135deg,#AA00FF,#6200EA)';
    if (level >= 10)  return 'linear-gradient(135deg,#1565C0,#00B8D4)';
    if (level >= 5)   return 'linear-gradient(135deg,#2E7D32,#00BFA5)';
    return 'rgba(255,255,255,0.15)';
  }

  getHeaderGradient(level: number): string {
    if (level >= 100) return 'from-yellow-500 via-orange-600 to-red-700';
    if (level >= 50)  return 'from-red-600 to-purple-800';
    if (level >= 30)  return 'from-orange-500 to-amber-600';
    if (level >= 20)  return 'from-purple-700 to-fuchsia-700';
    if (level >= 10)  return 'from-blue-500 to-cyan-600';
    if (level >= 5)   return 'from-green-600 to-teal-600';
    return 'from-blue-600 to-indigo-700';
  }

  getMissionProgress(mission: DailyMission): number {
    switch (mission.missionType) {
      case 'exercises': return this.totalExercisesSolved;
      case 'topics':    return this.progressList.length;
      case 'streak':    return this.streak;
      case 'xp':        return this.totalXp;
      default:          return 0;
    }
  }

  getMissionPercent(mission: DailyMission): number {
    return Math.min((this.getMissionProgress(mission) / mission.targetValue) * 100, 100);
  }

  isMissionClaimable(mission: DailyMission): boolean {
    return this.getMissionProgress(mission) >= mission.targetValue && !this.claimedMissionIds.has(mission.id);
  }

  isMissionClaimed(mission: DailyMission): boolean {
    return this.claimedMissionIds.has(mission.id);
  }

  get visibleMissions(): DailyMission[] {
    return this.missions
      .filter(m => !this.isMissionClaimed(m))
      .slice(0, 6);
  }

  get completedMissionsCount(): number {
    return this.claimedMissionIds.size;
  }
}
