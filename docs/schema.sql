
DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS favorite_movies;
DROP TABLE IF EXISTS members;
DROP TABLE IF EXISTS group_favorites;
DROP TABLE IF EXISTS groups;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
	user_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	user_name VARCHAR(25) UNIQUE NOT NULL,
	email VARCHAR(255) UNIQUE NOT NULL,
	password VARCHAR(255) NOT NULL,
	shared_token UUID UNIQUE
);

CREATE TABLE reviews (
	review_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	movies_tmdb_id INT NOT NULL,
	user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
	created_at TIMESTAMP NOT NULL DEFAULT NOW(),
	star INT NOT NULL CHECK (star BETWEEN 1 AND 5),
	review TEXT,
	UNIQUE (movies_tmdb_id, user_id)
);

CREATE TABLE favorite_movies (
	user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
	movies_tmdb_id INT NOT NULL,
	PRIMARY KEY (user_id, movies_tmdb_id)
);

CREATE TABLE groups (
	group_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	group_name VARCHAR(255) NOT NULL,
	owner_id INT NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT
);

CREATE TABLE members (
	user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
	group_id INT NOT NULL REFERENCES groups(group_id) ON DELETE CASCADE,
	status VARCHAR(25) NOT NULL CHECK (status IN ('pending', 'accepted', 'rejected')),
	PRIMARY KEY (group_id, user_id)
);

CREATE TABLE group_favorites (
	group_favorite_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	group_id INT NOT NULL REFERENCES groups(group_id) ON DELETE CASCADE,
	movies_tmdb_id INT NOT NULL,
	user_id INT REFERENCES users(user_id) ON DELETE SET NULL,
	UNIQUE(group_id, movies_tmdb_id)
);

CREATE INDEX idx_members_users      ON members(user_id);