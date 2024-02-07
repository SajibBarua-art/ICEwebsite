// For backend and express
const express = require('express');
const app = express();
const cors = require("cors");
const port = process.env.PORT || 5000;

require('dotenv').config();
app.use(express.json());
app.use(cors());
app.get("/", (req, resp) => {
    res.send("App is Working");
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

// Import your data and routes
const teacherRoutes = require('./components/teachers');
const courseDetailsRoutes = require('./components/courseDetails');
const studentRoutes = require('./components/students');
const timeSlotRoutes = require('./components/timeSlot');
const roomRoutes = require('./components/room');
const generateRandomRoutine = require('./components/ClassRoutine/generateRandomRoutine');
const routineOperation = require('./components/ClassRoutine/routineOperation');
const generateExamCommittee = require('./components/TheoryExamCommittee/generateExamCommittee');
const examComitteeOperation = require('./components/TheoryExamCommittee/examCommitteeOperation');
const generateLabExamCommittee = require('./components/LabExamCommittee/generateLabExamCommittee');
const labExamComitteeOperation = require('./components/LabExamCommittee/labExamCommitteeOperation');
const committee = require('./components/committee');
const feedback = require('./components/feedback');
const courseDistribution = require('./components/CourseDistribution/courseDistribution');
const classRoutineManagement = require('./components/ClassRoutine/classRoutineManagement');
const theoryExamRoutine = require('./components/TheoryExamRoutine/theoryExamRoutine');
const theoryDutyRoaster = require('./components/DutyRoaster/generateTheoryDutyRoaster');

// Use the routes for data management
app.use('/teachers', teacherRoutes);
app.use('/courseDetails', courseDetailsRoutes);
app.use('/students', studentRoutes);
app.use('/timeSlot', timeSlotRoutes);
app.use('/room', roomRoutes);
app.use('/generateRandomRoutine', generateRandomRoutine.app);
app.use('/routine', routineOperation);
app.use('/generateExamCommittee', generateExamCommittee.app);
app.use('/examCommittee', examComitteeOperation);
app.use('/generateLabExamCommittee', generateLabExamCommittee);
app.use('/labExamCommittee', labExamComitteeOperation);
app.use('/teacher', committee);
app.use('/feedback', feedback);
app.use('/courseDistribution', courseDistribution);
app.use('/classRoutineManagement', classRoutineManagement);
app.use('/theoryExamRoutine', theoryExamRoutine);
app.use('/generateTheoryDutyRoaster', theoryDutyRoaster);

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})