ALTER TABLE daily_missions ADD COLUMN IF NOT EXISTS reward_xp INT NOT NULL DEFAULT 10;

UPDATE daily_missions SET reward_xp = CASE
    WHEN mission_type = 'exercises' AND target_value <= 3  THEN target_value * 5
    WHEN mission_type = 'exercises' AND target_value <= 10 THEN target_value * 4
    WHEN mission_type = 'exercises' AND target_value <= 30 THEN target_value * 3
    WHEN mission_type = 'exercises' AND target_value <= 75 THEN target_value * 2
    WHEN mission_type = 'exercises'                        THEN target_value * 2
    WHEN mission_type = 'topics'   AND target_value <= 5   THEN target_value * 10
    WHEN mission_type = 'topics'   AND target_value <= 15  THEN target_value * 7
    WHEN mission_type = 'topics'                           THEN target_value * 5
    WHEN mission_type = 'streak'   AND target_value <= 7   THEN target_value * 8
    WHEN mission_type = 'streak'   AND target_value <= 30  THEN target_value * 6
    WHEN mission_type = 'streak'                           THEN target_value * 4
    WHEN mission_type = 'xp'                               THEN GREATEST(target_value / 10, 10)
    ELSE 10
END;
