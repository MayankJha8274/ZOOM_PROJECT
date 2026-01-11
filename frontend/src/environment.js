// Automatically detect if running in production or development
const IS_PROD = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';

const server = IS_PROD ?
    "https://meettrack-ai.onrender.com" :
    "http://localhost:8000"

export default server;

