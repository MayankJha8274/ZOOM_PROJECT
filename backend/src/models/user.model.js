/**
 * USER MODEL - user.model.js
 * Database schema for user accounts
 * Stores:
 * - name: User's display name
 * - username: Unique login identifier
 * - password: Hashed password (never stored in plain text)
 * - token: Session token for authentication after login
 */

import mongoose, { Schema } from "mongoose";

// Define the structure of a User document in MongoDB
const userScheme = new Schema(
    {
        name: { type: String, required: true },
        username: { type: String, required: true, unique: true }, // Must be unique
        password: { type: String, required: true }, // Stored as bcrypt hash
        token: { type: String } // Generated on login, used for authenticated requests
    }
)

// Create the User model from the schema
const User = mongoose.model("User", userScheme);

export { User };