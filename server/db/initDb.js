import fs from "node:fs";
import path from "node:path";
import pool from "../src/helper/db.js";

//package.json fetches .env variables

const manualReset = process.argv.includes("--reset");
const loadSeed = process.argv.includes("--seed");

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
        const sqlFilePath = path.join(import.meta.dirname, "schema.sql");
        const sqlQuery = fs.readFileSync(sqlFilePath, "utf8");

        await client.query("BEGIN");    //Start one block in PostgreSQL

        if (manualReset) {
            console.log("Manual reset, dropping all tables");
            await client.query("DROP SCHEMA public CASCADE");    //Drops every table, index and constraint
            await client.query("CREATE SCHEMA public");
        }

        console.log("initilizing db schema");

        await client.query(sqlQuery);   //Send the schema
        await client.query("COMMIT");   //Apply if everything went ok

        //seed.sql has its own BEGIN/COMMIT, so it runs outside the block above
        if (loadSeed) {
            console.log("loading test data from seed.sql");
            const seedFilePath = path.join(import.meta.dirname, "seed.sql");
            await client.query(fs.readFileSync(seedFilePath, "utf8"));
        }

        console.log("Initialization successful");
    }
    catch (error) {
        await client.query("ROLLBACK"); //If anything fails, cancel everything
        console.error("Initialization error:", error.message);
        process.exit(1);    //Stops node with exit error code
    }
    finally {
        client.release();       //Releases connection
        await pool.end();       //closes the connection
    }
}

initializeDatabase();