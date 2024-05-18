require('dotenv').config();
const express = require("express");
const app = express();
const http = require('http');
const cors = require("cors");
const path = require('path');
const mongoose = require('mongoose');






// Use the cors middleware with options to specify the allowed origin [----DO NOT REMOVE FRPM HERE----]
// app.use(cors());
app.use(cors({
  origin: ['http://localhost:8080', 'https://tech-zone-navy.vercel.app'], // Replace this with the origin of your frontend application
  credentials: true // Allow sending cookies with the CORS request
}));



// IMPORT ALL ROUTE FILES HERE....
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const employerRoutes = require("./routes/employerRoutes");
const jobRoutes = require("./routes/jobRoutes");
const contractRoutes = require("./routes/contractRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const adminRoutes = require("./routes/adminRoutes");
const messageRoutes = require("./routes/messageRoutes");
const taskWatchRoutes = require("./routes/taskWatchRoutes");


// socket io configurations for notification...
const server = http.createServer(app);
const io = require("socket.io")(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});


// Socket.io setup
io.on('connection', (socket) => {
  socket.on('join', (room) => {
    socket.join(room);
    console.log("socket joined room: ", room)
  });
  console.log("new socket io connection...")
});



// app.use((req, res, next) => {
//   res.header('Access-Control-Allow-Origin', 'http://localhost:8080');
//   res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
//   res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
//   res.header('Access-Control-Allow-Credentials', 'true'); // Include this line when using credentials
//   next();
// });

// Connect to the db
mongoose.connect(process.env.MONGODB_URI, {useNewUrlParser: true, useUnifiedTopology: true } )
.then(() => console.log('Tech-zone database connected successfully'))
.catch((err) => { console.error(err); });


// parse requests of content-type - application/json
app.use(express.json());
// parse requests of content-type - application/x-www-form-urlencoded
app.use(express.urlencoded({
  extended: true
}));



app.get('/', function(req, res){
  return res.send("Apex-tek API is live...")
})
// using users routes...
app.use('/api', authRoutes);
app.use('/api', userRoutes);
app.use('/api', jobRoutes);
app.use('/api', employerRoutes);
app.use("/api", contractRoutes);
app.use("/api", notificationRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/message", messageRoutes);
app.use("/api", taskWatchRoutes);



const Message = require('./models/messageModel');
const Room = require('./models/roomModel');

// SEND MESSAGE CONTROLLER >>>
app.post('/api/message/room/:room_id', async (req, res) => {
  try {
    const roomId = req.params.room_id;
    const { text, userId } = req.body;
    const room = await Room.findById(roomId);
    const today = Date.now();

    // Create a new message
    // const message = new Message({ text, user: userId, room: roomId });
    const message = await Message.create({ text, user: userId, room: roomId });
    room.updatedAt = today;
      
    await room.save();

    // Emit the message to the room using Socket.io
    io.to(roomId).emit('message', message);
    console.log("new socket msg sent to room: ", roomId);

    res.status(201).json({ message });
  } catch (error) {
    console.error('Error sending message:', error); // Log the error
    res.status(500).json({ error: 'Unable to send message' });
  }
});


//setup server to listen on port declared on env
server.listen(process.env.PORT || 8000, () => {
  console.log(`Server is live on port ${process.env.PORT}`);
})


