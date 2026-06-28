package pe.edu.upeu.academia_api.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/ocr")
public class OcrController {

    @PostMapping("/extract")
    public ResponseEntity<Map<String, String>> extract(@RequestParam("image") MultipartFile image) {
        String filename = image.getOriginalFilename() != null ? image.getOriginalFilename() : "image";
        return ResponseEntity.ok(Map.of(
                "latex", "% LaTeX extracted from " + filename,
                "text", filename
        ));
    }
}
