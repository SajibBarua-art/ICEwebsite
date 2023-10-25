const express = require('express');
const app = express.Router();
const fs = require('fs');

const buildTeacherCourseObjects = (teachersInfo, coursesInfo) => {
    const teacherCourseObjects = [];
  
    for (const teacher of teachersInfo) {
        const { courses, ...teacherWithoutCourses } = teacher;
  
        for (const courseCode of courses) {
            const courseDetails = coursesInfo.find((course) => course.code === courseCode);

            if (courseDetails) {
                const teacherWithCourseDetails = { teacher: teacherWithoutCourses, course: courseDetails };
                teacherCourseObjects.push(teacherWithCourseDetails);
            }
        }
    }
  
    return teacherCourseObjects;
};

const print = (routineMatrix) => {
    var e = 0, c = 0, t = 0;
    for(let i = 0; i < routineMatrix.length; i++) {
        for(let j = 0; j < routineMatrix[i].length; j++) {
            for(let k = 0; k < routineMatrix[i][j].length; k++) {
                for(let m = 0; m < routineMatrix[i][j][k].length; m++) {
                    if(routineMatrix[i][j][k][m].isAllocated) {
                        const str = routineMatrix[i][j][k][m].course.type;
    
                        if(str === 'theory') t++;
                        else if(str === 'electrical lab') e++;
                        else if (str === 'computer lab') c++;
                    }
                }
            }
        }
    }

    console.log(e, c, t)
}

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
        for(let slotIndex = 0; slotIndex < timeslots.length; slotIndex += inc) {
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

const buildRoutineMatrix = (routineMatrix, roomTimeSlots, coursesDetails, allRoom) => {
    if(coursesDetails.length > roomTimeSlots.length) {
        console.log("!!! Error, roomTimeSlots is less than coursesDetails !!!");
        process.exit();
    }

    var slotIndex = 0, cnt = 0;
    for(const courseDetails of coursesDetails) {
        const year = courseDetails.course.year;
        const term = courseDetails.course.term;
        const credit = courseDetails.course.credit;

        for(let j = 0; j < credit; j++) {
            var curSlotIndex = slotIndex;
            var day = roomTimeSlots[curSlotIndex].dayInd;
            var timeSlot = roomTimeSlots[curSlotIndex].timeSlotInd;

            while(routineMatrix[day][year][term][timeSlot].isAllocated) {
                curSlotIndex++;
                if(curSlotIndex === roomTimeSlots.length) {
                    console.log('error', );
                    process.exit();
                }
                day = roomTimeSlots[curSlotIndex].dayInd;
                timeSlot = roomTimeSlots[curSlotIndex].timeSlotInd;
            }

            const roomInd = roomTimeSlots[slotIndex].roomInd;
            routineMatrix[day][year][term][timeSlot] = {
                isAllocated: true,
                ...courseDetails,
                room: allRoom[roomInd]
            }

            if(credit === 1) {
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

function generateRandomRoutine() {
    // Retrieve all teachers info from the MongoDB database
    const teachersInfoString = fs.readFileSync('./database/teachersInfoString.json', 'utf-8');
    const coursesInfoString = fs.readFileSync('./database/courseInfoString.json', 'utf-8');
    const timeSlotString = fs.readFileSync('./database/timeSlotString.json', 'utf-8');
    const roomString = fs.readFileSync('./database/roomString.json', 'utf-8');

    const teachersInfo = JSON.parse(teachersInfoString);
    const coursesInfo = JSON.parse(coursesInfoString);
    const timeSlot = JSON.parse(timeSlotString);
    const room = JSON.parse(roomString);

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

    // console.log(electricalLabDetails.length, computerLabDetails.length, theoryDetails.length);

    const electricalRoom = room[0].lab.electrical;
    const computerRoom = room[0].lab.computer;
    const theoryRoom = room[0].theory;
    const timeSlots = timeSlot[0].timeSlot;
    const allRoom = [...electricalRoom, ...computerRoom, ...theoryRoom];

    // Build routine matrix
    // routineMatrix[day][year][timeslot]
    // initializing a 4D array
    const totalDay = 5, totalYear = 4 + 2, totalTerm = 2 + 2, totalTimeslot = timeSlots.length;
    const routineMatrix = new Array(totalDay);
    for(let day = 0; day < totalDay; day++) {
        routineMatrix[day] = new Array(totalYear);
        for(let year = 0; year < totalYear; year++) {
            routineMatrix[day][year] = new Array(totalTerm);
            for(let term = 0; term < totalTerm; term++) {
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
    buildRoutineMatrix(routineMatrix, computerRoomTimeSlots, computerLabDetails, allRoom);
    // print(routineMatrix);

    // To handle theory courses
    indexIncrement = electricalRoom.length + computerRoom.length;
    const theoryRoomTimeSlots = divideBySlots(theoryRoom, timeSlots, totalDay, false, indexIncrement);
    // add the extra computer room to the theory room which are not allocated
    // theoryRoomTimeSlots += computerRoomTimeSlots(1 consecutive slot)
    const computerSingleSlots = breakIntoSingleSlot(computerRoomTimeSlots);
    theoryRoomTimeSlots.push(...computerSingleSlots);
    buildRoutineMatrix(routineMatrix, theoryRoomTimeSlots, theoryDetails, allRoom);

    return routineMatrix;
}

generateRandomRoutine();

module.exports = app;