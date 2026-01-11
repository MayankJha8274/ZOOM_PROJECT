// Automatically detect if running in production or development
const IS_PROD = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';

// IMPORTANT: Replace with your BACKEND Render URL (the one running Node.js/Express)
// NOT your frontend URL (the static site)
const server = IS_PROD ?
    "https://meettrack-ai-backend.onrender.com" :  // ⚠️ UPDATE THIS with your actual backend URL
    "http://localhost:8000"

export default server;

