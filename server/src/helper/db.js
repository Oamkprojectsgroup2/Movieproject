import pg from "pg";

const { Pool } = pg;

const pool = new Pool({
    host: process.env.POSTGRES_HOST || "localhost",
    port: parseInt(process.env.POSTGRES_PORT) || 5432,
    user: process.env.POSTGRES_USER || "postgres",
    password: process.env.POSTGRES_PASSWORD || "postgres",
    database: process.env.POSTGRES_DB || "postgres",
    max: 10,    //MAximum number of Clients
    idleTimeoutMillis: 30000,   //Close idle clients after 30s
    connectionTimeoutMillis: 2000,  //Return error if takes more than 2s to open connection
});

pool.on("error", (err) => {
    console.error("Error on PostgreSQL client", err);
});

export const query = (text, params) => pool.query(text, params);
export default pool;