import {
  Component,
  ElementRef,
  ViewChild,
  AfterViewInit,
  Input,
  Output,
  EventEmitter,
  OnDestroy,
} from '@angular/core';


@Component({
  selector: 'app-math-editor',
  templateUrl: './math-editor.component.html',
  standalone: false,
})
export class MathEditorComponent implements AfterViewInit, OnDestroy {
  @ViewChild('mathfield') mathfieldRef!: ElementRef;
  @Input() placeholder = 'Escribe aquí (ej: fracción, raíz, integral...)';
  @Input() initialValue = '';
  @Output() latexChange = new EventEmitter<string>();

  latex = '';
  private mf: any = null;

  ngAfterViewInit(): void {
    this.initMathLive();
  }

  private async initMathLive(): Promise<void> {
    await import('mathlive');
    const el = this.mathfieldRef.nativeElement as HTMLElement;
    el.innerHTML = '';
    const mf = document.createElement('math-field') as any;
    mf.style.width = '100%';
    mf.style.fontSize = '1.1rem';
    mf.style.padding = '8px 12px';
    mf.style.border = '1px solid #d1d5db';
    mf.style.borderRadius = '8px';
    mf.style.outline = 'none';
    if (this.initialValue) {
      mf.value = this.initialValue;
    }
    mf.addEventListener('input', () => {
      this.latex = mf.value;
      this.latexChange.emit(this.latex);
    });
    el.appendChild(mf);
    this.mf = mf;
  }

  getValue(): string {
    return this.mf?.value ?? '';
  }

  setValue(latex: string): void {
    if (this.mf) this.mf.value = latex;
  }

  ngOnDestroy(): void {
    this.mf = null;
  }
}
