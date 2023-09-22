

// //////////////////////
require('dotenv').config();
const express = require("express"),
      app = express(),
      userRoutes = require("./routes/userRoutes");

const mongoose = require('mongoose');
const jobRoutes = require('./routes/jobRoutes');
const cors = require("cors");

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

app.use(cors);

// using users routes...
app.use('/api', userRoutes);
// app.use('/api', jobRoutes);
app.use(jobRoutes);




//setup server to listen on port 5000
app.listen(process.env.PORT || 5000, () => {
  console.log("Server is live on port 5000");
})


