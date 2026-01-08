import mongoose, { Schema } from "mongoose";

const attendanceSchema = new Schema({
  meetingId: { type: String, required: true },
  meetingOwner: { type: String, required: true }, // Owner who will receive the report
  participants: [{
    userId: String,
    name: String,
    totalTime: Number, // Total seconds in meeting
    verifiedTime: Number, // Seconds face was detected
    verifiedPercent: Number, // Percentage of time present
    status: String, // 'Present', 'Partial', or 'Absent'
  }],
  startTime: { type: Date, default: Date.now },
  endTime: { type: Date },
  date: { type: Date, default: Date.now },
});

const Attendance = mongoose.model("Attendance", attendanceSchema);

export { Attendance };