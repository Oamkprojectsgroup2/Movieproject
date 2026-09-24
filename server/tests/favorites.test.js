import assert from 'node:assert/strict';
import bcrypt from 'bcrypt';
import { randomUUID } from 'node:crypto';
import { after, before, test } from 'node:test';
import request from 'supertest';
import app from '../src/app.js';
import pool from '../src/helper/db.js';

const testDatabase = process.env.POSTGRES_DB || '';
const password = 'ValidPass1';
const createdUserIds = [];

async function createUser(label) {
    const id = randomUUID().replaceAll('-', '').slice(0, 10);
    const user = {
        user_name: `fav${label}${id}`.slice(0, 25),
        email: `favorite-${label}-${id}@example.com`,
    };
    const passwordHash = await bcrypt.hash(password, 10);
    const result = await pool.query(
        'INSERT INTO users (user_name, email, password) VALUES ($1, $2, $3) RETURNING user_id',
        [user.user_name, user.email, passwordHash],
    );

    user.user_id = result.rows[0].user_id;
    createdUserIds.push(user.user_id);
    return user;
}

async function tokenFor(user) {
    const response = await request(app)
        .post('/api/auth/login')
        .send({ email: user.email, password });

    assert.equal(response.statusCode, 200, 'fixture login failed');
    return response.body.token;
}

function favoritesRequest(token) {
    const pending = request(app).get('/api/favorites');

    if (token) {
        pending.set('Authorization', `Bearer ${token}`);
    }

    return pending;
}

async function addFavorite(token, movie_id) {
    return request(app)
        .post('/api/favorites')
        .set('Authorization', `Bearer ${token}`)
        .send({ movie_id });
}

async function removeFavorite(token, movieId) {
    return request(app)
        .delete(`/api/favorites/${movieId}`)
        .set('Authorization', `Bearer ${token}`)
        .send();
}

async function createShareToken(token) {
    return request(app)
        .post('/api/favorites/share')
        .set('Authorization', `Bearer ${token}`)
        .send();
}

async function sharedFavoritesRequest(sharedToken) {
    return request(app)
        .get(`/api/favorites/shared/${sharedToken}`)
        .send();
}

async function favoriteRows(userId, movieId) {
    const result = await pool.query(
        'SELECT user_id, movies_tmdb_id FROM favorite_movies WHERE user_id = $1 AND movies_tmdb_id = $2',
        [userId, movieId],
    );

    return result.rows;
}

before(async () => {
    assert.match(
        testDatabase,
        /test/i,
        'POSTGRES_DB must contain "test" before favorites API tests run',
    );
    assert.ok(process.env.JWT_SECRET, 'JWT_SECRET must be set before favorites API tests run');

    await pool.query('SELECT 1');
});

after(async () => {
    if (createdUserIds.length > 0) {
        await pool.query('DELETE FROM users WHERE user_id = ANY($1)', [createdUserIds]);
    }

    await pool.end();
});

test('rejects listing favorites without authentication', async () => {
    const response = await favoritesRequest();

    assert.equal(response.statusCode, 401);
    assert.deepEqual(response.body, { message: 'Authentication required' });
});

test('rejects listing favorites with an invalid token', async () => {
    const response = await favoritesRequest('invalid-token');

    assert.equal(response.statusCode, 401);
    assert.deepEqual(response.body, { message: 'Invalid or expired token' });
});

test('returns an empty list for a user without favorites', async () => {
    const user = await createUser('empty');
    const response = await favoritesRequest(await tokenFor(user));

    assert.equal(response.statusCode, 200);
    assert.deepEqual(response.body, { favorites: [] });
});

test('adds a favorite and persists it for the current user', async () => {
    const user = await createUser('add');
    const token = await tokenFor(user);
    const response = await addFavorite(token, 550);

    assert.equal(response.statusCode, 201);
    assert.deepEqual(response.body, { favorite: { movie_id: 550 } });
    assert.deepEqual(await favoriteRows(user.user_id, 550), [
        { user_id: user.user_id, movies_tmdb_id: 550 },
    ]);

    const listResponse = await favoritesRequest(token);
    assert.deepEqual(listResponse.body, { favorites: [{ movie_id: 550 }] });
});

test('handles adding the same favorite more than once', async () => {
    const user = await createUser('duplicate');
    const token = await tokenFor(user);

    assert.equal((await addFavorite(token, 551)).statusCode, 201);
    const duplicateResponse = await addFavorite(token, 551);

    assert.equal(duplicateResponse.statusCode, 200);
    assert.deepEqual(duplicateResponse.body, {
        message: 'Movie is already in favorites',
        favorite: { movie_id: 551 },
    });
    assert.equal((await favoriteRows(user.user_id, 551)).length, 1);
});

test('removes a favorite for the current user', async () => {
    const user = await createUser('remove');
    const token = await tokenFor(user);
    await addFavorite(token, 552);

    const response = await removeFavorite(token, 552);

    assert.equal(response.statusCode, 204);
    assert.equal((await favoriteRows(user.user_id, 552)).length, 0);
    assert.deepEqual((await favoritesRequest(token)).body, { favorites: [] });
});

test('treats removing an absent favorite as successful', async () => {
    const user = await createUser('absent');
    const response = await removeFavorite(await tokenFor(user), 553);

    assert.equal(response.statusCode, 204);
});

for (const [description, movie_id] of [
    ['a missing movie ID', undefined],
    ['a zero movie ID', 0],
    ['a negative movie ID', -1],
    ['a fractional movie ID', 1.5],
    ['a string movie ID', '554'],
]) {
    test(`rejects ${description} when adding a favorite`, async () => {
        const user = await createUser('invalidadd');
        const response = await addFavorite(await tokenFor(user), movie_id);

        assert.equal(response.statusCode, 400);
        assert.deepEqual(response.body, { message: 'movie_id must be a positive integer' });
    });
}

for (const movieId of ['abc', '0', '-1', '1.5']) {
    test(`rejects movie ID ${movieId} when removing a favorite`, async () => {
        const user = await createUser('invalidremove');
        const response = await removeFavorite(await tokenFor(user), movieId);

        assert.equal(response.statusCode, 400);
        assert.deepEqual(response.body, { message: 'movie_id must be a positive integer' });
    });
}

test('isolates favorites between users', async () => {
    const firstUser = await createUser('first');
    const secondUser = await createUser('second');
    const firstToken = await tokenFor(firstUser);
    const secondToken = await tokenFor(secondUser);

    await addFavorite(firstToken, 555);
    await addFavorite(secondToken, 555);

    assert.deepEqual((await favoritesRequest(firstToken)).body, { favorites: [{ movie_id: 555 }] });
    assert.deepEqual((await favoritesRequest(secondToken)).body, { favorites: [{ movie_id: 555 }] });

    await removeFavorite(firstToken, 555);

    assert.deepEqual((await favoritesRequest(firstToken)).body, { favorites: [] });
    assert.deepEqual((await favoritesRequest(secondToken)).body, { favorites: [{ movie_id: 555 }] });
});

test('creates a stable share token for the current user', async () => {
    const user = await createUser('share');
    const token = await tokenFor(user);

    const firstResponse = await createShareToken(token);
    const secondResponse = await createShareToken(token);

    assert.equal(firstResponse.statusCode, 200);
    assert.match(firstResponse.body.shared_token, /^[0-9a-f-]{36}$/i);
    assert.deepEqual(secondResponse.body, firstResponse.body);
});

test('allows public users to retrieve a shared favorite list', async () => {
    const user = await createUser('public');
    const token = await tokenFor(user);
    await addFavorite(token, 556);
    await addFavorite(token, 557);

    const shareResponse = await createShareToken(token);
    const response = await sharedFavoritesRequest(shareResponse.body.shared_token);

    assert.equal(response.statusCode, 200);
    assert.deepEqual(response.body, {
        user_name: user.user_name,
        favorites: [{ movie_id: 556 }, { movie_id: 557 }],
    });
    assert.equal(Object.hasOwn(response.body, 'user_id'), false);
    assert.equal(Object.hasOwn(response.body, 'email'), false);
});

test('returns an empty public list when the owner has no favorites', async () => {
    const user = await createUser('publicempty');
    const token = await tokenFor(user);
    const shareResponse = await createShareToken(token);

    const response = await sharedFavoritesRequest(shareResponse.body.shared_token);

    assert.equal(response.statusCode, 200);
    assert.deepEqual(response.body, {
        user_name: user.user_name,
        favorites: [],
    });
});

test('rejects unknown and malformed shared-list tokens', async () => {
    const unknownResponse = await sharedFavoritesRequest('11111111-1111-4111-8111-111111111111');
    const malformedResponse = await sharedFavoritesRequest('not-a-uuid');

    assert.equal(unknownResponse.statusCode, 404);
    assert.deepEqual(unknownResponse.body, { message: 'Favorite list not found' });
    assert.equal(malformedResponse.statusCode, 404);
    assert.deepEqual(malformedResponse.body, { message: 'Favorite list not found' });
});

test('keeps shared lists isolated between owners', async () => {
    const firstUser = await createUser('sharedfirst');
    const secondUser = await createUser('sharedsecond');
    const firstToken = await tokenFor(firstUser);
    const secondToken = await tokenFor(secondUser);

    await addFavorite(firstToken, 558);
    await addFavorite(secondToken, 559);

    const firstShare = await createShareToken(firstToken);
    const secondShare = await createShareToken(secondToken);
    const firstList = await sharedFavoritesRequest(firstShare.body.shared_token);
    const secondList = await sharedFavoritesRequest(secondShare.body.shared_token);

    assert.deepEqual(firstList.body.favorites, [{ movie_id: 558 }]);
    assert.deepEqual(secondList.body.favorites, [{ movie_id: 559 }]);
});
