require('dotenv').config();
const { connectDB } = require('./lib/mongo');
const app = require('./app');
const ChatServer = require('./wsServer');

const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB(process.env.MONGO_URI);

// Start HTTP server
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Initialize WebSocket server
new ChatServer(server);

console.log(`WebSocket server running on ws://localhost:${PORT}/chat`);