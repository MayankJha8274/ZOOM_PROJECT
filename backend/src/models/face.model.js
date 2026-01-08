import mongoose, { Schema } from "mongoose";

const faceSchema = new Schema({
  userId: { type: String, required: true }, // Username from login
  meetingId: { type: String, required: true }, // Meeting code
  descriptor: [Number], // 128 numbers for face matching
});

const Face = mongoose.model("Face", faceSchema);

export { Face };