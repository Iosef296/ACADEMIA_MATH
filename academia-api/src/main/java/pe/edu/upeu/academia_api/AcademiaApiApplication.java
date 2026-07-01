package pe.edu.upeu.academia_api;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class AcademiaApiApplication {
    public static void main(String[] args) {
        SpringApplication.run(AcademiaApiApplication.class, args);
    }
}
