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
    timeslot: {
        type: Array,
        required: true
    }
});

const Routine = mongoose.model('routine', routineSchema);

const createRoutineDatabase = async (routineMatrix, yearTerm, teachersName, getYear, getSemester, getDate, getRoutineDetails, timeslot) => {
    try {
        // Create a new routine object
        const newRoutine = new Routine({
            overall: routineMatrix,
            yearTerm: yearTerm,
            routineTeachersName: teachersName,
            year: getYear,
            semester: getSemester,
            classStartDate: getDate,
            routineDetails: getRoutineDetails,
            timeslot: timeslot
        });

        // console.log(getYear, getSemester);

        // Check if the total number of objects exceeds 10
        const routineCount = await Routine.countDocuments();
        // console.log("Document count: ", routineCount);

        if (routineCount > 10) {
            // Find and delete the oldest routine based on the classStartDate
            const oldestRoutine = await Routine.findOne();
            await Routine.findByIdAndDelete(oldestRoutine._id);
            // console.log('Oldest routine deleted');
        }

        // Save the new routine
        const savedRoutine = await newRoutine.save();
        // console.log('Routine saved');

        return savedRoutine;
    } catch (err) {
        console.error('Error saving routine:', err);
    }
};

const updateDatabaseRoutine = async (newRoutineMatrix, yearTerm, teachersName, getYear, getSemester, getDate) => {
    try {
        const result = await Routine.findOneAndUpdate(
            {}, // Match all documents
            {
                $set: {
                    overall: newRoutineMatrix,
                    yearTerm: yearTerm,
                    routineTeachersName: teachersName,
                    year: getYear,
                    semester: getSemester,
                    classStartDate: getDate,
                    yearSemester: getYear + getSemester
                }
            }, // Update the "overall" field
            { new: true } // Return the updated document
        );

        if (result) {
            // console.log('Routine updated');
            return result;
        } else {
            console.log('No routine document found');
        }
    } catch (err) {
        console.error('Error updating routine:', err);
    }
};

const toGetTeachersName = (teachersInfo) => {
    let allTeacherName = [];
    for (const teacher of teachersInfo) {
        const teacherName = `${teacher.firstName} ${teacher.lastName}`
        allTeacherName.push(teacherName);
    }

    return allTeacherName;
}

// Generate a random routine route
app.post('/', async (req, res) => {
    try {
        const { year, semester, classStartDate, routineDetails } = req.body;
        const yearSemester = year.toString() + semester.toString();

        // Retrieve all teachers info from the MongoDB database
        const CourseDistributionManagement = mongoose.model('CourseDistributionManagement');
        const courseDistributionManagement = await CourseDistributionManagement.find({ yearSemester }).lean();

        // console.log(courseDistributionManagement);
        if(courseDistributionManagement.length === 0) {
            res.send({ success: false, error: "No data found on your specific year and semester!!!" });
            return;
        }
        const teachersInfo = await Teacher.find().sort({ firstName: 1, lastName: 1 }); // Use .lean() to get plain JavaScript objects
        const coursesInfo = await CourseDetails.find({}).lean();
        const timeSlot = await TimeSlot.find({}).lean();
        const room = await Room.find({}).lean();

        const mappedTeachers = buildMappedTeachers(teachersInfo);
        const mappedCourses = buildMappedCourses(coursesInfo);

        // const allTeacherCourse = buildTeacherCourseObjects(teachersInfo, coursesInfo);
        const allTeacherCourse = buildTeacherCourse(courseDistributionManagement[0], mappedTeachers, mappedCourses);
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

        // To handle electrical lab
        var indexIncrement = 0; // room index
        const electricalRoomTimeSlots = divideBySlots(electricalRoom, timeSlots, totalDay, true, indexIncrement);
        buildRoutineMatrix(routineMatrix, electricalRoomTimeSlots, electricalLabDetails, allRoom);
        
        // To handle computer lab
        indexIncrement = electricalRoom.length;
        const computerRoomTimeSlots = divideBySlots(computerRoom, timeSlots, totalDay, true, indexIncrement);
        const extraComputerLabSlots = extraSlots(computerRoom, totalDay, indexIncrement); // to add first timeSlot which is not included in lab part
        buildRoutineMatrix(routineMatrix, computerRoomTimeSlots, computerLabDetails, allRoom);
        // print(routineMatrix);

        // To handle theory courses
        indexIncrement = electricalRoom.length + computerRoom.length;
        var theoryRoomTimeSlots = divideBySlots(theoryRoom, timeSlots, totalDay, false, indexIncrement);
        // add the extra computer room to the theory room which are not allocated
        // theoryRoomTimeSlots += computerRoomTimeSlots(1 consecutive slot)
        const computerSingleSlots = breakIntoSingleSlot(computerRoomTimeSlots);
        theoryRoomTimeSlots.push(...extraComputerLabSlots);
        theoryRoomTimeSlots.push(...computerSingleSlots);
        buildRoutineMatrix(routineMatrix, theoryRoomTimeSlots, theoryDetails, allRoom);

        // To memorize all the year-term
        const yearTerm = buildYearTermMatrix(theoryDetails);

        // To memorize all the teachers name
        const teachersName = toGetTeachersName(teachersInfo);

        // console.log(routineMatrix);

        // const data = updateDatabaseRoutine(routineMatrix, yearTerm, teachersName, year, semester, classStartDate);
        const data = {
            overall: routineMatrix,
            yearTerm,
            routineTeachersName: teachersName,
            year,
            semester,
            classStartDate,
            routineDetails,
            timeslot: timeSlots
        }
        res.json({ success: true, data });
    } catch (error) {
        console.error("An error occurred into the generate random routine:", error);
        res.send({ success: false, error: "Internal Server Error! Try again." });
    }
});

// to store the routine
app.post('/data', async (req, res) => {
    try {
        const { data } = req.body;

        const result = await createRoutineDatabase(data.overall, data.yearTerm, data.routineTeachersName, data.year, data.semester, data.classStartDate, data.routineDetails, data.timeslot);
        // console.log(data);
        res.json({ success: true, data: result });
    } catch (error) {
        console.error("An error occurred into the save routine:", error);
        res.send({ success: false, error: "Internal Server Error! Try again." });
    }
});

// fetch data from teacher profile
const buildTeacherCourseObjects = (teachersInfo, coursesInfo) => {
    const teacherCourseObjects = [];

    const map1 = new Map();
    for (const teacher of teachersInfo) {
        const { courses, ...teacherWithoutCourses } = teacher;

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
};

const buildMappedCourses = (coursesInfo) => {
    const mappedCourses = new Map();
    for (const course of coursesInfo) {
        mappedCourses.set(course.code, course);
    }
    return mappedCourses;
}

const buildMappedTeachers = (teachersInfo) => {
    const mappedTeachers = new Map();
    for (const teacher of teachersInfo) {
        mappedTeachers.set(teacher.teacherCode, teacher);
    }
    return mappedTeachers;
}

// fetch data from course distributions
const buildTeacherCourse = (courseDistributionManagement, mappedTeachers, mappedCourses) => {
    const teacherCourseObjects = [];

    const courses = courseDistributionManagement.courseDetails;

    // console.log("Courses: ", courses);

    for (let i = 0; i < courses.length; i++) {
        const courseCode = courses[i].courseCode;
        const courseObj = mappedCourses.get(courseCode);
        let teacherCourseObj = { course: courseObj };

        // swap the teacher, if 1st one is empty
        if(courses[i].teacherCode[0] === "") {
            [ courses[i].teacherCode[0], courses[i].teacherCode[1] ] = [ courses[i].teacherCode[1], courses[i].teacherCode[0] ];
            
            // no teacher assigned => leave it
            if(courses[i].teacherCode[0] === "") {
                continue;
            }
        }

        let teacherAssigned = false;
        for (let j = 0; j < courses[i].teacherCode.length; j++) {
            const teacherCode = courses[i].teacherCode[j];

            if (teacherCode !== "") {
                const teacherObj = mappedTeachers.get(teacherCode);
                if (j == 0) {
                    teacherAssigned = true
                    teacherCourseObj['teacher'] = teacherObj;
                } else {
                    teacherAssigned = true;
                    teacherCourseObj['teacher2'] = teacherObj;
                }
            }
        }
        if(teacherAssigned === true) {
            teacherCourseObjects.push(teacherCourseObj);
        }
    }

    // console.log("Teacher Course Objects: ", teacherCourseObjects);
    return teacherCourseObjects;
}

const shuffleArray = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

const breakIntoSingleSlot = roomTimeSlots => {
    const singleSlots = [...roomTimeSlots];

    for (const slot of roomTimeSlots) {
        const newSlot = { ...slot };
        newSlot.timeSlotInd++;
        singleSlots.push(newSlot);
    }
    return singleSlots;
}

const divideBySlots = (rooms, timeslots, totalDay, isLab, indexIncrement) => {
    const roomTimeSlots = [];
    var inc = 1; if (isLab) inc = 2;

    for (let roomIndex = 0; roomIndex < rooms.length; roomIndex++) {
        for (let slotIndex = inc - 1; slotIndex < timeslots.length; slotIndex += inc) {
            for (let day = 0; day < totalDay; day++) {
                const obj = {
                    roomInd: indexIncrement + roomIndex,
                    timeSlotInd: slotIndex,
                    dayInd: day
                }
                roomTimeSlots.push(obj);
            }
        }
    }

    return roomTimeSlots;
}

const extraSlots = (rooms, totalDay, indexIncrement) => {
    const roomTimeSlots = [];

    for (let roomIndex = 0; roomIndex < rooms.length; roomIndex++) {
        for (let day = 0; day < totalDay; day++) {
            const obj = {
                roomInd: indexIncrement + roomIndex,
                timeSlotInd: 0,
                dayInd: day
            }
            roomTimeSlots.push(obj);
        }
    }

    return roomTimeSlots;
}

const buildYearTermMatrix = (coursesDetails) => {
    let yearTermSet = new Set();
    for (const courseDetails of coursesDetails) {
        const year = courseDetails.course.year;
        const term = courseDetails.course.term;
        yearTermSet.add(year * 10 + term);
    }
    yt = [...yearTermSet];
    yt.sort((a, b) => a - b);
    yearTerm = []
    yt.forEach(yt => {
        yearTerm.push([Math.floor(yt / 10), yt % 10])
    })
    return yearTerm;
}

const buildRoutineMatrix = (routineMatrix, roomTimeSlots, coursesDetails, allRoom) => {
    if (coursesDetails.length > roomTimeSlots.length) {
        console.log("!!! Error, Room Time Slots is less than coursesDetails !!!");
        process.exit();
    }

    var cnt = 0;
    var isRoomTaken = new Array(10), isTeacherAllocated = new Array(10);
    for (let day = 0; day < 10; day++) {
        isRoomTaken[day] = new Array(10);
        isTeacherAllocated[day] = new Array(10);
        for (let timeSlot = 0; timeSlot < 10; timeSlot++) {
            isRoomTaken[day][timeSlot] = new Array(10);
            isTeacherAllocated[day][timeSlot] = new Set();
            for (let room = 0; room < 10; room++) {
                isRoomTaken[day][timeSlot][room] = false;
            }
        }
    }

    var slotIndex = 0; cnt = 0;
    for (const courseDetails of coursesDetails) {
        const year = courseDetails.course.year;
        const term = courseDetails.course.term;
        const credit = Math.ceil(parseFloat(courseDetails.course.credit));
        
        // if(courseDetails['teacher'] === undefined) {
        //     console.log(courseDetails);
        // }
        if(courseDetails.teacher === undefined || courseDetails.teacher.teacherCode === '') {
            continue;
        }
        let teacherCode = courseDetails.teacher.teacherCode;

        let teacher2Code = '';
        if (courseDetails.hasOwnProperty('teacher2')) {
            teacher2Code = courseDetails.teacher2.teacherCode;
        }

        for (let j = 0; j < credit; j++) {
            var curSlotIndex = slotIndex;
            var day = roomTimeSlots[curSlotIndex].dayInd;
            var timeSlot = roomTimeSlots[curSlotIndex].timeSlotInd;
            var roomInd = roomTimeSlots[slotIndex].roomInd;

            while (routineMatrix[day][year][term][timeSlot].isAllocated ||
                isRoomTaken[day][timeSlot][roomInd] ||
                isTeacherAllocated[day][timeSlot].has(teacherCode) ||
                (teacher2Code !== '' && isTeacherAllocated[day][timeSlot].has(teacher2Code))) {
                curSlotIndex++;
                if (curSlotIndex === roomTimeSlots.length) {
                    console.log('Not enough room slots!',);
                    process.exit();
                }
                day = roomTimeSlots[curSlotIndex].dayInd;
                timeSlot = roomTimeSlots[curSlotIndex].timeSlotInd;
                roomInd = roomTimeSlots[curSlotIndex].roomInd;
            }

            isRoomTaken[day][timeSlot][roomInd] = true;
            isTeacherAllocated[day][timeSlot].add(teacherCode);
            if (teacher2Code !== '') {
                isTeacherAllocated[day][timeSlot].add(teacher2Code);
                teacherCode = teacherCode + ', ' + teacher2Code;
            }
            routineMatrix[day][year][term][timeSlot] = {
                isAllocated: true,
                ...courseDetails,
                room: allRoom[roomInd]
            }

            if (credit === 1) {
                routineMatrix[day][year][term][timeSlot + 1] = {
                    isAllocated: true,
                    ...courseDetails,
                    room: allRoom[roomInd]
                }
            }

            // swapping
            [roomTimeSlots[curSlotIndex], roomTimeSlots[slotIndex]] = [roomTimeSlots[slotIndex], roomTimeSlots[curSlotIndex]];
        }
        slotIndex++; cnt++;
    }
}

module.exports = {
    app,
    shuffleArray,
    buildTeacherCourse,
    toGetTeachersName,
    buildYearTermMatrix,
    extraSlots,
    breakIntoSingleSlot,
    buildMappedCourses,
    buildMappedTeachers
};