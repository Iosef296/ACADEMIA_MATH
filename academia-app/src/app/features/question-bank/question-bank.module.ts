import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { QuestionBankListComponent } from './question-bank-list/question-bank-list.component';

const routes: Routes = [
  { path: '', component: QuestionBankListComponent },
];

@NgModule({
  declarations: [QuestionBankListComponent],
  imports: [CommonModule, FormsModule, RouterModule.forChild(routes)],
})
export class QuestionBankModule {}
