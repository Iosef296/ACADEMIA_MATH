import { Injectable } from '@angular/core';

/**
 * Heuristic multi-pass OCR text → LaTeX converter.
 * Zero external dependencies. Runs entirely client-side.
 *
 * Pipeline:
 *   Pass 1 — Unicode math symbol normalization
 *   Pass 2 — Mathematical keyword recognition (Spanish + English)
 *   Pass 3 — Fraction structural detection
 *   Pass 4 — Superscript / subscript brace normalization
 */
@Injectable({ providedIn: 'root' })
export class MathOcrService {

  convert(raw: string): string {
    const lines = raw.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    if (!lines.length) return '';
    if (lines.length === 1) return `$${this.processLine(lines[0])}$`;
    return lines.map(l => `$$${this.processLine(l)}$$`).join('\n');
  }

  processLine(line: string): string {
    let s = line;
    s = this.pass1Unicode(s);
    s = this.pass2Keywords(s);
    s = this.pass3Fractions(s);
    s = this.pass4Scripts(s);
    return s.trim();
  }

  private pass1Unicode(s: string): string {
    const MAP: Array<[RegExp, string]> = [
      // Superscript digits
      [/²/g, '^{2}'], [/³/g, '^{3}'], [/¹/g, '^{1}'],
      [/⁰/g, '^{0}'], [/⁴/g, '^{4}'], [/⁵/g, '^{5}'],
      [/⁶/g, '^{6}'], [/⁷/g, '^{7}'], [/⁸/g, '^{8}'], [/⁹/g, '^{9}'],
      // Subscript digits
      [/₀/g, '_{0}'], [/₁/g, '_{1}'], [/₂/g, '_{2}'], [/₃/g, '_{3}'],
      [/₄/g, '_{4}'], [/₅/g, '_{5}'], [/₆/g, '_{6}'], [/₇/g, '_{7}'],
      [/₈/g, '_{8}'], [/₉/g, '_{9}'],
      // Radicals
      [/√/g, '\\sqrt'], [/∛/g, '\\sqrt[3]'], [/∜/g, '\\sqrt[4]'],
      // Common constants
      [/∞/g, '\\infty'], [/π/g, '\\pi'],
      // Lowercase Greek
      [/α/g, '\\alpha'], [/β/g, '\\beta'], [/γ/g, '\\gamma'],
      [/δ/g, '\\delta'], [/ε/g, '\\varepsilon'], [/ζ/g, '\\zeta'],
      [/η/g, '\\eta'], [/θ/g, '\\theta'], [/ι/g, '\\iota'],
      [/κ/g, '\\kappa'], [/λ/g, '\\lambda'], [/μ/g, '\\mu'],
      [/ν/g, '\\nu'], [/ξ/g, '\\xi'], [/ρ/g, '\\rho'],
      [/σ/g, '\\sigma'], [/τ/g, '\\tau'], [/υ/g, '\\upsilon'],
      [/φ/g, '\\phi'], [/χ/g, '\\chi'], [/ψ/g, '\\psi'], [/ω/g, '\\omega'],
      // Uppercase Greek
      [/Γ/g, '\\Gamma'], [/Δ/g, '\\Delta'], [/Θ/g, '\\Theta'],
      [/Λ/g, '\\Lambda'], [/Ξ/g, '\\Xi'], [/Π/g, '\\Pi'],
      [/Σ/g, '\\Sigma'], [/Υ/g, '\\Upsilon'], [/Φ/g, '\\Phi'],
      [/Ψ/g, '\\Psi'], [/Ω/g, '\\Omega'],
      // Large operators
      [/∑/g, '\\sum'], [/∫/g, '\\int'], [/∏/g, '\\prod'],
      [/∂/g, '\\partial'], [/∇/g, '\\nabla'],
      // Arithmetic
      [/±/g, '\\pm'], [/∓/g, '\\mp'],
      [/×/g, '\\times'], [/÷/g, '\\div'],
      [/·/g, '\\cdot'], [/∙/g, '\\cdot'],
      // Relations
      [/≤/g, '\\leq'], [/≥/g, '\\geq'], [/≠/g, '\\neq'],
      [/≈/g, '\\approx'], [/≡/g, '\\equiv'], [/≅/g, '\\cong'],
      [/∝/g, '\\propto'], [/∼/g, '\\sim'],
      // Sets
      [/∈/g, '\\in'], [/∉/g, '\\notin'], [/∋/g, '\\ni'],
      [/⊂/g, '\\subset'], [/⊆/g, '\\subseteq'],
      [/⊃/g, '\\supset'], [/⊇/g, '\\supseteq'],
      [/∪/g, '\\cup'], [/∩/g, '\\cap'], [/∅/g, '\\emptyset'],
      // Arrows
      [/→/g, '\\rightarrow'], [/←/g, '\\leftarrow'],
      [/↔/g, '\\leftrightarrow'], [/↑/g, '\\uparrow'], [/↓/g, '\\downarrow'],
      [/⇒/g, '\\Rightarrow'], [/⇐/g, '\\Leftarrow'],
      [/⇔/g, '\\Leftrightarrow'],
      // Logic
      [/∀/g, '\\forall'], [/∃/g, '\\exists'], [/∄/g, '\\nexists'],
      [/¬/g, '\\neg'], [/∧/g, '\\wedge'], [/∨/g, '\\vee'],
      // Misc
      [/…/g, '\\ldots'], [/⋯/g, '\\cdots'], [/⋮/g, '\\vdots'],
      [/⌈/g, '\\lceil'], [/⌉/g, '\\rceil'],
      [/⌊/g, '\\lfloor'], [/⌋/g, '\\rfloor'],
      [/‖/g, '\\|'],
    ];
    for (const [re, rep] of MAP) s = s.replace(re, rep);
    return s;
  }

  private pass2Keywords(s: string): string {
    // ASCII operator pairs (order matters: longest first)
    s = s.replace(/<=/g, '\\leq').replace(/>=/g, '\\geq')
         .replace(/!=/g, '\\neq').replace(/<>/g, '\\neq')
         .replace(/->/g, '\\rightarrow').replace(/<-/g, '\\leftarrow')
         .replace(/\.\.\./g, '\\ldots');

    // Trig/log/calc functions (Spanish + English, word-boundary safe)
    const FUNCS: Array<[RegExp, string]> = [
      [/\bsen\b/g, '\\sin'],        // Spanish
      [/\bsin\b/g, '\\sin'], [/\bcos\b/g, '\\cos'], [/\btan\b/g, '\\tan'],
      [/\bcot\b/g, '\\cot'], [/\bsec\b/g, '\\sec'], [/\bcsc\b/g, '\\csc'],
      [/\barcsin\b/g, '\\arcsin'], [/\barccos\b/g, '\\arccos'],
      [/\barctan\b/g, '\\arctan'],
      [/\bsinh\b/g, '\\sinh'], [/\bcosh\b/g, '\\cosh'], [/\btanh\b/g, '\\tanh'],
      [/\bln\b/g, '\\ln'], [/\blog\b/g, '\\log'],
      [/\blim\b/g, '\\lim'], [/\bmax\b/g, '\\max'], [/\bmin\b/g, '\\min'],
      [/\bsup\b/g, '\\sup'], [/\binf\b/g, '\\inf'],
      [/\bdet\b/g, '\\det'], [/\bdim\b/g, '\\dim'],
      [/\bker\b/g, '\\ker'], [/\bmod\b/g, '\\bmod'],
      [/\bgcd\b/g, '\\gcd'],
    ];
    for (const [re, rep] of FUNCS) s = s.replace(re, rep);

    // sqrt with parens → braces
    s = s.replace(/\\?sqrt\s*\(([^)]+)\)/g, '\\sqrt{$1}');
    s = s.replace(/\bsqrt\b/g, '\\sqrt');
    s = s.replace(/\braiz\b/gi, '\\sqrt');       // Spanish

    // Greek letter words (case-insensitive)
    const GREEK: Array<[RegExp, string]> = [
      [/\balpha\b/gi, '\\alpha'], [/\bbeta\b/gi, '\\beta'],
      [/\bgamma\b/gi, '\\gamma'], [/\bdelta\b/gi, '\\delta'],
      [/\bepsilon\b/gi, '\\varepsilon'], [/\btheta\b/gi, '\\theta'],
      [/\blambda\b/gi, '\\lambda'], [/\bmu\b/gi, '\\mu'],
      [/\bnu\b/gi, '\\nu'], [/\bxi\b/gi, '\\xi'],
      [/\bsigma\b/gi, '\\sigma'], [/\btau\b/gi, '\\tau'],
      [/\bphi\b/gi, '\\phi'], [/\bpsi\b/gi, '\\psi'],
      [/\bomega\b/gi, '\\omega'], [/\bpi\b/gi, '\\pi'],
    ];
    for (const [re, rep] of GREEK) s = s.replace(re, rep);

    // Math keywords (en/es)
    const KW: Array<[RegExp, string]> = [
      [/\binfty\b/g, '\\infty'],
      [/\binfinity\b/gi, '\\infty'],
      [/\binfinit[oa]?\b/gi, '\\infty'],        // Spanish
      [/\bsum\b/gi, '\\sum'],
      [/\bsumatoria\b/gi, '\\sum'],
      [/\bprod\b/gi, '\\prod'],
      [/\bintegral\b/gi, '\\int'],
      [/\bpartial\b/gi, '\\partial'],
      [/\bforall\b/gi, '\\forall'],
      [/\bpara\s+todo\b/gi, '\\forall'],
      [/\bexists?\b/gi, '\\exists'],
      [/\bexiste\b/gi, '\\exists'],
      [/\bnabla\b/gi, '\\nabla'],
      [/\bcdot\b/gi, '\\cdot'],
      [/\btimes\b/gi, '\\times'],
      [/\bldots\b/g, '\\ldots'], [/\bcdots\b/g, '\\cdots'],
      [/\bsubset\b/gi, '\\subset'],
      [/\bemptyset\b/gi, '\\emptyset'],
      [/\bneg\b/g, '\\neg'], [/\bnot\b/g, '\\neg'],
      [/\bwedge\b/g, '\\wedge'], [/\bvee\b/g, '\\vee'],
      // floor/ceil/abs with parens
      [/\bfloor\s*\(([^)]+)\)/g, '\\lfloor $1 \\rfloor'],
      [/\bceil\s*\(([^)]+)\)/g, '\\lceil $1 \\rceil'],
      [/\babs\s*\(([^)]+)\)/g, '|$1|'],
    ];
    for (const [re, rep] of KW) s = s.replace(re, rep);

    return s;
  }

  private pass3Fractions(s: string): string {
    // (complex expr) / (complex expr)
    s = s.replace(/\(([^)]+)\)\s*\/\s*\(([^)]+)\)/g, '\\frac{$1}{$2}');
    // simple token / simple token  (avoid re-processing already-converted \frac)
    s = s.replace(/(?<!\\frac\{[^}]*\})\b([a-zA-Z0-9_^{}\\]+)\s*\/\s*([a-zA-Z0-9_^{}\\]+)\b/g,
      '\\frac{$1}{$2}');
    return s;
  }

  private pass4Scripts(s: string): string {
    // x^2 → x^{2}  (skip if already braced)
    s = s.replace(/\^([0-9a-zA-Z])(?!\{)/g, '^{$1}');
    // x_n → x_{n}
    s = s.replace(/_([0-9a-zA-Z])(?!\{)/g, '_{$1}');
    return s;
  }
}
