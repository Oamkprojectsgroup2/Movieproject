

BEGIN;

CREATE FUNCTION expect_fail(stmt TEXT, label TEXT) RETURNS void AS $$
BEGIN
    EXECUTE stmt;
    RAISE WARNING 'FAIL  % — statement succeeded but should have failed', label;
EXCEPTION WHEN others THEN
    RAISE NOTICE 'OK    % (%)', label, SQLSTATE;
END;
$$ LANGUAGE plpgsql;

CREATE FUNCTION expect_ok(stmt TEXT, label TEXT) RETURNS void AS $$
BEGIN
    EXECUTE stmt;
    RAISE NOTICE 'OK    %', label;
EXCEPTION WHEN others THEN
    RAISE WARNING 'FAIL  % — statement failed: %', label, SQLERRM;
END;
$$ LANGUAGE plpgsql;

CREATE FUNCTION expect_count(qry TEXT, expected BIGINT, label TEXT) RETURNS void AS $$
DECLARE got BIGINT;
BEGIN
    EXECUTE qry INTO got;
    IF got = expected THEN
        RAISE NOTICE 'OK    %', label;
    ELSE
        RAISE WARNING 'FAIL  % — expected %, got %', label, expected, got;
    END IF;
END;
$$ LANGUAGE plpgsql;



INSERT INTO users (user_name, email, password) VALUES
    ('juha',  'juha@example.fi',  'hash1'),
    ('matti', 'matti@example.fi', 'hash2'),
    ('liisa', 'liisa@example.fi', 'hash3');

INSERT INTO groups (group_name, owner_id)
    VALUES ('Movie Club', (SELECT user_id FROM users WHERE user_name = 'juha'));

INSERT INTO members (user_id, group_id, status) VALUES
    ((SELECT user_id  FROM users  WHERE user_name  = 'juha'),
     (SELECT group_id FROM groups WHERE group_name = 'Movie Club'), 'accepted'),
    ((SELECT user_id  FROM users  WHERE user_name  = 'matti'),
     (SELECT group_id FROM groups WHERE group_name = 'Movie Club'), 'accepted');

INSERT INTO favorite_movies (user_id, movies_tmdb_id)
    VALUES ((SELECT user_id FROM users WHERE user_name = 'matti'), 550);

INSERT INTO reviews (movies_tmdb_id, user_id, star, review)
    VALUES (550, (SELECT user_id FROM users WHERE user_name = 'matti'), 4, 'Good movie');

INSERT INTO group_favorites (group_id, movies_tmdb_id, user_id)
    VALUES ((SELECT group_id FROM groups WHERE group_name = 'Movie Club'),
            550,
            (SELECT user_id FROM users WHERE user_name = 'matti'));


\echo ''
\echo '=== 1. UNIQUE and NOT NULL constraints ==='

SELECT expect_fail(
    $$INSERT INTO users (user_name, email, password)
      VALUES ('juha', 'other@example.fi', 'x')$$,
    'duplicate user_name');

SELECT expect_fail(
    $$INSERT INTO users (user_name, email, password)
      VALUES ('newuser', 'juha@example.fi', 'x')$$,
    'duplicate email');

SELECT expect_fail(
    $$INSERT INTO users (user_name, password) VALUES ('noemail', 'x')$$,
    'missing email (NOT NULL)');

SELECT expect_fail(
    $$UPDATE users SET shared_token = '11111111-1111-1111-1111-111111111111'$$,
    'same shared_token on two users');

SELECT expect_fail(
    $$INSERT INTO users (user_name, email, password)
      VALUES ('this_name_is_far_too_long_for_the_column', 'z@z.fi', 'x')$$,
    'user_name longer than 25 characters');


\echo ''
\echo '=== 2. CHECK constraints ==='

SELECT expect_fail(
    $$INSERT INTO reviews (movies_tmdb_id, user_id, star)
      VALUES (600, (SELECT user_id FROM users WHERE user_name = 'liisa'), 0)$$,
    'star rating 0 (allowed 1-5)');

SELECT expect_fail(
    $$INSERT INTO reviews (movies_tmdb_id, user_id, star)
      VALUES (600, (SELECT user_id FROM users WHERE user_name = 'liisa'), 6)$$,
    'star rating 6 (allowed 1-5)');

SELECT expect_ok(
    $$INSERT INTO reviews (movies_tmdb_id, user_id, star)
      VALUES (600, (SELECT user_id FROM users WHERE user_name = 'liisa'), 5)$$,
    'star rating 5 accepted');

SELECT expect_fail(
    $$INSERT INTO members (user_id, group_id, status)
      VALUES ((SELECT user_id  FROM users  WHERE user_name  = 'liisa'),
              (SELECT group_id FROM groups WHERE group_name = 'Movie Club'),
              'banned')$$,
    'invalid status value');


\echo ''
\echo '=== 3. Composite keys and UNIQUE pairs ==='

SELECT expect_fail(
    $$INSERT INTO reviews (movies_tmdb_id, user_id, star)
      VALUES (550, (SELECT user_id FROM users WHERE user_name = 'matti'), 3)$$,
    'same user reviews the same movie twice');

SELECT expect_ok(
    $$INSERT INTO reviews (movies_tmdb_id, user_id, star)
      VALUES (550, (SELECT user_id FROM users WHERE user_name = 'liisa'), 3)$$,
    'a different user may review the same movie');

SELECT expect_fail(
    $$INSERT INTO group_favorites (group_id, movies_tmdb_id, user_id)
      VALUES ((SELECT group_id FROM groups WHERE group_name = 'Movie Club'),
              550,
              (SELECT user_id FROM users WHERE user_name = 'liisa'))$$,
    'same movie favourited twice in one group');

SELECT expect_fail(
    $$INSERT INTO members (user_id, group_id, status)
      VALUES ((SELECT user_id  FROM users  WHERE user_name  = 'matti'),
              (SELECT group_id FROM groups WHERE group_name = 'Movie Club'),
              'pending')$$,
    'same membership twice (composite PK)');

SELECT expect_fail(
    $$INSERT INTO favorite_movies (user_id, movies_tmdb_id)
      VALUES ((SELECT user_id FROM users WHERE user_name = 'matti'), 550)$$,
    'same favourite movie twice');


\echo ''
\echo '=== 4. Foreign keys ==='

SELECT expect_fail(
    $$INSERT INTO members (user_id, group_id, status)
      VALUES ((SELECT user_id FROM users WHERE user_name = 'liisa'), 99999, 'pending')$$,
    'membership in a group that does not exist');

SELECT expect_fail(
    $$INSERT INTO reviews (movies_tmdb_id, user_id, star) VALUES (700, 99999, 3)$$,
    'review by a user that does not exist');

SELECT expect_fail(
    $$INSERT INTO groups (group_name, owner_id) VALUES ('Ghost Group', 99999)$$,
    'group with an owner that does not exist');


\echo ''
\echo '=== 5. Delete rules: deleting a user (matti, owns no group) ==='

SELECT expect_ok(
    $$DELETE FROM users WHERE user_name = 'matti'$$,
    'deleting a non-owner succeeds');

-- Before the delete there were 3 reviews: matti (550), liisa (600), liisa (550).
-- Matti's review must be gone and liisa's two must remain.
SELECT expect_count(
    $$SELECT count(*) FROM reviews$$,
    2, 'matti''s review deleted, liisa''s two remain (CASCADE)');

SELECT expect_count(
    $$SELECT count(*) FROM favorite_movies$$,
    0, 'favourites deleted along with the user (CASCADE)');

SELECT expect_count(
    $$SELECT count(*) FROM members$$,
    1, 'membership deleted, juha''s membership remains (CASCADE)');

SELECT expect_count(
    $$SELECT count(*) FROM group_favorites WHERE user_id IS NULL$$,
    1, 'group favourite kept, adder set to NULL (SET NULL)');


\echo ''
\echo '=== 6. Delete rules: deleting an owner (juha owns the group) ==='

SELECT expect_fail(
    $$DELETE FROM users WHERE user_name = 'juha'$$,
    'an owner cannot be deleted (RESTRICT)');

SELECT expect_count(
    $$SELECT count(*) FROM users WHERE user_name = 'juha'$$,
    1, 'juha still exists after the blocked delete');

SELECT expect_ok(
    $$UPDATE groups SET owner_id = (SELECT user_id FROM users WHERE user_name = 'liisa')
      WHERE group_name = 'Movie Club'$$,
    'transferring ownership succeeds');

SELECT expect_ok(
    $$DELETE FROM users WHERE user_name = 'juha'$$,
    'former owner can be deleted after the transfer');

SELECT expect_count(
    $$SELECT count(*) FROM groups$$,
    1, 'group survived the deletion of its former owner');


\echo ''
\echo '=== Tests finished. Look for lines containing FAIL. ==='
\echo ''

ROLLBACK;
