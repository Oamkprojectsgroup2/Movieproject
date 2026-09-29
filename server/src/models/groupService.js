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