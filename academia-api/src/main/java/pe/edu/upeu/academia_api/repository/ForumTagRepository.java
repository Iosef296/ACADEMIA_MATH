package pe.edu.upeu.academia_api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pe.edu.upeu.academia_api.entity.ForumTag;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ForumTagRepository extends JpaRepository<ForumTag, UUID> {
    Optional<ForumTag> findByNameIgnoreCase(String name);
    List<ForumTag> findAllByOrderByNameAsc();
}
