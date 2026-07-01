import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { ForumListComponent } from './forum-list/forum-list.component';
import { ForumPostComponent } from './forum-post/forum-post.component';
import { ForumMarkdownPipe } from './shared/markdown.pipe';

const routes: Routes = [
  { path: '', component: ForumListComponent },
  { path: ':id', component: ForumPostComponent },
];

@NgModule({
  declarations: [ForumListComponent, ForumPostComponent, ForumMarkdownPipe],
  imports: [CommonModule, FormsModule, RouterModule.forChild(routes)],
})
export class ForumModule {}
