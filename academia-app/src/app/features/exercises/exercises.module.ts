import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { ExerciseListComponent } from './exercise-list/exercise-list.component';
import { ExerciseDetailComponent } from './exercise-detail/exercise-detail.component';
import { FlashcardsComponent } from './flashcards/flashcards.component';
import { SharedModule } from '../../shared/shared.module';

const routes: Routes = [
  { path: '', component: ExerciseListComponent },
  { path: 'flashcards', component: FlashcardsComponent },
  { path: ':id', component: ExerciseDetailComponent },
];

@NgModule({
  declarations: [ExerciseListComponent, ExerciseDetailComponent, FlashcardsComponent],
  imports: [CommonModule, FormsModule, RouterModule.forChild(routes), SharedModule],
})
export class ExercisesModule {}
