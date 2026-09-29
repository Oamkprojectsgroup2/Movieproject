import pool from "../helper/db.js";

export const createGroup = async (ownerId, groupName) => {
  const client = await pool.connect();

  try{
    await client.query("BEGIN");

    const result = await client.query(
      `INSERT INTO groups (group_name, owner_id)
       VALUES ($1, $2)
       RETURNING group_id, group_name, owner_id`,
      [groupName, ownerId],
    );
    const group = result.rows[0];

    await client.query(
      `INSERT INTO members (user_id, group_id, status)
       VALUES ($1, $2, 'accepted')`,
       [ownerId, group.group_id],
    );

    await client.query("COMMIT");
    return group;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

export const listGroups = async (userId = null) => {
  const result = await pool.query(
    `SELECT g.group_id, g.group_name, g.owner_id, u.user_name AS owner_name,
     COUNT(m.user_id) FILTER (WHERE m.status = 'accepted')::int AS member_count,
     MAX(m.status) FILTER (WHERE m.user_id = $1) AS my_status
     FROM groups g
     JOIN users u ON u.user_id = g.owner_id
     LEFT JOIN members m ON m.group_id = g.group_id
     GROUP BY g.group_id, u.user_name
     ORDER BY g.group_name`,
    [userId],
  );

  return result.rows;
};

export const joinGroup = async (groupId, userId) => {
  const result = await pool.query(
    `INSERT INTO members (group_id, user_id, status) VALUES ($1, $2, 'pending')
    RETURNING user_id, group_id, status`, [groupId, userId],
  );

  return result.rows[0];
};

export const ownerCheck = async (groupId, userId) => {
  const result = await pool.query(
    `SELECT owner_id FROM groups WHERE group_id = $1`, [groupId]
  );
  //If group doesnt exist or wrong owner
  if (result.rows.length === 0 || result.rows[0].owner_id !== userId) {
    return false
  }
  return true
};

export const getPendingMembers = async (groupId, userId) => {
  const result = await pool.query(
    `SELECT m.user_id, u.user_name, m.status FROM members m
    JOIN groups g ON m.group_id = g.group_id
    JOIN users u ON m.user_id = u.user_id
    WHERE m.group_id = $1 AND g.owner_id = $2 AND status = 'pending'`,
    [groupId, userId],
  );

  return result.rows;
};

export const acceptMember = async (groupId, userId) => {
  const result = await pool.query(
    `UPDATE members SET status = 'accepted' 
    WHERE group_id = $1 AND user_id = $2 AND status = 'pending'
    RETURNING user_id, group_id`, [groupId, userId]
  );
  return result.rows[0];
};

export const rejectMember = async (groupId, userId) => {
  const result = await pool.query(
    `UPDATE members SET status = 'rejected' 
    WHERE group_id = $1 AND user_id = $2 AND status = 'pending'
    RETURNING user_id, group_id`, [groupId, userId]
  );
  return result.rows[0];
};
