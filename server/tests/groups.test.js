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

function getGroup(groupId, token) {
    const pending = request(app).get(`/api/groups/${groupId}`);

    if (token) {
        pending.set('Authorization', `Bearer ${token}`);
    }

    return pending;
}

function addMovieToGroup(groupId, token, movieId) {
    const pending = request(app).post(`/api/groups/${groupId}/favorites`);

    if (token) {
        pending.set('Authorization', `Bearer ${token}`);
    }

    return pending.send({ movie_id: movieId });
}

function deleteGroup(groupId, token) {
    const pending = request(app).delete(`/api/groups/${groupId}`);

    if (token) {
        pending.set('Authorization', `Bearer ${token}`);
    }

    return pending;
}

async function addMember(groupId, userId, status) {
    await pool.query(
        'INSERT INTO members (user_id, group_id, status) VALUES ($1, $2, $3)',
        [userId, groupId, status],
    );
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

test('preserves pending and rejected membership statuses in the group list', async () => {
    const owner = await createUser('statusowner');
    const pending = await createUser('statuspending');
    const rejected = await createUser('statusrejected');
    const ownerToken = await tokenFor(owner);
    const pendingToken = await tokenFor(pending);
    const rejectedToken = await tokenFor(rejected);
    const createResponse = await createGroup(ownerToken, { group_name: uniqueGroupName('statuses') });
    const groupId = createResponse.body.group.group_id;

    await addMember(groupId, pending.user_id, 'pending');
    await addMember(groupId, rejected.user_id, 'rejected');

    const pendingResponse = await request(app)
        .get('/api/groups')
        .set('Authorization', `Bearer ${pendingToken}`);
    const rejectedResponse = await request(app)
        .get('/api/groups')
        .set('Authorization', `Bearer ${rejectedToken}`);

    const pendingGroup = pendingResponse.body.groups.find((group) => group.group_id === groupId);
    const rejectedGroup = rejectedResponse.body.groups.find((group) => group.group_id === groupId);

    assert.equal(pendingResponse.statusCode, 200);
    assert.equal(pendingGroup.my_status, 'pending');
    assert.equal(rejectedResponse.statusCode, 200);
    assert.equal(rejectedGroup.my_status, 'rejected');
});

test('returns group details to the owner and accepted members', async () => {
    const owner = await createUser('detailowner');
    const member = await createUser('detailmember');
    const deletedAdder = await createUser('detaildeleted');
    const ownerToken = await tokenFor(owner);
    const memberToken = await tokenFor(member);
    const createResponse = await createGroup(ownerToken, { group_name: uniqueGroupName('detail') });
    const groupId = createResponse.body.group.group_id;

    await addMember(groupId, member.user_id, 'accepted');
    await pool.query(
        `INSERT INTO group_favorites (group_id, movies_tmdb_id, user_id)
         VALUES ($1, $2, $3), ($1, $4, $5)`,
        [groupId, 101, owner.user_id, 102, deletedAdder.user_id],
    );
    await pool.query('DELETE FROM users WHERE user_id = $1', [deletedAdder.user_id]);

    const expectedMembers = [owner, member]
        .map((user) => ({ user_id: user.user_id, user_name: user.user_name }))
        .sort((a, b) => a.user_name.localeCompare(b.user_name));
    const expectedGroup = {
        group_id: groupId,
        group_name: createResponse.body.group.group_name,
        owner_id: owner.user_id,
        owner_name: owner.user_name,
        member_count: 2,
        is_owner: true,
        members: expectedMembers,
        favorites: [
            { movie_id: 101, added_by: owner.user_name },
            { movie_id: 102, added_by: null },
        ],
    };

    const ownerResponse = await getGroup(groupId, ownerToken);
    const memberResponse = await getGroup(groupId, memberToken);
    const expectedMemberGroup = { ...expectedGroup, is_owner: false };

    assert.equal(ownerResponse.statusCode, 200);
    assert.deepEqual(ownerResponse.body, { group: expectedGroup });
    assert.equal(memberResponse.statusCode, 200);
    assert.deepEqual(memberResponse.body, { group: expectedMemberGroup });
});

test('protects group details with authentication and accepted membership', async () => {
    const owner = await createUser('accessowner');
    const pending = await createUser('accesspending');
    const rejected = await createUser('accessrejected');
    const outsider = await createUser('accessoutsider');
    const ownerToken = await tokenFor(owner);
    const pendingToken = await tokenFor(pending);
    const rejectedToken = await tokenFor(rejected);
    const outsiderToken = await tokenFor(outsider);
    const createResponse = await createGroup(ownerToken, { group_name: uniqueGroupName('access') });
    const groupId = createResponse.body.group.group_id;

    await addMember(groupId, pending.user_id, 'pending');
    await addMember(groupId, rejected.user_id, 'rejected');

    const unauthorizedCases = [
        ['without authentication', undefined, 401, 'Authentication required'],
        ['with an invalid token', 'invalid-token', 401, 'Invalid or expired token'],
        ['as a pending member', pendingToken, 403, 'You do not have access to this group'],
        ['as a rejected member', rejectedToken, 403, 'You do not have access to this group'],
        ['as a non-member', outsiderToken, 403, 'You do not have access to this group'],
    ];

    for (const [description, token, statusCode, message] of unauthorizedCases) {
        const response = await getGroup(groupId, token);
        assert.equal(response.statusCode, statusCode, description);
        assert.deepEqual(response.body, { message }, description);
    }

    const malformedResponse = await getGroup('not-a-number', ownerToken);
    assert.equal(malformedResponse.statusCode, 400);
    assert.deepEqual(malformedResponse.body, { message: 'Group ID must be a positive integer' });

    const missingResponse = await getGroup(999999999, ownerToken);
    assert.equal(missingResponse.statusCode, 404);
    assert.deepEqual(missingResponse.body, { message: 'Group not found' });
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

test('allows only the owner to delete a group', async () => {
    const owner = await createUser('deleteowner');
    const outsider = await createUser('deleteoutsider');
    const ownerToken = await tokenFor(owner);
    const outsiderToken = await tokenFor(outsider);
    const createResponse = await createGroup(
        ownerToken,
        { group_name: uniqueGroupName('deleteowner') },
    );
    const groupId = createResponse.body.group.group_id;

    const unauthenticatedResponse = await deleteGroup(groupId);
    assert.equal(unauthenticatedResponse.statusCode, 401);

    const outsiderResponse = await deleteGroup(groupId, outsiderToken);
    assert.equal(outsiderResponse.statusCode, 403);
    assert.deepEqual(outsiderResponse.body, {
        message: 'Only the group owner can delete this group',
    });

    const groupResult = await pool.query(
        'SELECT group_id FROM groups WHERE group_id = $1',
        [groupId],
    );
    assert.equal(groupResult.rowCount, 1);
});

test('owner deletion removes the group and its related data from the public list', async () => {
    const owner = await createUser('deletecascade');
    const member = await createUser('deletecascademember');
    const ownerToken = await tokenFor(owner);
    const createResponse = await createGroup(
        ownerToken,
        { group_name: uniqueGroupName('deletecascade') },
    );
    const groupId = createResponse.body.group.group_id;

    await addMember(groupId, member.user_id, 'accepted');
    await pool.query(
        `INSERT INTO group_favorites (group_id, movies_tmdb_id, user_id)
         VALUES ($1, $2, $3)`,
        [groupId, 987654, owner.user_id],
    );

    const deleteResponse = await deleteGroup(groupId, ownerToken);
    assert.equal(deleteResponse.statusCode, 204);

    const groupResult = await pool.query(
        'SELECT group_id FROM groups WHERE group_id = $1',
        [groupId],
    );
    const membersResult = await pool.query(
        'SELECT group_id FROM members WHERE group_id = $1',
        [groupId],
    );
    const favoritesResult = await pool.query(
        'SELECT group_id FROM group_favorites WHERE group_id = $1',
        [groupId],
    );
    const publicListResponse = await listGroups();

    assert.equal(groupResult.rowCount, 0);
    assert.equal(membersResult.rowCount, 0);
    assert.equal(favoritesResult.rowCount, 0);
    assert.equal(
        publicListResponse.body.groups.some((group) => group.group_id === groupId),
        false,
    );
});

test('returns 404 when the owner tries to delete a missing group', async () => {
    const owner = await createUser('deletemissing');
    const response = await deleteGroup(999999999, await tokenFor(owner));

    assert.equal(response.statusCode, 404);
    assert.deepEqual(response.body, { message: 'Group not found' });
});

test('allows an accepted member to add a movie to the group', async () => {
    const owner = await createUser('favoriteowner');
    const member = await createUser('favoritemember');
    const ownerToken = await tokenFor(owner);
    const memberToken = await tokenFor(member);
    const createResponse = await createGroup(
        ownerToken,
        { group_name: uniqueGroupName('favorite') },
    );
    const groupId = createResponse.body.group.group_id;
    const movieId = 654321;

    await addMember(groupId, member.user_id, 'accepted');

    const response = await addMovieToGroup(groupId, memberToken, movieId);
    const detailsResponse = await getGroup(groupId, memberToken);

    assert.equal(response.statusCode, 201);
    assert.equal(response.body.added, true);
    assert.deepEqual(detailsResponse.body.group.favorites, [
        { movie_id: movieId, added_by: member.user_name },
    ]);
});

test('does not add a duplicate group favorite', async () => {
    const owner = await createUser('duplicatemovie');
    const token = await tokenFor(owner);
    const createResponse = await createGroup(
        token,
        { group_name: uniqueGroupName('duplicate') },
    );
    const groupId = createResponse.body.group.group_id;
    const movieId = 654322;

    const firstResponse = await addMovieToGroup(groupId, token, movieId);
    const secondResponse = await addMovieToGroup(groupId, token, movieId);
    const result = await pool.query(
        'SELECT group_id FROM group_favorites WHERE group_id = $1 AND movies_tmdb_id = $2',
        [groupId, movieId],
    );

    assert.equal(firstResponse.statusCode, 201);
    assert.equal(secondResponse.statusCode, 200);
    assert.equal(secondResponse.body.added, false);
    assert.equal(result.rowCount, 1);
});

test('requires authentication and accepted membership to add a group favorite', async () => {
    const owner = await createUser('favoriteaccessowner');
    const pending = await createUser('favoritepending');
    const rejected = await createUser('favoriterejected');
    const outsider = await createUser('favoriteoutsider');
    const ownerToken = await tokenFor(owner);
    const pendingToken = await tokenFor(pending);
    const rejectedToken = await tokenFor(rejected);
    const outsiderToken = await tokenFor(outsider);
    const createResponse = await createGroup(
        ownerToken,
        { group_name: uniqueGroupName('favoriteaccess') },
    );
    const groupId = createResponse.body.group.group_id;
    const movieId = 654323;

    await addMember(groupId, pending.user_id, 'pending');
    await addMember(groupId, rejected.user_id, 'rejected');

    const unauthorizedCases = [
        ['without authentication', undefined, 401],
        ['with an invalid token', 'invalid-token', 401],
        ['as a pending member', pendingToken, 403],
        ['as a rejected member', rejectedToken, 403],
        ['as a non-member', outsiderToken, 403],
    ];

    for (const [description, token, statusCode] of unauthorizedCases) {
        const response = await addMovieToGroup(groupId, token, movieId);
        assert.equal(response.statusCode, statusCode, description);
    }

    const result = await pool.query(
        'SELECT group_id FROM group_favorites WHERE group_id = $1 AND movies_tmdb_id = $2',
        [groupId, movieId],
    );
    assert.equal(result.rowCount, 0);
});

test('validates group and movie IDs when adding a group favorite', async () => {
    const owner = await createUser('favoritevalidation');
    const token = await tokenFor(owner);
    const createResponse = await createGroup(
        token,
        { group_name: uniqueGroupName('favoritevalidation') },
    );
    const groupId = createResponse.body.group.group_id;

    const invalidGroupResponse = await addMovieToGroup('not-a-number', token, 654324);
    assert.equal(invalidGroupResponse.statusCode, 400);

    const invalidMovieResponse = await addMovieToGroup(groupId, token, 'not-a-number');
    assert.equal(invalidMovieResponse.statusCode, 400);

    const missingGroupResponse = await addMovieToGroup(999999999, token, 654324);
    assert.equal(missingGroupResponse.statusCode, 404);
});