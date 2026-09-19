import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import pool from "../helper/db.js";

const SALT_ROUNDS = 10;

const normalizeEmail = (value) => {
    return typeof value === "string" ? value.trim().toLowerCase() : "";
};

export const register = async (req, res) => {
    const {user_name, email, password} = req.body;
    const normalizedEmail = normalizeEmail(email);

    try {
        if (!user_name || !normalizedEmail || !password) {
            return res.status(400).json({message: "All fields are required"});
        }

        const userNameCheck = await pool.query(
            "SELECT user_id FROM users WHERE user_name = $1", [user_name]
        );
        if (userNameCheck.rows.length > 0) {
            return res.status(409).json({message: "Username already in use"});
        }

        const emailCheck = await pool.query(
            "SELECT user_id FROM users WHERE email = $1", [normalizedEmail]
        );
        if (emailCheck.rows.length > 0) {
            return res.status(409).json({message: "Email already in use"});
        }

        if (password.length < 8 || !/\p{Lu}/u.test(password) || !/\d/.test(password)) {
            return res.status(409).json({message: "Password invalid"});
        }

        const passwordHashed = await bcrypt.hash(password, SALT_ROUNDS);
        const newUser = await pool.query(
            "INSERT INTO users (user_name, email, password) VALUES ($1, $2, $3) RETURNING user_id, user_name, email",
            [user_name, normalizedEmail, passwordHashed]
        );

        return res.status(201).json({
            message: "Registration successful",
            user: newUser.rows[0],
        });
    }
    catch (error) {
        console.error("Registration error: ", error);
        return res.status(500).json({message: "Registration error"})
    }
};

export const login = async (req, res) => {
    const { email, password } = req.body;
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail || !password) {
        return res.status(400).json({
            message: "Email and password are required"
        });
    }

    try {
        const result = await pool.query(
            `SELECT user_id, user_name, email, password
            FROM users
            WHERE email = $1`,
            [normalizedEmail]
        );

        const user = result.rows[0];

        if(!user) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        const passwordMatches = await bcrypt.compare(password, user.password);
        
        if (!passwordMatches) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }


        if (!process.env.JWT_SECRET) {
            console.error("JWT_SECRET is not configured");
            return res.status(500).json({
                message: "Authentication is not configured"
            });
        }

        const token = jwt.sign(
            {
                user_id: user.user_id,
                user_name: user.user_name,
                email: user.email
            },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        return res.status(200).json({
            message: "Login successful",
            token,
            user: {
                user_id: user.user_id,
                user_name: user.user_name,
                email: user.email
            }
        });

    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json ({
            message: "Login error"
        });
    }
};

export const logout = (req, res) => {
    return res.status(200).json({
        message: "Logout successful"
    });
};

export const deleteAccount = async (req, res) => {
    const { password } = req.body ?? {};

    if (typeof password !== "string" || password.length === 0) {
        return res.status(400).json({
            message: "Password is required"
        });
    }

    let client;
    let transactionStarted = false;

    try {
        client = await pool.connect();
        await client.query("BEGIN");
        transactionStarted = true;

        const userResult = await client.query(
            "SELECT password FROM users WHERE user_id = $1 FOR UPDATE",
            [req.user.user_id]
        );

        if (userResult.rows.length === 0) {
            await client.query("ROLLBACK");
            transactionStarted = false;
            return res.status(404).json({
                message: "User account not found"
            });
        }

        const passwordMatches = await bcrypt.compare(password, userResult.rows[0].password);

        if (!passwordMatches) {
            await client.query("ROLLBACK");
            transactionStarted = false;
            return res.status(401).json({
                message: "Incorrect password"
            });
        }

        const ownedGroupsResult = await client.query(
            "SELECT 1 FROM groups WHERE owner_id = $1 LIMIT 1",
            [req.user.user_id]
        );

        if (ownedGroupsResult.rows.length > 0) {
            await client.query("ROLLBACK");
            transactionStarted = false;
            return res.status(409).json({
                message: "Transfer group ownership before deleting your account"
            });
        }

        await client.query(
            "DELETE FROM users WHERE user_id = $1",
            [req.user.user_id]
        );

        await client.query("COMMIT");
        transactionStarted = false;

        return res.status(200).json({
            message: "Account deleted successfully"
        });
    } catch (error) {
        if (transactionStarted) {
            try {
                await client.query("ROLLBACK");
            } catch (rollbackError) {
                console.error("Account deletion rollback error:", rollbackError);
            }
        }

        if (error.code === "23503") {
            return res.status(409).json({
                message: "Transfer group ownership before deleting your account"
            });
        }

        console.error("Account deletion error:", error);
        return res.status(500).json({
            message: "Account deletion error"
        });
    } finally {
        client?.release();
    }
};
