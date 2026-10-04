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
  if (result.rows.length === 1 && result.rows[0].owner_id === userId) {
    return true
  }
  return false
};

export const membershipCheck = async (groupID, userId) => {
  const result = await pool.query(
    `SELECT status FROM members WHERE group_id = $1 AND user_id = $2`, [groupID, userId]
  );
  return result.rows;
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

export const getGroupDetails = async (groupId, userId) => {
  const groupResult = await pool.query(
    `SELECT g.group_id, g.group_name, g.owner_id, owner.user_name AS owner_name,
     COUNT(m.user_id) FILTER (WHERE m.status = 'accepted')::int AS member_count
     FROM groups g
     JOIN users owner ON owner.user_id = g.owner_id
     LEFT JOIN members m ON m.group_id = g.group_id
     WHERE g.group_id = $1
     GROUP BY g.group_id, owner.user_name`,
    [groupId],
  );

  if (groupResult.rows.length === 0) {
    return null;
  }

  const group = groupResult.rows[0];
  const isOwner = group.owner_id === userId;
  const accessResult = await pool.query(
    `SELECT 1
     FROM members
     WHERE group_id = $1 AND user_id = $2 AND status = 'accepted'
     UNION ALL
     SELECT 1
     FROM groups
     WHERE group_id = $1 AND owner_id = $2
     LIMIT 1`,
    [groupId, userId],
  );

  if (accessResult.rows.length === 0) {
    return { authorized: false };
  }

  const [membersResult, favoritesResult] = await Promise.all([
    pool.query(
      `SELECT m.user_id, u.user_name
       FROM members m
       JOIN users u ON u.user_id = m.user_id
       WHERE m.group_id = $1 AND m.status = 'accepted'
       ORDER BY u.user_name`,
      [groupId],
    ),
    pool.query(
      `SELECT gf.movies_tmdb_id AS movie_id, u.user_name AS added_by
       FROM group_favorites gf
       LEFT JOIN users u ON u.user_id = gf.user_id
       WHERE gf.group_id = $1
       ORDER BY gf.group_favorite_id`,
      [groupId],
    ),
  ]);

  return {
    authorized: true,
    group: {
      ...group,
      is_owner: isOwner,
      members: membersResult.rows,
      favorites: favoritesResult.rows,
    },
  };
};


export const deleteGroup = async (groupId, ownerId) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const groupResult = await client.query(
      `SELECT owner_id FROM groups WHERE group_id = $1 FOR UPDATE`,
      [groupId],
    );

    if (groupResult.rows.length === 0) {
      await client.query("COMMIT");
      return { notFound: true };
    }

    if (Number(groupResult.rows[0].owner_id) !== Number(ownerId)) {
      await client.query("COMMIT");
      return { unauthorized: true };
    }

    await client.query(
      `DELETE FROM groups WHERE group_id = $1`,
      [groupId],
    );

    await client.query("COMMIT");
    return { deleted: true };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

export const addMovieToGroup = async (groupId, movieId, userId) => {
  const insertResult = await pool.query(
     `INSERT INTO group_favorites (group_id, movies_tmdb_id, user_id)
     SELECT $1, $2, $3
     WHERE EXISTS (
       SELECT 1
       FROM members
       WHERE group_id = $1 AND user_id = $3 AND status = 'accepted'
     )
     ON CONFLICT (group_id, movies_tmdb_id) DO NOTHING
     RETURNING group_favorite_id`,
    [groupId, movieId, userId],
  );

  if (insertResult.rows.length > 0) {
    return {added: true };
  }
  const groupResult = await pool.query(
    "SELECT 1 FROM groups WHERE group_id = $1",
    [groupId],
  );
  if (groupResult.rows.length === 0) {
    return { notFound: true };
  }
  const memberResult = await pool.query(
    `SELECT 1 FROM members
    WHERE group_id = $1 AND user_id = $2 AND status = 'accepted'`,
    [groupId, userId],
  );

if (memberResult.rows.length === 0) {
  return { unauthorized: true };
}
return { added: false};
};

export const removeMovieFromGroup = async (groupId, movieId, ownerId) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const groupResult = await client.query(
      `SELECT owner_id FROM groups WHERE group_id = $1 FOR UPDATE`,
      [groupId],
    );

    if (groupResult.rows.length === 0) {
      await client.query("COMMIT");
      return { notFound: true };
    }

    if (Number(groupResult.rows[0].owner_id) !== Number(ownerId)) {
      await client.query("COMMIT");
      return { unauthorized: true };
    }

    const deleteResult = await client.query(
      `DELETE FROM group_favorites
       WHERE group_id = $1 AND movies_tmdb_id = $2`,
      [groupId, movieId],
    );

    if (deleteResult.rowCount === 0) {
      await client.query("COMMIT");
      return { movieNotFound: true };
    }

    await client.query("COMMIT");
    return { removed: true };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};
