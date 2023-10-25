const express = require('express');
const app = express.Router();
const mongoose = require('mongoose');
const Teacher = mongoose.model('teachers');
const CourseDetails = mongoose.model('courseDetails');
const TimeSlot = mongoose.model('timeSlot');
const Room = mongoose.model('room');

// Generate a random routine route
app.get('/', async (req, res) => {
    try {
        // Retrieve all teachers info from the MongoDB database
        const teachersInfo = await Teacher.find({});
        const coursesInfo = await CourseDetails.find({});
        const timeSlot = await TimeSlot.find({});
        const room = await Room.find({});

        const allTeacherCourse = buildTeacherCourseObjects(teachersInfo, coursesInfo);

        const electricalLab = [], computerLab = [], theory = [];
        for(const course of allTeacherCourse) {
            if(course.type === 'theory') {
                theory.push(course);
            } else if(course.type === 'computer lab') {
                computerLab.push(course);
            } else if(course.type === 'electrical lab') {
                electricalLab.push(course);
            } else {
                console.log("!!! There is an error on: ", course);
            }
        }

        const electricalRoom = room[0].lab.electrical;
        const computerRoom = room[0].lab.computer;
        const theoryRoom = room[0].theory;
        const timeslot = timeSlot[0].timeSlot;

        

        res.json([]);
    } catch (error) {
        console.error("An error occurred into the generate random routine:", error);
        res.status(500).send("Internal Server Error");
    }
});

const buildTeacherCourseObjects = (teachersInfo, coursesInfo) => {
    const teacherCourseObjects = [];
  
    for (const teacher of teachersInfo) {
        const { courses, ...teacherWithoutCourses } = teacher._doc;
  
        for (const courseCode of courses) {
            const courseDetails = coursesInfo.find((course) => course.code === courseCode);

            if (courseDetails) {
                const teacherWithCourseDetails = { ...teacherWithoutCourses, ...courseDetails._doc };
                teacherCourseObjects.push(teacherWithCourseDetails);
            }
        }
    }
  
    return teacherCourseObjects;
  };

function generateRandomRoutine() {
    // Replace this with your own logic to generate a random routine
    const routine = {
        // Your routine data
    };
    return routine;
}

module.exports = app;