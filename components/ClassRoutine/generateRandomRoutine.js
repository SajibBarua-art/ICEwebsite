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
    createdAt: {
        type: Date,
        default: Date.now,
    },
    routineDetails: {
        type: [
            {
                session: String,
                totalStudents: String
            }
        ]
    }
});

const Routine = mongoose.model('routine', routineSchema);

const createRoutineDatabase = async (routineMatrix, yearTerm, teachersName, getYear, getSemester, getDate, getRoutineDetails) => {
    try {
        // Create a new routine object
        const newRoutine = new Routine({
            overall: routineMatrix,
            yearTerm: yearTerm,
            routineTeachersName: teachersName,
            year: getYear,
            semester: getSemester,
            classStartDate: getDate,
            routineDetails: getRoutineDetails
        });

        console.log(getYear, getSemester);

        // Save the new routine
        const savedRoutine = await newRoutine.save();
        console.log('Routine saved');

        // Check if the total number of objects exceeds 10
        const routineCount = await Routine.countDocuments();
        console.log("Document count: ", routineCount);

        if (routineCount > 10) {
            // Find and delete the oldest routine based on the classStartDate
            const oldestRoutine = await Routine.findOne().sort({ createdAt: 1 });
            await Routine.findByIdAndDelete(oldestRoutine._id);
            console.log('Oldest routine deleted');
        }

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
            console.log('Routine updated');
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

        console.log(routineDetails);

        // Retrieve all teachers info from the MongoDB database
        const teachersInfo = await Teacher.find({}).lean(); // Use .lean() to get plain JavaScript objects
        const coursesInfo = await CourseDetails.find({}).lean();
        const timeSlot = await TimeSlot.find({}).lean();
        const room = await Room.find({}).lean();

        const allTeacherCourse = buildTeacherCourseObjects(teachersInfo, coursesInfo);

        // divide the courses according to the electrical lab, computer lab and theory
        const electricalLabDetails = [], computerLabDetails = [], theoryDetails = [];
        for(const teacherCourse of allTeacherCourse) {
            const course = teacherCourse.course;
            if(course.type === 'theory') {
                theoryDetails.push(teacherCourse);
            } else if(course.type === 'computer lab') {
                computerLabDetails.push(teacherCourse);
            } else if(course.type === 'electrical lab') {
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
        for(let day = 0; day < totalDay; day++) {
            routineMatrix[day] = new Array(totalYear);
            for(let year = 0; year <= totalYear; year++) {
                routineMatrix[day][year] = new Array(totalTerm);
                for(let term = 0; term <= totalTerm; term++) {
                    routineMatrix[day][year][term] = new Array(totalTimeslot);
                    for(let timeslot = 0; timeslot < totalTimeslot; timeslot++) {
                        routineMatrix[day][year][term][timeslot] = {isAllocated: false};
                    }
                }
            }
        }

        // To handle electrical lab
        var indexIncrement = 0;
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

        // const data = updateDatabaseRoutine(routineMatrix, yearTerm, teachersName, year, semester, classStartDate);
        const data = await createRoutineDatabase(routineMatrix, yearTerm, teachersName, year, semester, classStartDate, routineDetails);
        // console.log(data);
        res.json({ success: true, data });
    } catch (error) {
        console.error("An error occurred into the generate random routine:", error);
        res.send({ success: false, error: "Internal Server Error! Try again." });
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
};

const shuffleArray = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

const breakIntoSingleSlot = roomTimeSlots => {
    const singleSlots = [ ...roomTimeSlots ];

    for(const slot of roomTimeSlots) {
        const newSlot = { ...slot };
        newSlot.timeSlotInd++;
        singleSlots.push(newSlot);
    }
    return singleSlots;
}

const divideBySlots = (rooms, timeslots, totalDay, isLab, indexIncrement) => {
    const roomTimeSlots = [];
    var inc = 1; if(isLab) inc = 2;

    for(let roomIndex = 0; roomIndex < rooms.length; roomIndex++) {
        for(let slotIndex = inc - 1; slotIndex < timeslots.length; slotIndex += inc) {
            for(let day = 0; day < totalDay; day++) {
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

    for(let roomIndex = 0; roomIndex < rooms.length; roomIndex++) {
        for(let day = 0; day < totalDay; day++) {
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
    for(const courseDetails of coursesDetails) {
        const year = courseDetails.course.year;
        const term = courseDetails.course.term;
        yearTermSet.add(year*10+term);
    }
    yt = [...yearTermSet];
    yt.sort((a, b) => a - b);
    yearTerm = []
    yt.forEach(yt => {
      yearTerm.push([Math.floor(yt/10), yt%10])
    })
    return yearTerm;
}

const buildRoutineMatrix = (routineMatrix, roomTimeSlots, coursesDetails, allRoom) => {
    if(coursesDetails.length > roomTimeSlots.length) {
        console.log("!!! Error, roomTimeSlots is less than coursesDetails !!!");
        process.exit();
    }

    var slotIndex = 0, cnt = 0;
    var isRoomTaken = new Array(10), isTeacherAllocated = new Array(10);
    for(let day = 0; day < 10; day++) {
        isRoomTaken[day] = new Array(10);
        isTeacherAllocated[day] = new Array(10);
        for(let timeSlot = 0; timeSlot < 10; timeSlot++) {
            isRoomTaken[day][timeSlot] = new Array(10);
            isTeacherAllocated[day][timeSlot] = new Set();
            for(let room = 0; room < 10; room++) {
                isRoomTaken[day][timeSlot][room] = false;
            }
        }
    }

    var slotIndex = 0, cnt = 0;
    for(const courseDetails of coursesDetails) {
        const year = courseDetails.course.year;
        const term = courseDetails.course.term;
        const credit = courseDetails.course.credit;
        const teacherCode = courseDetails.teacher.teacherCode;

        for(let j = 0; j < credit; j++) {
            var curSlotIndex = slotIndex;
            var day = roomTimeSlots[curSlotIndex].dayInd;
            var timeSlot = roomTimeSlots[curSlotIndex].timeSlotInd;
            var roomInd = roomTimeSlots[slotIndex].roomInd;

            while(routineMatrix[day][year][term][timeSlot].isAllocated || isRoomTaken[day][timeSlot][roomInd] || isTeacherAllocated[day][timeSlot].has(teacherCode)) {
                curSlotIndex++;
                if(curSlotIndex === roomTimeSlots.length) {
                    console.log('error', );
                    process.exit();
                }
                day = roomTimeSlots[curSlotIndex].dayInd;
                timeSlot = roomTimeSlots[curSlotIndex].timeSlotInd;
                roomInd = roomTimeSlots[curSlotIndex].roomInd;
            }

            isRoomTaken[day][timeSlot][roomInd] = true;
            isTeacherAllocated[day][timeSlot].add(teacherCode);
            routineMatrix[day][year][term][timeSlot] = {
                isAllocated: true,
                courseCode: courseDetails.course.code,
                teacherCode: teacherCode,
                room: allRoom[roomInd]
            }

            if(credit === 1) {
                routineMatrix[day][year][term][timeSlot + 1] = {
                    isAllocated: true,
                    courseCode: courseDetails.course.code,
                    teacherCode: teacherCode,
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
    shuffleArray
};