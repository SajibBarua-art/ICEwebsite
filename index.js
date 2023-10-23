// For backend and express
const express = require('express');
const app = express();
const cors = require("cors");
const port = process.env.PORT || 5000;

require('dotenv').config();
app.use(express.json());
app.use(cors());
app.get("/", (req, resp) => {
    resp.send("App is Working");
});

// Connect to the database
const mongoose = require('mongoose');
mongoose.connect(`mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.smd1bmx.mongodb.net/?retryWrites=true&w=majority`, {
    dbName: 'routine',
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => {
    console.log('Connected to routine database');
})
.catch(err => {
    console.error('Error connecting to the database:', err);
});

// database for teachers information
const teacherRoutes = require('./components/teachers');
app.use('/teachers', teacherRoutes);

// database for course details
const courseDetailsRoutes = require('./components/courseDetails.js');
app.use('/courseDetails', courseDetailsRoutes);

// database for students information
const studentRoutes = require('./components/students');
app.use('/students', studentRoutes);

// database for time-slot
const timeSlotRoutes = require('./components/timeSlot');
app.use('/timeSlot', timeSlotRoutes);

// database for room
const roomRoutes = require('./components/room');
app.use('/room', roomRoutes);

// create routine randomly


app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})