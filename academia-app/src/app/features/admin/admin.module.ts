import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { UserManagementComponent } from './user-management/user-management.component';
import { TopicManagementComponent } from './topic-management/topic-management.component';
import { MissionManagementComponent } from './mission-management/mission-management.component';
import { LevelRewardManagementComponent } from './level-reward-management/level-reward-management.component';

const routes: Routes = [
  { path: '', redirectTo: 'users', pathMatch: 'full' },
  { path: 'users', component: UserManagementComponent },
  { path: 'topics', component: TopicManagementComponent },
  { path: 'missions', component: MissionManagementComponent },
  { path: 'level-rewards', component: LevelRewardManagementComponent },
];

@NgModule({
  declarations: [UserManagementComponent, TopicManagementComponent, MissionManagementComponent, LevelRewardManagementComponent],
  imports: [CommonModule, FormsModule, RouterModule.forChild(routes)],
})
export class AdminModule {}
