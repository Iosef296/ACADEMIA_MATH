import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { ChallengesComponent } from './challenges/challenges.component';
import { RewardsComponent } from './rewards/rewards.component';
import { AvatarCustomizerComponent } from './avatar-customizer/avatar-customizer.component';

const routes: Routes = [
  { path: '', redirectTo: 'challenges', pathMatch: 'full' },
  { path: 'challenges', component: ChallengesComponent },
  { path: 'rewards', component: RewardsComponent },
  { path: 'avatar', component: AvatarCustomizerComponent },
];

@NgModule({
  declarations: [ChallengesComponent, RewardsComponent, AvatarCustomizerComponent],
  imports: [CommonModule, RouterModule.forChild(routes)],
})
export class GamificationModule {}
