const express = require('express');
const app = express.Router();
const mongoose = require('mongoose');
const Teacher = mongoose.model('teachers');
const CourseDetails = mongoose.model('courseDetails');
const TimeSlot = mongoose.model('timeSlot');
const Room = mongoose.model('room');
const SlotPriority = mongoose.model('slotPriority');
const TeacherPriority = mongoose.model('teacherPriority');

const priorityBasedRoutineManagementSchema = new mongoose.Schema({
    overall: {
        type: Array,
        required: true
    },
    yearTerm: {
        type: Array,
        required: true
    },
    routineTeachersName: {
        type: Array,
        required: true
    },
    year: {
        type: String,
        required: true
    },
    semester: {
        type: String,
        required: true
    },
    classStartDate: {
        type: Date,
        default: Date.now
    },
    routineDetails: {
        type: [
            {
                session: String,
                totalStudents: String
            }
        ]
    },
    room: {
        type: Object,
        required: true
    },
    timeslot: {
        type: Array,
        required: true
    }
});

const PriorityBasedRoutine = mongoose.model('priorityBasedRoutine', priorityBasedRoutineManagementSchema);
const { shuffleArray } = require('./generateRandomRoutine');

app.post('/', async(req, res) => {
    try {
        const { year, semester, classStartDate, routineDetails } = req.body;
        const yearSemester = year.toString() + semester.toString();

        // Retrieve all teachers info from the MongoDB database
        const CourseDistributionManagement = mongoose.model('CourseDistributionManagement');
        const courseDistributionManagement = await CourseDistributionManagement.find({ yearSemester }).lean();

        console.log(courseDistributionManagement);
        if(courseDistributionManagement.length === 0) {
            res.send({ success: false, error: "No data found on your specific year and semester!!!" });
            return;
        }

        const teachersInfo = await Teacher.find({}).lean(); // Use .lean() to get plain JavaScript objects
        const coursesInfo = await CourseDetails.find({}).lean();
        const timeSlot = await TimeSlot.find({}).lean();
        const room = await Room.find({}).lean();
        const slotPriority = await SlotPriority.find({}).lean();
        const teacherPriority = await TeacherPriority.find({}).lean();

        // console.log("teachers: ", teachersInfo);
        // console.log("courses: ", coursesInfo);
        // console.log("timeslot: ", timeSlot);
        // console.log("room: ", room);
        // console.log("slotPriority: ", slotPriority);
        // console.log("teacherPriority: ", teacherPriority);

        const allTeacherCourse = buildTeacherCourse(courseDistributionManagement[0], teachersInfo, coursesInfo);
        // console.log(allTeacherCourse);

        // divide the courses according to the electrical lab, computer lab and theory
        const electricalLabDetails = [], computerLabDetails = [], theoryDetails = [];
        for (const teacherCourse of allTeacherCourse) {
            const course = teacherCourse.course;
            if (course.type === 'theory') {
                theoryDetails.push(teacherCourse);
            } else if (course.type === 'computer lab') {
                computerLabDetails.push(teacherCourse);
            } else if (course.type === 'electrical lab') {
                electricalLabDetails.push(teacherCourse);
            } else {
                console.log("!!! There is an error on: ", course);
            }
        }

        // shuffle to randomize the routine
        shuffleArray(electricalLabDetails);
        shuffleArray(computerLabDetails);
        shuffleArray(theoryDetails);

        console.log(theoryDetails);

        const electricalRoom = room[0].lab.electrical;
        const computerRoom = room[0].lab.computer;
        const theoryRoom = room[0].theory;
        const timeSlots = timeSlot[0].timeSlot;
        const allRoom = [...electricalRoom, ...computerRoom, ...theoryRoom];

        // Build routine matrix
        // routineMatrix[day][year][timeslot]
        // initializing a 4D array
        const totalDay = 5, totalYear = 4, totalTerm = 2, totalTimeslot = timeSlots.length;
        const routineMatrix = new Array(totalDay);
        for (let day = 0; day < totalDay; day++) {
            routineMatrix[day] = new Array(totalYear);
            for (let year = 0; year <= totalYear; year++) {
                routineMatrix[day][year] = new Array(totalTerm);
                for (let term = 0; term <= totalTerm; term++) {
                    routineMatrix[day][year][term] = new Array(totalTimeslot);
                    for (let timeslot = 0; timeslot < totalTimeslot; timeslot++) {
                        routineMatrix[day][year][term][timeslot] = { isAllocated: false };
                    }
                }
            }
        }

        res.json({ success: true });
    } catch (err) {
        console.error('Error saving routine:', err);
    }
})

module.exports = app;
