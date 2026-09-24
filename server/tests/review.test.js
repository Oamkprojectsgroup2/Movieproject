import assert from 'node:assert/strict';
import { randomUUID, randomInt } from 'node:crypto';
import { after, before, test } from 'node:test';
import request from 'supertest';
import app from '../src/app.js';
import pool from '../src/helper/db.js';

const testDatabase = process.env.POSTGRES_DB || '';

const targetMovieId = randomInt(1,999);
const unReviewedMovieId = randomInt(1000,1999);
const randomRating = randomInt(1,6);  
const testUser = {
    user_name: `loginTest${randomUUID().replaceAll('-', '').slice(0, 10)}`,
    email: `login-${randomUUID()}@example.com`,
    password: 'ValidPass1',
};

before(async () => {
    assert.match(
        testDatabase,
        /test/i,
        'POSTGRES_DB must contain "test" before registration API tests run',
    );

    const userIdReturned = await pool.query(
        'INSERT INTO users (user_name, email, password) VALUES ($1, $2, $3) RETURNING user_id',
        [testUser.user_name, testUser.email, testUser.password],
    );
    const userId = userIdReturned.rows[0].user_id;

    await pool.query(
        `INSERT INTO reviews (user_id, movies_tmdb_id, star) VALUES ($1, $2, $3)`,
        [userId, targetMovieId, randomRating]
    )
});

after(async () => {
    await pool.query(
        'DELETE FROM users WHERE user_name = $1', [testUser.user_name],
    );
    await pool.end();
});

test("searches for review and successfully returns it", async () => {
    const response = await request(app).get(`/api/reviews/search/${targetMovieId}`);
    assert.equal(response.statusCode, 200);
    assert.equal(response.body.reviews[0].movies_tmdb_id, targetMovieId);
});

test("searches for review for movie that has none", async () => {
    const response = await request(app).get(`/api/reviews/search/${unReviewedMovieId}`);
    assert.equal(response.statusCode, 200);
    assert.equal(response.body.count, 0);
});

test("test for invalid movieId", async () => {
    const response = await request(app).get(`/api/reviews/search/a`);
    assert.equal(response.statusCode, 400);
});
