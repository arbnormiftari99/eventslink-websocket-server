const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { MongoClient } = require('mongodb');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

require('dotenv').config(); 


const PORT = process.env.PORT || 4000;

// MongoDB connection
const MONGO_URI = process.env.MONGO_URI;
const client = new MongoClient(MONGO_URI);

async function connectToDB() {
  try {
    await client.connect();
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
  }
}

app.use(cors());

// WebSocket logic
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Listen for chat messages
  socket.on('chatMessage', async (msg) => {
    console.log('Message received:', msg);

    // Save message to MongoDB
    const db = client.db('chatDB');  // Replace with your actual DB name
    const messagesCollection = db.collection('messages');
    await messagesCollection.insertOne({ message: msg, timestamp: new Date() });

    // Broadcast the message to all connected clients
    io.emit('chatMessage', msg);
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected:', socket.id);
  });
});

server.listen(PORT, async () => {
  console.log(`WebSocket server is running on port ${PORT}`);
  await connectToDB(); // Connect to the database when the server starts
});
