# Quick Start Guide - Attendance Tracking Feature

## 🚀 Getting Started

### Prerequisites
- Node.js installed
- MongoDB running
- Both frontend and backend dependencies installed

### Starting the Application

1. **Start Backend** (Terminal 1)
   ```bash
   cd backend
   npm start
   ```
   Server runs on: `http://localhost:8000`

2. **Start Frontend** (Terminal 2)
   ```bash
   cd frontend
   npm start
   ```
   App runs on: `http://localhost:3000`

## 📋 Testing the Attendance Feature

### Scenario 1: Basic Attendance Tracking

1. **User 1 (Meeting Owner)**
   - Open `http://localhost:3000/meeting123`
   - Enter username: "Owner"
   - Click "Connect"
   - Register face when prompted
   - Stay on camera for the meeting

2. **User 2 (Participant with Good Attendance)**
   - Open `http://localhost:3000/meeting123` (new tab/window)
   - Enter username: "GoodStudent"
   - Click "Connect"
   - Register face when prompted
   - **Stay visible on camera** for 80% of meeting

3. **User 3 (Participant with Partial Attendance)**
   - Open `http://localhost:3000/meeting123` (new tab/window)
   - Enter username: "PartialStudent"
   - Click "Connect"
   - Register face when prompted
   - **Turn away from camera frequently** (aim for ~60% visible)

4. **User 4 (Participant with Poor Attendance)**
   - Open `http://localhost:3000/meeting123` (new tab/window)
   - Enter username: "AbsentStudent"
   - Click "Connect"
   - Register face when prompted
   - **Minimize window or turn away** most of the time (aim for <50% visible)

5. **Wait 2-3 minutes** to accumulate tracking data

6. **End Meeting**
   - As Owner (User 1), click the red "End Call" button
   - Attendance report will automatically appear

### Expected Results

The attendance report should show:
- **GoodStudent**: ~80% verified → Status: **Present** ✅
- **PartialStudent**: ~60% verified → Status: **Partial** ⚠️
- **AbsentStudent**: <50% verified → Status: **Absent** ❌
- **Owner**: Should see special "Meeting Owner Report" badge 👑

## 🧪 Testing API Endpoints

### 1. Get Owner's Meeting Reports
```bash
curl http://localhost:8000/api/v1/attendance/owner/Owner
```

Expected response:
```json
{
  "success": true,
  "count": 1,
  "data": [
    {
      "meetingId": "http://localhost:3000/meeting123",
      "meetingOwner": "Owner",
      "participants": [
        {
          "userId": "GoodStudent",
          "verifiedPercent": 80,
          "status": "Present"
        },
        ...
      ]
    }
  ]
}
```

### 2. Get Specific Meeting Report
```bash
curl http://localhost:8000/api/v1/attendance/meeting/http:%2F%2Flocalhost:3000%2Fmeeting123
```

### 3. Get User's Attendance History
```bash
curl http://localhost:8000/api/v1/attendance/user/GoodStudent
```

## 🎯 Testing Different Attendance Levels

### To Get "Present" Status (≥75%)
- Stay visible on camera
- Keep face towards camera
- Ensure good lighting
- Don't minimize window

### To Get "Partial" Status (50-74%)
- Turn away from camera occasionally
- Look at other screen/phone sometimes
- Cover camera briefly

### To Get "Absent" Status (<50%)
- Minimize browser window
- Turn away from camera most of time
- Join but don't register face
- Join and immediately leave

## 🔍 Debugging Tips

### Face Not Detected?
1. Check browser console (F12)
2. Look for: `"AI model still loading..."`
3. Wait 20 seconds for first-time model load
4. Ensure camera permissions granted
5. Check lighting conditions

### Attendance Seems Wrong?
1. Open browser console
2. Look for logs: `"✓ Updated {userId}: totalTime=..."`
3. Verify `verifiedDelta` is 10 when face detected, 0 when not
4. Check `totalTime` increases every 10 seconds

### Report Not Appearing?
1. Check owner clicked "End Call"
2. Open Network tab → WebSocket/Socket.io
3. Look for `attendance-report` event
4. Check MongoDB for saved reports

### Backend Logging
Backend shows useful logs:
```
✅ User xyz joined meeting: abc
✓ Updated userId: totalTime=60s, verifiedTime=50s
📊 Generating attendance report for meeting: abc
✅ Attendance report saved to database
```

## 📊 Understanding the Report

### Report Fields Explained

- **User**: Participant's username
- **Verified %**: Percentage of time face was detected
- **Total Time (s)**: Total seconds in meeting
- **Verified Time (s)**: Seconds face was successfully detected
- **Status**: Present/Partial/Absent based on percentage

### Status Color Coding
- 🟢 **Green (Present)**: ≥75% - Excellent attendance
- 🟠 **Orange (Partial)**: 50-74% - Needs improvement
- 🔴 **Red (Absent)**: <50% - Poor attendance

## 🎨 Optional: View Attendance History Page

If you added the AttendanceHistory page to your routes:

1. Navigate to `http://localhost:3000/attendance-history`
2. Log in as the meeting owner
3. View all historical meeting reports
4. Click expand icons to see detailed participant information

## ⚙️ Configuration Options

### Change Detection Frequency
**File**: `frontend/src/pages/VideoMeet.jsx` (line ~240)
```javascript
const interval = setInterval(async () => {
  // ...
}, 10000); // 10 seconds - change as needed
```

### Change Attendance Thresholds
**File**: `backend/src/controllers/socketManager.js` (line ~158)
```javascript
if (percent >= 75) {          // Change 75 to your threshold
  status = 'Present';
} else if (percent >= 50) {   // Change 50 to your threshold
  status = 'Partial';
} else {
  status = 'Absent';
}
```

### Change Face Recognition Confidence
**File**: `frontend/src/pages/VideoMeet.jsx` (line ~254)
```javascript
if (1 - distance > 0.6) {     // Change 0.6 (60% confidence)
  verifiedDelta = 10;
}
```

## 📝 Quick Troubleshooting

| Issue | Solution |
|-------|----------|
| Models loading forever | Refresh page, check internet connection |
| Face not registering | Better lighting, look straight at camera |
| Wrong attendance % | Ensure you stayed full meeting duration |
| Report not received | Check if owner ended meeting properly |
| API returns empty | Check if meeting completed and saved |

## ✅ Success Indicators

You'll know it's working when:
1. ✅ Face enrollment completes with success message
2. ✅ Console logs show `"✓ Updated userId..."` every 10 seconds
3. ✅ Attendance report appears when meeting ends
4. ✅ Report shows correct status based on visibility
5. ✅ API returns saved report data
6. ✅ Owner sees special owner badge on report

## 🆘 Need Help?

1. Check browser console (F12) for errors
2. Check backend terminal for error logs
3. Verify MongoDB is running
4. Ensure all dependencies installed (`npm install`)
5. Clear browser cache and try again
6. Check `ATTENDANCE_FEATURE_README.md` for detailed documentation

---
**Ready to test!** Follow the steps above and enjoy your new attendance tracking feature! 🎉
