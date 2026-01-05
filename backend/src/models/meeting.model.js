/**
 * MEETING MODEL - meeting.model.js
 * Database schema for meeting history
 * Tracks which users have joined which meeting codes
 * Used to show "History" page on frontend
 */

import mongoose, { Schema } from "mongoose";

// Define the structure of a Meeting document in MongoDB
const meetingSchema = new Schema(
    {
        user_id: { type: String }, // Username of who joined the meeting
        meetingCode: { type: String, required: true }, // The meeting room code
        date: { type: Date, default: Date.now, required: true } // When they joined
    }
)

// Create the Meeting model from the schema
const Meeting = mongoose.model("Meeting", meetingSchema);

export { Meeting };