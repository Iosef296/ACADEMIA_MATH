package pe.edu.upeu.academia_api.service.impl;

import com.lowagie.text.Document;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.pdf.PdfWriter;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import pe.edu.upeu.academia_api.repository.ExerciseRepository;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PdfServiceImpl {

    private final ExerciseRepository exerciseRepository;

    private static final List<Map<String, Object>> TEMPLATES = List.of(
            Map.of("id", 1, "name", "Examen Formal",
                    "config", Map.of("primaryColor", "#1e40af", "header", "Evaluación", "footer", "ACADEMIA")),
            Map.of("id", 2, "name", "Guía de Estudio",
                    "config", Map.of("primaryColor", "#065f46", "header", "Guía", "footer", "Material de Estudio")),
            Map.of("id", 3, "name", "Hoja de Práctica",
                    "config", Map.of("primaryColor", "#7c3aed", "header", "Práctica", "footer", ""))
    );

    public List<Map<String, Object>> getTemplates() {
        return TEMPLATES;
    }

    public Optional<Map<String, Object>> getTemplateById(int id) {
        return TEMPLATES.stream().filter(t -> t.get("id").equals(id)).findFirst();
    }

    public byte[] generatePdf(Map<String, Object> payload) {
        String title = (String) payload.getOrDefault("title", "Documento");
        List<?> content = (List<?>) payload.getOrDefault("content", List.of());

        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            Document doc = new Document(PageSize.A4, 50, 50, 70, 50);
            PdfWriter.getInstance(doc, baos);
            doc.open();

            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18, Color.DARK_GRAY);
            Font sectionFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 13, new Color(30, 64, 175));
            Font bodyFont = FontFactory.getFont(FontFactory.HELVETICA, 11, Color.BLACK);
            Font exerciseTitleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11, new Color(30, 64, 175));

            Paragraph docTitle = new Paragraph(title, titleFont);
            docTitle.setAlignment(Element.ALIGN_CENTER);
            docTitle.setSpacingAfter(20);
            doc.add(docTitle);

            for (Object rawSection : content) {
                if (!(rawSection instanceof Map<?, ?> section)) continue;
                String type = (String) section.get("type");
                Object contentObj = section.get("content");
                String sectionContent = contentObj != null ? contentObj.toString() : "";

                if ("title".equals(type)) {
                    Paragraph p = new Paragraph(sectionContent, sectionFont);
                    p.setSpacingBefore(12);
                    p.setSpacingAfter(6);
                    doc.add(p);
                } else if ("text".equals(type)) {
                    Paragraph p = new Paragraph(sectionContent, bodyFont);
                    p.setSpacingAfter(8);
                    doc.add(p);
                } else if ("exercise".equals(type)) {
                    Object exId = section.get("exerciseId");
                    String exerciseText = resolveExercise(exId);
                    Paragraph p = new Paragraph(exerciseText, exerciseTitleFont);
                    p.setSpacingBefore(8);
                    p.setSpacingAfter(4);
                    doc.add(p);

                    Paragraph blank = new Paragraph(
                            "Respuesta: ___________________________________________", bodyFont);
                    blank.setSpacingAfter(16);
                    doc.add(blank);
                }
            }

            doc.close();
            return baos.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Error generando PDF: " + e.getMessage(), e);
        }
    }

    private String resolveExercise(Object exId) {
        if (exId == null) return "Ejercicio sin asignar";
        try {
            UUID id = UUID.fromString(exId.toString());
            return exerciseRepository.findById(id)
                    .map(e -> e.getTitle() + " — " + e.getContentLatex())
                    .orElse("Ejercicio: " + exId);
        } catch (Exception e) {
            return "Ejercicio: " + exId;
        }
    }
}
