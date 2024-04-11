require('dotenv').config();
const express = require("express");
const app = express();
const http = require('http');
const cors = require("cors");
const path = require('path');
const mongoose = require('mongoose');






// Use the cors middleware with options to specify the allowed origin [----DO NOT REMOVE FRPM HERE----]
app.use(cors());
// app.use(cors({
//   origin: 'http://localhost:8080',
//   methods: ['GET', 'POST', 'OPTIONS', 'PUT', 'PATCH', 'DELETE'],
//   allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'], // Include 'Authorization' header here
//   credentials: true
// }));




// IMPORT ALL ROUTE FILES HERE....
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const employerRoutes = require("./routes/employerRoutes");
const jobRoutes = require("./routes/jobRoutes");
const contractRoutes = require("./routes/contractRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const adminRoutes = require("./routes/adminRoutes");
const messageRoutes = require("./routes/messageRoutes");


// socket io configurations for notification...
const server = http.createServer(app);
const io = require('socket.io')(server);

// Socket.io setup
io.on('connection', (socket) => {
  socket.on('join', (room) => {
    socket.join(room);
    console.log("socket joined room: ", room)
  });
  console.log("new socket io connection...")
});

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:8080');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Credentials', 'true'); // Include this line when using credentials
  next();
});

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





//setup server to listen on port declared on env
server.listen(process.env.PORT || 8000, () => {
  console.log(`Server is live on port ${process.env.PORT}`);
})


