import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { ProgressOverviewComponent } from './progress-overview/progress-overview.component';
import { BadgesComponent } from './badges/badges.component';
import { RankingComponent } from './ranking/ranking.component';
import { StudyGoalsComponent } from './study-goals/study-goals.component';
import { ReportsComponent } from './reports/reports.component';

const routes: Routes = [
  { path: '', component: ProgressOverviewComponent },
  { path: 'badges', component: BadgesComponent },
  { path: 'ranking', component: RankingComponent },
  { path: 'goals', component: StudyGoalsComponent },
  { path: 'reports', component: ReportsComponent },
];

@NgModule({
  declarations: [ProgressOverviewComponent, BadgesComponent, RankingComponent,
    StudyGoalsComponent, ReportsComponent],
  imports: [CommonModule, FormsModule, RouterModule.forChild(routes)],
})
export class ProgressModule {}
