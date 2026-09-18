import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { after, before, test } from 'node:test';
import request from 'supertest';
import app from '../src/app.js';
import pool from '../src/helper/db.js';

const testDatabase = process.env.POSTGRES_DB || '';
const testUsers = [];

const validPassword = 'ValidPass1';

function createUserData() {
    const id = randomUUID().replaceAll('-', '').slice(0, 10);

    return {
        user_name: `apiTest${id}`,
        email: `registration-${id}@example.com`,
        password: validPassword,
    };
}

async function register(userData) {
    const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

    if (response.statusCode === 201) {
        testUsers.push(userData);
    }

    return response;
}

before(async () => {
    assert.match(
        testDatabase,
        /test/i,
        'POSTGRES_DB must contain "test" before registration API tests run',
    );

    await pool.query('SELECT 1');
});

after(async () => {
    for (const user of testUsers) {
        await pool.query(
            'DELETE FROM users WHERE user_name = $1 OR email = $2',
            [user.user_name, user.email.trim().toLowerCase()],
        );
    }

    await pool.end();
});

test('registers a user and returns the created public user data', async () => {
    const user = createUserData();
    const response = await register({
        ...user,
        email: `  ${user.email.toUpperCase()} `,
    });

    assert.equal(response.statusCode, 201);
    assert.deepEqual(response.body, {
        message: 'Registration successful',
        user: {
            user_id: response.body.user.user_id,
            user_name: user.user_name,
            email: user.email,
        },
    });
    assert.equal(Object.hasOwn(response.body.user, 'password'), false);
    assert.equal(Object.hasOwn(response.body.user, 'password_hash'), false);
});

test('rejects registration when required data is missing', async () => {
    const response = await request(app)
        .post('/api/auth/register')
        .send({});

    assert.equal(response.statusCode, 400);
    assert.deepEqual(response.body, { message: 'All fields are required' });
});

test('rejects blank registration fields', async () => {
    const response = await request(app)
        .post('/api/auth/register')
        .send({
            user_name: '   ',
            email: '   ',
            password: '',
        });

    assert.equal(response.statusCode, 400);
    assert.deepEqual(response.body, { message: 'All fields are required' });
});

test('rejects a duplicate username', async () => {
    const user = createUserData();
    await register(user);

    const response = await request(app)
        .post('/api/auth/register')
        .send({
            ...user,
            email: `another-${user.email}`,
        });

    assert.equal(response.statusCode, 409);
    assert.deepEqual(response.body, { message: 'Username already in use' });
});

test('rejects a duplicate email', async () => {
    const user = createUserData();
    await register(user);

    const response = await request(app)
        .post('/api/auth/register')
        .send({
            ...user,
            user_name: `${user.user_name}Other`,
        });

    assert.equal(response.statusCode, 409);
    assert.deepEqual(response.body, { message: 'Email already in use' });
});

for (const [description, password] of [
    ['a password shorter than eight characters', 'Short1'],
    ['a password without an uppercase letter', 'lowercase1'],
    ['a password without a number', 'NoNumberPass'],
]) {
    test(`rejects ${description}`, async () => {
        const user = createUserData();
        const response = await request(app)
            .post('/api/auth/register')
            .send({ ...user, password });

        assert.equal(response.statusCode, 409);
        assert.deepEqual(response.body, { message: 'Password invalid' });
    });
}