-- Subtemas de Aritmética
INSERT INTO topics (id, name, description, parent_id, topic_order, is_locked, estimated_minutes, difficulty)
SELECT gen_random_uuid(), 'Fracciones', 'Operaciones con fracciones y números mixtos.', t.id, 1, false, 30, 'basico'
FROM topics t WHERE t.name = 'Aritmética' AND t.parent_id IS NULL LIMIT 1;

INSERT INTO topics (id, name, description, parent_id, topic_order, is_locked, estimated_minutes, difficulty)
SELECT gen_random_uuid(), 'Porcentajes', 'Cálculo de porcentajes y descuentos.', t.id, 2, false, 30, 'basico'
FROM topics t WHERE t.name = 'Aritmética' AND t.parent_id IS NULL LIMIT 1;

INSERT INTO topics (id, name, description, parent_id, topic_order, is_locked, estimated_minutes, difficulty)
SELECT gen_random_uuid(), 'Proporciones', 'Regla de tres simple y compuesta.', t.id, 3, false, 30, 'intermedio'
FROM topics t WHERE t.name = 'Aritmética' AND t.parent_id IS NULL LIMIT 1;

-- Subtemas de Geometría
INSERT INTO topics (id, name, description, parent_id, topic_order, is_locked, estimated_minutes, difficulty)
SELECT gen_random_uuid(), 'Figuras Planas', 'Área y perímetro de figuras planas.', t.id, 1, false, 45, 'basico'
FROM topics t WHERE t.name = 'Geometría' AND t.parent_id IS NULL LIMIT 1;

INSERT INTO topics (id, name, description, parent_id, topic_order, is_locked, estimated_minutes, difficulty)
SELECT gen_random_uuid(), 'Trigonometría', 'Seno, coseno, tangente y sus aplicaciones.', t.id, 2, false, 60, 'intermedio'
FROM topics t WHERE t.name = 'Geometría' AND t.parent_id IS NULL LIMIT 1;

-- Subtemas de Estadística
INSERT INTO topics (id, name, description, parent_id, topic_order, is_locked, estimated_minutes, difficulty)
SELECT gen_random_uuid(), 'Medidas de Tendencia Central', 'Media, mediana y moda.', t.id, 1, false, 40, 'basico'
FROM topics t WHERE t.name = 'Estadística' AND t.parent_id IS NULL LIMIT 1;

INSERT INTO topics (id, name, description, parent_id, topic_order, is_locked, estimated_minutes, difficulty)
SELECT gen_random_uuid(), 'Probabilidad', 'Probabilidad clásica y condicional.', t.id, 2, false, 50, 'intermedio'
FROM topics t WHERE t.name = 'Estadística' AND t.parent_id IS NULL LIMIT 1;

-- Mover ejercicios de Aritmética (root) → Fracciones
UPDATE exercises
SET topic_id = (SELECT id FROM topics WHERE name = 'Fracciones' LIMIT 1)
WHERE topic_id = (SELECT id FROM topics WHERE name = 'Aritmética' AND parent_id IS NULL LIMIT 1)
  AND title = 'Fracciones mixtas';

-- Mover ejercicios de Aritmética (root) → Porcentajes
UPDATE exercises
SET topic_id = (SELECT id FROM topics WHERE name = 'Porcentajes' LIMIT 1)
WHERE topic_id = (SELECT id FROM topics WHERE name = 'Aritmética' AND parent_id IS NULL LIMIT 1)
  AND title = 'Porcentaje aplicado';

-- Mover ejercicios de Geometría (root) → Figuras Planas
UPDATE exercises
SET topic_id = (SELECT id FROM topics WHERE name = 'Figuras Planas' LIMIT 1)
WHERE topic_id = (SELECT id FROM topics WHERE name = 'Geometría' AND parent_id IS NULL LIMIT 1);

-- Mover ejercicios de Estadística (root) → Medidas de Tendencia Central / Probabilidad
UPDATE exercises
SET topic_id = (SELECT id FROM topics WHERE name = 'Medidas de Tendencia Central' LIMIT 1)
WHERE topic_id = (SELECT id FROM topics WHERE name = 'Estadística' AND parent_id IS NULL LIMIT 1)
  AND title = 'Media aritmética';

UPDATE exercises
SET topic_id = (SELECT id FROM topics WHERE name = 'Probabilidad' LIMIT 1)
WHERE topic_id = (SELECT id FROM topics WHERE name = 'Estadística' AND parent_id IS NULL LIMIT 1)
  AND title = 'Probabilidad clásica';

-- Ejercicios adicionales para los nuevos temas
INSERT INTO exercises (id, topic_id, created_by, title, content_latex, is_parametric, difficulty, needs_graph, created_at)
SELECT gen_random_uuid(), t.id,
       (SELECT id FROM users WHERE role = 'TEACHER' LIMIT 1),
       'Suma de fracciones heterogéneas',
       'Calcula: $$\frac{1}{{a}} + \frac{1}{{b}}$$',
       true, 'BASIC', false, NOW()
FROM topics t WHERE t.name = 'Fracciones' LIMIT 1;

INSERT INTO exercises (id, topic_id, created_by, title, content_latex, is_parametric, difficulty, needs_graph, created_at)
SELECT gen_random_uuid(), t.id,
       (SELECT id FROM users WHERE role = 'TEACHER' LIMIT 1),
       'Descuento sucesivo',
       'Un producto de S/. {precio} tiene dos descuentos consecutivos de {d1}% y {d2}%. ¿Cuál es el precio final?',
       true, 'INTERMEDIATE', false, NOW()
FROM topics t WHERE t.name = 'Porcentajes' LIMIT 1;

INSERT INTO exercises (id, topic_id, created_by, title, content_latex, is_parametric, difficulty, needs_graph, created_at)
SELECT gen_random_uuid(), t.id,
       (SELECT id FROM users WHERE role = 'TEACHER' LIMIT 1),
       'Seno y coseno',
       'En un triángulo rectángulo con ángulo de {ang}°, calcula el seno y coseno.',
       true, 'BASIC', false, NOW()
FROM topics t WHERE t.name = 'Trigonometría' LIMIT 1;

INSERT INTO exercises (id, topic_id, created_by, title, content_latex, is_parametric, difficulty, needs_graph, created_at)
SELECT gen_random_uuid(), t.id,
       (SELECT id FROM users WHERE role = 'TEACHER' LIMIT 1),
       'Mediana de un conjunto',
       'Ordena y calcula la mediana: {a}, {b}, {c}, {d}, {e}, {f}, {g}',
       true, 'BASIC', false, NOW()
FROM topics t WHERE t.name = 'Medidas de Tendencia Central' LIMIT 1;
