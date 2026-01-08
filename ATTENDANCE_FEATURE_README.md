# Face Detection-Based Attendance Tracking Feature

## Overview
This feature automatically tracks meeting attendance using real-time face detection. Participants are marked as Present, Partial, or Absent based on how long their registered face is detected during the meeting.

## How It Works

### 1. **Face Registration**
When a user joins a meeting:
- They are prompted to register their face using their webcam
- The system captures their face descriptor (unique facial features)
- This descriptor is stored temporarily for the meeting duration

### 2. **Real-Time Tracking**
During the meeting:
- Every 10 seconds, the system checks if the registered face is visible
- If face is detected with >60% confidence, 10 seconds are added to "verified time"
- Total time in meeting is also tracked

### 3. **Attendance Status Calculation**
At the end of the meeting, attendance is determined by:

```
Verified Percentage = (Verified Time / Total Time) × 100

Status:
- Present: ≥ 75% verified time
- Partial: ≥ 50% and < 75% verified time  
- Absent: < 50% verified time
```

### 4. **Report Generation**
When the meeting ends:
- System generates a comprehensive attendance report
- Report is sent to all participants
- **Meeting owner receives a special highlighted report**
- Report is saved to database for future reference

## Features

### ✅ Automatic Attendance Marking
- **Present (≥75%)**: User's face detected most of the time
- **Partial (50-74%)**: User's face detected about half the time
- **Absent (<50%)**: User's face rarely detected or not present

### 👑 Meeting Owner Benefits
- First person to join becomes the meeting owner
- Owner receives special attendance report notification
- Can access all historical attendance reports via API

### 📊 Attendance Reports Include:
- Meeting ID and date/time
- Each participant's:
  - Total time in meeting (seconds)
  - Verified time (seconds face was detected)
  - Verification percentage
  - Attendance status
- Meeting owner information

### 🔒 Privacy & Security
- Face descriptors are encrypted numerical arrays (128 numbers)
- Actual images are never stored
- Face data is automatically deleted after meeting ends
- Each meeting uses isolated face recognition

## Technical Implementation

### Backend (Node.js/Express/Socket.io)

#### Models Updated:
1. **Meeting Model** (`meeting.model.js`)
   - Added `meetingOwner` field to track who created the meeting

2. **Attendance Model** (`attendance.model.js`)
   ```javascript
   {
     meetingId: String,
     meetingOwner: String,
     participants: [{
       userId: String,
       name: String,
       totalTime: Number,
       verifiedTime: Number,
       verifiedPercent: Number,
       status: String // 'Present', 'Partial', 'Absent'
     }],
     startTime: Date,
     endTime: Date
   }
   ```

#### Socket Events:
1. **join-call** - User joins meeting, identifies owner
2. **register-face** - Stores face descriptor
3. **verified-update** - Updates presence every 10 seconds
4. **end-meeting** - Generates and sends report
5. **attendance-report** - Broadcast to all participants
6. **owner-attendance-report** - Special report for owner

#### API Endpoints:
- `GET /api/v1/attendance/owner/:userId` - Get all reports for meeting owner
- `GET /api/v1/attendance/meeting/:meetingId` - Get specific meeting report
- `GET /api/v1/attendance/user/:userId` - Get user's attendance history

### Frontend (React)

#### Key Components:

1. **VideoMeet.jsx** - Main video meeting component
   - Face enrollment modal
   - Real-time face detection
   - Attendance report display
   
2. **AttendanceHistory.jsx** - View historical reports (NEW)
   - Shows all meetings owned by user
   - Expandable report cards
   - Detailed participant information

#### Libraries Used:
- `@vladmandic/face-api` - Face detection and recognition
- `socket.io-client` - Real-time communication
- `@mui/material` - UI components

## Usage Guide

### For Meeting Participants:

1. **Join Meeting**
   - Enter your username in the lobby
   - Click "Connect"

2. **Register Face**
   - Look directly at the camera
   - Wait for "Ready" status
   - Click "CAPTURE MY FACE"
   - System confirms registration

3. **During Meeting**
   - Stay visible on camera for accurate tracking
   - Face detection runs every 10 seconds
   - No action needed from you

4. **View Report**
   - When meeting ends, report appears automatically
   - Shows your attendance percentage and status

### For Meeting Owners:

1. **Start Meeting**
   - First person to join becomes owner
   - Complete face registration like other participants

2. **Monitor Meeting**
   - No special actions required
   - System tracks all participants automatically

3. **End Meeting**
   - Click "End Call" button
   - Receive highlighted owner report
   - Report saved to database

4. **Access History** (optional)
   - Navigate to `/attendance-history` page
   - View all your past meeting reports
   - Expand reports for detailed information

## API Usage Examples

### Get Reports as Meeting Owner
```javascript
fetch('http://localhost:8000/api/v1/attendance/owner/yourUserId')
  .then(res => res.json())
  .then(data => console.log(data.data));
```

### Get Specific Meeting Report
```javascript
fetch('http://localhost:8000/api/v1/attendance/meeting/meetingCode123')
  .then(res => res.json())
  .then(data => console.log(data.data));
```

### Get Your Attendance Records
```javascript
fetch('http://localhost:8000/api/v1/attendance/user/yourUserId')
  .then(res => res.json())
  .then(data => console.log(data.data));
```

## Configuration

### Adjust Face Detection Frequency
In `VideoMeet.jsx`, line ~240:
```javascript
const interval = setInterval(async () => {
  // ... face detection code
}, 10000); // Change 10000 (10 seconds) to desired interval
```

### Adjust Attendance Thresholds
In `socketManager.js`, line ~158:
```javascript
if (percent >= 75) {
  status = 'Present';
} else if (percent >= 50) {
  status = 'Partial';
} else {
  status = 'Absent';
}
```

### Adjust Face Recognition Confidence
In `VideoMeet.jsx`, line ~254:
```javascript
if (1 - distance > 0.6) verifiedDelta = 10;
// Change 0.6 (60% confidence) to desired threshold
```

## Troubleshooting

### Face Not Detected
- Ensure good lighting
- Look directly at camera
- Wait 2-3 seconds for camera to stabilize
- Check browser camera permissions

### Attendance Seems Inaccurate
- Verify face was registered successfully
- Stay visible on camera throughout meeting
- Check if multiple people in frame (may confuse detection)
- Ensure stable internet connection

### Report Not Received
- Check browser console for errors
- Verify meeting owner clicked "End Call"
- Check if socket connection is active
- Query database using API endpoints

## Database Schema

### Attendance Collection
```javascript
{
  _id: ObjectId,
  meetingId: "meeting-code-123",
  meetingOwner: "john_doe",
  participants: [
    {
      userId: "participant1",
      name: "participant1",
      totalTime: 600,      // 10 minutes
      verifiedTime: 480,   // 8 minutes
      verifiedPercent: 80,
      status: "Present"
    }
  ],
  startTime: ISODate("2026-01-08T10:00:00Z"),
  endTime: ISODate("2026-01-08T10:10:00Z"),
  date: ISODate("2026-01-08T10:10:00Z")
}
```

## Future Enhancements

Potential improvements:
- Email notifications to meeting owner
- Export reports to PDF/CSV
- Analytics dashboard
- Multi-face detection for shared cameras
- Mobile app support
- Integration with calendar systems
- Custom attendance thresholds per meeting
- Real-time attendance status indicator

## Security Considerations

- Face descriptors are 128-element arrays, not actual images
- Data transmitted over WebSocket is ephemeral
- Face data deleted immediately after meeting
- No personally identifiable images stored
- HTTPS recommended for production
- Implement rate limiting on API endpoints
- Add authentication to attendance routes

## Support

For issues or questions:
1. Check browser console for errors
2. Verify all dependencies installed
3. Ensure MongoDB connection active
4. Check Socket.io connection status
5. Review network requests in DevTools

---

**Version**: 1.0.0  
**Last Updated**: January 8, 2026  
**Tested On**: Chrome 120+, Firefox 121+, Edge 120+
