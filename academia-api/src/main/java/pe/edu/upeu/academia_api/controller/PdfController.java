package pe.edu.upeu.academia_api.controller;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import pe.edu.upeu.academia_api.service.impl.PdfServiceImpl;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/pdf")
@RequiredArgsConstructor
public class PdfController {

    private final PdfServiceImpl pdfService;
    private final ConcurrentHashMap<String, byte[]> previewCache = new ConcurrentHashMap<>();

    @GetMapping("/templates")
    public ResponseEntity<List<Map<String, Object>>> getTemplates() {
        return ResponseEntity.ok(pdfService.getTemplates());
    }

    @GetMapping("/templates/{id}")
    public ResponseEntity<Map<String, Object>> getTemplate(@PathVariable int id) {
        Optional<Map<String, Object>> template = pdfService.getTemplateById(id);
        return template.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/generate")
    public ResponseEntity<byte[]> generate(@RequestBody Map<String, Object> payload) {
        byte[] pdf = pdfService.generatePdf(payload);
        String filename = payload.getOrDefault("title", "documento").toString()
                .replaceAll("[^a-zA-Z0-9_\\-]", "_") + ".pdf";
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .body(pdf);
    }

    @PostMapping("/preview")
    public ResponseEntity<Map<String, String>> preview(
            @RequestBody Map<String, Object> payload,
            HttpServletRequest request) {
        byte[] pdf = pdfService.generatePdf(payload);
        String previewId = UUID.randomUUID().toString();
        previewCache.put(previewId, pdf);
        String baseUrl = request.getScheme() + "://" + request.getServerName() + ":" + request.getServerPort();
        return ResponseEntity.ok(Map.of("url", baseUrl + "/api/pdf/view/" + previewId));
    }

    @GetMapping(value = "/view/{previewId}", produces = MediaType.APPLICATION_PDF_VALUE)
    public ResponseEntity<byte[]> viewPreview(@PathVariable String previewId) {
        byte[] pdf = previewCache.get(previewId);
        if (pdf == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"preview.pdf\"")
                .body(pdf);
    }
}
