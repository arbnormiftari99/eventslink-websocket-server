
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
    origin: '*', 
    methods: ['GET', 'POST'],
  },
});

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

app.get('/', (req, res) => {
  res.send('WebSocket server is running');
});

const createRoomName = (senderId, receiverId) => {
  return [senderId, receiverId].sort().join('_');
};

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('joinRoom', (roomName) => {
    console.log(`User joined room: ${roomName}, socket ID: ${socket.id}`);
    socket.join(roomName);
    console.log(`User joined room: ${roomName}`);
  });

  // Listen for private messages
  socket.on('privateMessage', async (msg) => {
    const { senderId, receiverId, message } = msg;
    const roomName = createRoomName(senderId, receiverId);
    console.log(`Message from ${senderId} to ${receiverId}:`, message);
    try{
      const db = client.db('EventsLink_Project'); 
    const messagesCollection = db.collection('messages');
    await messagesCollection.insertOne({
      message,
      senderId,
      receiverId,
      timestamp: new Date(),
    });

    io.to(roomName).emit('privateMessage', msg);
    } catch(error){
      console.log('Error saving message:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, async () => {
  console.log(`WebSocket server is running on port ${PORT}`);
  await connectToDB();
});

