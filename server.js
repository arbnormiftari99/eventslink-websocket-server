// server.js (WebSocket server)

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { MongoClient } = require('mongodb');
require('dotenv').config();

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // Replace with your Next.js URL if necessary
    methods: ['GET', 'POST'],
  },
});

// MongoDB connection
const MONGO_URI = process.env.MONGO_URI; // Your MongoDB URI from environment variables
const client = new MongoClient(MONGO_URI);

async function connectToDB() {
  try {
    await client.connect();
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
  }
}

app.get('/', (req, res) => {
  res.send('WebSocket server is running');
});

// Function to create a consistent room name
const createRoomName = (senderId, receiverId) => {
  return [senderId, receiverId].sort().join('_');
};

// WebSocket connection handler
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Listen for join room events
  socket.on('joinRoom', (roomName) => {
    socket.join(roomName);
    console.log(`User joined room: ${roomName}`);
  });

  // Listen for private messages
  socket.on('privateMessage', async (msg) => {
    const { senderId, receiverId, message } = msg;
    const roomName = createRoomName(senderId, receiverId);
    console.log(message);

    // Save message to MongoDB
    const db = client.db('EventsLink_Project'); // Use your actual database name
    const messagesCollection = db.collection('chatMessages');
    await messagesCollection.insertOne({
      message,
      senderId,
      receiverId,
      timestamp: new Date(),
    });

    // Emit the message only to the room participants
    io.to(roomName).emit('privateMessage', msg);
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected:', socket.id);
  });
});

// Start the server
const PORT = process.env.PORT || 4000;
server.listen(PORT, async () => {
  console.log(`WebSocket server is running on port ${PORT}`);
  await connectToDB(); // Connect to MongoDB when the server starts
});

