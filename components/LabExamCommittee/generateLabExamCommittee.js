const express = require('express');
const app = express.Router();
const mongoose = require('mongoose');
const Teacher = mongoose.model('teachers');
const CourseDetails = mongoose.model('courseDetails');
const { rearrangeCourses } = require('../TheoryExamCommittee/generateExamCommittee');
const { shuffleArray } = require('../ClassRoutine/generateRandomRoutine');
const FastPriorityQueue = require('fastpriorityqueue');

const labExamCommitteeSchema = new mongoose.Schema({
    lab: {
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
    createdAt: {
        type: Date,
        default: Date.now,
    }
});

const LabExamCommittee = mongoose.model('labexamcommittees', labExamCommitteeSchema);

const createLabExamCommitteeDatabase = async (newExamComitteeMatrix, getYear, getSemester, getDate) => {
    try {
        // Create a new Exam Committee object
        const newExamCommittee = new ExamCommittee({
            theory: newExamComitteeMatrix,
            teachers: teacherWithCourses,
            year: getYear,
            semester: getSemester,
            classStartDate: getDate
        });

        // Save the new Exam Committee
        const savedExamCommittee = await newExamCommittee.save();
        console.log('ExamCommittee saved');

        // Check if the total number of objects exceeds 10
        const countDatabase = await LabExamCommittee.countDocuments();
        console.log("Document count: ", countDatabase);

        if (countDatabase > 10) {
            // Find and delete the oldest Exam Committee based on the createdAt
            const oldestExamCommittee = await LabExamCommittee.findOne();
            await ExamCommittee.findByIdAndDelete(oldestExamCommittee._id);
            console.log('Oldest Exam Committee deleted');
        }

        return savedExamCommittee._id;
    } catch (err) {
        console.error('Error saving Exam Committee:', err);
    }
};

const updateDatabaseLabExamCommittee = async (newExamComitteeMatrix) => {
    try {
        const result = await LabExamCommittee.findOneAndUpdate(
            {}, // Match all documents
            { $set: { lab: newExamComitteeMatrix } },
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

        if(teacher.department !== 'ICE, NSTU') {
            continue;
        }
  
        for (const courseCode of courses) {
            const courseDetails = coursesInfo.find((course) => course.code === courseCode);

            if (courseDetails) {
                if(courseDetails.type === 'theory') {
                    continue;
                }
                const teacherWithCourseDetails = { teacher: teacherWithoutCourses, course: courseDetails };
                const teacher2 = teacherWithCourseDetails.teacher;
                const courseCode = teacherWithCourseDetails.course.code;
                const ind = teacherCourseObjects.length;
                if(map1.has(courseCode)) {
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

const buildLabExamCommittee = (teacherCourses, teacherWithLab, teacherWithoutLab) => {
    shuffleArray(teacherWithLab);
    shuffleArray(teacherWithoutLab);

    const len = teacherCourses.length;
    const labExamCommittee = new Array(len);

    const teacherPriority = new Map();
    for(const teacherCode of teacherWithLab) {
        teacherPriority.set(teacherCode, 6);
    }

    for(let i = 0; i < len; i++) {
        const code = teacherCourses[i].teacher.teacherCode;
        const year = teacherCourses[i].course.year;
        const term = teacherCourses[i].course.term;
        const courseCode = teacherCourses[i].course.code;

        labExamCommittee[i] = {
            year: year,
            term: term,
            courseCode: courseCode,
            teacherCodes: ''
        }

        labExamCommittee[i].teacherCodes = code;
        let priority = teacherPriority.get(code);
        teacherPriority.set(code, priority - 1);
        if(teacherCourses[i].hasOwnProperty('teacher2')) {
            const code2 = teacherCourses[i].teacher2.teacherCode;
            priority = teacherPriority.get(code2);
            labExamCommittee[i].teacherCodes += ',' + code2;
            teacherPriority.set(code2, priority - 1);
        }
    }

    // priority queue
    const pq = new FastPriorityQueue((a, b) => a.priority > b.priority);
    for(const teacherCode of teacherWithoutLab) {
        pq.add({teacherCode: teacherCode, priority: 12});
    }
    teacherPriority.forEach((priority, teacherCode) => {
        pq.add({teacherCode: teacherCode, priority: priority});
    })

    // In one iteration, array last element will be removed
    // and last element wiil be added to the front of the array
    for(let i = 0; i < len; i++) {
        let totalTeacherCode = 1;
        for(let j = 0; j < labExamCommittee[i]; j++) {
            if(labExamCommittee[i][j] === ', ') totalTeacherCode++;
        }

        while(totalTeacherCode < 3) {
            const pq_top = pq.poll(); pq_top.priority--;
            labExamCommittee[i].teacherCodes += ', ' + pq_top.teacherCode;
            pq.add(pq_top);
            totalTeacherCode++;
        }
    }

    return labExamCommittee;
}

// Generate a random examComittee route
app.get('/', async (req, res) => {
    try {
        // Retrieve all teachers info from the MongoDB database
        const teachersInfo = await Teacher.find({}).lean(); // Use .lean() to get plain JavaScript objects
        const coursesInfo = await CourseDetails.find({}).lean();

        const allLabTeacherCourse = buildTeacherCourseObjects(teachersInfo, coursesInfo);

        // to separate the teachers according to the any lab courses took or not
        const teachersWithLabCourses = new Set();
        for(const teacherCourse of allLabTeacherCourse) {
            const teacherCode = teacherCourse.teacher.teacherCode;
            teachersWithLabCourses.add(teacherCode);
        }
        const teachersWithoutLabCourses = new Set();
        for(const teacher of teachersInfo) {
            const teacherCode = teacher.teacherCode;
            teachersWithoutLabCourses.add(teacherCode);
        }
        for(const teacherCode of teachersWithLabCourses) {
            teachersWithoutLabCourses.delete(teacherCode);
        }

        const yearTermWiseCourse = rearrangeCourses(allLabTeacherCourse);
        const sortedCourses = [];
        for(let i = 4; i > 0; i--) {
            sortedCourses.push(...yearTermWiseCourse[i][1]);
            sortedCourses.push(...yearTermWiseCourse[i][2]);
        }
        const labExamCommittee = buildLabExamCommittee(sortedCourses, teachersWithLabCourses, teachersWithoutLabCourses);

        let yearTermWiseLabExamCommittee = new Array(7);
        for(let i = 0; i < 7; i++) {
            yearTermWiseLabExamCommittee[i] = new Array(4);
            for(let j = 0; j < 4; j++) {
                yearTermWiseLabExamCommittee[i][j] = [];
            }
        }
        for(let i = 0; i < labExamCommittee.length; i++) {
            const year = labExamCommittee[i].year, term = labExamCommittee[i].term;
            yearTermWiseLabExamCommittee[year][term].push(labExamCommittee[i]);
        }

        // createLabExamCommitteeDatabase(yearTermWiseLabExamCommittee);
        updateDatabaseLabExamCommittee(yearTermWiseLabExamCommittee);
        res.json({ success: true, data: yearTermWiseLabExamCommittee });
    } catch (error) {
        console.error("An error occurred into the generate random lab exam committee:", error);
        res.send({ success: false, error: "Internal Server Error" });
    }
});

module.exports = app;