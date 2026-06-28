package pe.edu.upeu.academia_api.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import pe.edu.upeu.academia_api.entity.*;
import pe.edu.upeu.academia_api.repository.*;

import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements ApplicationRunner {

    private final UserRepository userRepository;
    private final TopicRepository topicRepository;
    private final ExerciseRepository exerciseRepository;
    private final StudentProfileRepository studentProfileRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (topicRepository.count() > 0) {
            log.info("DB ya tiene temas, omitiendo seed.");
            return;
        }

        log.info("Inicializando datos de prueba...");

        // Resolve teacher user (seed or use existing)
        User teacher = userRepository.findByEmail("teacher@academia.com").orElseGet(() ->
                userRepository.save(User.builder()
                        .name("Prof. García")
                        .email("teacher@academia.com")
                        .passwordHash(passwordEncoder.encode("Admin123!"))
                        .role(UserRole.TEACHER)
                        .emailVerified(true)
                        .build()));

        // Ensure admin exists
        userRepository.findByEmail("admin@academia.com").orElseGet(() ->
                userRepository.save(User.builder()
                        .name("Administrador")
                        .email("admin@academia.com")
                        .passwordHash(passwordEncoder.encode("Admin123!"))
                        .role(UserRole.ADMIN)
                        .emailVerified(true)
                        .build()));

        // Student demo (optional)
        User student = userRepository.findByEmail("student@academia.com").orElseGet(() ->
                userRepository.save(User.builder()
                        .name("Estudiante Demo")
                        .email("student@academia.com")
                        .passwordHash(passwordEncoder.encode("Admin123!"))
                        .role(UserRole.STUDENT)
                        .emailVerified(true)
                        .build()));

        if (studentProfileRepository.findByUserId(student.getId()).isEmpty()) {
            studentProfileRepository.save(StudentProfile.builder()
                    .user(student)
                    .xpTotal(250)
                    .streakCurrent(3)
                    .streakMax(7)
                    .build());
        }

        // Topics
        Topic algebra = topicRepository.save(Topic.builder()
                .name("Álgebra")
                .description("Fundamentos de álgebra: ecuaciones, polinomios y factorización.")
                .topicOrder(1)
                .isLocked(false)
                .estimatedMinutes(120)
                .build());

        Topic calculo = topicRepository.save(Topic.builder()
                .name("Cálculo")
                .description("Límites, derivadas e integrales.")
                .topicOrder(2)
                .isLocked(false)
                .estimatedMinutes(180)
                .build());

        Topic aritmetica = topicRepository.save(Topic.builder()
                .name("Aritmética")
                .description("Operaciones básicas, fracciones, porcentajes y proporciones.")
                .topicOrder(3)
                .isLocked(false)
                .estimatedMinutes(90)
                .build());

        Topic geometria = topicRepository.save(Topic.builder()
                .name("Geometría")
                .description("Figuras planas, sólidos, trigonometría y geometría analítica.")
                .topicOrder(4)
                .isLocked(false)
                .estimatedMinutes(150)
                .build());

        Topic estadistica = topicRepository.save(Topic.builder()
                .name("Estadística")
                .description("Probabilidad, distribuciones y análisis de datos.")
                .topicOrder(5)
                .isLocked(false)
                .estimatedMinutes(90)
                .build());

        // Subtopics of Álgebra
        Topic ecuaciones = topicRepository.save(Topic.builder()
                .name("Ecuaciones Lineales")
                .description("Resolución de ecuaciones de primer grado.")
                .parent(algebra)
                .topicOrder(1)
                .isLocked(false)
                .estimatedMinutes(60)
                .build());

        Topic polinomios = topicRepository.save(Topic.builder()
                .name("Polinomios")
                .description("Operaciones con polinomios y factorización.")
                .parent(algebra)
                .topicOrder(2)
                .isLocked(false)
                .estimatedMinutes(60)
                .build());

        // Subtopics of Cálculo
        Topic limites = topicRepository.save(Topic.builder()
                .name("Límites")
                .description("Concepto y cálculo de límites de funciones.")
                .parent(calculo)
                .topicOrder(1)
                .isLocked(false)
                .estimatedMinutes(90)
                .build());

        Topic derivadas = topicRepository.save(Topic.builder()
                .name("Derivadas")
                .description("Reglas de derivación y aplicaciones.")
                .parent(calculo)
                .topicOrder(2)
                .isLocked(false)
                .estimatedMinutes(90)
                .build());

        // Exercises - Álgebra
        exerciseRepository.saveAll(List.of(
            Exercise.builder()
                .title("Ecuación lineal simple")
                .contentLatex("Resuelve: $${a}x + {b} = {c}$$")
                .topic(ecuaciones)
                .difficulty(ExerciseDifficulty.BASIC)
                .isParametric(true)
                .needsGraph(false)
                .createdBy(teacher)
                .build(),

            Exercise.builder()
                .title("Sistema de dos ecuaciones")
                .contentLatex("Resuelve el sistema:\n$$\\begin{cases} {a}x + {b}y = {c} \\\\ {d}x - {e}y = {f} \\end{cases}$$")
                .topic(ecuaciones)
                .difficulty(ExerciseDifficulty.INTERMEDIATE)
                .isParametric(true)
                .needsGraph(false)
                .createdBy(teacher)
                .build(),

            Exercise.builder()
                .title("Factorización de trinomio")
                .contentLatex("Factoriza: $$x^2 + {b}x + {c}$$")
                .topic(polinomios)
                .difficulty(ExerciseDifficulty.INTERMEDIATE)
                .isParametric(true)
                .needsGraph(false)
                .createdBy(teacher)
                .build(),

            Exercise.builder()
                .title("Suma de polinomios")
                .contentLatex("Calcula: $$(x^2 + {a}x + {b}) + ({c}x^2 - {d}x + {e})$$")
                .topic(polinomios)
                .difficulty(ExerciseDifficulty.BASIC)
                .isParametric(true)
                .needsGraph(false)
                .createdBy(teacher)
                .build(),

            // Exercises - Cálculo
            Exercise.builder()
                .title("Límite de función racional")
                .contentLatex("Calcula: $$\\lim_{{x \\to {a}}} \\frac{x^2 - {b}}{x - {c}}$$")
                .topic(limites)
                .difficulty(ExerciseDifficulty.INTERMEDIATE)
                .isParametric(true)
                .needsGraph(false)
                .createdBy(teacher)
                .build(),

            Exercise.builder()
                .title("Límite al infinito")
                .contentLatex("Calcula: $$\\lim_{{x \\to \\infty}} \\frac{{a}x^2 + {b}x}{{c}x^2 - {d}}$$")
                .topic(limites)
                .difficulty(ExerciseDifficulty.ADVANCED)
                .isParametric(true)
                .needsGraph(false)
                .createdBy(teacher)
                .build(),

            Exercise.builder()
                .title("Derivada de función potencia")
                .contentLatex("Deriva: $$f(x) = {a}x^{n} + {b}x^2 - {c}$$")
                .topic(derivadas)
                .difficulty(ExerciseDifficulty.BASIC)
                .isParametric(true)
                .needsGraph(false)
                .createdBy(teacher)
                .build(),

            Exercise.builder()
                .title("Regla del producto")
                .contentLatex("Deriva: $$f(x) = ({a}x^2 + {b})(x^3 - {c}x)$$")
                .topic(derivadas)
                .difficulty(ExerciseDifficulty.INTERMEDIATE)
                .isParametric(true)
                .needsGraph(false)
                .createdBy(teacher)
                .build(),

            // Exercises - Aritmética
            Exercise.builder()
                .title("Fracciones mixtas")
                .contentLatex("Simplifica: $$\\frac{{a}}{{b}} + \\frac{{c}}{{d}} - \\frac{{e}}{{f}}$$")
                .topic(aritmetica)
                .difficulty(ExerciseDifficulty.BASIC)
                .isParametric(true)
                .needsGraph(false)
                .createdBy(teacher)
                .build(),

            Exercise.builder()
                .title("Porcentaje aplicado")
                .contentLatex("Un artículo cuesta S/. {precio}. Si tiene un descuento del {pct}%, ¿cuánto pagas?")
                .topic(aritmetica)
                .difficulty(ExerciseDifficulty.BASIC)
                .isParametric(true)
                .needsGraph(false)
                .createdBy(teacher)
                .build(),

            // Exercises - Geometría
            Exercise.builder()
                .title("Área del triángulo")
                .contentLatex("Calcula el área de un triángulo con base {b} cm y altura {h} cm.")
                .topic(geometria)
                .difficulty(ExerciseDifficulty.BASIC)
                .isParametric(true)
                .needsGraph(false)
                .createdBy(teacher)
                .build(),

            Exercise.builder()
                .title("Teorema de Pitágoras")
                .contentLatex("En un triángulo rectángulo con catetos {a} y {b}, calcula la hipotenusa.")
                .topic(geometria)
                .difficulty(ExerciseDifficulty.BASIC)
                .isParametric(true)
                .needsGraph(false)
                .createdBy(teacher)
                .build(),

            // Exercises - Estadística
            Exercise.builder()
                .title("Media aritmética")
                .contentLatex("Calcula la media de los datos: {a}, {b}, {c}, {d}, {e}")
                .topic(estadistica)
                .difficulty(ExerciseDifficulty.BASIC)
                .isParametric(true)
                .needsGraph(false)
                .createdBy(teacher)
                .build(),

            Exercise.builder()
                .title("Probabilidad clásica")
                .contentLatex("En una bolsa hay {r} bolas rojas y {b} bolas azules. ¿Cuál es la probabilidad de sacar una bola roja?")
                .topic(estadistica)
                .difficulty(ExerciseDifficulty.BASIC)
                .isParametric(true)
                .needsGraph(false)
                .createdBy(teacher)
                .build()
        ));

        log.info("Seed completado: {} usuarios, {} temas, {} ejercicios",
                userRepository.count(), topicRepository.count(), exerciseRepository.count());
    }
}
