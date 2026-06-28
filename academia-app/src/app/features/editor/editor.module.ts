import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { MathEditorComponent } from './math-editor/math-editor.component';
import { StepEditorComponent } from './step-editor/step-editor.component';
import { GraphEditorComponent } from './graph-editor/graph-editor.component';
import { ExerciseEditorComponent } from './exercise-editor/exercise-editor.component';

const routes: Routes = [
  { path: '', component: ExerciseEditorComponent },
  { path: 'new', component: ExerciseEditorComponent },
  { path: ':id', component: ExerciseEditorComponent },
];

@NgModule({
  declarations: [
    MathEditorComponent,
    StepEditorComponent,
    GraphEditorComponent,
    ExerciseEditorComponent,
  ],
  imports: [CommonModule, FormsModule, RouterModule.forChild(routes)],
  exports: [MathEditorComponent, StepEditorComponent, GraphEditorComponent],
})
export class EditorModule {}
