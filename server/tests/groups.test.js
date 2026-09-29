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
        user_name: `grp${label}${id}`.slice(0, 25),
        email: `group-${label}-${id}@example.com`,
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

function uniqueGroupName(label) {
    return `Test ${label} ${randomUUID().slice(0, 8)}`;
}

function listGroups() {
    return request(app).get('/api/groups');
}

function createGroup(token, body) {
    const pending = request(app).post('/api/groups');

    if (token) {
        pending.set('Authorization', `Bearer ${token}`);
    }

    return pending.send(body);
}

async function memberRows(groupId) {
    const result = await pool.query(
        'SELECT user_id, group_id, status FROM members WHERE group_id = $1',
        [groupId],
    );

    return result.rows;
}

before(async () => {
    assert.match(
        testDatabase,
        /test/i,
        'POSTGRES_DB must contain "test" before groups API tests run',
    );
    assert.ok(process.env.JWT_SECRET, 'JWT_SECRET must be set before groups API tests run');

    await pool.query('SELECT 1');
});

after(async () => {
    if (createdUserIds.length > 0) {
        // groups.owner_id is ON DELETE RESTRICT, so groups must go before their owners
        await pool.query('DELETE FROM groups WHERE owner_id = ANY($1)', [createdUserIds]);
        await pool.query('DELETE FROM users WHERE user_id = ANY($1)', [createdUserIds]);
    }

    await pool.end();
});

test('lists groups without authentication', async () => {
    const response = await listGroups();

    assert.equal(response.statusCode, 200);
    assert.ok(Array.isArray(response.body.groups));
});

test('rejects creating a group without authentication', async () => {
    const response = await createGroup(undefined, { group_name: uniqueGroupName('noauth') });

    assert.equal(response.statusCode, 401);
    assert.deepEqual(response.body, { message: 'Authentication required' });
});

test('rejects creating a group with an invalid token', async () => {
    const response = await createGroup('invalid-token', { group_name: uniqueGroupName('badtoken') });

    assert.equal(response.statusCode, 401);
    assert.deepEqual(response.body, { message: 'Invalid or expired token' });
});

test('creates a group and stores the creator as its owner and member', async () => {
    const user = await createUser('create');
    const groupName = uniqueGroupName('create');
    const response = await createGroup(await tokenFor(user), { group_name: groupName });

    assert.equal(response.statusCode, 201);
    assert.equal(typeof response.body.group.group_id, 'number');
    assert.equal(response.body.group.group_name, groupName);
    assert.equal(response.body.group.owner_id, user.user_id);

    assert.deepEqual(await memberRows(response.body.group.group_id), [
        { user_id: user.user_id, group_id: response.body.group.group_id, status: 'accepted' },
    ]);
});

test('trims whitespace from the group name', async () => {
    const user = await createUser('trim');
    const groupName = uniqueGroupName('trim');
    const response = await createGroup(await tokenFor(user), { group_name: `  ${groupName}  ` });

    assert.equal(response.statusCode, 201);
    assert.equal(response.body.group.group_name, groupName);
});

test('shows a created group in the public list', async () => {
    const user = await createUser('list');
    const groupName = uniqueGroupName('list');
    const createResponse = await createGroup(await tokenFor(user), { group_name: groupName });

    const response = await listGroups();
    const group = response.body.groups.find(
        (item) => item.group_id === createResponse.body.group.group_id,
    );

    assert.deepEqual(group, {
        group_id: createResponse.body.group.group_id,
        group_name: groupName,
        owner_id: user.user_id,
        owner_name: user.user_name,
        member_count: 1,
        my_status: null,
    });
});

test('includes the current user\'s membership status when a token is sent', async () => {
    const user = await createUser('mystatus');
    const token = await tokenFor(user);
    const createResponse = await createGroup(token, { group_name: uniqueGroupName('mystatus') });

    const response = await request(app)
        .get('/api/groups')
        .set('Authorization', `Bearer ${token}`);
    const group = response.body.groups.find(
        (item) => item.group_id === createResponse.body.group.group_id,
    );

    assert.equal(response.statusCode, 200);
    assert.equal(group.my_status, 'accepted');
});

test('accepts a group name of exactly 50 characters', async () => {
    const user = await createUser('maxlen');
    const response = await createGroup(await tokenFor(user), { group_name: 'a'.repeat(50) });

    assert.equal(response.statusCode, 201);
});

for (const [description, body] of [
    ['a missing group name', {}],
    ['an empty group name', { group_name: '' }],
    ['a whitespace-only group name', { group_name: '   ' }],
    ['a non-string group name', { group_name: 123 }],
]) {
    test(`rejects ${description}`, async () => {
        const user = await createUser('invalid');
        const response = await createGroup(await tokenFor(user), body);

        assert.equal(response.statusCode, 400);
        assert.deepEqual(response.body, { message: 'Group name is required' });
    });
}

test('rejects a group name longer than 50 characters', async () => {
    const user = await createUser('toolong');
    const response = await createGroup(await tokenFor(user), { group_name: 'a'.repeat(51) });

    assert.equal(response.statusCode, 400);
    assert.deepEqual(response.body, { message: 'Group name must be at most 50 characters' });
});