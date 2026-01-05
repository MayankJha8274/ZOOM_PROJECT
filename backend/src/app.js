/**
 * BACKEND ENTRY POINT - app.js
 * This is the main server file that:
 * 1. Sets up Express server
 * 2. Configures Socket.io for real-time video communication
 * 3. Connects to MongoDB database
 * 4. Defines API routes for user authentication and meeting history
 */

import express from "express";
import { createServer } from "node:http"; // HTTP server for Express

import { Server } from "socket.io"; // Real-time communication for video calls

import mongoose from "mongoose"; // MongoDB ODM for database operations
import { connectToSocket } from "./controllers/socketManager.js"; // Socket.io connection handler

import cors from "cors"; // Allow frontend to make requests from different origin
import userRoutes from "./routes/users.routes.js"; // User authentication routes

// Initialize Express application
const app = express();
// Create HTTP server from Express app
const server = createServer(app);
// Initialize Socket.io with the HTTP server for real-time video call functionality
const io = connectToSocket(server);


// Set server port (from .env file or default to 8000)
app.set("port", (process.env.PORT || 8000))

// MIDDLEWARE CONFIGURATION
app.use(cors()); // Enable Cross-Origin Resource Sharing (allows frontend to connect)
app.use(express.json({ limit: "40kb" })); // Parse JSON request bodies up to 40kb
app.use(express.urlencoded({ limit: "40kb", extended: true })); // Parse URL-encoded data

// API ROUTES
// All user-related endpoints (login, register, meeting history) are prefixed with /api/v1/users
app.use("/api/v1/users", userRoutes);

// START SERVER FUNCTION
const start = async () => {
    app.set("mongo_user")
    // Connect to MongoDB database
    const connectionDb = await mongoose.connect("mongodb+srv://imdigitalashish:imdigitalashish@cluster0.cujabk4.mongodb.net/")

    console.log(`MONGO Connected DB HOst: ${connectionDb.connection.host}`)
    
    // Start the server on port 8000
    server.listen(app.get("port"), () => {
        console.log("LISTENIN ON PORT 8000")
    });
}

// Initialize and start the server
start();