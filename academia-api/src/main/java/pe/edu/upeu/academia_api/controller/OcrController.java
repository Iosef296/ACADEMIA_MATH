package pe.edu.upeu.academia_api.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import pe.edu.upeu.academia_api.util.MathLatexConverter;

import java.util.Map;

@RestController
@RequestMapping("/ocr")
public class OcrController {

    /**
     * Accepts image upload + pre-extracted OCR text.
     * Frontend sends both so the server can apply its own conversion pass.
     */
    @PostMapping("/extract")
    public ResponseEntity<Map<String, String>> extract(
            @RequestParam("image") MultipartFile image,
            @RequestParam(value = "text", required = false, defaultValue = "") String text) {

        if (text.isBlank()) {
            return ResponseEntity.ok(Map.of("latex", "", "text", ""));
        }
        String latex = MathLatexConverter.convert(text);
        return ResponseEntity.ok(Map.of("latex", latex, "text", text));
    }

    /**
     * Standalone text → LaTeX endpoint.
     * Accepts { "text": "..." } JSON body, returns { "latex": "..." }.
     */
    @PostMapping("/convert")
    public ResponseEntity<Map<String, String>> convert(@RequestBody Map<String, String> body) {
        String text = body.getOrDefault("text", "");
        if (text.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "text is required"));
        }
        return ResponseEntity.ok(Map.of("latex", MathLatexConverter.convert(text)));
    }
}
