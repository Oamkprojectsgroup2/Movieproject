import bcrypt from "bcrypt";
import pool from "../helper/db.js";

const SALT_ROUNDS = 10;

export const register = async (req, res) => {
    const {user_name, email, password} = req.body;

    try {
        if (!user_name || !email || !password) {
            return res.status(400).json({message: "All fields are required"});
        }

        const userNameCheck = await pool.query(
            "SELECT user_id FROM users WHERE user_name = $1", [user_name]
        );
        if (userNameCheck.rows.length > 0) {
            return res.status(409).json({message: "Username already in use"});
        }

        const emailCheck = await pool.query(
            "SELECT user_id FROM users WHERE email = $1", [email]
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
            [user_name, email, passwordHashed]
        )

        return res.status(201).json({
            message: "Registration successful",
            user: newUser.rows[0],
        });
    }
    catch (error) {
        console.error("Registration error: ", error);
        return res.status(500).json({message: "Registration error"})
    }
}