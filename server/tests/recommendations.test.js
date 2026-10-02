import assert from 'node:assert/strict';
import bcrypt from 'bcrypt';
import { randomUUID } from 'node:crypto';
import { after, afterEach, before, mock, test } from 'node:test';
import request from 'supertest';
import app from '../src/app.js';
import pool from '../src/helper/db.js';

const testDatabase = process.env.POSTGRES_DB || '';
const password = 'ValidPass1';
const createdUserIds = [];

// Fake TMDB data
const FAVORITE_GENRES = {
  101: [27, 878],
  102: [27, 878, 12],
  103: [27, 35, 12],
};
const REVIEWED_ID = 401;
const discoverIds = [101, REVIEWED_ID, 501, 502, 503, 504, 505, 506, 507, 508, 509, 510];
const popularIds = [501, 102, REVIEWED_ID, ...Array.from({ length: 20 }, (_, i) => 601 + i)];

const movie = (id) => ({ id, title: `Movie ${id}` });

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function fakeTmdb({ failDiscover = false, failPopular = false, recommendations = {} } = {}) {
  const calls = [];

  mock.method(globalThis, 'fetch', async (input) => {
    const url = new URL(input);
    calls.push(url);

    if (url.pathname.endsWith('/discover/movie')) {
      if (failDiscover) return jsonResponse({}, 500);
      return jsonResponse({ results: discoverIds.map(movie), total_pages: 1 });
    }

    if (url.pathname.endsWith('/movie/popular')) {
      if (failPopular) return jsonResponse({}, 500);
      return jsonResponse({ results: popularIds.map(movie), total_pages: 1 });
    }

    const recs = url.pathname.match(/\/movie\/(\d+)\/recommendations$/);
    if (recs) {
      const ids = recommendations[Number(recs[1])] || [];
      return jsonResponse({ results: ids.map(movie), total_pages: 1 });
    }

    const details = url.pathname.match(/\/movie\/(\d+)$/);
    if (details) {
      const id = Number(details[1]);
      const genres = (FAVORITE_GENRES[id] || []).map((genreId) => ({ id: genreId }));
      return jsonResponse({ id, genres });
    }

    throw new Error(`Unexpected TMDB request: ${url}`);
  });

  return calls;
}

async function createUser(label) {
  const id = randomUUID().replaceAll('-', '').slice(0, 10);
  const user = {
    user_name: `rec${label}${id}`.slice(0, 25),
    email: `recommend-${label}-${id}@example.com`,
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

async function addFavorites(userId, movieIds) {
  for (const movieId of movieIds) {
    await pool.query(
      'INSERT INTO favorite_movies (user_id, movies_tmdb_id) VALUES ($1, $2)',
      [userId, movieId],
    );
  }
}

async function addReview(userId, movieId) {
  await pool.query(
    'INSERT INTO reviews (user_id, movies_tmdb_id, star) VALUES ($1, $2, $3)',
    [userId, movieId, 4],
  );
}

function recommendationsRequest(token) {
  const pending = request(app).get('/api/movies/recommended?language=en-US&region=FI');

  if (token) {
    pending.set('Authorization', `Bearer ${token}`);
  }

  return pending;
}

before(async () => {
  assert.match(
    testDatabase,
    /test/i,
    'POSTGRES_DB must contain "test" before recommendation API tests run',
  );
  assert.ok(process.env.JWT_SECRET, 'JWT_SECRET must be set before recommendation API tests run');

  await pool.query('SELECT 1');
});

afterEach(() => {
  mock.restoreAll();
});

after(async () => {
  if (createdUserIds.length > 0) {
    await pool.query('DELETE FROM users WHERE user_id = ANY($1)', [createdUserIds]);
  }

  await pool.end();
});

test('rejects recommendations without authentication', async () => {
  const response = await recommendationsRequest();

  assert.equal(response.statusCode, 401);
});

test('returns popular movies for a user without favorites', async () => {
  const user = await createUser('nofav');
  await addReview(user.user_id, REVIEWED_ID);
  const calls = fakeTmdb();

  const response = await recommendationsRequest(await tokenFor(user));
  const ids = response.body.results.map((result) => result.id);

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.type, 'popular');
  assert.ok(ids.length <= 20);
  assert.ok(!ids.includes(REVIEWED_ID), 'reviewed movie should be excluded');
  assert.ok(!calls.some((url) => url.pathname.endsWith('/discover/movie')));
});

test('recommends movies from the three most common favorite genres', async () => {
  const user = await createUser('genres');
  await addFavorites(user.user_id, [101, 102, 103]);
  const calls = fakeTmdb();

  const response = await recommendationsRequest(await tokenFor(user));
  const discover = calls.find((url) => url.pathname.endsWith('/discover/movie'));

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.type, 'recommended');
  assert.ok(discover, 'discover endpoint should be called');
  assert.equal(discover.searchParams.get('with_genres'), '27|12|878');
  assert.equal(discover.searchParams.get('sort_by'), 'popularity.desc');
  assert.equal(discover.searchParams.get('language'), 'en-US');
});

test('excludes favorites and reviewed movies and fills up to 20 from popular', async () => {
  const user = await createUser('fill');
  await addFavorites(user.user_id, [101, 102, 103]);
  await addReview(user.user_id, REVIEWED_ID);
  fakeTmdb();

  const response = await recommendationsRequest(await tokenFor(user));
  const ids = response.body.results.map((result) => result.id);

  assert.equal(response.statusCode, 200);
  assert.equal(ids.length, 20);
  assert.equal(new Set(ids).size, ids.length, 'results should not contain duplicates');

  for (const excludedId of [101, 102, 103, REVIEWED_ID]) {
    assert.ok(!ids.includes(excludedId), `movie ${excludedId} should be excluded`);
  }

  // Genre matches come first, then popular fill
  assert.deepEqual(ids.slice(0, 10), [501, 502, 503, 504, 505, 506, 507, 508, 509, 510]);
  assert.deepEqual(ids.slice(10), [601, 602, 603, 604, 605, 606, 607, 608, 609, 610]);
});

test('falls back to popular movies when genre discovery fails', async () => {
  const user = await createUser('fallback');
  await addFavorites(user.user_id, [101]);
  fakeTmdb({ failDiscover: true });

  const response = await recommendationsRequest(await tokenFor(user));

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.type, 'popular');
  assert.equal(response.body.results.length, 20);
});

test('returns 500 when TMDB fails', async () => {
  const user = await createUser('fail');
  await addFavorites(user.user_id, [101]);
  fakeTmdb({ failDiscover: true, failPopular: true });

  const response = await recommendationsRequest(await tokenFor(user));

  assert.equal(response.statusCode, 500);
  assert.ok(response.body.message);
});

test('ranks movies recommended for several favorites first', async () => {
  const user = await createUser('rank');
  await addFavorites(user.user_id, [101, 102, 103]);
  fakeTmdb({
    recommendations: {
      101: [701, 702, 703],
      102: [702, 703],
      103: [703],
    },
  });

  const response = await recommendationsRequest(await tokenFor(user));
  const ids = response.body.results.map((result) => result.id);

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.type, 'recommended');
  assert.deepEqual(ids.slice(0, 3), [703, 702, 701]);
  assert.equal(ids.length, 20, 'genre and popular movies should fill the rest');
});

test('excludes favorites and reviewed movies from TMDB recommendations', async () => {
  const user = await createUser('recexcl');
  await addFavorites(user.user_id, [101, 102]);
  await addReview(user.user_id, REVIEWED_ID);
  fakeTmdb({
    recommendations: {
      101: [102, REVIEWED_ID, 701],
    },
  });

  const response = await recommendationsRequest(await tokenFor(user));
  const ids = response.body.results.map((result) => result.id);

  assert.equal(response.statusCode, 200);
  assert.equal(ids[0], 701);
  assert.ok(!ids.includes(102), 'favorite should be excluded');
  assert.ok(!ids.includes(REVIEWED_ID), 'reviewed movie should be excluded');
  assert.equal(new Set(ids).size, ids.length, 'results should not contain duplicates');
});

test('uses at most 10 favorites for TMDB recommendations', async () => {
  const user = await createUser('maxseed');
  const favoriteIds = Array.from({ length: 12 }, (_, i) => 101 + i);
  await addFavorites(user.user_id, favoriteIds);
  const calls = fakeTmdb();

  const response = await recommendationsRequest(await tokenFor(user));
  const recommendationCalls = calls.filter((url) => url.pathname.endsWith('/recommendations'));

  assert.equal(response.statusCode, 200);
  assert.equal(recommendationCalls.length, 10);
});
