const express = require('express');
const app = express.Router();
const mongoose = require('mongoose');
const Teacher = mongoose.model('teachers');
const CourseDetails = mongoose.model('courseDetails');

const examCommitteeSchema = new mongoose.Schema({
    theory: {
        type: Array,
        required: true
    },
    teachers: {
        type: Map,
        of: [
            {
                courseCode: { type: String },
                courseName: { type: String },
                remark: { type: String }
            }
        ]
    },
    year: {
        type: String,
        required: true
    },
    semester: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
    }
});

const ExamCommittee = mongoose.model('examcommittees', examCommitteeSchema);

const createExamCommittee = async (newExamComitteeMatrix, teacherWithCourses, getYear, getSemester) => {
    try {
        // Create a new Exam Committee object
        const newExamCommittee = new ExamCommittee({
            theory: newExamComitteeMatrix,
            teachers: teacherWithCourses,
            year: getYear,
            semester: getSemester
        });

        console.log(newExamCommittee);

        // Save the new Exam Committee
        const savedExamCommittee = await newExamCommittee.save();
        console.log('ExamCommittee saved');

        // Check if the total number of objects exceeds 10
        const countDatabase = await ExamCommittee.countDocuments();
        console.log("Document count: ", countDatabase);

        if (countDatabase > 10) {
            // Find and delete the oldest Exam Committee based on the createdAt
            const oldestExamCommittee = await ExamCommittee.findOne().sort({ createdAt: 1 });
            await ExamCommittee.findByIdAndDelete(oldestExamCommittee._id);
            console.log('Oldest Exam Committee deleted');
        }

        return savedExamCommittee;
    } catch (err) {
        console.error('Error saving Exam Committee:', err);
    }
};

const updateDatabaseExamCommittee = async (newExamComitteeMatrix, teacherWithCourses) => {
    try {
        const result = await ExamCommittee.findOneAndUpdate(
            {}, // Match all documents
            {
                $set: {
                    theory: newExamComitteeMatrix,
                    teachers: teacherWithCourses
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
                if (courseDetails.type !== 'theory') {
                    continue;
                }
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

const buildTeacherCourse = (courseDistribution, teachersInfo, coursesInfo) => {
    const teacherCourseObjects = [];

    const courses = courseDistribution.courseDetails;

    for (let i = 0; i < courses.length; i++) {
        const courseCode = courses[i].courseCode;
        const courseObj = coursesInfo.find(c => c.code === courseCode);

        // to avoid the lab courses
        if(courseObj.type !== 'theory') {
            continue;
        }

        let teacherCourseObj = { course: courseObj };

        // swap the teacher, if 1st one is empty
        if(courses[i].teacherCode[0] === "") {
            [ courses[i].teacherCode[0], courses[i].teacherCode[1] ] = [ courses[i].teacherCode[1], courses[i].teacherCode[0] ];
            
            // no teacher assigned => leave it
            if(courses[i].teacherCode[0] === "") {
                continue;
            }
        }

        for (let j = 0; j < courses[i].teacherCode.length; j++) {
            const teacherCode = courses[i].teacherCode[j];

            if (teacherCode !== "") {
                const teacherObj = teachersInfo.find(t => t.teacherCode === teacherCode);

                // to avoid the other department teachers
                if(teacherObj.department !== 'ICE, NSTU') {
                    continue;
                }

                if (j == 0) {
                    teacherCourseObj['teacher'] = teacherObj;
                } else {
                    teacherCourseObj['teacher2'] = teacherObj;
                }
            }
        }
        teacherCourseObjects.push(teacherCourseObj);
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

const buildExamCommittee = (teacherCourseDetails, teachersInfoSortedByCourses, teachersInfoSortedByJoiningDate, teacherWithCourses) => {
    const len = teacherCourseDetails.length;
    const examCommittee = new Array(len);
    for (let i = 0; i < len; i++) {
        examCommittee[i] = new Array(4);
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

        // to handle teacher with courses database
        const teacherName = removePunctuation(name);
        const courseDetails = {
            courseCode: examCommittee[i][0].course.code,
            courseName: examCommittee[i][0].course.name,
            remark: '1st Examiner'
        }
        if (teacherWithCourses[teacherName]) {
            // If the array already exists, push the new object
            teacherWithCourses[teacherName].push(courseDetails);
        } else {
            // If the array doesn't exist, create it with the new object as the first element
            teacherWithCourses[teacherName] = [courseDetails];
        }
    }

    // to 2nd examiner
    for (let i = 0; i < len; i++) {
        let teacher;
        if (teacherCourseDetails[i].hasOwnProperty('teacher2')) {
            teacher = teacherCourseDetails[i].teacher2;
        }
        else {
            let teacherInd = 0;
            teacher = teachersInfoSortedByCourses[teacherInd];
            while (takenTeachers[i].has(teacher.teacherCode)) {
                teacherInd++;
                if (teacherInd === teachersInfoSortedByCourses.length) {
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

        // to handle teacher with courses database
        const teacherName = removePunctuation(name);
        const courseDetails = {
            courseCode: examCommittee[i][0].course.code,
            courseName: examCommittee[i][0].course.name,
            remark: '2nd Examiner'
        }
        if (teacherWithCourses[teacherName]) {
            // If the array already exists, push the new object
            teacherWithCourses[teacherName].push(courseDetails);
        } else {
            // If the array doesn't exist, create it with the new object as the first element
            teacherWithCourses[teacherName] = [courseDetails];
        }
    }

    // to 3rd and 4th examiner
    for (let i = 0; i < 2 * len; i++) {
        let teacherInd = 0;
        let teacher = teachersInfoSortedByJoiningDate[teacherInd];
        while (takenTeachers[i % len].has(teacher.teacherCode)) {
            teacherInd++;
            if (teacherInd === teachersInfoSortedByJoiningDate.length) {
                teacherInd = 0;
            }
            teacher = teachersInfoSortedByJoiningDate[teacherInd];
        }
        teachersInfoSortedByJoiningDate.push(teachersInfoSortedByJoiningDate[teacherInd]);
        teachersInfoSortedByJoiningDate.splice(teacherInd, 1);
        takenTeachers[i % len].add(teacher.teacherCode);

        const name = teacher.firstName + ' ' + teacher.lastName;
        examCommittee[i % len][2 + (i >= len)] = {
            teacher: {
                name: name,
                designation: teacher.designation,
                department: teacher.department,
                remark: (i < len) ? '3rd Examiner' : '4th Examiner'
            }
        }

        // to handle teacher with courses database
        const teacherName = removePunctuation(name);
        const courseDetails = {
            courseCode: examCommittee[i % len][0].course.code,
            courseName: examCommittee[i % len][0].course.name,
            remark: (i < len) ? '3rd Examiner' : '4th Examiner'
        }
        if (teacherWithCourses[teacherName]) {
            // If the array already exists, push the new object
            teacherWithCourses[teacherName].push(courseDetails);
        } else {
            // If the array doesn't exist, create it with the new object as the first element
            teacherWithCourses[teacherName] = [courseDetails];
        }
    }

    return examCommittee;
}

// Generate a random examComittee route
app.post('/', async (req, res) => {
    try {
        const { year, semester } = req.body;
        const yearSemester = year.toString() + semester.toString();

        // console.log(yearSemester);

        // Retrieve all teachers info from the MongoDB database
        const CourseDistribution = mongoose.model('coursedistributions');
        const courseDistribution = await CourseDistribution.find({ yearSemester }).lean();
        if(!courseDistribution.length) {
            res.json({ success: false, error: "Your provided Year and Semester is not correct!" });
            return;
        }

        const teachersInfo = await Teacher.find({}).lean(); // Use .lean() to get plain JavaScript objects
        const coursesInfo = await CourseDetails.find({}).lean();

        // const allTeacherCourse = buildTeacherCourseObjects(teachersInfo, coursesInfo);
        const allTeacherCourse = buildTeacherCourse(courseDistribution[0], teachersInfo, coursesInfo);
        const yearTermWiseCourse = rearrangeCourses(allTeacherCourse);
        const teachersInfoSortedByCourses = teachersInfo, teachersInfoSortedByJoiningDate = teachersInfo;
        
        teachersInfoSortedByCourses.sort((a, b) => b.courses.length - a.courses.length);
        teachersInfoSortedByJoiningDate.sort((a, b) => new Date(a.joiningDate) - new Date(b.joiningDate));
        
        const sortedCourses = [];
        for (let i = 4; i > 0; i--) {
            sortedCourses.push(...yearTermWiseCourse[i][1]);
            sortedCourses.push(...yearTermWiseCourse[i][2]);
        }

        let teacherWithCourses = {};
        const examCommittee = buildExamCommittee(sortedCourses, teachersInfoSortedByCourses, teachersInfoSortedByJoiningDate, teacherWithCourses);
        let yearTermWiseExamCommittee = new Array(7);
        for (let i = 0; i < 7; i++) {
            yearTermWiseExamCommittee[i] = new Array(4);
            for (let j = 0; j < 4; j++) {
                yearTermWiseExamCommittee[i][j] = [];
            }
        }

        for (let i = 0; i < examCommittee.length; i++) {
            const year = examCommittee[i][0].course.year, term = examCommittee[i][0].course.term;
            yearTermWiseExamCommittee[year][term].push(examCommittee[i]);
        }

        // createRoutineDatabase(yearTermWiseExamCommittee);
        // updateDatabaseExamCommittee(yearTermWiseExamCommittee, teacherWithCourses);
        const data = {
            year, semester,
            theory: yearTermWiseExamCommittee,
            teachers: teacherWithCourses
        }
        res.json({ success: true, data });
    } catch (error) {
        console.error("An error occurred into the generate random examComittee:", error);
        res.send({ success: false, error: "Internal Server Error" });
    }
});

app.post('/data', async (req, res) => {
    try {
        const { data } = req.body;

        const result = await createExamCommittee(data.theory, data.teachers, data.year, data.semester);
        // console.log(data);
        res.json({ success: true, data: result });
    } catch (error) {
        console.error("An error occurred into the save routine:", error);
        res.send({ success: false, error: "Internal Server Error! Try again." });
    }
});

module.exports = {
    app,
    rearrangeCourses
};