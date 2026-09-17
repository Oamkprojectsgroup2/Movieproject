import assert from 'node:assert/strict';
import bcrypt from 'bcrypt';
import { randomUUID } from 'node:crypto';
import { after, before, test } from 'node:test';
import request from 'supertest';
import app from '../src/app.js';
import pool from '../src/helper/db.js';

const testDatabase = process.env.POSTGRES_DB || '';
const testUser = {
    user_name: `loginTest${randomUUID().replaceAll('-', '').slice(0, 10)}`,
    email: `login-${randomUUID()}@example.com`,
    password: 'ValidPass1',
};

async function login(credentials = {}) {
    return request(app)
        .post('/api/auth/login')
        .send(credentials);
}

before(async () => {
    assert.match(
        testDatabase,
        /test/i,
        'POSTGRES_DB must contain "test" before login/logout API tests run',
    );
    assert.ok(process.env.JWT_SECRET, 'JWT_SECRET must be set before login/logout API tests run');

    const passwordHash = await bcrypt.hash(testUser.password, 10);
    await pool.query(
        'INSERT INTO users (user_name, email, password) VALUES ($1, $2, $3)',
        [testUser.user_name, testUser.email, passwordHash],
    );
});

after(async () => {
    await pool.query(
        'DELETE FROM users WHERE user_name = $1 OR email = $2',
        [testUser.user_name, testUser.email],
    );
    await pool.end();
});

test('logs in with valid credentials and returns a token and public user', async () => {
    const response = await login({
        email: `  ${testUser.email.toUpperCase()} `,
        password: testUser.password,
    });

    assert.equal(response.statusCode, 200);
    assert.equal(response.body.message, 'Login successful');
    assert.equal(typeof response.body.token, 'string');
    assert.ok(response.body.token.length > 0);
    assert.deepEqual(response.body.user, {
        user_id: response.body.user.user_id,
        user_name: testUser.user_name,
        email: testUser.email,
    });
    assert.equal(Object.hasOwn(response.body.user, 'password'), false);
});

test('rejects login with a nonexistent email', async () => {
    const response = await login({
        email: `missing-${testUser.email}`,
        password: testUser.password,
    });

    assert.equal(response.statusCode, 401);
    assert.deepEqual(response.body, { message: 'Invalid email or password' });
});

test('rejects login with an incorrect password', async () => {
    const response = await login({
        email: testUser.email,
        password: 'WrongPass1',
    });

    assert.equal(response.statusCode, 401);
    assert.deepEqual(response.body, { message: 'Invalid email or password' });
});

test('rejects login when email or password is missing', async () => {
    const response = await login({ email: testUser.email });

    assert.equal(response.statusCode, 400);
    assert.deepEqual(response.body, { message: 'Email and password are required' });
});

test('logs out with a valid login token', async () => {
    const loginResponse = await login({
        email: testUser.email,
        password: testUser.password,
    });

    const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${loginResponse.body.token}`)
        .send();

    assert.equal(response.statusCode, 200);
    assert.deepEqual(response.body, { message: 'Logout successful' });
});

test('rejects logout without authentication', async () => {
    const response = await request(app)
        .post('/api/auth/logout')
        .send();

    assert.equal(response.statusCode, 401);
    assert.deepEqual(response.body, { message: 'Authentication required' });
});

test('rejects logout with an invalid token', async () => {
    const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', 'Bearer invalid-token')
        .send();

    assert.equal(response.statusCode, 401);
    assert.deepEqual(response.body, { message: 'Invalid or expired token' });
});
