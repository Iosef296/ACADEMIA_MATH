import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { TopicListComponent } from './topic-list/topic-list.component';
import { TopicDetailComponent } from './topic-detail/topic-detail.component';
import { SharedModule } from '../../shared/shared.module';

const routes: Routes = [
  { path: '', component: TopicListComponent },
  { path: ':id', component: TopicDetailComponent },
];

@NgModule({
  declarations: [TopicListComponent, TopicDetailComponent],
  imports: [CommonModule, FormsModule, RouterModule.forChild(routes), SharedModule],
})
export class TopicsModule {}
