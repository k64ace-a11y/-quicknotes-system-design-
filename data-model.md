# QuickNotes Data Model

## Design choice

QuickNotes should use a relational SQL database such as PostgreSQL. Users, notes and tags have clear relationships, and the `note_tags` junction table needs foreign-key constraints to keep many-to-many links consistent. Transactions also help keep note and tag changes reliable. A document database could be useful for some flexible metadata, but SQL is the simpler primary store for this structured data.

## Entities and relationships

- **users**: one user can own many notes and create many tags (one-to-many).
- **notes**: each note belongs to one user; a note can have many tags.
- **tags**: each tag belongs to one user; a tag can be attached to many notes.
- **note_tags**: junction entity joining notes and tags, implementing a many-to-many relationship. Its composite primary key prevents the same tag being attached to the same note twice.

## SQL schema

The following is PostgreSQL-flavoured SQL:

```sql
CREATE TABLE users (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    email VARCHAR(254) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE notes (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(100) NOT NULL,
    body TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT notes_title_not_blank CHECK (length(trim(title)) > 0)
);

CREATE TABLE tags (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT tags_unique_name_per_user UNIQUE (user_id, name)
);

CREATE TABLE note_tags (
    note_id BIGINT NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
    tag_id BIGINT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (note_id, tag_id)
);
```

A production implementation should also ensure that a note cannot be linked to another user's tag. This can be enforced in application logic and, if desired, with additional composite keys and constraints.

## Indexes

```sql
CREATE INDEX notes_user_created_idx
    ON notes (user_id, created_at DESC);

CREATE INDEX note_tags_tag_id_idx
    ON note_tags (tag_id);
```

The first index speeds up the common operation of listing one user's newest notes. The second helps find notes associated with a particular tag. Indexes use storage and slow some writes slightly, so add them for measured query patterns rather than indexing every column.

## Example queries

### 1. List a user's newest notes

```sql
SELECT id, title, body, created_at, updated_at
FROM notes
WHERE user_id = 42
ORDER BY created_at DESC
LIMIT 10;
```

### 2. Count notes per user

```sql
SELECT u.id, u.email, COUNT(n.id) AS note_count
FROM users AS u
LEFT JOIN notes AS n ON n.user_id = u.id
GROUP BY u.id, u.email
ORDER BY note_count DESC;
```

### 3. Find notes carrying a tag (JOIN)

```sql
SELECT n.id, n.title, n.body
FROM notes AS n
JOIN note_tags AS nt ON nt.note_id = n.id
JOIN tags AS t ON t.id = nt.tag_id
WHERE n.user_id = 42
  AND t.name = 'study'
ORDER BY n.created_at DESC;
```

### 4. Create a note

```sql
INSERT INTO notes (user_id, title, body)
VALUES (42, 'Revise REST APIs', 'Review the endpoint examples.')
RETURNING id, user_id, title, body, created_at, updated_at;
```

Use parameterized statements in application code rather than concatenating user-provided values into SQL. Authorization checks must also ensure the authenticated user owns the selected note and tag.
