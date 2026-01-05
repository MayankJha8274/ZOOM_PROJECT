/**
 * SOCKET MANAGER - socketManager.js
 * This file handles all real-time WebSocket communication for video calls:
 * - User joining/leaving calls
 * - WebRTC signaling (peer-to-peer connection setup)
 * - Chat messages during video calls
 * - Tracking active connections per meeting room
 */

import { Server } from "socket.io"

// DATA STRUCTURES TO TRACK ACTIVE CALLS
// connections: { 'meeting-code': ['socket-id-1', 'socket-id-2', ...] }
let connections = {} // Stores which users are in which meeting room

// messages: { 'meeting-code': [{sender, data, socket-id-sender}, ...] }
let messages = {} // Stores chat messages for each meeting room

// timeOnline: { 'socket-id': Date }
let timeOnline = {} // Tracks when each user joined (for analytics)

export const connectToSocket = (server) => {
    // Initialize Socket.io server with CORS configuration
    const io = new Server(server, {
        cors: {
            origin: "*", // Allow connections from any origin
            methods: ["GET", "POST"],
            allowedHeaders: ["*"],
            credentials: true
        }
    });


    // EVENT: When a user connects to the server
    io.on("connection", (socket) => {

        console.log("SOMETHING CONNECTED")

        // EVENT: User joins a video call meeting
        // 'path' is the meeting code/room ID
        socket.on("join-call", (path) => {

            // Create a new room if it doesn't exist
            if (connections[path] === undefined) {
                connections[path] = []
            }
            // Add this user's socket ID to the meeting room
            connections[path].push(socket.id)

            // Track when this user joined
            timeOnline[socket.id] = new Date();

            // Notify all existing users in the room that a new user joined
            // This triggers WebRTC peer connection setup on the frontend
            for (let a = 0; a < connections[path].length; a++) {
                io.to(connections[path][a]).emit("user-joined", socket.id, connections[path])
            }

            // Send all previous chat messages to the newly joined user
            // So they can see the chat history
            if (messages[path] !== undefined) {
                for (let a = 0; a < messages[path].length; ++a) {
                    io.to(socket.id).emit("chat-message", messages[path][a]['data'],
                        messages[path][a]['sender'], messages[path][a]['socket-id-sender'])
                }
            }

        })

        // EVENT: WebRTC signaling - Exchange connection data between peers
        // This is used for establishing peer-to-peer video/audio connections
        // 'toId' is the recipient's socket ID, 'message' contains WebRTC offer/answer/ICE candidate
        socket.on("signal", (toId, message) => {
            io.to(toId).emit("signal", socket.id, message);
        })

        // EVENT: Chat message sent during video call
        socket.on("chat-message", (data, sender) => {

            // Find which meeting room this user is in
            const [matchingRoom, found] = Object.entries(connections)
                .reduce(([room, isFound], [roomKey, roomValue]) => {

                    // Check if this socket ID is in this room
                    if (!isFound && roomValue.includes(socket.id)) {
                        return [roomKey, true];
                    }

                    return [room, isFound];

                }, ['', false]);

            // If user is in a room, broadcast their message
            if (found === true) {
                // Initialize message array for this room if needed
                if (messages[matchingRoom] === undefined) {
                    messages[matchingRoom] = []
                }

                // Store the message
                messages[matchingRoom].push({ 'sender': sender, "data": data, "socket-id-sender": socket.id })
                console.log("message", matchingRoom, ":", sender, data)

                // Broadcast message to all users in the room
                connections[matchingRoom].forEach((elem) => {
                    io.to(elem).emit("chat-message", data, sender, socket.id)
                })
            }

        })

        // EVENT: User disconnects (closes browser, loses connection, etc.)
        socket.on("disconnect", () => {

            // Calculate how long the user was online (for analytics)
            var diffTime = Math.abs(timeOnline[socket.id] - new Date())

            var key // Will store the meeting room code

            // Find which room the disconnected user was in
            for (const [k, v] of JSON.parse(JSON.stringify(Object.entries(connections)))) {

                for (let a = 0; a < v.length; ++a) {
                    if (v[a] === socket.id) {
                        key = k

                        // Notify all other users in the room that this user left
                        for (let a = 0; a < connections[key].length; ++a) {
                            io.to(connections[key][a]).emit('user-left', socket.id)
                        }

                        // Remove the user from the room
                        var index = connections[key].indexOf(socket.id)
                        connections[key].splice(index, 1)

                        // Delete the room if it's empty (last user left)
                        if (connections[key].length === 0) {
                            delete connections[key]
                        }
                    }
                }

            }


        })


    })


    return io;
}

