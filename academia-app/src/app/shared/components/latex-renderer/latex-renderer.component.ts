import {
  Component,
  Input,
  ElementRef,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import katex from 'katex';

@Component({
  selector: 'app-latex-renderer',
  template: '<span></span>',
  standalone: false,
})
export class LatexRendererComponent implements OnChanges {
  @Input() latex = '';
  @Input() displayMode = false;

  constructor(private el: ElementRef<HTMLElement>) {}

  ngOnChanges(_changes: SimpleChanges): void {
    this.render();
  }

  private render(): void {
    const el = this.el.nativeElement;
    const src = this.latex?.trim() ?? '';
    if (!src) {
      el.innerHTML = '';
      return;
    }

    // If no $ delimiters: pure math expression
    if (!src.includes('$')) {
      try {
        katex.render(src, el, { displayMode: this.displayMode, throwOnError: false, output: 'html' });
      } catch {
        el.textContent = src;
      }
      return;
    }

    // Mixed text + math: parse segments
    el.innerHTML = this.parseMixed(src);
  }

  private parseMixed(src: string): string {
    const parts: string[] = [];
    let i = 0;

    while (i < src.length) {
      if (src[i] === '$') {
        const isDisplay = src[i + 1] === '$';
        const delim = isDisplay ? '$$' : '$';
        const start = i + delim.length;
        const end = src.indexOf(delim, start);

        if (end === -1) {
          // Unclosed delimiter — treat rest as text
          parts.push(this.escHtml(src.slice(i)));
          break;
        }

        const math = src.slice(start, end);
        try {
          parts.push(katex.renderToString(math, {
            displayMode: isDisplay,
            throwOnError: false,
            output: 'html',
          }));
        } catch {
          parts.push(this.escHtml(delim + math + delim));
        }
        i = end + delim.length;
      } else {
        // Accumulate plain text until next $
        const next = src.indexOf('$', i);
        const text = next === -1 ? src.slice(i) : src.slice(i, next);
        parts.push(this.escHtml(text));
        i = next === -1 ? src.length : next;
      }
    }

    return parts.join('');
  }

  private escHtml(s: string): string {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
}
