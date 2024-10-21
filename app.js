require('dotenv').config();
const express = require("express");
const mongoose = require('mongoose');
const cors = require("cors");
const path = require('path');

const app = express();
const { initializeSocket } = require('./utils/socket');

const passport = require("passport");
const Strategy = require("passport-google-oauth20");

const session = require("express-session");


// Middlewares
app.use(cors({
  origin: ['http://localhost:8080', 'http://localhost:8081', 'https://www.apexteks.com', 'https://apexteks.com', 'https://tech-zone-navy.vercel.app', 'https://www.tech-zone.com.ng', 'https://tech-zone.com.ng'],
  credentials: true
}));
app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));


app.use(
  session({
    secret: process.env.SESSION_SECRET, // session secret
    resave: false,
    saveUninitialized: false,
  })
);

// initialize passport and session
app.use(passport.initialize());
app.use(passport.session());





// Connect to the db
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('ApexTeks database connected successfully'))
  .catch((err) => { console.error(err); });

// Routes
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const employerRoutes = require("./routes/employerRoutes");
const jobRoutes = require("./routes/jobRoutes");
const contractRoutes = require("./routes/contractRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const adminRoutes = require("./routes/adminRoutes");
const messageRoutes = require("./routes/messageRoutes");
const taskWatchRoutes = require("./routes/taskWatchRoutes");
const waitListRoutes = require("./routes/waitListRoute");
const walletRoutes = require('./routes/walletRoutes');

app.use('/api', authRoutes);
app.use('/api', userRoutes);
app.use('/api', jobRoutes);
app.use('/api', employerRoutes);
app.use("/api", contractRoutes);
app.use("/api", notificationRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/message", messageRoutes);
app.use("/api", taskWatchRoutes);
app.use("/api", waitListRoutes);
app.use("/api/wallets", walletRoutes);

app.get('/', (req, res) => {
  return res.send("Apex-tek API is live...");
});


// passport and google auth..





// Start server with Socket.io
const server = initializeSocket(app);

server.listen(process.env.PORT || 8000, () => {
  console.log(`Server is live on port ${process.env.PORT}`);
});
