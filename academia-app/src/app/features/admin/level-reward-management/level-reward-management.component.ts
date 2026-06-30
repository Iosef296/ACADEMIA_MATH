import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';

interface LevelReward {
  id: number;
  level: number;
  title: string;
  description: string;
  emoji: string;
  bonusXp: number;
  active: boolean;
}

@Component({
  selector: 'app-level-reward-management',
  templateUrl: './level-reward-management.component.html',
  standalone: false,
})
export class LevelRewardManagementComponent implements OnInit {
  rewards: LevelReward[] = [];
  loading = false;
  error = '';

  newReward = { level: 1, title: '', description: '', emoji: '🏆', bonusXp: 100 };
  editingReward: LevelReward | null = null;
  editCopy: Partial<LevelReward> = {};

  constructor(private api: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.api.get<LevelReward[]>('level-rewards/all').subscribe({
      next: (data) => { this.rewards = data; this.loading = false; this.cdr.detectChanges(); },
      error: () => { this.error = 'Error al cargar recompensas'; this.loading = false; this.cdr.detectChanges(); },
    });
  }

  create(): void {
    if (!this.newReward.title.trim()) return;
    this.api.post<LevelReward>('level-rewards', this.newReward).subscribe({
      next: (r) => {
        this.rewards.push(r);
        this.rewards.sort((a, b) => a.level - b.level);
        this.newReward = { level: 1, title: '', description: '', emoji: '🏆', bonusXp: 100 };
        this.cdr.detectChanges();
      },
      error: () => { this.error = 'Error al crear recompensa'; this.cdr.detectChanges(); },
    });
  }

  startEdit(reward: LevelReward): void {
    this.editingReward = reward;
    this.editCopy = { ...reward };
  }

  cancelEdit(): void {
    this.editingReward = null;
    this.editCopy = {};
  }

  saveEdit(): void {
    if (!this.editingReward) return;
    this.api.put<LevelReward>(`level-rewards/${this.editingReward.id}`, this.editCopy).subscribe({
      next: (updated) => {
        const idx = this.rewards.findIndex(r => r.id === updated.id);
        if (idx !== -1) this.rewards[idx] = updated;
        this.rewards.sort((a, b) => a.level - b.level);
        this.editingReward = null;
        this.editCopy = {};
        this.cdr.detectChanges();
      },
      error: () => { this.error = 'Error al guardar cambios'; this.cdr.detectChanges(); },
    });
  }

  delete(reward: LevelReward): void {
    if (!confirm(`¿Eliminar recompensa del nivel ${reward.level}?`)) return;
    this.api.delete(`level-rewards/${reward.id}`).subscribe({
      next: () => { this.rewards = this.rewards.filter(r => r.id !== reward.id); this.cdr.detectChanges(); },
    });
  }
}
