package pe.edu.upeu.academia_api.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
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

    @Value("${openrouter.api.key:}")
    private String openRouterKey;

    private static final String OR_URL = "https://openrouter.ai/api/v1/chat/completions";

    private static final List<String> MODELS = List.of(
        "google/gemma-4-31b-it:free",
        "nvidia/nemotron-nano-12b-v2-vl:free",
        "google/gemma-4-26b-a4b-it:free",
        "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free"
    );

    private static final String PROMPT =
        "Eres un experto en matemáticas. Esta imagen contiene ejercicios o apuntes " +
        "matemáticos escritos a mano. Extrae TODO el contenido matemático que veas " +
        "y conviértelo a LaTeX. Devuelve ÚNICAMENTE el código LaTeX, sin bloques " +
        "de markdown (no uses ```), sin explicaciones, sin texto adicional.";

    @PostMapping("/extract")
    public ResponseEntity<Map<String, String>> extract(
            @RequestParam("image") MultipartFile image,
            @RequestParam(value = "text", required = false, defaultValue = "") String text) {

        if (!openRouterKey.isBlank()) {
            try {
                String base64   = Base64.getEncoder().encodeToString(image.getBytes());
                String mimeType = Objects.requireNonNullElse(image.getContentType(), "image/jpeg");
                String latex    = callWithFallback(base64, mimeType);
                return ResponseEntity.ok(Map.of("latex", latex, "text", latex));
            } catch (Exception e) {
                System.err.println("[OCR] OpenRouter error: " + e.getMessage());
            }
        }

        if (text.isBlank()) return ResponseEntity.ok(Map.of("latex", "", "text", ""));
        return ResponseEntity.ok(Map.of("latex", MathLatexConverter.convert(text), "text", text));
    }

    @PostMapping("/convert")
    public ResponseEntity<Map<String, String>> convert(@RequestBody Map<String, String> body) {
        String text = body.getOrDefault("text", "");
        if (text.isBlank()) return ResponseEntity.badRequest().body(Map.of("error", "text is required"));
        return ResponseEntity.ok(Map.of("latex", MathLatexConverter.convert(text)));
    }

    private String callWithFallback(String base64Image, String mimeType) throws Exception {
        Exception lastError = null;
        for (String model : MODELS) {
            try {
                String result = callOpenRouter(base64Image, mimeType, model);
                System.out.println("[OCR] Model " + model + " succeeded.");
                return result;
            } catch (Exception e) {
                System.err.println("[OCR] Model " + model + " failed: " + e.getMessage() + ", trying next...");
                lastError = e;
            }
        }
        throw lastError != null ? lastError : new RuntimeException("All OCR models failed");
    }

    private String callOpenRouter(String base64Image, String mimeType, String model) throws Exception {
        RestTemplate rt = new RestTemplate();

        Map<String, Object> textContent  = Map.of("type", "text", "text", PROMPT);
        Map<String, Object> imageContent = Map.of(
            "type", "image_url",
            "image_url", Map.of("url", "data:" + mimeType + ";base64," + base64Image)
        );
        Map<String, Object> message = Map.of(
            "role", "user",
            "content", List.of(textContent, imageContent)
        );
        Map<String, Object> reqBody = Map.of(
            "model", model,
            "messages", List.of(message),
            "max_tokens", 2048
        );

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(openRouterKey);
        headers.set("HTTP-Referer", "https://thorough-acceptance-production-2a5e.up.railway.app");
        headers.set("X-Title", "MathLearn OCR");

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(reqBody, headers);
        ResponseEntity<String> resp = rt.postForEntity(OR_URL, entity, String.class);

        ObjectMapper om = new ObjectMapper();
        JsonNode root = om.readTree(resp.getBody());
        JsonNode choices = root.path("choices");
        if (choices.isEmpty() || choices.get(0) == null) {
            throw new RuntimeException("No choices in response from " + model + ": " + resp.getBody());
        }
        String raw = choices.get(0).path("message").path("content").asText("").trim();
        // Strip invisible math Unicode (U+2061–U+2064, zero-width, BOM) that KaTeX can't render
        return raw.replaceAll("[\\u2061-\\u2064\\u200B-\\u200F\\uFEFF]", "");
    }
}
