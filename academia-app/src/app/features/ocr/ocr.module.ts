import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { OcrComponent } from './ocr.component';
import { SharedModule } from '../../shared/shared.module';

const routes: Routes = [
  { path: '', component: OcrComponent },
];

@NgModule({
  declarations: [OcrComponent],
  imports: [CommonModule, RouterModule.forChild(routes), SharedModule],
})
export class OcrModule {}
