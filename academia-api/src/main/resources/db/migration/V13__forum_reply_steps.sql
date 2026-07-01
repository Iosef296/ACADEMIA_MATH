CREATE TABLE forum_reply_steps (
    id UUID PRIMARY KEY,
    reply_id UUID NOT NULL REFERENCES forum_posts(id) ON DELETE CASCADE,
    step_order INT NOT NULL,
    title VARCHAR(255) NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_forum_reply_steps_reply ON forum_reply_steps(reply_id, step_order);
