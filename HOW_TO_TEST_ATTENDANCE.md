# 🧪 How to Test the Attendance Feature - Step by Step

## ✅ Issues Fixed

Before testing, the following issues have been fixed:
1. ✅ **Backend URL corrected**: Changed from `localhost:3000` to `localhost:8000`
2. ✅ **Video/Audio start enabled**: Camera and mic now start ON by default
3. ✅ **Toggle buttons fixed**: Icons now correctly reflect video/audio state
4. ✅ **Track management improved**: Better handling of enable/disable

## 🚀 Prerequisites

### 1. Make Sure Backend is Running
```bash
# Terminal 1 - Start Backend
cd C:\Users\mayan\OneDrive\Desktop\ZOOM_PROJECT\Zoom\backend
npm start
```

**You should see**:
```
LISTENIN ON PORT 8000
MONGO Connected DB HOst: cluster0.cujabk4.mongodb.net
```

### 2. Make Sure Frontend is Running  
```bash
# Terminal 2 - Start Frontend
cd C:\Users\mayan\OneDrive\Desktop\ZOOM_PROJECT\Zoom\frontend
npm start
```

**You should see**:
```
webpack compiled successfully
Compiled successfully!
```

## 📝 Step-by-Step Testing Guide

### Test 1: Single User (Basic Functionality)

1. **Open Meeting**
   - Go to: `http://localhost:3000/testmeeting1`
   
2. **Enter Lobby**
   - You should see your camera preview
   - Video and audio should be ON (green icons)
   - Enter username: `TestUser1`
   - Click "Connect"

3. **Face Enrollment**
   - Face enrollment modal should appear automatically
   - Wait for "Ready" message (may take 20 seconds first time)
   - Look directly at camera
   - Click "CAPTURE MY FACE"
   - Should see: "Face captured successfully!"

4. **Check Console Logs**
   - Press F12 to open browser console
   - You should see logs like:
   ```
   All models loaded!
   ✅ User xyz joined meeting: testmeeting1
   Enrollment video ready
   ```

5. **Wait 30-60 Seconds**
   - Stay visible on camera
   - Every 10 seconds, check console for:
   ```
   ✓ Updated TestUser1: totalTime=10s, verifiedTime=10s
   ✓ Updated TestUser1: totalTime=20s, verifiedTime=20s
   ```

6. **End Meeting**
   - Click red "End Call" button
   - Attendance report should appear automatically
   - Should show 100% or close to 100% verified
   - Status: **Present** ✅

**Expected Result**: Your attendance should be "Present" with ~100% verification.

---

### Test 2: Multiple Users (Full Feature Test)

#### User 1 - Meeting Owner (You) - Good Attendance

1. **Open in Chrome**
   - URL: `http://localhost:3000/meeting123`
   - Username: `Owner`
   - Register face
   - **Stay on camera throughout the test**

#### User 2 - Participant with Good Attendance

2. **Open in Chrome Incognito (or different browser)**
   - URL: `http://localhost:3000/meeting123`
   - Username: `GoodStudent`
   - Register face
   - **Stay visible on camera ~80% of time**

#### User 3 - Participant with Partial Attendance

3. **Open in Edge or Firefox**
   - URL: `http://localhost:3000/meeting123`
   - Username: `PartialStudent`
   - Register face
   - **Turn away from camera frequently (aim for ~60% visible)**
   - Look at phone, turn to side, etc.

#### User 4 - Participant with Poor Attendance

4. **Open in another browser tab**
   - URL: `http://localhost:3000/meeting123`
   - Username: `AbsentStudent`
   - Register face
   - **Minimize window or turn away most of the time**
   - Stay away from camera >50% of time

#### Wait 2-3 Minutes

5. **Let the meeting run**
   - Keep each user at their designated attendance level
   - Check backend terminal for logs:
   ```
   ✓ Updated GoodStudent: totalTime=60s, verifiedTime=50s
   ✓ Updated PartialStudent: totalTime=60s, verifiedTime=35s
   ✓ Updated AbsentStudent: totalTime=60s, verifiedTime=20s
   ```

#### End Meeting (As Owner)

6. **From Owner's window, click "End Call"**
   - Report should appear for all users
   - Owner should see special badge: "👑 Meeting Owner Report"

#### Expected Results:

```
┌───────────────┬─────────────┬──────────┐
│ User          │ Verified %  │ Status   │
├───────────────┼─────────────┼──────────┤
│ Owner         │ ~100%       │ Present  │
│ GoodStudent   │ ~80%        │ Present  │
│ PartialStudent│ ~60%        │ Partial  │
│ AbsentStudent │ ~30%        │ Absent   │
└───────────────┴─────────────┴──────────┘
```

---

### Test 3: Verify Data in Database

After the test, check if data was saved:

1. **Test API Endpoints**

**Get Owner's Reports:**
```bash
curl http://localhost:8000/api/v1/attendance/owner/Owner
```

**Expected Response:**
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
          "userId": "Owner",
          "verifiedPercent": 100,
          "status": "Present",
          "totalTime": 180,
          "verifiedTime": 180
        },
        {
          "userId": "GoodStudent",
          "verifiedPercent": 80,
          "status": "Present"
        },
        {
          "userId": "PartialStudent",
          "verifiedPercent": 60,
          "status": "Partial"
        },
        {
          "userId": "AbsentStudent",
          "verifiedPercent": 30,
          "status": "Absent"
        }
      ]
    }
  ]
}
```

---

## 🔍 Troubleshooting

### Issue: Face Not Detected

**Symptoms**: verifiedTime stays at 0

**Solutions**:
1. Better lighting
2. Look directly at camera
3. Remove glasses/masks
4. Wait for models to load completely
5. Check console for errors

### Issue: 404 Error on Login

**Symptom**: `POST http://localhost:3000/api/v1/users/register 404`

**Solution**: ✅ FIXED - Server URL now correctly points to port 8000

### Issue: Video Icon Shows Off but Video Visible

**Solution**: ✅ FIXED - Video and audio now start enabled by default

### Issue: Mic Not Working

**Symptoms**: Can't hear audio from other participants

**Solutions**:
1. Check browser permissions (click lock icon in address bar)
2. Check system audio settings
3. Ensure microphone is selected in browser
4. Audio toggle button should be green (enabled)

### Issue: Report Not Appearing

**Check**:
1. Did owner click "End Call"?
2. Check browser console for errors
3. Check backend terminal for:
   ```
   📊 Generating attendance report for meeting: xyz
   ✅ Attendance report saved to database
   ```
4. Look for socket event: `attendance-report`

### Issue: Wrong Attendance Percentage

**Reasons**:
1. User didn't stay for full meeting
2. Face not properly registered
3. Poor lighting/camera angle
4. Multiple people in frame
5. User turned away too much

**To Verify**:
- Check console logs for `verifiedDelta` values:
  - Should be `10` when face detected
  - Should be `0` when face not detected

---

## 📊 Understanding the Results

### Verification Console Logs

**When face is detected** (every 10 seconds):
```javascript
✓ Updated TestUser: totalTime=10s, verifiedTime=10s (delta=10)
✓ Updated TestUser: totalTime=20s, verifiedTime=20s (delta=10)
```

**When face is NOT detected**:
```javascript
✓ Updated TestUser: totalTime=30s, verifiedTime=20s (delta=0)
```

### Percentage Calculation

```
Verified Percentage = (verifiedTime / totalTime) × 100

Example:
- totalTime = 100 seconds (in meeting for 100 seconds)
- verifiedTime = 75 seconds (face detected for 75 seconds)
- Percentage = (75 / 100) × 100 = 75%
- Status = Present (because ≥75%)
```

### Status Rules

```
Present:  verifiedPercent >= 75%  → Green ✅
Partial:  50% <= verifiedPercent < 75%  → Orange ⚠️
Absent:   verifiedPercent < 50%  → Red ❌
```

---

## 🎯 Quick Test (1 Minute)

If you just want to verify it's working:

1. Open `http://localhost:3000/quicktest`
2. Username: `QuickTest`
3. Register face
4. Wait 30 seconds (stay on camera)
5. Check console: Should see 3 updates with verifiedTime increasing
6. Click "End Call"
7. See report with ~100% Present status

---

## 🎨 Visual Indicators

### UI Elements to Check:

1. **Enrollment Modal**
   - ✅ Camera preview visible
   - ✅ "Ready" or "Loading AI..." message
   - ✅ Blue bordered video box
   - ✅ "CAPTURE MY FACE" button

2. **Meeting Controls**
   - 🎥 Video button (green = on, gray = off)
   - 🎤 Mic button (green = on, gray = off)
   - 🔴 End call button (red)
   - 💬 Chat button

3. **Attendance Report**
   - 📊 Title: "Attendance Report"
   - 👑 Owner badge (if you're owner)
   - 📝 Criteria explanation box
   - 📋 Participant table with colors
   - 🔵 Close button

---

## 🔧 Console Commands for Testing

Open browser console (F12) and run:

### Check if face-api models loaded:
```javascript
console.log('Models loaded:', faceapi.nets.tinyFaceDetector.isLoaded);
```

### Check current socket connection:
```javascript
console.log('Socket connected:', socketRef.current?.connected);
```

### Manually trigger report (for testing):
```javascript
socketRef.current?.emit('end-meeting', { meetingId: 'yourMeetingCode' });
```

---

## ✅ Success Checklist

- [ ] Backend running on port 8000
- [ ] Frontend running on port 3000
- [ ] Can login/register without 404 error
- [ ] Camera preview shows in lobby
- [ ] Face enrollment modal appears
- [ ] Face captured successfully
- [ ] Console shows verification updates every 10s
- [ ] End call generates report
- [ ] Report shows correct percentages
- [ ] Status colors match criteria (green/orange/red)
- [ ] Owner sees special badge
- [ ] API endpoint returns saved data

---

## 📞 Need Help?

### Check These Locations:

1. **Backend logs**: Terminal running backend
2. **Frontend console**: Browser F12 → Console tab
3. **Network tab**: F12 → Network → WS (for socket.io)
4. **MongoDB**: Check if documents are saving

### Common Error Messages:

| Error | Meaning | Fix |
|-------|---------|-----|
| 404 on /api/v1/users | Wrong server URL | ✅ Fixed |
| "AI model still loading" | Models downloading | Wait 20s |
| "No face detected" | Can't see your face | Better lighting |
| "Camera not ready" | Video not initialized | Wait 2-3 seconds |
| Socket disconnected | Backend not running | Start backend |

---

## 🎉 You're Ready!

Follow the steps above and your attendance tracking feature should work perfectly. The main test is **Test 2** with multiple users to see different attendance statuses.

**Remember**: 
- Stay on camera for "Present"
- Turn away sometimes for "Partial"  
- Stay away for "Absent"

Good luck! 🚀
