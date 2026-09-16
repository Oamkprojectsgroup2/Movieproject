import fs from "node:fs";
import path from "node:path";
import pool from "../src/helper/db.js";

//package.json fetches .env variables

const manualReset = process.argv.includes("--reset");

/*      //For debugging connection
console.log("Connecting with DB Config:", {
  host: process.env.POSTGRES_HOST,
  port: process.env.POSTGRES_PORT,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD ? "****" : undefined,
  database: process.env.POSTGRES_DB,
});
*/

async function initializeDatabase() {
    const client = await pool.connect();     //Opens a connection
    try {
        if (manualReset) {
            console.log("Manual reset, dropping tables");
            await client.query("DROP TABLE IF EXISTS users CASCADE");
        }
        const sqlFilePath = path.join(import.meta.dirname, "schema.sql");
        const sqlQuery = fs.readFileSync(sqlFilePath, "utf8");

        console.log("initilizing db schema");

        await client.query("BEGIN");    //Start one block in PostgreSQL
        await client.query(sqlQuery);   //Send the schema
        await client.query("COMMIT");   //Apply if everything went ok

        console.log("Initialization successful");
    }
    catch (error) {
        await client.query("ROLLBACK"); //If anything fails, cancel everything
        console.log("Initialization error");
        process.exit(1);    //Stops node with exit error code
    }
    finally {
        client.release();       //Releases connection
        await pool.end();       //closes the connection
    }
}

initializeDatabase();