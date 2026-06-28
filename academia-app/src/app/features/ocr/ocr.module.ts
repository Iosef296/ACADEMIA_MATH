import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { OcrComponent } from './ocr.component';

const routes: Routes = [
  { path: '', component: OcrComponent },
];

@NgModule({
  declarations: [OcrComponent],
  imports: [CommonModule, RouterModule.forChild(routes)],
})
export class OcrModule {}
