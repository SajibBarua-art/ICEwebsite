const express = require('express');
const app = express.Router();
const mongoose = require('mongoose');
const Teacher = mongoose.model('teachers');
const CourseDetails = mongoose.model('courseDetails');
const TimeSlot = mongoose.model('timeSlot');
const Room = mongoose.model('room');

const routineSchema = new mongoose.Schema({
    overall: {
        type: Array,
        required: true
    }
});

const ExamComittee = mongoose.model('examComittee', routineSchema);

const createRoutineDatabase = async (routineMatrix) => {
    try {
        const newExamComittee = new ExamComittee(routineMatrix);

        await newExamComittee.save();
        console.log('ExamComittee saved');
    } catch (err) {
        console.error('Error saving examComittee:', err);
    }
};

const updateDatabaseExamCommittee = async (newExamComitteeMatrix) => {
    try {
        const result = await ExamComittee.findOneAndUpdate(
            {}, // Match all documents
            { $set: { newExamComitteeMatrix } },
            { new: true } // Return the updated document
        );

        if (result) {
            console.log('ExamComittee updated');
        } else {
            console.log('No examComittee document found');
        }
    } catch (err) {
        console.error('Error updating examComittee:', err);
    }
};

// Generate a random examComittee route
app.get('/', async (req, res) => {
    try {
        // Retrieve all teachers info from the MongoDB database
        const teachersInfo = await Teacher.find({}).lean(); // Use .lean() to get plain JavaScript objects
        const coursesInfo = await CourseDetails.find({}).lean();
        const timeSlot = await TimeSlot.find({}).lean();
        const room = await Room.find({}).lean();

        const allTeacherCourse = buildTeacherCourseObjects(teachersInfo, coursesInfo);

        res.json(routineMatrix);
    } catch (error) {
        console.error("An error occurred into the generate random examComittee:", error);
        res.status(500).send("Internal Server Error");
    }
});

const buildTeacherCourseObjects = (teachersInfo, coursesInfo) => {
    const teacherCourseObjects = [];
    
    const map1 = new Map();
    for (const teacher of teachersInfo) {
        const { courses, ...teacherWithoutCourses } = teacher;
  
        for (const courseCode of courses) {
            const courseDetails = coursesInfo.find((course) => course.code === courseCode);

            if (courseDetails) {
                const teacherWithCourseDetails = { teacher: teacherWithoutCourses, course: courseDetails };
                const teacher = teacherWithCourseDetails.teacher.teacherCode;
                const courseCode = teacherWithCourseDetails.course.code;
                const ind = teacherCourseObjects.length;
                if(map1.has(courseCode)) {
                    const prev_ind = map1.get(courseCode);
                    teacherCourseObjects[prev_ind].teacher.teacherCode += ('/' + teacher);
                    continue;
                }

                map1.set(courseCode, ind);
                teacherCourseObjects.push(teacherWithCourseDetails);
            }
        }
    }
  
    return teacherCourseObjects;
};


module.exports = app;