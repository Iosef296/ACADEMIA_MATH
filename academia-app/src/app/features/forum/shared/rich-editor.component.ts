import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter,
         Input, OnChanges, Output, SimpleChanges, ViewChild } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-forum-rich-editor',
  templateUrl: './rich-editor.component.html',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ForumRichEditorComponent implements OnChanges {
  @Input() value = '';
  @Input() placeholder = 'Escribe... **markdown** y $LaTeX$ soportados';
  @Input() rows = 5;
  @Input() showPreview = true;

  @Output() valueChange = new EventEmitter<string>();

  @ViewChild('ta') textareaRef?: ElementRef<HTMLTextAreaElement>;

  ocrLoading = false;
  ocrError = '';
  dragOver = false;

  constructor(private api: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnChanges(_: SimpleChanges): void {
    this.cdr.markForCheck();
  }

  onInput(v: string): void {
    this.value = v;
    this.valueChange.emit(v);
  }

  apply(format: 'bold' | 'italic' | 'code' | 'codeblock' | 'list' | 'math'): void {
    const wraps: Record<string, [string, string, string]> = {
      bold:      ['**', '**', 'texto'],
      italic:    ['*', '*', 'texto'],
      code:      ['`', '`', 'código'],
      codeblock: ['\n```\n', '\n```\n', 'código'],
      list:      ['\n- ', '', 'ítem'],
      math:      ['$', '$', 'x^2'],
    };
    const [pre, post, ph] = wraps[format];
    const ta = this.textareaRef?.nativeElement;
    if (ta) {
      const start = ta.selectionStart ?? this.value.length;
      const end = ta.selectionEnd ?? this.value.length;
      const selected = this.value.substring(start, end) || ph;
      const before = this.value.substring(0, start);
      const after = this.value.substring(end);
      const next = before + pre + selected + post + after;
      this.value = next;
      this.valueChange.emit(next);
      setTimeout(() => {
        ta.focus();
        const pos = start + pre.length + selected.length;
        ta.setSelectionRange(pos, pos);
      });
    } else {
      const next = this.value + pre + ph + post;
      this.value = next;
      this.valueChange.emit(next);
    }
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) this.runOcr(file);
    input.value = '';
  }

  onDragOver(e: DragEvent): void {
    e.preventDefault();
    this.dragOver = true;
    this.cdr.markForCheck();
  }
  onDragLeave(e: DragEvent): void {
    e.preventDefault();
    this.dragOver = false;
    this.cdr.markForCheck();
  }
  onDrop(e: DragEvent): void {
    e.preventDefault();
    this.dragOver = false;
    const file = e.dataTransfer?.files?.[0];
    if (file && file.type.startsWith('image/')) this.runOcr(file);
    this.cdr.markForCheck();
  }

  private runOcr(file: File): void {
    this.ocrError = '';
    this.ocrLoading = true;
    this.cdr.markForCheck();
    this.api.upload<{ latex: string; text: string }>('ocr/extract', file)
      .subscribe({
        next: (res) => {
          const latex = (res.latex ?? res.text ?? '').trim();
          if (latex) {
            const snippet = `\n\n$$${latex}$$\n\n`;
            const next = (this.value || '') + snippet;
            this.value = next;
            this.valueChange.emit(next);
          } else {
            this.ocrError = 'La imagen no contiene contenido matemático reconocible.';
          }
          this.ocrLoading = false;
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.ocrLoading = false;
          this.ocrError = 'No se pudo procesar la imagen.';
          console.error('OCR error:', err);
          this.cdr.markForCheck();
        },
      });
  }
}
