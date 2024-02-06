const express = require('express');
const app = express.Router();
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const Teacher = mongoose.model('teachers');
const CourseDetails = mongoose.model('courseDetails');

const dutyRoasterSchema = new mongoose.Schema({
    examYear: {
        type: String,
        required: true
    },
    semester: {
        type: String,
        required: true
    },
    theory: {
        type: Array,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
    }
});

const TheoryDutyRoaster = mongoose.model('theorydutyroaster', dutyRoasterSchema);

// Middleware to parse JSON data
app.use(bodyParser.json());

const createDutyRoaster = async (examYear, semester, theory) => {
    try {
        // Create a new routine object
        const newDutyRoaster = new TheoryDutyRoaster({
            examYear, 
            semester,
            theory
        });

        // Save the new routine
        const savedRoutine = await newDutyRoaster.save();
        console.log('Duty Roaster saved');

        // Check if the total number of objects exceeds 10
        const routineCount = await TheoryDutyRoaster.countDocuments();

        if (routineCount > 10) {
            // Find and delete the oldest routine based on the date
            const oldestRoutine = await TheoryDutyRoaster.findOne().sort({ createdAt: 1 });
            await TheoryDutyRoaster.findByIdAndDelete(oldestRoutine._id);
            console.log('Oldest Duty Roaster deleted');
        }

        return savedRoutine._id;
    } catch (err) {
        console.error('Error saving duty roaster:', err);
    }
};

const updateDutyRoaster = async (newDutyRoasterMatrix) => {
    try {
        const result = await TheoryDutyRoaster.findOneAndUpdate(
            {}, // Match all documents
            {
                $set: {
                    theory: newDutyRoasterMatrix
                }
            },
            { new: true } // Return the updated document
        );

        if (result) {
            console.log('Exam Committee updated');
        } else {
            console.log('No exam Committee document found');
        }
    } catch (err) {
        console.error('Error updating examComittee:', err);
    }
};

const buildTeacherCourseObjects = (teachersInfo, coursesInfo) => {
    const teacherCourseObjects = [];

    const map1 = new Map();
    for (const teacher of teachersInfo) {
        const { courses, ...teacherWithoutCourses } = teacher;

        if (teacher.department !== 'ICE, NSTU') {
            continue;
        }

        for (const courseCode of courses) {
            const courseDetails = coursesInfo.find((course) => course.code === courseCode);

            if (courseDetails) {
                const teacherWithCourseDetails = { teacher: teacherWithoutCourses, course: courseDetails };
                const teacher2 = teacherWithCourseDetails.teacher;
                const courseCode = teacherWithCourseDetails.course.code;
                const ind = teacherCourseObjects.length;
                if (map1.has(courseCode)) {
                    const prev_ind = map1.get(courseCode);
                    teacherCourseObjects[prev_ind]['teacher2'] = teacher2;
                    continue;
                }

                map1.set(courseCode, ind);
                teacherCourseObjects.push(teacherWithCourseDetails);
            }
        }
    }

    return teacherCourseObjects;
}

const rearrangeCourses = (allTeacherCourse) => {
    var yearTermWiseCourse = new Array(7);
    for (let i = 0; i < 7; i++) {
        yearTermWiseCourse[i] = new Array(4);
        for (let j = 0; j < 4; j++) {
            yearTermWiseCourse[i][j] = [];
        }
    }

    for (const teacherCourse of allTeacherCourse) {
        const course = teacherCourse.course;
        const year = course.year, term = course.term;
        yearTermWiseCourse[year][term].push(teacherCourse);
    }

    for (let i = 1; i <= 4; i++) {
        yearTermWiseCourse[i][1].sort((a, b) => a.course.code.localeCompare(b.course.code));
        yearTermWiseCourse[i][2].sort((a, b) => a.course.code.localeCompare(b.course.code));
    }

    return yearTermWiseCourse;
}

const removePunctuation = (inputString) => {
    // Use a regular expression to remove all punctuation marks
    return inputString.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
}

const buildDutyRoaster = (teacherCourseDetails, teachersInfoSortedByJoiningDate) => {
    const len = teacherCourseDetails.length;
    const dutyRoaster = new Array(len);
    for (let i = 0; i < len; i++) {
        dutyRoaster[i] = new Array(3);
    }

    let takenTeachers = new Array(len);
    for (let i = 0; i < len; i++) {
        takenTeachers[i] = new Set();
    }

    // to 1st examiner
    for (let i = 0; i < len; i++) {
        const teacher = teacherCourseDetails[i].teacher;
        const course = teacherCourseDetails[i].course;
        const name = teacher.firstName + ' ' + teacher.lastName;
        const teacherCode = teacher.teacherCode;

        takenTeachers[i].add(teacherCode);
        dutyRoaster[i][0] = {
            course: {
                name: course.name,
                code: course.code,
                year: course.year,
                term: course.term
            },
            teacher: {
                name: name,
                designation: teacher.designation,
                department: teacher.department,
                remark: '1st Roaster'
            }
        }
    }

    // to 2nd & 3rd examiner
    for (let i = 0; i < 2 * len; i++) {
        let teacher;
        if ((i < len) && teacherCourseDetails[i].hasOwnProperty('teacher2')) {
            teacher = teacherCourseDetails[i].teacher2;
        }
        else {
            let teacherInd = 0;
            teacher = teachersInfoSortedByJoiningDate[teacherInd];
            while (takenTeachers[i % len].has(teacher.teacherCode)) {
                teacherInd++;
                if (teacherInd === teachersInfoSortedByJoiningDate.length) {
                    teacherInd = 0;
                }
                teacher = teachersInfoSortedByJoiningDate[teacherInd];
            }
            teachersInfoSortedByJoiningDate.push(teachersInfoSortedByJoiningDate[teacherInd]);
            teachersInfoSortedByJoiningDate.splice(teacherInd, 1);
        }

        takenTeachers[i % len].add(teacher.teacherCode);
        const name = teacher.firstName + ' ' + teacher.lastName;
        dutyRoaster[i % len][1 + (i >= len)] = {
            teacher: {
                name: name,
                designation: teacher.designation,
                department: teacher.department,
                remark: (i < len) ? '2nd Roaster' : '3rd Roaster'
            }
        }
    }

    return dutyRoaster;
}

// Generate a random examComittee route
app.post('/', async (req, res) => {
    try {
        const theoryDutyRoaster = new TheoryDutyRoaster(req.body);
        console.log(theoryDutyRoaster);

        // Retrieve all teachers info from the MongoDB database
        const teachersInfo = await Teacher.find({}).lean(); // Use .lean() to get plain JavaScript objects
        const coursesInfo = await CourseDetails.find({ term: theoryDutyRoaster.semester, type: 'theory' }).lean();

        const allTeacherCourse = buildTeacherCourseObjects(teachersInfo, coursesInfo);
        const yearTermWiseCourse = rearrangeCourses(allTeacherCourse);
        const teachersInfoSortedByJoiningDate = teachersInfo;

        teachersInfoSortedByJoiningDate.sort((a, b) => new Date(a.joiningDate) - new Date(b.joiningDate));

        const sortedCourses = [];
        for (let i = 4; i > 0; i--) {
            sortedCourses.push(...yearTermWiseCourse[i][1]);
            sortedCourses.push(...yearTermWiseCourse[i][2]);
        }

        const dutyRoaster = buildDutyRoaster(sortedCourses, teachersInfoSortedByJoiningDate);
        let yearTermWiseDutyRoaster = new Array(7);
        for (let i = 0; i < 7; i++) {
            yearTermWiseDutyRoaster[i] = new Array(4);
            for (let j = 0; j < 4; j++) {
                yearTermWiseDutyRoaster[i][j] = [];
            }
        }

        for (let i = 0; i < dutyRoaster.length; i++) {
            const year = dutyRoaster[i][0].course.year, term = dutyRoaster[i][0].course.term;
            yearTermWiseDutyRoaster[year][term].push(dutyRoaster[i]);
        }

        createDutyRoaster(theoryDutyRoaster.examYear, theoryDutyRoaster.semester, yearTermWiseDutyRoaster);
        // updateDutyRoaster(yearTermWiseDutyRoaster);
        res.json(yearTermWiseDutyRoaster);
    } catch (error) {
        console.error("An error occurred into the generate random examComittee:", error);
        res.status(500).send("Internal Server Error");
    }
});

module.exports = app;