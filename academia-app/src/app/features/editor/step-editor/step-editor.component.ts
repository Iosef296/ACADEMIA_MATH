import { Component, Input, Output, EventEmitter } from '@angular/core';

export interface StepDraft {
  stepOrder: number;
  contentLatex: string;
  hint: string;
  warning: string;
}

@Component({
  selector: 'app-step-editor',
  templateUrl: './step-editor.component.html',
  standalone: false,
})
export class StepEditorComponent {
  @Input() steps: StepDraft[] = [];
  @Output() stepsChange = new EventEmitter<StepDraft[]>();

  addStep(): void {
    this.steps = [
      ...this.steps,
      { stepOrder: this.steps.length + 1, contentLatex: '', hint: '', warning: '' },
    ];
    this.stepsChange.emit(this.steps);
  }

  removeStep(index: number): void {
    this.steps = this.steps
      .filter((_, i) => i !== index)
      .map((s, i) => ({ ...s, stepOrder: i + 1 }));
    this.stepsChange.emit(this.steps);
  }

  moveUp(index: number): void {
    if (index === 0) return;
    const arr = [...this.steps];
    [arr[index - 1], arr[index]] = [arr[index], arr[index - 1]];
    this.steps = arr.map((s, i) => ({ ...s, stepOrder: i + 1 }));
    this.stepsChange.emit(this.steps);
  }

  moveDown(index: number): void {
    if (index === this.steps.length - 1) return;
    const arr = [...this.steps];
    [arr[index], arr[index + 1]] = [arr[index + 1], arr[index]];
    this.steps = arr.map((s, i) => ({ ...s, stepOrder: i + 1 }));
    this.stepsChange.emit(this.steps);
  }

  onLatexChange(index: number, latex: string): void {
    this.steps[index].contentLatex = latex;
    this.stepsChange.emit(this.steps);
  }
}
