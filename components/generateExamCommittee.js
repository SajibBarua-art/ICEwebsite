const express = require('express');
const app = express.Router();
const mongoose = require('mongoose');
const Teacher = mongoose.model('teachers');
const CourseDetails = mongoose.model('courseDetails');

const examCommitteeSchema = new mongoose.Schema({
    theory: {
        type: Array,
        required: true
    }
});

const ExamComittee = mongoose.model('examcommittees', examCommitteeSchema);

const createRoutineDatabase = async (examCommittee) => {
    try {
        const newExamComittee = new ExamComittee({
            theory: examCommittee
        });

        await newExamComittee.save();
        console.log('Exam Committee saved');
    } catch (err) {
        console.error('Error saving examComittee:', err);
    }
};

const updateDatabaseExamCommittee = async (newExamComitteeMatrix) => {
    try {
        const result = await ExamComittee.findOneAndUpdate(
            {}, // Match all documents
            { $set: { theory: newExamComitteeMatrix } },
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
                if(courseDetails.type !== 'theory') {
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

const rearrangeCourses = (allTeacherCourse) => {
    var yearTermWiseCourse = new Array(7);
    for (let i = 0; i < 7; i++) {
        yearTermWiseCourse[i] = new Array(4);
        for (let j = 0; j < 4; j++) {
            yearTermWiseCourse[i][j] = [];
        }
    }

    for(const teacherCourse of allTeacherCourse) {
        const course = teacherCourse.course;
        const year = course.year, term = course.term;
        yearTermWiseCourse[year][term].push(teacherCourse);
    }

    for(let i = 1; i <= 4; i++) {
        yearTermWiseCourse[i][1].sort((a, b) => a.course.code.localeCompare(b.course.code));
        yearTermWiseCourse[i][2].sort((a, b) => a.course.code.localeCompare(b.course.code));
    }

    return yearTermWiseCourse;
}


const buildExamCommittee = (teacherCourseDetails, teachersInfoSortedByCourses, teachersInfoSortedByJoiningDate) => {
    const len = teacherCourseDetails.length;
    const examCommittee = new Array(len);
    for(let i = 0; i < len; i++) {
        examCommittee[i] = new Array(4);
    }

    let takenTeachers = new Array(len);
    for(let i = 0; i < len; i++) {
        takenTeachers[i] = new Set();
    }

    // to 1st examiner
    for(let i = 0; i < len; i++) {
        const teacher = teacherCourseDetails[i].teacher;
        const course = teacherCourseDetails[i].course;
        const name = teacher.firstName + ' ' + teacher.lastName;
        const teacherCode = teacher.teacherCode;

        takenTeachers[i].add(teacherCode);
        examCommittee[i][0] = {
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
                remark: '1st Examiner'
            }
        }
    }

    // to 2nd examiner
    for(let i = 0; i < len; i++) {
        let teacher;
        if(teacherCourseDetails[i].hasOwnProperty('teacher2')) {
            teacher = teacherCourseDetails[i].teacher2;
        }
        else {
            let teacherInd = 0;
            teacher = teachersInfoSortedByCourses[teacherInd];
            while(takenTeachers[i].has(teacher.teacherCode)) {
                teacherInd++;
                if(teacherInd === teachersInfoSortedByCourses.length) {
                    teacherInd = 0;
                }
                teacher = teachersInfoSortedByCourses[teacherInd];
            }
            teachersInfoSortedByCourses.push(teachersInfoSortedByCourses[teacherInd]);
            teachersInfoSortedByCourses.splice(teacherInd, 1);
        }

        takenTeachers[i].add(teacher.teacherCode);
        const name = teacher.firstName + ' ' + teacher.lastName;
        examCommittee[i][1] = {
            teacher: {
                name: name,
                designation: teacher.designation,
                department: teacher.department,
                remark: '2nd Examiner'
            }
        }
    }

    // to 3rd and 4th examiner
    for(let i = 0; i < 2*len; i++) {
        let teacherInd = 0;
        let teacher = teachersInfoSortedByJoiningDate[teacherInd];
        while(takenTeachers[i%len].has(teacher.teacherCode)) {
            teacherInd++;
            if(teacherInd === teachersInfoSortedByJoiningDate.length) {
                teacherInd = 0;
            }
            teacher = teachersInfoSortedByJoiningDate[teacherInd];
        }
        teachersInfoSortedByJoiningDate.push(teachersInfoSortedByJoiningDate[teacherInd]);
        teachersInfoSortedByJoiningDate.splice(teacherInd, 1);
        takenTeachers[i%len].add(teacher.teacherCode);

        const name = teacher.firstName + ' ' + teacher.lastName;
        examCommittee[i%len][2 + (i >= len)] = {
            teacher: {
                name: name,
                designation: teacher.designation,
                department: teacher.department,
                remark: (i < len) ? '3rd Examiner': '4th Examiner'
            }
        }
    }

    return examCommittee;
}

// Generate a random examComittee route
app.get('/', async (req, res) => {
    try {
        // Retrieve all teachers info from the MongoDB database
        const teachersInfo = await Teacher.find({}).lean(); // Use .lean() to get plain JavaScript objects
        const coursesInfo = await CourseDetails.find({}).lean();

        const allTeacherCourse = buildTeacherCourseObjects(teachersInfo, coursesInfo);
        const yearTermWiseCourse = rearrangeCourses(allTeacherCourse);
        const teachersInfoSortedByCourses = teachersInfo, teachersInfoSortedByJoiningDate = teachersInfo;
        teachersInfoSortedByCourses.sort((a, b) => b.courses.length - a.courses.length);
        teachersInfoSortedByJoiningDate.sort((a, b) => new Date(a.joiningDate) - new Date(b.joiningDate));
        const sortedCourses = [];
        for(let i = 4; i > 0; i--) {
            sortedCourses.push(...yearTermWiseCourse[i][1]);
            sortedCourses.push(...yearTermWiseCourse[i][2]);
        }
        
        const examCommittee = buildExamCommittee(sortedCourses, teachersInfoSortedByCourses, teachersInfoSortedByJoiningDate);
        let yearTermWiseExamCommittee = new Array(7);
        for(let i = 0; i < 7; i++) {
            yearTermWiseExamCommittee[i] = new Array(4);
            for(let j = 0; j < 4; j++) {
                yearTermWiseExamCommittee[i][j] = [];
            }
        }

        for(let i = 0; i < examCommittee.length; i++) {
            const year = examCommittee[i][0].course.year, term = examCommittee[i][0].course.term;
            yearTermWiseExamCommittee[year][term].push(examCommittee[i]);
        }

        // createRoutineDatabase(yearTermWiseExamCommittee);
        updateDatabaseExamCommittee(yearTermWiseExamCommittee);
        res.json(yearTermWiseExamCommittee);
    } catch (error) {
        console.error("An error occurred into the generate random examComittee:", error);
        res.status(500).send("Internal Server Error");
    }
});

module.exports = {
    app,
    rearrangeCourses
};