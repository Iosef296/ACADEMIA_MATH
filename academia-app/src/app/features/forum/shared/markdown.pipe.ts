import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

const escape = (s: string) =>
  s.replace(/&/g, '&amp;')
   .replace(/</g, '&lt;')
   .replace(/>/g, '&gt;');

@Pipe({ name: 'forumMarkdown', standalone: false })
export class ForumMarkdownPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}

  transform(value: string | null | undefined): SafeHtml {
    if (!value) return '';
    let text = escape(value);

    // Bloques de código ```code```
    text = text.replace(/```([\s\S]*?)```/g,
      (_, code) => `<pre class="bg-gray-900 text-gray-100 rounded-lg p-3 my-2 overflow-x-auto text-xs"><code>${code.trim()}</code></pre>`);

    // Inline code `code`
    text = text.replace(/`([^`\n]+)`/g,
      (_, code) => `<code class="bg-gray-100 text-pink-700 px-1.5 py-0.5 rounded text-[0.9em] font-mono">${code}</code>`);

    // Negrita **text**
    text = text.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>');

    // Itálica *text*  (evita colisión con negrita usando lookaround simple)
    text = text.replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, '$1<em>$2</em>');

    // Listas: líneas que empiezan con "- " → <ul><li>
    text = text.replace(/(^|\n)((?:- .+(?:\n|$))+)/g, (_, prefix, block) => {
      const items = block.trim().split('\n')
        .map((l: string) => `<li>${l.replace(/^- /, '')}</li>`)
        .join('');
      return `${prefix}<ul class="list-disc pl-5 my-1 space-y-0.5">${items}</ul>`;
    });

    // Saltos de línea simples → <br>
    text = text.replace(/\n/g, '<br>');

    return this.sanitizer.bypassSecurityTrustHtml(text);
  }
}
