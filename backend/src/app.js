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
import dotenv from "dotenv";

dotenv.config(); // Load environment variables from .env file
import userRoutes from "./routes/users.routes.js"; // User authentication routes
import attendanceRoutes from "./routes/attendance.routes.js"; // Attendance report routes

// Initialize Express application
const app = express();
// Create HTTP server from Express app
const server = createServer(app);
// Initialize Socket.io with the HTTP server for real-time video call functionality
const io = connectToSocket(server);


// Set server port (from .env file or default to 8000)
app.set("port", (process.env.PORT || 8000))

// MIDDLEWARE CONFIGURATION
// Configure CORS to allow frontend requests from localhost:3000
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: "40kb" })); // Parse JSON request bodies up to 40kb
app.use(express.urlencoded({ limit: "40kb", extended: true })); // Parse URL-encoded data

// API ROUTES
// Test endpoint to verify server is running
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running', port: app.get("port") });
});

// All user-related endpoints (login, register, meeting history) are prefixed with /api/v1/users
app.use("/api/v1/users", userRoutes);
// All attendance-related endpoints (reports, owner reports) are prefixed with /api/v1/attendance
app.use("/api/v1/attendance", attendanceRoutes);

// START SERVER FUNCTION
const start = async () => {
  try {
    const connectionDb = await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Mongo Connected:", connectionDb.connection.host);

    const PORT = app.get("port");
    
    // Add error handler for port conflicts
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ ERROR: Port ${PORT} is already in use!`);
        console.log(`💡 Solution: Kill the process using port ${PORT}:`);
        console.log(`   Windows: netstat -ano | findstr :${PORT}`);
        console.log(`   Then: taskkill /F /PID <PID>`);
        console.log(`   Or use: npm run kill-port`);
        process.exit(1);
      } else {
        console.error("❌ Server error:", error);
        process.exit(1);
      }
    });

    server.listen(PORT, '0.0.0.0', () => {
      console.log(`✅ Server listening on port ${PORT}`);
      console.log(`✅ API Health Check: http://localhost:${PORT}/api/health`);
      console.log(`✅ Login endpoint: http://localhost:${PORT}/api/v1/users/login`);
    });

  } catch (error) {
    console.error("❌ Server failed to start:", error.message);
    process.exit(1);
  }
};


// Initialize and start the server
start();