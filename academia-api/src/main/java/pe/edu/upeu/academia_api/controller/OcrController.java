package pe.edu.upeu.academia_api.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;
import pe.edu.upeu.academia_api.util.MathLatexConverter;

import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@RestController
@RequestMapping("/ocr")
public class OcrController {

    @Value("${gemini.api.key:}")
    private String geminiApiKey;

    private static final String GEMINI_URL =
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=";

    private static final String PROMPT =
        "Eres un experto en matemáticas. Esta imagen contiene ejercicios o apuntes " +
        "matemáticos escritos a mano. Extrae TODO el contenido matemático que puedas ver " +
        "y conviértelo a LaTeX válido. Devuelve ÚNICAMENTE el código LaTeX, sin bloques " +
        "de markdown, sin explicaciones, sin texto adicional.";

    /**
     * Receives the image, calls Gemini Vision for OCR, returns LaTeX.
     * Falls back to MathLatexConverter if no API key or Gemini fails.
     */
    @PostMapping("/extract")
    public ResponseEntity<Map<String, String>> extract(
            @RequestParam("image") MultipartFile image,
            @RequestParam(value = "text", required = false, defaultValue = "") String text) {

        // If Gemini key is configured, use AI vision
        if (!geminiApiKey.isBlank()) {
            try {
                String base64 = Base64.getEncoder().encodeToString(image.getBytes());
                String mimeType = Objects.requireNonNullElse(image.getContentType(), "image/jpeg");
                String latex = callGemini(base64, mimeType);
                return ResponseEntity.ok(Map.of("latex", latex, "text", latex));
            } catch (Exception e) {
                // Log and fall through to text-based fallback
                System.err.println("[OCR] Gemini error: " + e.getMessage());
            }
        }

        // Fallback: use the text passed by the frontend (Tesseract result)
        if (text.isBlank()) {
            return ResponseEntity.ok(Map.of("latex", "", "text", ""));
        }
        String latex = MathLatexConverter.convert(text);
        return ResponseEntity.ok(Map.of("latex", latex, "text", text));
    }

    /**
     * Standalone text → LaTeX conversion endpoint.
     */
    @PostMapping("/convert")
    public ResponseEntity<Map<String, String>> convert(@RequestBody Map<String, String> body) {
        String text = body.getOrDefault("text", "");
        if (text.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "text is required"));
        }
        return ResponseEntity.ok(Map.of("latex", MathLatexConverter.convert(text)));
    }

    @SuppressWarnings("unchecked")
    private String callGemini(String base64Image, String mimeType) throws Exception {
        RestTemplate rt = new RestTemplate();

        Map<String, Object> inlineData = Map.of("mime_type", mimeType, "data", base64Image);
        Map<String, Object> imagePart  = Map.of("inline_data", inlineData);
        Map<String, Object> textPart   = Map.of("text", PROMPT);
        Map<String, Object> content    = Map.of("parts", List.of(textPart, imagePart));
        Map<String, Object> reqBody    = Map.of("contents", List.of(content));

        String json = rt.postForObject(GEMINI_URL + geminiApiKey, reqBody, String.class);

        ObjectMapper om = new ObjectMapper();
        JsonNode root = om.readTree(json);
        return root.path("candidates").get(0)
                   .path("content").path("parts").get(0)
                   .path("text").asText("").trim();
    }
}
