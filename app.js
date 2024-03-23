require('dotenv').config();
const express = require("express");
const app = express();
const http = require('http');
const cors = require("cors");

// const fileUpload = require('express-fileupload');
const path = require('path');
const mongoose = require('mongoose');


// Use the cors middleware with options to specify the allowed origin [----DO NOT REMOVE FRPM HERE----]
app.use(cors());
// IMPORT ALL ROUTE FILES HERE....
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const employerRoutes = require("./routes/employerRoutes");
const jobRoutes = require("./routes/jobRoutes");
const contractRoutes = require("./routes/contractRoutes");
const notificationRoutes = require("./routes/notificationRoutes");

// socket io configurations for notification...
const server = http.createServer(app);

// const io = require("socket.io")(server, {
//   cors: {
//     origin: "*",
//     methods: ["GET", "POST"]
//   }
// });

// io.on('connection', (socket) => {
//   console.log('A user connected');
//   socket.on('disconnect', () => {
//     console.log('User disconnected');
//   });
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
// for file uploads...
// app.use(fileUpload());



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






//setup server to listen on port declared on env
server.listen(process.env.PORT || 5000, () => {
  console.log(`Server is live on port ${process.env.PORT}`);
})


