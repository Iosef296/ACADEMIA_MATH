package pe.edu.upeu.academia_api.util;

/**
 * Heuristic multi-pass OCR text → LaTeX converter (Java mirror of MathOcrService.ts).
 * Zero external dependencies. Pure Java 21.
 *
 * Pipeline:
 *   Pass 1 — Unicode math symbol normalization
 *   Pass 2 — Mathematical keyword recognition (Spanish + English)
 *   Pass 3 — Fraction structural detection
 *   Pass 4 — Superscript / subscript brace normalization
 */
public final class MathLatexConverter {

    private MathLatexConverter() {}

    public static String convert(String raw) {
        if (raw == null || raw.isBlank()) return "";
        String[] lines = raw.split("\n");
        StringBuilder sb = new StringBuilder();
        for (String line : lines) {
            String trimmed = line.trim();
            if (trimmed.isEmpty()) continue;
            if (!sb.isEmpty()) sb.append("\\\\\n");
            String processed = processLine(trimmed);
            if (lines.length == 1) sb.append("$").append(processed).append("$");
            else sb.append("$$").append(processed).append("$$");
        }
        return sb.toString();
    }

    static String processLine(String line) {
        String s = line;
        s = pass1Unicode(s);
        s = pass2Keywords(s);
        s = pass3Fractions(s);
        s = pass4Scripts(s);
        return s.trim();
    }

    private static String pass1Unicode(String s) {
        // Superscript digits
        s = s.replace("²", "^{2}").replace("³", "^{3}").replace("¹", "^{1}")
             .replace("⁰", "^{0}").replace("⁴", "^{4}").replace("⁵", "^{5}")
             .replace("⁶", "^{6}").replace("⁷", "^{7}").replace("⁸", "^{8}").replace("⁹", "^{9}");
        // Subscript digits
        s = s.replace("₀", "_{0}").replace("₁", "_{1}").replace("₂", "_{2}").replace("₃", "_{3}")
             .replace("₄", "_{4}").replace("₅", "_{5}").replace("₆", "_{6}").replace("₇", "_{7}")
             .replace("₈", "_{8}").replace("₉", "_{9}");
        // Radicals
        s = s.replace("√", "\\sqrt").replace("∛", "\\sqrt[3]").replace("∜", "\\sqrt[4]");
        // Common constants
        s = s.replace("∞", "\\infty").replace("π", "\\pi");
        // Lowercase Greek
        s = s.replace("α", "\\alpha").replace("β", "\\beta").replace("γ", "\\gamma")
             .replace("δ", "\\delta").replace("ε", "\\varepsilon").replace("ζ", "\\zeta")
             .replace("η", "\\eta").replace("θ", "\\theta").replace("ι", "\\iota")
             .replace("κ", "\\kappa").replace("λ", "\\lambda").replace("μ", "\\mu")
             .replace("ν", "\\nu").replace("ξ", "\\xi").replace("ρ", "\\rho")
             .replace("σ", "\\sigma").replace("τ", "\\tau").replace("υ", "\\upsilon")
             .replace("φ", "\\phi").replace("χ", "\\chi").replace("ψ", "\\psi").replace("ω", "\\omega");
        // Uppercase Greek
        s = s.replace("Γ", "\\Gamma").replace("Δ", "\\Delta").replace("Θ", "\\Theta")
             .replace("Λ", "\\Lambda").replace("Ξ", "\\Xi").replace("Π", "\\Pi")
             .replace("Σ", "\\Sigma").replace("Υ", "\\Upsilon").replace("Φ", "\\Phi")
             .replace("Ψ", "\\Psi").replace("Ω", "\\Omega");
        // Large operators
        s = s.replace("∑", "\\sum").replace("∫", "\\int").replace("∏", "\\prod")
             .replace("∂", "\\partial").replace("∇", "\\nabla");
        // Arithmetic
        s = s.replace("±", "\\pm").replace("∓", "\\mp")
             .replace("×", "\\times").replace("÷", "\\div")
             .replace("·", "\\cdot").replace("∙", "\\cdot");
        // Relations
        s = s.replace("≤", "\\leq").replace("≥", "\\geq").replace("≠", "\\neq")
             .replace("≈", "\\approx").replace("≡", "\\equiv").replace("≅", "\\cong")
             .replace("∝", "\\propto").replace("∼", "\\sim");
        // Sets
        s = s.replace("∈", "\\in").replace("∉", "\\notin").replace("∋", "\\ni")
             .replace("⊂", "\\subset").replace("⊆", "\\subseteq")
             .replace("⊃", "\\supset").replace("⊇", "\\supseteq")
             .replace("∪", "\\cup").replace("∩", "\\cap").replace("∅", "\\emptyset");
        // Arrows
        s = s.replace("→", "\\rightarrow").replace("←", "\\leftarrow")
             .replace("↔", "\\leftrightarrow").replace("↑", "\\uparrow").replace("↓", "\\downarrow")
             .replace("⇒", "\\Rightarrow").replace("⇐", "\\Leftarrow").replace("⇔", "\\Leftrightarrow");
        // Logic
        s = s.replace("∀", "\\forall").replace("∃", "\\exists").replace("∄", "\\nexists")
             .replace("¬", "\\neg").replace("∧", "\\wedge").replace("∨", "\\vee");
        // Misc
        s = s.replace("…", "\\ldots").replace("⋯", "\\cdots").replace("⋮", "\\vdots")
             .replace("⌈", "\\lceil").replace("⌉", "\\rceil")
             .replace("⌊", "\\lfloor").replace("⌋", "\\rfloor")
             .replace("‖", "\\|");
        return s;
    }

    private static String pass2Keywords(String s) {
        // ASCII operator pairs (longest first)
        s = s.replace("<=", "\\leq").replace(">=", "\\geq")
             .replace("!=", "\\neq").replace("<>", "\\neq")
             .replace("->", "\\rightarrow").replace("<-", "\\leftarrow")
             .replace("...", "\\ldots");

        // Math functions with word boundaries (\b in regex → \\b in Java literal)
        // Replacement "\\\\cmd" → value \\cmd → in replaceAll → \cmd in output
        String[][] wordFuncs = {
            {"sen",    "\\\\sin"},   // Spanish
            {"arcsin", "\\\\arcsin"}, {"arccos", "\\\\arccos"}, {"arctan", "\\\\arctan"},
            {"sinh",   "\\\\sinh"},  {"cosh",   "\\\\cosh"},   {"tanh",   "\\\\tanh"},
            {"sin",    "\\\\sin"},   {"cos",    "\\\\cos"},    {"tan",    "\\\\tan"},
            {"cot",    "\\\\cot"},   {"sec",    "\\\\sec"},    {"csc",    "\\\\csc"},
            {"ln",     "\\\\ln"},    {"log",    "\\\\log"},
            {"lim",    "\\\\lim"},   {"max",    "\\\\max"},    {"min",    "\\\\min"},
            {"sup",    "\\\\sup"},   {"det",    "\\\\det"},    {"dim",    "\\\\dim"},
            {"ker",    "\\\\ker"},   {"gcd",    "\\\\gcd"},
            {"sqrt",   "\\\\sqrt"},  {"raiz",   "\\\\sqrt"},   // raiz = Spanish
        };
        for (String[] pair : wordFuncs) {
            s = s.replaceAll("(?i)\\b" + pair[0] + "\\b", pair[1]);
        }

        // sqrt(expr) → \sqrt{expr}
        s = s.replaceAll("\\\\sqrt\\s*\\(([^)]+)\\)", "\\\\sqrt{$1}");

        // Greek letter words
        String[][] greek = {
            {"alpha",   "\\\\alpha"},   {"beta",    "\\\\beta"},
            {"gamma",   "\\\\gamma"},   {"delta",   "\\\\delta"},
            {"epsilon", "\\\\varepsilon"}, {"theta", "\\\\theta"},
            {"lambda",  "\\\\lambda"},  {"mu",      "\\\\mu"},
            {"nu",      "\\\\nu"},      {"xi",      "\\\\xi"},
            {"sigma",   "\\\\sigma"},   {"tau",     "\\\\tau"},
            {"phi",     "\\\\phi"},     {"psi",     "\\\\psi"},
            {"omega",   "\\\\omega"},   {"pi",      "\\\\pi"},
        };
        for (String[] pair : greek) {
            s = s.replaceAll("(?i)\\b" + pair[0] + "\\b", pair[1]);
        }

        // Math keywords (en/es)
        s = s.replaceAll("(?i)\\binfty\\b",       "\\\\infty");
        s = s.replaceAll("(?i)\\binfinity\\b",    "\\\\infty");
        s = s.replaceAll("(?i)\\binfinit[oa]?\\b","\\\\infty");
        s = s.replaceAll("(?i)\\bsum\\b",         "\\\\sum");
        s = s.replaceAll("(?i)\\bsumatoria\\b",   "\\\\sum");
        s = s.replaceAll("(?i)\\bprod\\b",        "\\\\prod");
        s = s.replaceAll("(?i)\\bintegral\\b",    "\\\\int");
        s = s.replaceAll("(?i)\\bpartial\\b",     "\\\\partial");
        s = s.replaceAll("(?i)\\bforall\\b",      "\\\\forall");
        s = s.replaceAll("(?i)\\bpara todo\\b",   "\\\\forall");
        s = s.replaceAll("(?i)\\bexists?\\b",     "\\\\exists");
        s = s.replaceAll("(?i)\\bexiste\\b",      "\\\\exists");
        s = s.replaceAll("(?i)\\bnabla\\b",       "\\\\nabla");
        s = s.replaceAll("(?i)\\bcdot\\b",        "\\\\cdot");
        s = s.replaceAll("(?i)\\btimes\\b",       "\\\\times");
        s = s.replaceAll("\\bldots\\b",           "\\\\ldots");
        s = s.replaceAll("\\bcdots\\b",           "\\\\cdots");
        s = s.replaceAll("(?i)\\bsubset\\b",      "\\\\subset");
        s = s.replaceAll("(?i)\\bemptyset\\b",    "\\\\emptyset");
        s = s.replaceAll("\\bneg\\b",             "\\\\neg");
        s = s.replaceAll("\\bnot\\b",             "\\\\neg");
        s = s.replaceAll("\\bwedge\\b",           "\\\\wedge");
        s = s.replaceAll("\\bvee\\b",             "\\\\vee");
        s = s.replaceAll("\\bldots\\b",           "\\\\ldots");

        // floor/ceil/abs with parens
        s = s.replaceAll("\\bfloor\\s*\\(([^)]+)\\)", "\\\\lfloor $1 \\\\rfloor");
        s = s.replaceAll("\\bceil\\s*\\(([^)]+)\\)",  "\\\\lceil $1 \\\\rceil");
        s = s.replaceAll("\\babs\\s*\\(([^)]+)\\)",   "|$1|");

        return s;
    }

    private static String pass3Fractions(String s) {
        // (complex) / (complex)
        s = s.replaceAll("\\(([^)]+)\\)\\s*/\\s*\\(([^)]+)\\)", "\\\\frac{$1}{$2}");
        // simple token / simple token
        s = s.replaceAll("([a-zA-Z0-9_^{}\\\\]+)\\s*/\\s*([a-zA-Z0-9_^{}\\\\]+)",
                         "\\\\frac{$1}{$2}");
        return s;
    }

    private static String pass4Scripts(String s) {
        // x^2 → x^{2}  (skip if already braced)
        s = s.replaceAll("\\^([0-9a-zA-Z])(?!\\{)", "^{$1}");
        // x_n → x_{n}
        s = s.replaceAll("_([0-9a-zA-Z])(?!\\{)", "_{$1}");
        return s;
    }
}
