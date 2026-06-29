package pe.edu.upeu.academia_api.controller;

import com.lowagie.text.*;
import com.lowagie.text.pdf.PdfWriter;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import pe.edu.upeu.academia_api.dto.exam.AnswerRequest;
import pe.edu.upeu.academia_api.dto.exam.ExamRequest;
import pe.edu.upeu.academia_api.dto.exam.ExamResponse;
import pe.edu.upeu.academia_api.entity.ExamAttempt;
import pe.edu.upeu.academia_api.exception.AppException;
import pe.edu.upeu.academia_api.repository.ExamAttemptRepository;
import pe.edu.upeu.academia_api.service.ExamService;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/exams")
@RequiredArgsConstructor
public class ExamController {

    private final ExamService examService;
    private final ExamAttemptRepository attemptRepository;

    @GetMapping
    public ResponseEntity<List<ExamResponse>> findAll(@RequestParam(required = false) String topicId) {
        return ResponseEntity.ok(examService.findAll(topicId));
    }

    @GetMapping("/my-history")
    public ResponseEntity<List<Map<String, Object>>> myHistory(Authentication auth) {
        UUID userId = UUID.fromString(auth.getName());
        List<Map<String, Object>> history = attemptRepository.findByUserIdOrderByStartedAtDesc(userId)
                .stream().map(a -> {
                    Map<String, Object> m = new java.util.LinkedHashMap<>();
                    m.put("attemptId", a.getId());
                    m.put("examId", a.getExam() != null ? a.getExam().getId() : null);
                    m.put("examTitle", a.getExam() != null ? a.getExam().getTitle() : null);
                    m.put("score", a.getScore());
                    m.put("startedAt", a.getStartedAt());
                    m.put("submittedAt", a.getSubmittedAt());
                    m.put("passed", a.getScore() != null && a.getExam() != null && a.getScore() >= a.getExam().getPassingScore());
                    return m;
                }).toList();
        return ResponseEntity.ok(history);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ExamResponse> findById(@PathVariable UUID id) {
        return ResponseEntity.ok(examService.findById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('TEACHER','ADMIN')")
    public ResponseEntity<ExamResponse> create(@Valid @RequestBody ExamRequest request, Authentication auth) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(examService.create(request, UUID.fromString(auth.getName())));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('TEACHER','ADMIN')")
    public ResponseEntity<ExamResponse> update(@PathVariable UUID id, @Valid @RequestBody ExamRequest request) {
        return ResponseEntity.ok(examService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('TEACHER','ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        examService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/start")
    public ResponseEntity<Map<String, Object>> start(@PathVariable UUID id, Authentication auth) {
        return ResponseEntity.ok(examService.startAttempt(id, UUID.fromString(auth.getName())));
    }

    @PostMapping("/attempts/{attemptId}/submit")
    public ResponseEntity<Map<String, Object>> submit(
            @PathVariable UUID attemptId,
            @RequestBody List<AnswerRequest> answers,
            Authentication auth) {
        return ResponseEntity.ok(examService.submitAttempt(attemptId, answers, UUID.fromString(auth.getName())));
    }

    @GetMapping("/attempts/{attemptId}/results")
    public ResponseEntity<Map<String, Object>> results(@PathVariable UUID attemptId) {
        return ResponseEntity.ok(examService.getResults(attemptId));
    }

    @GetMapping("/attempts/{attemptId}/certificate")
    @Transactional(readOnly = true)
    public ResponseEntity<byte[]> certificate(@PathVariable UUID attemptId, Authentication auth) {
        ExamAttempt attempt = attemptRepository.findById(attemptId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Intento no encontrado"));

        if (attempt.getScore() == null || attempt.getExam() == null || attempt.getScore() < attempt.getExam().getPassingScore()) {
            throw new AppException(HttpStatus.FORBIDDEN, "Puntaje insuficiente para certificado");
        }

        String studentName = attempt.getUser() != null ? attempt.getUser().getName() : "Estudiante";
        String examTitle = attempt.getExam() != null ? attempt.getExam().getTitle() : "Examen";
        double score = attempt.getScore();
        String date = attempt.getSubmittedAt() != null
                ? attempt.getSubmittedAt().format(DateTimeFormatter.ofPattern("dd/MM/yyyy"))
                : java.time.LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy"));

        byte[] pdf = generateCertificatePdf(studentName, examTitle, score, date);

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"certificado.pdf\"")
                .body(pdf);
    }

    private byte[] generateCertificatePdf(String name, String examTitle, double score, String date) {
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            Document doc = new Document(PageSize.A4.rotate(), 60, 60, 60, 60);
            PdfWriter.getInstance(doc, baos);
            doc.open();

            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 32, new Color(30, 64, 175));
            Font headFont = FontFactory.getFont(FontFactory.HELVETICA, 16, new Color(75, 85, 99));
            Font nameFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 26, new Color(17, 24, 39));
            Font bodyFont = FontFactory.getFont(FontFactory.HELVETICA, 13, new Color(75, 85, 99));
            Font scoreFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 20, new Color(5, 150, 105));

            Paragraph title = new Paragraph("CERTIFICADO DE LOGRO", titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            title.setSpacingAfter(30);
            doc.add(title);

            Paragraph sub = new Paragraph("Academia Virtual de Matemáticas", headFont);
            sub.setAlignment(Element.ALIGN_CENTER);
            sub.setSpacingAfter(40);
            doc.add(sub);

            Paragraph certText = new Paragraph("Se certifica que", bodyFont);
            certText.setAlignment(Element.ALIGN_CENTER);
            certText.setSpacingAfter(10);
            doc.add(certText);

            Paragraph studentName = new Paragraph(name, nameFont);
            studentName.setAlignment(Element.ALIGN_CENTER);
            studentName.setSpacingAfter(20);
            doc.add(studentName);

            Paragraph completed = new Paragraph("ha completado satisfactoriamente el examen", bodyFont);
            completed.setAlignment(Element.ALIGN_CENTER);
            completed.setSpacingAfter(10);
            doc.add(completed);

            Paragraph exam = new Paragraph("\"" + examTitle + "\"", nameFont);
            exam.setAlignment(Element.ALIGN_CENTER);
            exam.setSpacingAfter(20);
            doc.add(exam);

            Paragraph scoreP = new Paragraph("Puntaje obtenido: " + String.format("%.1f%%", score), scoreFont);
            scoreP.setAlignment(Element.ALIGN_CENTER);
            scoreP.setSpacingAfter(30);
            doc.add(scoreP);

            Paragraph dateP = new Paragraph("Fecha: " + date, bodyFont);
            dateP.setAlignment(Element.ALIGN_CENTER);
            doc.add(dateP);

            doc.close();
            return baos.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Error generando certificado", e);
        }
    }
}
