const fs = require('fs');
const FastPriorityQueue = require('fastpriorityqueue');

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

const shuffleArray = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
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
const generateExamCommittee = () => {
    const teachersInfoString = fs.readFileSync('./database/teachersInfoString.json', 'utf-8');
    const coursesInfoString = fs.readFileSync('./database/courseInfoString.json', 'utf-8');

    const teachersInfo = JSON.parse(teachersInfoString);
    const coursesInfo = JSON.parse(coursesInfoString);

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

    console.log(yearTermWiseLabExamCommittee[3][2]);

    // createRoutineDatabase(yearTermWiseLabExamCommittee);
    // updateDatabaseExamCommittee(yearTermWiseLabExamCommittee);
    // res.json({ success: true, data: yearTermWiseLabExamCommittee });

};

generateExamCommittee();