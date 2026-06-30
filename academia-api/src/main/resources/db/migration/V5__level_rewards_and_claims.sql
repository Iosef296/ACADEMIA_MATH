CREATE TABLE IF NOT EXISTS user_mission_claims (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    mission_id BIGINT NOT NULL,
    claimed_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_user_mission UNIQUE (user_id, mission_id)
);

CREATE TABLE IF NOT EXISTS level_rewards (
    id BIGSERIAL PRIMARY KEY,
    level INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    emoji VARCHAR(10) NOT NULL DEFAULT '🏆',
    bonus_xp INT NOT NULL DEFAULT 0,
    active BOOLEAN NOT NULL DEFAULT TRUE
);

INSERT INTO level_rewards (level, title, description, emoji, bonus_xp) VALUES
(2,  'Principiante',         '¡Llegaste al nivel 2! El camino comienza.',                      '🌱', 50),
(3,  'En camino',            'Estás progresando bien. ¡Sigue así!',                            '🚀', 75),
(4,  'Curioso',              'Tu curiosidad te lleva lejos.',                                  '🔍', 90),
(5,  'Aprendiz',             'Ya dominas los conceptos básicos. ¡Excelente!',                  '📚', 120),
(6,  'Determinado',          'Nada te detiene cuando te propones algo.',                       '💪', 140),
(7,  'Constante',            'La constancia es la clave del éxito.',                           '🔥', 160),
(8,  'Aplicado',             'Tu dedicación está dando frutos.',                               '✏️', 180),
(9,  'Perseverante',         'Cada obstáculo es una oportunidad de aprender.',                 '⚡', 200),
(10, 'Estudiante Avanzado',  '¡Nivel 10! Eres un estudiante de alto rendimiento.',            '🎓', 300),
(12, 'Analista',             'Analizas problemas con precisión matemática.',                   '🧮', 350),
(15, 'Matemático Jr.',       'Tu dominio de las matemáticas es notable.',                      '📐', 500),
(20, 'Experto',              '¡Nivel 20! Pocos llegan hasta aquí.',                           '🏆', 700),
(25, 'Maestro en Formación', 'Estás a punto de dominar las matemáticas.',                     '🌟', 900),
(30, 'Maestro',              '¡Increíble! Nivel 30. Eres un referente.',                      '👑', 1200),
(50, 'Gran Maestro',         'Has alcanzado la cima. Eres una leyenda de MathLearn.',          '🌠', 2500),
(100,'Leyenda',              'Nivel 100. No hay palabras para describir tu logro.',            '🎆', 5000);
