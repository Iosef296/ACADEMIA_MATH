import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LatexRendererComponent } from './components/latex-renderer/latex-renderer.component';

@NgModule({
  declarations: [LatexRendererComponent],
  imports: [CommonModule],
  exports: [LatexRendererComponent],
})
export class SharedModule {}
