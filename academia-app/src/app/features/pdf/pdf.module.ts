import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { TemplateSelectorComponent } from './template-selector/template-selector.component';
import { PdfBuilderComponent } from './pdf-builder/pdf-builder.component';
import { CountTypePipe } from './pdf-builder/count-type.pipe';

const routes: Routes = [
  { path: '', component: TemplateSelectorComponent },
  { path: 'builder', component: PdfBuilderComponent },
];

@NgModule({
  declarations: [TemplateSelectorComponent, PdfBuilderComponent, CountTypePipe],
  imports: [CommonModule, FormsModule, RouterModule.forChild(routes)],
})
export class PdfModule {}
