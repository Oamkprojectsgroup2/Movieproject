import assert from 'node:assert/strict';
import bcrypt from 'bcrypt';
import { randomUUID } from 'node:crypto';
import { after, before, test } from 'node:test';
import request from 'supertest';
import app from '../src/app.js';
import pool from '../src/helper/db.js';

const testDatabase = process.env.POSTGRES_DB || '';
const PASSWORD = 'ValidPass1';
const createdUserIds = [];

async function createUser(label) {
    const id = randomUUID().replaceAll('-', '').slice(0, 10);
    const user = {
        user_name: `del${label}${id}`.slice(0, 25),
        email: `delete-${label}-${id}@example.com`.toLowerCase(),
        password: PASSWORD,
    };

    const passwordHash = await bcrypt.hash(user.password, 10);
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
        .send({ email: user.email, password: user.password });

    assert.equal(response.statusCode, 200, 'fixture login failed');
    return response.body.token;
}

async function deleteAccount({ token, body } = {}) {
    const pending = request(app).delete('/api/auth/account');

    if (token) {
        pending.set('Authorization', `Bearer ${token}`);
    }

    return pending.send(body ?? {});
}

async function userExists(user_id) {
    const result = await pool.query('SELECT 1 FROM users WHERE user_id = $1', [user_id]);
    return result.rowCount === 1;
}

before(async () => {
    assert.match(
        testDatabase,
        /test/i,
        'POSTGRES_DB must contain "test" before account deletion API tests run',
    );
    assert.ok(process.env.JWT_SECRET, 'JWT_SECRET must be set before account deletion API tests run');

    await pool.query('SELECT 1');
});

after(async () => {
    if (createdUserIds.length > 0) {
        await pool.query('DELETE FROM groups WHERE owner_id = ANY($1)', [createdUserIds]);
        await pool.query('DELETE FROM users WHERE user_id = ANY($1)', [createdUserIds]);
    }

    await pool.end();
});

test('rejects account deletion without authentication', async () => {
    const response = await deleteAccount({ body: { password: PASSWORD } });

    assert.equal(response.statusCode, 401);
    assert.deepEqual(response.body, { message: 'Authentication required' });
});

test('rejects account deletion with an invalid token', async () => {
    const response = await deleteAccount({ token: 'invalid-token', body: { password: PASSWORD } });

    assert.equal(response.statusCode, 401);
    assert.deepEqual(response.body, { message: 'Invalid or expired token' });
});

test('rejects account deletion when the password is missing', async () => {
    const user = await createUser('nopw');
    const response = await deleteAccount({ token: await tokenFor(user) });

    assert.equal(response.statusCode, 400);
    assert.deepEqual(response.body, { message: 'Password is required' });
    assert.ok(await userExists(user.user_id));
});

test('rejects account deletion when the password is not a string', async () => {
    const user = await createUser('typepw');
    const response = await deleteAccount({ token: await tokenFor(user), body: { password: 12345678 } });

    assert.equal(response.statusCode, 400);
    assert.deepEqual(response.body, { message: 'Password is required' });
});

test('rejects account deletion with an incorrect password', async () => {
    const user = await createUser('wrongpw');
    const response = await deleteAccount({ token: await tokenFor(user), body: { password: 'WrongPass1' } });

    assert.equal(response.statusCode, 401);
    assert.deepEqual(response.body, { message: 'Incorrect password' });
    assert.ok(await userExists(user.user_id));
});

test('rejects account deletion while the user owns a group', async () => {
    const user = await createUser('owner');
    await pool.query(
        'INSERT INTO groups (group_name, owner_id) VALUES ($1, $2)',
        [`delete-test-group-${user.user_id}`, user.user_id],
    );

    const response = await deleteAccount({
        token: await tokenFor(user),
        body: { password: PASSWORD },
    });

    assert.equal(response.statusCode, 409);
    assert.deepEqual(response.body, {
        message: 'Transfer group ownership before deleting your account',
    });
    assert.ok(await userExists(user.user_id));
});

test('deletes the account and its owned data', async () => {
    const user = await createUser('happy');
    const other = await createUser('groupowner');

    const group = await pool.query(
        'INSERT INTO groups (group_name, owner_id) VALUES ($1, $2) RETURNING group_id',
        [`delete-test-group-${other.user_id}`, other.user_id],
    );
    const group_id = group.rows[0].group_id;

    await pool.query(
        'INSERT INTO reviews (movies_tmdb_id, user_id, star, review) VALUES ($1, $2, $3, $4)',
        [550, user.user_id, 5, 'deletion test review'],
    );
    await pool.query(
        'INSERT INTO favorite_movies (user_id, movies_tmdb_id) VALUES ($1, $2)',
        [user.user_id, 550],
    );
    await pool.query(
        'INSERT INTO members (user_id, group_id, status) VALUES ($1, $2, $3)',
        [user.user_id, group_id, 'accepted'],
    );
    await pool.query(
        'INSERT INTO group_favorites (group_id, movies_tmdb_id, user_id) VALUES ($1, $2, $3)',
        [group_id, 550, user.user_id],
    );

    const response = await deleteAccount({
        token: await tokenFor(user),
        body: { password: PASSWORD },
    });

    assert.equal(response.statusCode, 200);
    assert.deepEqual(response.body, { message: 'Account deleted successfully' });
    assert.equal(await userExists(user.user_id), false);

    for (const [table, column] of [['reviews', 'user_id'], ['favorite_movies', 'user_id'], ['members', 'user_id']]) {
        const result = await pool.query(`SELECT 1 FROM ${table} WHERE ${column} = $1`, [user.user_id]);
        assert.equal(result.rowCount, 0, `${table} rows should cascade`);
    }

    const favorite = await pool.query(
        'SELECT user_id FROM group_favorites WHERE group_id = $1 AND movies_tmdb_id = $2',
        [group_id, 550],
    );
    assert.equal(favorite.rowCount, 1, 'the group keeps the favorite');
    assert.equal(favorite.rows[0].user_id, null, 'the favorite is anonymised');
});

test('rejects account deletion when the account is already deleted', async () => {
    const user = await createUser('gone');
    const token = await tokenFor(user);

    const first = await deleteAccount({ token, body: { password: PASSWORD } });
    assert.equal(first.statusCode, 200);

    const second = await deleteAccount({ token, body: { password: PASSWORD } });

    assert.equal(second.statusCode, 404);
    assert.deepEqual(second.body, { message: 'User account not found' });
});
