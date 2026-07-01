CREATE TABLE forum_reactions (
    post_id UUID NOT NULL REFERENCES forum_posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id)       ON DELETE CASCADE,
    emoji   VARCHAR(16) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (post_id, user_id, emoji)
);

CREATE INDEX idx_forum_reactions_post ON forum_reactions(post_id);
