# 🎥 ZoomClone - Video Conferencing with AI Face Recognition Attendance

A full-stack video conferencing application with **real-time AI-powered face recognition** for automated attendance tracking. Built with React, Node.js, WebRTC, and TensorFlow.js.

![License](https://img.shields.io/badge/license-ISC-blue.svg)
![Node](https://img.shields.io/badge/node-18%2B-green.svg)
![React](https://img.shields.io/badge/react-18.2.0-61DAFB.svg)

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [System Architecture](#-system-architecture)
- [Installation](#-installation)
- [Project Structure](#-project-structure)
- [How It Works](#-how-it-works)
- [API Endpoints](#-api-endpoints)
- [Socket Events](#-socket-events)
- [Database Models](#-database-models)
- [Troubleshooting](#-troubleshooting)
- [Future Scope](#-future-scope)

---

## ✨ Features

### Core Video Conferencing
- 📹 **Real-time Video Calls** - WebRTC peer-to-peer connections
- 🎤 **Audio/Video Controls** - Mute/unmute, camera on/off
- 🖥️ **Screen Sharing** - Share your screen with participants
- 💬 **In-Meeting Chat** - Real-time text messaging
- 👥 **Multi-participant Support** - Group video calls

### AI-Powered Attendance System
- 🤖 **Face Recognition** - TensorFlow.js powered face detection
- 📊 **Automated Attendance** - Tracks presence every 10 seconds
- 👁️ **Real-time Monitoring** - Live attendance dashboard for meeting owners
- 📈 **Attendance Reports** - Detailed reports with presence percentage
- ✅ **Smart Status** - Present (≥75%), Partial (50-75%), Absent (<50%)

### User Management
- 🔐 **User Authentication** - Secure login/registration with bcrypt
- 📚 **Meeting History** - View past meetings and attendance records
- 👑 **Meeting Owner System** - First user becomes the meeting owner

---

## 🛠 Tech Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.2.0 | UI Framework |
| Material-UI | 5.18.0 | Component Library |
| Socket.io-client | 4.7.3 | Real-time Communication |
| @vladmandic/face-api | 1.7.15 | Face Recognition |
| TensorFlow.js | 4.22.0 | ML Runtime |
| React Router | 6.21.1 | Navigation |
| Axios | 1.6.5 | HTTP Client |

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 18+ | Runtime |
| Express.js | 4.18.2 | Web Framework |
| Socket.io | 4.7.3 | WebSocket Server |
| MongoDB | - | Database |
| Mongoose | 8.0.3 | ODM |
| Bcrypt | 5.1.1 | Password Hashing |

### WebRTC
| Component | Purpose |
|-----------|---------|
| RTCPeerConnection | Peer-to-peer media streaming |
| getUserMedia | Camera/microphone access |
| STUN Server | NAT traversal (Google STUN) |

---

## 🏗 System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT (React)                          │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │   Video     │  │    Chat     │  │   Face Recognition      │  │
│  │   Stream    │  │   Panel     │  │   (TensorFlow.js)       │  │
│  └──────┬──────┘  └──────┬──────┘  └───────────┬─────────────┘  │
│         │                │                     │                 │
│         └────────────────┼─────────────────────┘                 │
│                          │                                       │
│                  ┌───────┴───────┐                               │
│                  │  Socket.io    │                               │
│                  │   Client      │                               │
│                  └───────┬───────┘                               │
└──────────────────────────┼──────────────────────────────────────┘
                           │ WebSocket
                           ▼
┌──────────────────────────┴──────────────────────────────────────┐
│                      SERVER (Node.js)                            │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │  Express    │  │  Socket.io  │  │   Attendance            │  │
│  │   API       │  │   Server    │  │   Manager               │  │
│  └──────┬──────┘  └──────┬──────┘  └───────────┬─────────────┘  │
│         │                │                     │                 │
│         └────────────────┼─────────────────────┘                 │
│                          │                                       │
│                  ┌───────┴───────┐                               │
│                  │   Mongoose    │                               │
│                  │     ODM       │                               │
│                  └───────┬───────┘                               │
└──────────────────────────┼──────────────────────────────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │   MongoDB    │
                    │   Atlas      │
                    └──────────────┘
```

---

## 🚀 Installation

### Prerequisites
- Node.js 18+ installed
- MongoDB Atlas account (or local MongoDB)
- Git

### Step 1: Clone the Repository
```bash
git clone <repository-url>
cd Zoom
```

### Step 2: Backend Setup
```bash
cd backend
npm install
```

Create `.env` file in backend folder:
```env
PORT=8000
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/zoomclone
```

### Step 3: Frontend Setup
```bash
cd ../frontend
npm install
```

### Step 4: Start the Application

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```

### Step 5: Access the Application
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- Health Check: http://localhost:8000/api/health

---

## 📁 Project Structure

```
Zoom/
├── backend/
│   ├── src/
│   │   ├── app.js                 # Express server entry point
│   │   ├── controllers/
│   │   │   ├── socketManager.js   # Socket.io event handlers
│   │   │   └── user.controller.js # User authentication logic
│   │   ├── models/
│   │   │   ├── user.model.js      # User schema
│   │   │   ├── face.model.js      # Face descriptor schema
│   │   │   ├── meeting.model.js   # Meeting history schema
│   │   │   └── attendance.model.js# Attendance record schema
│   │   └── routes/
│   │       ├── users.routes.js    # Auth API routes
│   │       └── attendance.routes.js# Attendance API routes
│   └── package.json
│
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── App.js                 # Main app with routing
│   │   ├── environment.js         # Backend URL config
│   │   ├── contexts/
│   │   │   └── AuthContext.jsx    # Authentication state
│   │   ├── pages/
│   │   │   ├── landing.jsx        # Homepage
│   │   │   ├── authentication.jsx # Login/Register
│   │   │   ├── home.jsx           # Dashboard after login
│   │   │   ├── VideoMeet.jsx      # Video call + attendance
│   │   │   ├── history.jsx        # Meeting history
│   │   │   └── AttendanceHistory.jsx # Attendance reports
│   │   ├── styles/
│   │   │   └── videoComponent.module.css
│   │   └── utils/
│   │       └── withAuth.jsx       # Auth HOC
│   └── package.json
│
└── README.md
```

---

## 🔄 How It Works

### 1. User Flow
```
Landing Page → Login/Register → Home Dashboard → Join/Create Meeting
```

### 2. Video Call Flow
```
1. User joins meeting URL (e.g., /abc123)
2. Camera/Mic permissions requested
3. Socket.io connection established
4. WebRTC peer connections created with other users
5. Video/audio streams exchanged
```

### 3. Face Recognition Attendance Flow
```
1. User joins meeting
2. Face enrollment modal appears
3. User's face is captured and 128D descriptor extracted
4. Descriptor saved to MongoDB
5. Every 10 seconds:
   - Face detection runs on local video
   - Detected face compared with enrolled face
   - If match (>60% confidence): verifiedTime += 10s
   - Data sent to server via Socket.io
6. On meeting end:
   - Attendance report generated
   - Report sent to meeting owner
   - Saved to database
```

### 4. Attendance Calculation
```javascript
verifiedPercent = (verifiedTime / totalTime) * 100

Status:
- Present: verifiedPercent >= 75%
- Partial: verifiedPercent >= 50% && < 75%
- Absent: verifiedPercent < 50%
```

---

## 🔌 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/users/register` | Create new user |
| POST | `/api/v1/users/login` | User login |
| POST | `/api/v1/users/logout` | User logout |
| POST | `/api/v1/users/add_to_activity` | Log meeting activity |
| GET | `/api/v1/users/get_all_activity` | Get user's meeting history |

### Attendance
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/attendance/reports` | Get all attendance reports |
| GET | `/api/v1/attendance/owner-reports/:owner` | Get reports for meeting owner |

### Health
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Server health check |

---

## 📡 Socket Events

### Client → Server
| Event | Data | Description |
|-------|------|-------------|
| `join-call` | `(path, userId, userName, isOwner)` | Join a meeting room |
| `signal` | `(toId, message)` | WebRTC signaling |
| `chat-message` | `(data, sender)` | Send chat message |
| `register-face` | `{meetingId, userId, descriptor}` | Register face descriptor |
| `verified-update` | `{meetingId, userId, userName, verifiedDelta}` | Update attendance |
| `end-meeting` | `{meetingId}` | End meeting & generate report |

### Server → Client
| Event | Data | Description |
|-------|------|-------------|
| `user-joined` | `(socketId, allSocketIds)` | New user joined |
| `user-left` | `(socketId)` | User left meeting |
| `signal` | `(fromId, message)` | WebRTC signal relay |
| `chat-message` | `(data, sender, socketId)` | New chat message |
| `you-are-owner` | - | Notify meeting owner |
| `live-attendance` | `{participants}` | Live attendance data |
| `attendance-report` | `{report}` | Final attendance report |
| `owner-attendance-report` | `{report}` | Owner's detailed report |

---

## 💾 Database Models

### User
```javascript
{
  name: String,        // Display name
  username: String,    // Unique login ID
  password: String,    // Bcrypt hashed
  token: String        // Session token
}
```

### Face
```javascript
{
  userId: String,      // Username
  meetingId: String,   // Meeting code
  descriptor: [Number] // 128D face descriptor
}
```

### Attendance
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
    status: String       // 'Present'|'Partial'|'Absent'
  }],
  startTime: Date,
  endTime: Date
}
```

---

## 🔧 Troubleshooting

### Common Issues

#### 1. Port Already in Use
```bash
# Windows
netstat -ano | findstr :8000
taskkill /F /PID <PID>

# Or use npm script
cd backend && npm run kill-port
```

#### 2. Camera/Microphone Not Working
- Check browser permissions
- Ensure HTTPS in production (WebRTC requires secure context)
- Try refreshing the page

#### 3. Face Recognition Not Loading
- Check console for model loading errors
- Verify CDN access: https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/
- Wait for "All models loaded!" message

#### 4. WebRTC Connection Failed
- Check STUN server connectivity
- Ensure both users have camera enabled
- Check firewall settings

#### 5. MongoDB Connection Failed
- Verify MONGO_URI in .env file
- Check network connectivity
- Ensure IP is whitelisted in MongoDB Atlas

#### 6. Socket Connection Refused
- Ensure backend is running on port 8000
- Check frontend environment.js has correct URL
- Verify CORS configuration

---

## 🚀 Future Scope

### Phase 1: Enhanced Security
- [ ] ID card verification before face enrollment
- [ ] Two-factor authentication
- [ ] End-to-end encryption for video

### Phase 2: Advanced Features
- [ ] Virtual backgrounds
- [ ] Meeting recording
- [ ] Breakout rooms
- [ ] Whiteboard collaboration

### Phase 3: AI Improvements
- [ ] Anti-spoofing (liveness detection)
- [ ] Multiple face detection warning
- [ ] Emotion/attention tracking
- [ ] Auto-attendance from recorded meetings

### Phase 4: Scalability
- [ ] SFU media server integration
- [ ] Load balancing
- [ ] CDN for static assets
- [ ] Kubernetes deployment

### Phase 5: Integration
- [ ] Google Calendar sync
- [ ] Email notifications
- [ ] LMS integration (Canvas, Moodle)
- [ ] Export attendance to Excel/PDF

---

## 👨‍💻 Scripts Reference

### Backend
```bash
npm run dev      # Start with nodemon (hot reload)
npm start        # Production start
npm run kill-port # Kill process on port 8000
npm run restart  # Kill port + start dev
```

### Frontend
```bash
npm start        # Development server
npm run build    # Production build
npm test         # Run tests
```

---

## 📝 License

This project is licensed under the ISC License.

---

## 🙏 Acknowledgments

- [face-api.js](https://github.com/vladmandic/face-api) - Face recognition library
- [Socket.io](https://socket.io/) - Real-time communication
- [Material-UI](https://mui.com/) - React component library
- [WebRTC](https://webrtc.org/) - Real-time media streaming

---

<p align="center">
  Made with ❤️ for modern video conferencing
</p>
