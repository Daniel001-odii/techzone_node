

// //////////////////////
require('dotenv').config();
const express = require("express"),
      app = express(),
      userRoutes = require("./routes/userRoutes");

const mongoose = require('mongoose');
const jobRoutes = require('./routes/jobRoutes');
const cors = require("cors");

const http = require('http');
const socketIo = require('socket.io');
const server = http.createServer(app);
const io = socketIo(server);

// Use the cors middleware with options to specify the allowed origin
app.use(cors({
  origin: 'http://localhost:5173', // Replace with the actual origin of your client application
  credentials: true, // If you need to send cookies or authentication headers
}));


  // Connect to the MongoDB Atlas database using the URL from your .env file
  mongoose.connect("mongodb+srv://admin:admin@cluster0.3rg9h4v.mongodb.net/?retryWrites=true&w=majority").then(() => {
    console.log('Connected to Database Successfully')
  })



// parse requests of content-type - application/json
app.use(express.json());
// parse requests of content-type - application/x-www-form-urlencoded
app.use(express.urlencoded({
  extended: true
}));



// using users routes...
app.use('/api', userRoutes);
// app.use('/api', jobRoutes);
app.use('/api', jobRoutes);


// Real-time notification handler
io.on('connection', (socket) => {
  console.log('A user connected');

  // Emit a welcome message when a user connects
  socket.emit('notification', { message: 'Welcome to the notification system!' });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});


//setup server to listen on port declared on env 
app.listen(process.env.PORT || 5000, () => {
  console.log(`Server is live on port ${process.env.PORT}`);
})


