import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';

interface DailyMission {
  id: number;
  title: string;
  emoji: string;
  missionType: string;
  targetValue: number;
  active: boolean;
}

@Component({
  selector: 'app-mission-management',
  templateUrl: './mission-management.component.html',
  standalone: false,
})
export class MissionManagementComponent implements OnInit {
  missions: DailyMission[] = [];
  loading = false;
  error = '';

  newMission = { title: '', emoji: '🎯', missionType: 'exercises', targetValue: 1, rewardXp: 10 };
  missionTypes = [
    { value: 'exercises', label: 'Ejercicios resueltos' },
    { value: 'topics',    label: 'Temas explorados' },
    { value: 'streak',    label: 'Días de racha' },
    { value: 'xp',        label: 'XP acumulados' },
  ];

  constructor(private api: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.api.get<DailyMission[]>('missions/all').subscribe({
      next: (data) => { this.missions = data; this.loading = false; this.cdr.detectChanges(); },
      error: () => { this.error = 'Error al cargar misiones'; this.loading = false; this.cdr.detectChanges(); },
    });
  }

  create(): void {
    if (!this.newMission.title.trim()) return;
    this.api.post<DailyMission>('missions', this.newMission).subscribe({
      next: (m) => {
        this.missions.push(m);
        this.newMission = { title: '', emoji: '🎯', missionType: 'exercises', targetValue: 1, rewardXp: 10 };
        this.cdr.detectChanges();
      },
      error: () => { this.error = 'Error al crear misión'; this.cdr.detectChanges(); },
    });
  }

  toggle(mission: DailyMission): void {
    this.api.put<DailyMission>(`missions/${mission.id}/toggle`, {}).subscribe({
      next: (updated) => {
        const idx = this.missions.findIndex(m => m.id === mission.id);
        if (idx !== -1) this.missions[idx] = updated;
        this.cdr.detectChanges();
      },
    });
  }

  delete(mission: DailyMission): void {
    if (!confirm(`¿Eliminar "${mission.title}"?`)) return;
    this.api.delete(`missions/${mission.id}`).subscribe({
      next: () => { this.missions = this.missions.filter(m => m.id !== mission.id); this.cdr.detectChanges(); },
    });
  }

  typeLabel(type: string): string {
    return this.missionTypes.find(t => t.value === type)?.label ?? type;
  }
}
