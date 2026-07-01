CREATE TABLE forum_tags (
    id UUID PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE forum_post_tags (
    post_id UUID NOT NULL REFERENCES forum_posts(id) ON DELETE CASCADE,
    tag_id  UUID NOT NULL REFERENCES forum_tags(id)  ON DELETE CASCADE,
    PRIMARY KEY (post_id, tag_id)
);

CREATE INDEX idx_forum_post_tags_post ON forum_post_tags(post_id);
CREATE INDEX idx_forum_post_tags_tag  ON forum_post_tags(tag_id);
