import dotenv from 'dotenv';
import fs from "node:fs";
import path from "node:path";
import pool from "../src/helper/db.js";

//Fetch .env from root folder
dotenv.config({path: path.resolve(process.cwd(), '../../.env')});

/*      //For debugging connection
console.log("Connecting with DB Config:", {
  host: process.env.POSTGRES_HOST,
  port: process.env.POSTGRES_PORT,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD ? "****" : undefined,
  database: process.env.POSTGRES_DB,
});
*/

async function initilizeDatabase() {
    const client = await pool.connect();     //Opens a connection
    try {
        const sqlFilePath = path.join(import.meta.dirname, "schema.sql");
        const sqlQuery = fs.readFileSync(sqlFilePath, "utf8");

        console.log("initilizing and resetting db schema");

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

initilizeDatabase();