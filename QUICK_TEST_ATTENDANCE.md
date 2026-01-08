# ✅ Quick Test - Is Attendance Feature Working?

## Step 1: Open Meeting (Single User Test)

1. **Open your browser**: `http://localhost:3000/test123`
2. **Enter username**: `TestUser`
3. **Click "Connect"**

## Step 2: Check Face Enrollment

✅ **Face enrollment modal should appear**
- Wait for "Ready" message (green)
- If you see "Loading AI model..." (orange), wait 15-20 seconds
- Click "CAPTURE MY FACE"
- Should say: "Face captured successfully!"

## Step 3: Verify Tracking is Running

**Open Browser Console** (Press F12):

Look for these logs appearing **every 10 seconds**:

```
✓ Updated TestUser: totalTime=10s, verifiedTime=10s (delta=10)
✓ Updated TestUser: totalTime=20s, verifiedTime=20s (delta=10)
✓ Updated TestUser: totalTime=30s, verifiedTime=30s (delta=10)
```

### What This Means:
- ✅ **totalTime** increasing → You're in the meeting
- ✅ **verifiedTime** increasing → Your face is being detected
- ✅ **delta=10** → Face detected this round
- ❌ **delta=0** → Face NOT detected (turn away to test)

## Step 4: Test Face Detection

**Stay on camera for 30 seconds** - verifiedTime should match totalTime

**Turn away from camera** - next update should show delta=0:
```
✓ Updated TestUser: totalTime=40s, verifiedTime=30s (delta=0)
```

## Step 5: End Meeting and See Report

1. **Click red "End Call" button**
2. **Attendance report modal should appear** automatically

### Report Should Show:
```
User: TestUser
Verified %: ~100% (if you stayed on camera)
Status: Present ✅ (green)
```

---

## 🎉 If You See All This = Feature is Working!

---

## ❌ Troubleshooting

### Issue: No logs in console

**Check Backend Terminal:**
You should see:
```
✅ User TestUser joined meeting: test123
Face registered for user: TestUser
✓ Updated TestUser: totalTime=10s, verifiedTime=10s
```

If not:
1. Backend may not be running
2. Socket connection failed
3. Face not registered

### Issue: "AI model still loading" forever

**Solutions:**
1. Wait full 30 seconds (first time downloads models)
2. Check internet connection (models load from CDN)
3. Check console for errors
4. Refresh page

### Issue: Face not captured

**Try:**
1. Better lighting
2. Look directly at camera
3. Remove glasses
4. Wait 2-3 seconds for camera to stabilize

### Issue: No report appears

**Check:**
1. Did you click "End Call"?
2. Check backend logs for "Generating attendance report"
3. Check console for errors
4. Socket connection active?

---

## 🎯 Quick 30-Second Test

1. Join meeting → Register face → Wait 30 seconds → End call
2. Check console for 3 logs (at 10s, 20s, 30s)
3. See report with ~100% Present

**If this works = Feature is fully functional!** ✅

---

## 📊 Understanding the Numbers

```
totalTime = 60s (1 minute in meeting)
verifiedTime = 45s (face detected for 45 seconds)

Percentage = (45 / 60) × 100 = 75%
Status = Present (because ≥75%)
```

```
totalTime = 60s
verifiedTime = 35s

Percentage = (35 / 60) × 100 = 58%
Status = Partial (because 50-74%)
```

```
totalTime = 60s
verifiedTime = 20s

Percentage = (20 / 60) × 100 = 33%
Status = Absent (because <50%)
```

---

## Multiple Users Test (Optional)

1. **Open 3 browser windows** (or different browsers)
2. **All join same meeting code**: `test123`
3. **Each registers their face**
4. **User 1**: Stay on camera (→ Present)
5. **User 2**: Turn away sometimes (→ Partial)
6. **User 3**: Minimize window (→ Absent)
7. **Wait 2 minutes**
8. **User 1 ends call** (as owner)
9. **All see report** with different statuses

---

## 🔧 Console Commands to Debug

### Check socket connection:
```javascript
console.log('Connected:', socketRef.current?.connected)
```

### Check if models loaded:
```javascript
console.log('Models loaded:', modelsLoaded)
```

### Check video state:
```javascript
console.log('Video on:', video)
console.log('Audio on:', audio)
```

### Manually end meeting:
```javascript
socketRef.current?.emit('end-meeting', { meetingId: 'test123' })
```

---

## ✅ Checklist

- [ ] Backend running (port 8000)
- [ ] Frontend running (port 3000)
- [ ] Can join meeting without errors
- [ ] Face enrollment modal appears
- [ ] Face captured successfully
- [ ] Console shows updates every 10s
- [ ] totalTime increases
- [ ] verifiedTime increases (when on camera)
- [ ] End call generates report
- [ ] Report shows correct percentage
- [ ] Status color matches (green/orange/red)

**All checked = Feature working perfectly!** 🎉
