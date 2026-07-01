CREATE TABLE forum_likes (
    post_id UUID NOT NULL REFERENCES forum_posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (post_id, user_id)
);

CREATE INDEX idx_forum_likes_post ON forum_likes(post_id);
CREATE INDEX idx_forum_likes_user ON forum_likes(user_id);
