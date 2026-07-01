ALTER TABLE forum_posts
    ADD COLUMN accepted_reply_id UUID NULL REFERENCES forum_posts(id) ON DELETE SET NULL;

CREATE INDEX idx_forum_posts_accepted ON forum_posts(accepted_reply_id);
