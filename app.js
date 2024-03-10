require('dotenv').config();
const express = require("express");
const cors = require("cors");
const app = express();
const fileUpload = require('express-fileupload');
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
app.use(fileUpload());



// using users routes...
app.use('/api', authRoutes);
app.use('/api', userRoutes);
app.use('/api', jobRoutes);
app.use('/api', employerRoutes);
app.use("/api", contractRoutes)


//setup server to listen on port declared on env
app.listen(process.env.PORT || 5000, () => {
  console.log(`Server is live on port ${process.env.PORT}`);
})


