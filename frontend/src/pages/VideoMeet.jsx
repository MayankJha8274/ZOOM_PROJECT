/**
 * VIDEO MEET COMPONENT - VideoMeet.jsx (FINAL FIXED)
 */

import * as faceapi from '@vladmandic/face-api';
import {
  Modal,
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  Card,
  CardContent,
  Chip,
} from '@mui/material';
import { AuthContext } from '../contexts/AuthContext';

import React, { useEffect, useRef, useState, useContext } from 'react';
import io from 'socket.io-client';
import { Badge, IconButton, TextField } from '@mui/material';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import styles from '../styles/videoComponent.module.css';
import CallEndIcon from '@mui/icons-material/CallEnd';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import ScreenShareIcon from '@mui/icons-material/ScreenShare';
import StopScreenShareIcon from '@mui/icons-material/StopScreenShare';
import ChatIcon from '@mui/icons-material/Chat';
import server from '../environment';

const server_url = server;

let connections = {};
const peerConfigConnections = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
};

// tiny face detector options (recommended for webcam) [web:24]
const tinyOptions = new faceapi.TinyFaceDetectorOptions({
  inputSize: 320,
  scoreThreshold: 0.5,
});

// const waitForVideoReady = (videoEl, timeoutMs = 10000) =>
//   new Promise((resolve, reject) => {
//     const start = Date.now();
//     const check = () => {
//       if (
//         videoEl &&
//         videoEl.readyState >= 2 &&
//         videoEl.videoWidth > 0 &&
//         videoEl.videoHeight > 0
//       ) {
//         resolve(true);
//       } else if (Date.now() - start > timeoutMs) {
//         reject(new Error('Video not ready in time'));
//       } else {
//         requestAnimationFrame(check);
//       }
//     };
//     check();
//   });

export default function VideoMeetComponent() {
  // Refs
  const socketRef = useRef();
  const socketIdRef = useRef();
  const localVideoref = useRef();  // main in‑call video
  const lobbyVideoRef = useRef();  // lobby preview
  const modalVideoRef = useRef();  // enrollment video

  // Core states
  const [videoAvailable, setVideoAvailable] = useState(true);
  const [audioAvailable, setAudioAvailable] = useState(true);
  const [video, setVideo] = useState(true);
  const [audio, setAudio] = useState(true);
  const [screen, setScreen] = useState(false);
  const [showModal, setModal] = useState(false);
  const [screenAvailable, setScreenAvailable] = useState(false);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [newMessages, setNewMessages] = useState(0);
  const [askForUsername, setAskForUsername] = useState(true);
  const [username, setUsername] = useState('');
  const [videos, setVideos] = useState([]);

  // Attendance states
  const { userId = 'guest' } = useContext(AuthContext) || {};
  const [showEnrollmentModal, setShowEnrollmentModal] = useState(false);
  const [faceDescriptor, setFaceDescriptor] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [attendanceReport, setAttendanceReport] = useState(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [isMeetingOwner, setIsMeetingOwner] = useState(false);
  const [ownerReportReceived, setOwnerReportReceived] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [liveAttendance, setLiveAttendance] = useState([]);
  
  // Generate unique user ID for this session
  const [uniqueUserId] = useState(() => {
    const stored = sessionStorage.getItem('uniqueUserId');
    if (stored) return stored;
    const id = `${username || 'user'}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('uniqueUserId', id);
    return id;
  });

  // separate stream for modal so it never depends on others
  const modalStreamRef = useRef(null);

  const meetingCode = window.location.href;

  // Load face-api models from CDN [web:52]
  useEffect(() => {
    const loadModels = async () => {
      console.log('Loading face-api models from CDN...');
      const modelUrl =
        'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/';
      try {
        await faceapi.nets.tinyFaceDetector.loadFromUri(modelUrl);
        await faceapi.nets.faceLandmark68Net.loadFromUri(modelUrl);
        await faceapi.nets.faceRecognitionNet.loadFromUri(modelUrl);
        console.log('All models loaded!');
        setModelsLoaded(true);
      } catch (err) {
        console.error('Failed to load models:', err);
      }
    };
    loadModels();
  }, []);
  
  // debug: stop other streams when enrollment modal opens
  useEffect(() => {
  if (showEnrollmentModal) {
    console.log('Stopping other camera streams before enrollment');

    if (window.localStream) {
      window.localStream.getTracks().forEach(t => t.stop());
      window.localStream = null;
    }
    getPermissions();
  }
}, [showEnrollmentModal]);


  // Always request a fresh camera stream for the enrollment modal
  useEffect(() => {
  if (!showEnrollmentModal) return;

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: false,
      });

      modalStreamRef.current = stream;

      // VERY IMPORTANT: wait one frame so video exists
      requestAnimationFrame(() => {
        if (modalVideoRef.current) {
          modalVideoRef.current.srcObject = stream;

          modalVideoRef.current.onloadedmetadata = () => {
            modalVideoRef.current.play();
            console.log('Enrollment video ready');
          };
        }
      });
    } catch (err) {
      console.error('Enrollment camera error:', err);
      alert('Camera access failed');
    }
  };

  startCamera();

  return () => {
    if (modalStreamRef.current) {
      modalStreamRef.current.getTracks().forEach(t => t.stop());
      modalStreamRef.current = null;
    }
  };
}, [showEnrollmentModal]);


 // Face Enrollment (FIXED – FINAL)
const enrollFace = async () => {
  if (!modelsLoaded) {
    alert('AI model still loading...');
    return;
  }

  const videoEl = modalVideoRef.current;

  if (
    !videoEl ||
    !videoEl.srcObject ||
    videoEl.videoWidth === 0 ||
    videoEl.videoHeight === 0
  ) {
    alert('Camera not ready yet. Please wait 2 seconds.');
    return;
  }

  console.log('=== ENROLL DEBUG ===');
  console.log('readyState:', videoEl.readyState);
  console.log('videoWidth:', videoEl.videoWidth);
  console.log('videoHeight:', videoEl.videoHeight);
  console.log('====================');

  try {
    const detection = await faceapi
      .detectSingleFace(videoEl, tinyOptions)
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!detection) {
      alert('No face detected. Please look directly at the camera.');
      return;
    }

    const descriptor = Array.from(detection.descriptor);

    if (socketRef.current) {
      socketRef.current.emit('register-face', {
        meetingId: window.location.pathname.slice(1),
        userId: uniqueUserId,
        descriptor,
      });
    }

    setFaceDescriptor(descriptor);
    setShowEnrollmentModal(false);
    alert(`✅ Face registered for ${username}! Attendance tracking started.`);
  } catch (error) {
    console.error('Enrollment error:', error);
    alert('Error capturing face. Please try again.');
  }
};


  // Real-time verification using main local video
  useEffect(() => {
    if (!modelsLoaded || !faceDescriptor || !socketRef.current) {
      console.log('⏸️ Attendance tracking not started yet:', {
        modelsLoaded,
        hasFaceDescriptor: !!faceDescriptor,
        hasSocket: !!socketRef.current
      });
      return;
    }

    console.log('🎯 Starting attendance tracking for:', userId || username || 'guest');

    const interval = setInterval(async () => {
      //added check for video readiness
      const videoEl = localVideoref.current;
      if (
        !videoEl ||
        !videoEl.srcObject ||
        videoEl.videoWidth === 0 ||
        videoEl.videoHeight === 0
      ) {
        console.log('⚠️ Video not ready for face detection');
        return;
      }

      try {
        const detection = await faceapi
          .detectSingleFace(localVideoref.current, tinyOptions)
          .withFaceLandmarks()
          .withFaceDescriptor();

        let verifiedDelta = 0;
        if (detection) {
          const distance = faceapi.euclideanDistance(
            detection.descriptor,
            faceDescriptor,
          );
          if (1 - distance > 0.6) {
            verifiedDelta = 10;
            console.log('✅ Face detected! Confidence:', (1 - distance).toFixed(2));
          } else {
            console.log('⚠️ Face detected but confidence too low:', (1 - distance).toFixed(2));
          }
        } else {
          console.log('❌ No face detected in frame');
        }

        console.log('📤 Sending verified-update:', {
          meetingId: meetingCode,
          userId: uniqueUserId,
          userName: username,
          verifiedDelta
        });

        socketRef.current.emit('verified-update', {
          meetingId: meetingCode,
          userId: uniqueUserId,
          userName: username,
          verifiedDelta,
        });
      } catch (e) {
        console.log('❌ Verification error:', e);
      }
    }, 10000);

    return () => {
      console.log('🛑 Stopping attendance tracking');
      clearInterval(interval);
    };
  }, [modelsLoaded, faceDescriptor, meetingCode, userId, username, socketRef.current]);

  // Show enrollment after username
  useEffect(() => {
    if (!askForUsername && modelsLoaded && !faceDescriptor) {
      setShowEnrollmentModal(true);
      
      // Request notification permission for owner
      if (isMeetingOwner && 'Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
          console.log('Notification permission:', permission);
        });
      }
    }
  }, [askForUsername, modelsLoaded, faceDescriptor, isMeetingOwner]);

  // === CORE WEBRTC & MEDIA FUNCTIONS ===
  const getPermissions = async () => {
    try {
      console.log('🎥 Requesting camera and microphone permissions...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      window.localStream = stream;
      
      // Enable audio and video tracks by default
      const audioTracks = stream.getAudioTracks();
      const videoTracks = stream.getVideoTracks();
      console.log('✅ Got', audioTracks.length, 'audio track(s) and', videoTracks.length, 'video track(s)');
      
      audioTracks.forEach((track, idx) => {
        track.enabled = true;
        console.log(`🎤 Audio Track ${idx}:`, track.label, '- Enabled:', track.enabled);
      });
      videoTracks.forEach((track, idx) => {
        track.enabled = true;
        console.log(`🎥 Video Track ${idx}:`, track.label, '- Enabled:', track.enabled);
      });
      
      if (localVideoref.current) localVideoref.current.srcObject = stream;
      if (lobbyVideoRef.current) lobbyVideoRef.current.srcObject = stream;
      setVideoAvailable(true);
      setAudioAvailable(true);
      setAudio(true);  // Enable audio by default
      setVideo(true);  // Enable video by default
      console.log('✅ Media permissions granted and tracks enabled');
      console.log('🎤 Audio tracks:', stream.getAudioTracks().map(t => ({ label: t.label, enabled: t.enabled })));
      console.log('🎥 Video tracks:', stream.getVideoTracks().map(t => ({ label: t.label, enabled: t.enabled })));
      console.log('🔊 window.localStream set with', stream.getAudioTracks().length, 'audio tracks');
      if (navigator.mediaDevices.getDisplayMedia) setScreenAvailable(true);
    } catch (err) {
      try {
        const videoStream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        window.localStream = videoStream;
        videoStream.getVideoTracks().forEach(track => track.enabled = true);
        if (localVideoref.current) localVideoref.current.srcObject = videoStream;
        if (lobbyVideoRef.current) lobbyVideoRef.current.srcObject = videoStream;
        setVideoAvailable(true);
        setAudioAvailable(false);
      } catch (e) {
        setVideoAvailable(false);
        setAudioAvailable(false);
      }
    }
  };

  useEffect(() => {
    getPermissions();
  }, []);

  // debug: get media when joining from lobby
  const getMedia = () => {
    console.log('📡 Connecting to socket server...');
    console.log('🎤 window.localStream exists:', !!window.localStream);
    if (window.localStream) {
      console.log('🎤 Audio tracks in localStream:', window.localStream.getAudioTracks().length);
      window.localStream.getAudioTracks().forEach(track => {
        console.log('🎤 Track:', track.label, '- Enabled:', track.enabled, '- ReadyState:', track.readyState);
      });
    }
    connectToSocketServer();
  };

  const getUserMedia = () => {
    if ((video && videoAvailable) || (audio && audioAvailable)) {
      navigator.mediaDevices
        .getUserMedia({
          video: video && videoAvailable,
          audio: audio && audioAvailable,
        })
        .then(getUserMediaSuccess)
        .catch(e => console.log(e));
    } else {
      try {
        if (localVideoref.current && localVideoref.current.srcObject) {
          localVideoref.current.srcObject
            .getTracks()
            .forEach(t => t.stop());
        }
      } catch (e) {
        console.log('Error stopping tracks:', e);
      }
    }
  };

  const getUserMediaSuccess = stream => {
    try {
      window.localStream.getTracks().forEach(t => t.stop());
    } catch (e) {}
    window.localStream = stream;
    
    // Enable audio and video tracks - always enable audio for transmission
    stream.getAudioTracks().forEach(track => {
      track.enabled = true; // ALWAYS enable for WebRTC transmission
      console.log('🎤 Audio track set to:', track.enabled, '- Label:', track.label);
    });
    stream.getVideoTracks().forEach(track => {
      track.enabled = true; // Enable video too initially
      console.log('🎥 Video track set to:', track.enabled, '- Label:', track.label);
    });
    
    // Update state to reflect audio is working
    setAudio(true);
    setVideo(true);
    
    if (localVideoref.current) localVideoref.current.srcObject = stream;
    if (lobbyVideoRef.current) lobbyVideoRef.current.srcObject = stream;

    for (let id in connections) {
      if (id === socketIdRef.current) continue;
      connections[id].addStream(stream);
      connections[id].createOffer().then(d => {
        connections[id].setLocalDescription(d).then(() => {
          socketRef.current.emit(
            'signal',
            id,
            JSON.stringify({ sdp: connections[id].localDescription }),
          );
        });
      });
    }
  };

  const getDislayMedia = () => {
    if (screen && navigator.mediaDevices.getDisplayMedia) {
      navigator.mediaDevices
        .getDisplayMedia({ video: true, audio: true })
        .then(getDislayMediaSuccess)
        .catch(e => console.log(e));
    }
  };

  const getDislayMediaSuccess = stream => {
    try {
      window.localStream.getTracks().forEach(t => t.stop());
    } catch (e) {}
    window.localStream = stream;
    if (localVideoref.current) localVideoref.current.srcObject = stream;

    for (let id in connections) {
      if (id === socketIdRef.current) continue;
      connections[id].addStream(stream);
      connections[id].createOffer().then(d => {
        connections[id].setLocalDescription(d).then(() => {
          socketRef.current.emit(
            'signal',
            id,
            JSON.stringify({ sdp: connections[id].localDescription }),
          );
        });
      });
    }
  };

  useEffect(() => {
    if (screen !== undefined) getDislayMedia();
  }, [screen, getDislayMedia]);

  const gotMessageFromServer = (fromId, message) => {
    const signal = JSON.parse(message);
    if (fromId !== socketIdRef.current) {
      if (signal.sdp) {
        connections[fromId]
          .setRemoteDescription(new RTCSessionDescription(signal.sdp))
          .then(() => {
            if (signal.sdp.type === 'offer') {
              connections[fromId].createAnswer().then(desc => {
                connections[fromId].setLocalDescription(desc).then(() => {
                  socketRef.current.emit(
                    'signal',
                    fromId,
                    JSON.stringify({
                      sdp: connections[fromId].localDescription,
                    }),
                  );
                });
              });
            }
          });
      }
      if (signal.ice) {
        connections[fromId].addIceCandidate(new RTCIceCandidate(signal.ice));
      }
    }
  };

  const connectToSocketServer = () => {
    socketRef.current = io.connect(server_url, { secure: false });
    socketRef.current.on('signal', gotMessageFromServer);
    socketRef.current.on('connect', () => {
      socketRef.current.emit('join-call', window.location.href, uniqueUserId, username || 'Anonymous', false);
      socketIdRef.current = socketRef.current.id;

      // Listen for owner assignment from server
      socketRef.current.on('you-are-owner', () => {
        console.log('👑 Server confirmed: You are the meeting owner');
        setIsMeetingOwner(true);
      });

      // Listen for live attendance updates (for dashboard)
      socketRef.current.on('live-attendance', (attendanceData) => {
        console.log('📊 Live attendance update received:', attendanceData);
        setLiveAttendance(attendanceData.participants || []);
      });

      // Listen for attendance reports
      socketRef.current.on('attendance-report', (report) => {
        console.log('📊 Attendance report received:', report);
        setAttendanceReport(report);
        setShowReportModal(true);
      });

      socketRef.current.on('owner-attendance-report', (report) => {
        console.log('👑 OWNER ATTENDANCE REPORT RECEIVED:', report);
        console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: gold; font-weight: bold');
        console.log('%c👑 YOU ARE THE MEETING OWNER', 'color: gold; font-size: 20px; font-weight: bold');
        console.log('%c📊 Attendance Report Summary:', 'color: gold; font-weight: bold');
        report.participants.forEach(p => {
          const emoji = p.status === 'Present' ? '✅' : p.status === 'Partial' ? '⚠️' : '❌';
          console.log(`${emoji} ${p.name}: ${p.verifiedPercent}% - ${p.status}`);
        });
        console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: gold; font-weight: bold');
        
        setAttendanceReport(report);
        setShowReportModal(true);
        setOwnerReportReceived(true);
      });

      socketRef.current.on('chat-message', addMessage);
      socketRef.current.on('user-left', id =>
        setVideos(v => v.filter(vid => vid.socketId !== id)),
      );
      socketRef.current.on('user-joined', (id, clients) => {
        clients.forEach(socketListId => {
          connections[socketListId] = new RTCPeerConnection(
            peerConfigConnections,
          );
          connections[socketListId].onicecandidate = e => {
            if (e.candidate)
              socketRef.current.emit(
                'signal',
                socketListId,
                JSON.stringify({ ice: e.candidate }),
              );
          };
          connections[socketListId].ontrack = e => {
            console.log(`📹 Received track from peer ${socketListId}:`, e.track.kind);
            console.log(`  ⬇️ Track details: ${e.track.label} - Enabled: ${e.track.enabled} - Muted: ${e.track.muted} - ReadyState: ${e.track.readyState}`);
            
            let remoteStream = null;
            if (e.streams && e.streams[0]) {
              remoteStream = e.streams[0];
            } else {
              // Create new stream if not provided
              const existing = videos.find(v => v.socketId === socketListId);
              if (existing && existing.stream) {
                remoteStream = existing.stream;
                remoteStream.addTrack(e.track);
              } else {
                remoteStream = new MediaStream();
                remoteStream.addTrack(e.track);
              }
            }
            
            console.log(`🎤 Remote stream now has ${remoteStream.getAudioTracks().length} audio, ${remoteStream.getVideoTracks().length} video tracks`);
            
            const exists = videos.find(v => v.socketId === socketListId);
            if (exists) {
              setVideos(v =>
                v.map(vid =>
                  vid.socketId === socketListId
                    ? { ...vid, stream: remoteStream }
                    : vid,
                ),
              );
            } else {
              setVideos(v => [...v, { socketId: socketListId, stream: remoteStream }]);
            }
          };
          if (window.localStream) {
            console.log(`✅ Adding localStream to new peer connection ${socketListId}`);
            console.log(`🎤 LocalStream has ${window.localStream.getAudioTracks().length} audio, ${window.localStream.getVideoTracks().length} video tracks`);
            
            window.localStream.getTracks().forEach(track => {
              console.log(`  ➡️ Adding ${track.kind} track: ${track.label} - Enabled: ${track.enabled} - ReadyState: ${track.readyState}`);
              connections[socketListId].addTrack(track, window.localStream);
            });
            
            console.log(`🔊 All tracks successfully added to peer ${socketListId}`);
          } else {
            console.error('❌ ERROR: window.localStream is null! Cannot add stream to peer connection.');
          }
        });
      });
    });
  };

  const addMessage = (data, sender) => {
    setMessages(prev => [...prev, { sender, data }]);
    if (sender !== username) setNewMessages(prev => prev + 1);
  };

  const sendMessage = () => {
    if (message.trim()) {
      socketRef.current.emit('chat-message', message, username);
      setMessage('');
    }
  };

//debug
const handleVideo = () => {
  setVideo(prev => {
    const newState = !prev;

    if (window.localStream) {
      window.localStream.getVideoTracks().forEach(track => {
        track.enabled = newState;
      });
    }

    return newState;
  });
};


  // debug audio
  const handleAudio = () => {
    setAudio(prev => {
      const newState = !prev;
      console.log('🎤 Toggling audio:', prev ? 'OFF' : 'ON', '→', newState ? 'ON' : 'OFF');

      if (window.localStream) {
        const audioTracks = window.localStream.getAudioTracks();
        console.log('🎤 Found', audioTracks.length, 'audio track(s)');
        
        if (audioTracks.length === 0) {
          console.error('⚠️ No audio tracks found! Mic might not be permitted.');
          alert('No microphone detected. Please check browser permissions.');
          return prev;
        }
        
        audioTracks.forEach((track, idx) => {
          track.enabled = newState;
          console.log(`🎤 Track ${idx}:`, track.label, '- Enabled:', track.enabled, '- ReadyState:', track.readyState, '- Muted:', track.muted);
        });
        
        console.log(`✅ Audio ${newState ? 'ENABLED' : 'DISABLED'} - other participants ${newState ? 'CAN' : 'CANNOT'} hear you`);
      } else {
        console.error('⚠️ No localStream found!');
        return prev;
      }

      return newState;
    });
  };


  const handleScreen = () => setScreen(s => !s);

  const handleEndCall = () => {
    console.log('📞 Ending meeting...');
    socketRef.current?.emit('end-meeting', { meetingId: meetingCode });
    // Don't stop tracks or redirect yet - let user see the report first
    // They will be stopped when modal is closed
  };

  const connect = () => {
    setAskForUsername(false);
    getMedia();
  };

  return (
    <div>
      {askForUsername ? (
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <h2>Enter into Lobby</h2>
          <TextField
            label="Username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            variant="outlined"
            sx={{ width: '300px', mb: 2 }}
          />
          <br />
          <Button variant="contained" onClick={connect}>
            Connect
          </Button>
          <div style={{ marginTop: '20px' }}>
            <video
              ref={lobbyVideoRef}
              autoPlay
              muted
              playsInline
              style={{
                width: '640px',
                height: '480px',
                background: 'black',
                borderRadius: '10px',
              }}
            />
          </div>
        </div>
      ) : (
        <div className={styles.meetVideoContainer}>
          {isMeetingOwner && (
            <div style={{
              position: 'absolute',
              top: '10px',
              left: '10px',
              background: 'linear-gradient(135deg, #FFD700, #FFA500)',
              color: 'white',
              padding: '10px 20px',
              borderRadius: '25px',
              fontWeight: 'bold',
              fontSize: '14px',
              boxShadow: '0 4px 15px rgba(255, 215, 0, 0.4)',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span style={{ fontSize: '20px' }}>👑</span>
              <span>Meeting Owner - You'll receive attendance report</span>
            </div>
          )}
          {showModal && (
            <div className={styles.chatRoom}>
              <div className={styles.chatContainer}>
                <h1>Chat</h1>
                <div className={styles.chattingDisplay}>
                  {messages.length > 0 ? (
                    messages.map((m, i) => (
                      <div key={i} style={{ marginBottom: '15px' }}>
                        <strong>{m.sender}:</strong> {m.data}
                      </div>
                    ))
                  ) : (
                    <p>No messages yet</p>
                  )}
                </div>
                <div className={styles.chattingArea}>
                  <TextField
                    fullWidth
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && sendMessage()}
                    label="Type a message"
                    variant="outlined"
                  />
                  <Button
                    variant="contained"
                    onClick={sendMessage}
                    sx={{ ml: 1 }}
                  >
                    Send
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div className={styles.buttonContainers}>
            <IconButton onClick={handleVideo} style={{ color: 'white' }} title="Toggle Video">
              {video ? <VideocamIcon /> : <VideocamOffIcon />}
            </IconButton>
            <IconButton 
              onClick={handleEndCall} 
              style={{ 
                color: 'white',
                background: '#dc3545',
                padding: '12px'
              }}
              title={isMeetingOwner ? "End Meeting & Generate Attendance Report" : "Leave Meeting"}
            >
              <CallEndIcon />
            </IconButton>
            <IconButton 
              onClick={handleAudio} 
              style={{ 
                color: audio ? 'white' : '#ff4444',
                background: audio ? 'transparent' : 'rgba(255, 68, 68, 0.2)',
                border: audio ? 'none' : '2px solid #ff4444'
              }}
              title={audio ? "Mute Microphone" : "Unmute Microphone"}
            >
              {audio ? <MicIcon /> : <MicOffIcon />}
            </IconButton>
            {screenAvailable && (
              <IconButton
                onClick={handleScreen}
                style={{ color: 'white' }}
              >
                {screen ? <ScreenShareIcon /> : <StopScreenShareIcon />}
              </IconButton>
            )}
            {isMeetingOwner && (
              <IconButton
                onClick={() => setShowDashboard(!showDashboard)}
                style={{ 
                  color: showDashboard ? '#FFD700' : 'white',
                  background: showDashboard ? 'rgba(255, 215, 0, 0.3)' : liveAttendance.length > 0 ? 'rgba(76, 175, 80, 0.2)' : 'transparent',
                  border: liveAttendance.length > 0 ? '2px solid rgba(76, 175, 80, 0.5)' : 'none',
                  animation: liveAttendance.length > 0 && !showDashboard ? 'pulse 2s infinite' : 'none'
                }}
                title={`Attendance Dashboard (${liveAttendance.length} participants tracked)`}
              >
                <Badge badgeContent={liveAttendance.length} color="success">
                  <span style={{ fontSize: '24px' }}>📊</span>
                </Badge>
              </IconButton>
            )}
            <Badge badgeContent={newMessages} color="error">
              <IconButton
                onClick={() => setModal(!showModal)}
                style={{ color: 'white' }}
              >
                <ChatIcon />
              </IconButton>
            </Badge>
          </div>

          <video
            className={styles.meetUserVideo}
            ref={localVideoref}
            autoPlay
            muted
            playsInline
          ></video>

          <div className={styles.conferenceView}>
            {videos.map((v, index) => {
              console.log(`� Rendering remote video ${index} for socket: ${v.socketId}`, v.stream ? 'has stream' : 'NO STREAM!');
              if (v.stream) {
                console.log(`  🎤 Stream ${v.socketId} audio tracks:`, v.stream.getAudioTracks().length);
                v.stream.getAudioTracks().forEach(track => {
                  console.log(`    ♪ Audio: ${track.label} - Enabled: ${track.enabled} - Muted: ${track.muted} - ReadyState: ${track.readyState}`);
                });
              }
              return (
                <div key={`${v.socketId}-${index}`}>
                  <video
                    ref={ref => {
                      if (ref && v.stream) {
                        ref.srcObject = v.stream;
                        // Ensure audio is enabled on remote videos
                        ref.muted = false;
                        ref.volume = 1.0;
                        ref.setAttribute('playsinline', '');
                        ref.setAttribute('autoplay', '');
                        console.log(`🔊 Video element ${v.socketId} configured:`, {
                          muted: ref.muted,
                          volume: ref.volume,
                          readyState: ref.readyState,
                          paused: ref.paused
                        });
                      }
                    }}
                    autoPlay
                    playsInline
                  />
                </div>
              );
            })}
          </div>

          {/* Attendance Dashboard */}
          {isMeetingOwner && showDashboard && (
            <div style={{
              position: 'absolute',
              top: '70px',
              right: '20px',
              width: '350px',
              maxHeight: '70vh',
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              borderRadius: '15px',
              padding: '20px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
              zIndex: 1000,
              overflowY: 'auto'
            }}>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <span>📊</span>
                <span style={{ fontWeight: 'bold' }}>Live Attendance Dashboard</span>
              </Typography>
              
              <Box sx={{ mb: 2, p: 2, bgcolor: 'gold', borderRadius: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <span>👑</span>
                  <span>You are the Meeting Owner</span>
                </Typography>
              </Box>

              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Real-time attendance tracking (updates every 10s)
              </Typography>

              {liveAttendance.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 3 }}>
                  <Typography color="text.secondary">
                    Waiting for participants to register faces...
                  </Typography>
                </Box>
              ) : (
                <Box>
                  {liveAttendance.map((participant, index) => {
                    const percent = participant.totalTime > 0 
                      ? Math.round((participant.verifiedTime / participant.totalTime) * 100) 
                      : 0;
                    const status = percent >= 75 ? 'Present' : percent >= 50 ? 'Partial' : 'Absent';
                    const statusColor = status === 'Present' ? '#4CAF50' : status === 'Partial' ? '#FF9800' : '#F44336';
                    const statusEmoji = status === 'Present' ? '✅' : status === 'Partial' ? '⚠️' : '❌';

                    return (
                      <Card key={index} sx={{ mb: 2, borderLeft: `4px solid ${statusColor}`, elevation: 3 }}>
                        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                              {participant.userName || participant.userId || 'Unknown'}
                            </Typography>
                            <Chip 
                              label={`${statusEmoji} ${status}`}
                              size="small"
                              sx={{ 
                                bgcolor: statusColor, 
                                color: 'white',
                                fontWeight: 'bold'
                              }}
                            />
                          </Box>
                          
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                              Total Time:
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                              {Math.floor(participant.totalTime / 60)}m {participant.totalTime % 60}s
                            </Typography>
                          </Box>

                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                              Face Detected:
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                              {Math.floor(participant.verifiedTime / 60)}m {participant.verifiedTime % 60}s
                            </Typography>
                          </Box>

                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                              Attendance:
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="h6" sx={{ fontWeight: 'bold', color: statusColor }}>
                                {percent}%
                              </Typography>
                            </Box>
                          </Box>

                          <Box sx={{ mt: 1 }}>
                            <Box sx={{ 
                              height: 8, 
                              bgcolor: '#e0e0e0', 
                              borderRadius: 1, 
                              overflow: 'hidden' 
                            }}>
                              <Box sx={{ 
                                height: '100%', 
                                width: `${percent}%`, 
                                bgcolor: statusColor,
                                transition: 'width 0.3s ease'
                              }} />
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    );
                  })}
                </Box>
              )}

              <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
                <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>
                  <strong>Legend:</strong>
                </Typography>
                <Typography variant="caption" sx={{ display: 'block' }}>
                  ✅ Present (≥75%) | ⚠️ Partial (50-74%) | ❌ Absent (&lt;50%)
                </Typography>
              </Box>
            </div>
          )}
        </div>
      )}

      {/* ENROLLMENT MODAL */}
      <Modal open={showEnrollmentModal}>
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            bgcolor: 'white',
            p: 5,
            borderRadius: 4,
            boxShadow: 24,
            textAlign: 'center',
            width: { xs: '95%', sm: 550 },
            maxWidth: '650px',
          }}
        >
          <Typography
            variant="h5"
            gutterBottom
            fontWeight="bold"
            color="primary"
          >
            Verify Your Identity for Attendance
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ mb: 4 }}
          >
            Look directly at the camera and stay still
          </Typography>

          <video
            ref={modalVideoRef}
            autoPlay
            muted
            playsInline
            style={{
              width: '100%',
              maxWidth: '500px',
              height: '380px',
              borderRadius: '20px',
              background: '#000',
              border: '8px solid #1976d2',
              objectFit: 'cover',
              margin: '20px 0',
            }}
          />

          <Typography
            variant="body1"
            sx={{
              mb: 4,
              fontWeight: 'bold',
              color: modelsLoaded ? 'green' : 'orange',
            }}
          >
            {modelsLoaded
              ? 'Ready — your face should be visible above'
              : 'Loading AI model... (first time may take 20 seconds)'}
          </Typography>

          <Button
            onClick={enrollFace}
            variant="contained"
            size="large"
            disabled={!modelsLoaded}
            sx={{ minWidth: '300px', py: 2, fontSize: '1.4rem' }}
          >
            {modelsLoaded ? 'CAPTURE MY FACE' : 'LOADING AI...'}
          </Button>
        </Box>
      </Modal>

      {/* Attendance Report Modal */}
      <Modal
        open={showReportModal}
        onClose={() => setShowReportModal(false)}
      >
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            bgcolor: 'white',
            p: 4,
            borderRadius: 2,
            maxWidth: 700,
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto',
          }}
        >
          <Typography variant="h5" textAlign="center" gutterBottom>
            📊 Attendance Report
          </Typography>
          {ownerReportReceived && (
            <Typography 
              variant="subtitle1" 
              textAlign="center" 
              gutterBottom
              sx={{ 
                color: 'primary.main', 
                fontWeight: 'bold',
                mb: 2,
                bgcolor: 'primary.light',
                p: 1,
                borderRadius: 1
              }}
            >
              👑 Meeting Owner Report
            </Typography>
          )}
          <Typography variant="body2" textAlign="center" color="text.secondary" gutterBottom>
            Meeting ID: {attendanceReport?.meetingId}
          </Typography>
          <Typography variant="body2" textAlign="center" color="text.secondary" sx={{ mb: 2 }}>
            Based on face detection during the meeting
          </Typography>
          
          <Box sx={{ mb: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
            <Typography variant="body2" sx={{ mb: 0.5 }}>
              <strong>✅ Present:</strong> Face detected ≥ 75% of time
            </Typography>
            <Typography variant="body2" sx={{ mb: 0.5 }}>
              <strong>⚠️ Partial:</strong> Face detected ≥ 50% but &lt; 75% of time
            </Typography>
            <Typography variant="body2">
              <strong>❌ Absent:</strong> Face detected &lt; 50% of time
            </Typography>
          </Box>

          <Table>
            <TableHead>
              <TableRow>
                <TableCell>
                  <strong>User</strong>
                </TableCell>
                <TableCell align="center">
                  <strong>Verified %</strong>
                </TableCell>
                <TableCell align="center">
                  <strong>Status</strong>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {attendanceReport?.participants.map(p => (
                <TableRow key={p.userId}>
                  <TableCell>{p.name}</TableCell>
                  <TableCell align="center">
                    {p.verifiedPercent}%
                  </TableCell>
                  <TableCell align="center">
                    <strong 
                      style={{
                        color: p.status === 'Present' ? 'green' 
                             : p.status === 'Partial' ? 'orange' 
                             : 'red'
                      }}
                    >
                      {p.status}
                    </strong>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Button
            onClick={() => {
              setShowReportModal(false);
              // Clean up and redirect after closing report
              try {
                if (localVideoref.current?.srcObject) {
                  localVideoref.current.srcObject.getTracks().forEach(t => t.stop());
                }
              } catch (e) {
                console.error('Error stopping tracks:', e);
              }
              setTimeout(() => {
                window.location.href = '/';
              }, 300);
            }}
            variant="contained"
            sx={{ mt: 3, display: 'block', mx: 'auto' }}
          >
            Close & Exit Meeting
          </Button>
        </Box>
      </Modal>
    </div>
  );
}



