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

const print = (roomAllocated) => {
    var e = 0, c = 0, t = 0;
    for(let i = 0; i < roomAllocated.length; i++) {
        for(let j = 0; j < roomAllocated[i].length; j++) {
            for(let k = 0; k < roomAllocated[i][j].length; k++) {
                for(let m = 0; m < roomAllocated[i][j][k].length; m++) {
                    if(roomAllocated[i][j][k][m].isAllocated) {
                        const str = roomAllocated[i][j][k][m].course.type;
    
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

const print2 = (roomAllocated) => {
    var e = 0, c = 0, t = 0;
    for(let i = 0; i < roomAllocated.length; i++) {
        for(let j = 0; j < roomAllocated[i].length; j++) {
            for(let k = 0; k < roomAllocated[i][j].length; k++) {
                if(roomAllocated[i][j][k].isAllocated) {
                    const str = roomAllocated[i][j][k].course.type;

                    if(str === 'theory') t++;
                    else if(str === 'electrical lab') e++;
                    else if (str === 'computer lab') c++;
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

const roomAllocation = (roomAllocated, roomTimeSlots, teacherCourses, isLab) => {
    roomTimeSlots.reverse();
    for(const teacherCourse of teacherCourses) {
        for(let i = 0; i < teacherCourse.course.credit; i++) {
            if(roomTimeSlots.length === 0) {
                console.log("!!! Room Allocation Failed! Due to insufficient room !!!");
                break;
            }

            const slot = roomTimeSlots.pop();
            roomAllocated[slot.dayInd][slot.roomInd][slot.timeSlotInd] = {
                isAllocated: true,
                ...teacherCourse
            };

            if(isLab) {
                // console.log(slot.dayInd, slot.roomInd, slot.timeSlotInd + 1);

                roomAllocated[slot.dayInd][slot.roomInd][slot.timeSlotInd + 1] = {
                    isAllocated: true,
                    ...teacherCourse
                }; 
            }
        }
    }

    return roomAllocated;
}

const buildRoutineMatrix = (roomAllocated, routineMatrix, allRoom) => {
    for(let day = 0; day < roomAllocated.length; day++) {
        for(let room = 0; room < roomAllocated[day].length; room++) {
            for(let timeSlot = 0; timeSlot < roomAllocated[day][room].length; timeSlot++) {
                if(roomAllocated[day][room][timeSlot].isAllocated) {
                    const year = roomAllocated[day][room][timeSlot].course.year;
                    const term = roomAllocated[day][room][timeSlot].course.term;

                    routineMatrix[day][year][term][timeSlot] = {
                        isAllocated: true,
                        ...roomAllocated[day][room][timeSlot],
                        roomNo: allRoom[room]
                    }
                }
            }
        }
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

    // roomAllocated: [day][room][timeslot]
    // initializing a 3D array
    const totalDay = 5, totalRoom = allRoom.length, totalTimeslot = timeSlots.length;
    const roomAllocated = new Array(totalDay);
    for(let i = 0; i < totalDay; i++) {
        roomAllocated[i] = new Array(totalRoom);
        for(let j = 0; j < totalRoom; j++) {
            roomAllocated[i][j] = new Array(totalTimeslot);

            for(let k = 0; k < totalTimeslot; k++) {
                roomAllocated[i][j][k] = {isAllocated: false};
            }
        }
    }

    // To handle electrical lab
    var indexIncrement = 0;
    const electricalRoomTimeSlots = divideBySlots(electricalRoom, timeSlots, totalDay, true, indexIncrement);
    roomAllocation(roomAllocated, electricalRoomTimeSlots, electricalLabDetails, true);
    // print(roomAllocated);

    // To handle computer lab
    indexIncrement = electricalRoom.length;
    const computerRoomTimeSlots = divideBySlots(computerRoom, timeSlots, totalDay, true, indexIncrement);
    roomAllocation(roomAllocated, computerRoomTimeSlots, computerLabDetails, true);
    // print(roomAllocated);

    // To handle theory courses
    indexIncrement = electricalRoom.length + computerRoom.length;
    const theoryRoomTimeSlots = divideBySlots(theoryRoom, timeSlots, totalDay, false, indexIncrement);
    // add the extra computer room to the theory room which are not allocated
    // theoryRoomTimeSlots += computerRoomTimeSlots(1 consecutive slot)
    const computerSingleSlots = breakIntoSingleSlot(computerRoomTimeSlots);
    theoryRoomTimeSlots.push(...computerSingleSlots);
    roomAllocation(roomAllocated, theoryRoomTimeSlots, theoryDetails, false);

    // console.log(electricalRoomTimeSlots, computerRoomTimeSlots, theoryRoomTimeSlots);
    // print(roomAllocated);

    // Build routine matrix
    // routineMatrix[day][year][timeslot]
    // initializing a 4D array
    const totalYear = 4 + 2, totalTerm = 2 + 2;
    const routineMatrix = new Array(totalDay);
    for(let i = 0; i < totalDay; i++) {
        routineMatrix[i] = new Array(totalYear);
        for(let j = 0; j < totalYear; j++) {
            routineMatrix[i][j] = new Array(totalTerm);
            for(let m = 0; m < totalTerm; m++) {
                routineMatrix[i][j][m] = new Array(totalTimeslot);
                for(let k = 0; k < totalTimeslot; k++) {
                    routineMatrix[i][j][m][k] = {isAllocated: false};
                }
            }
        }
    }

    buildRoutineMatrix(roomAllocated, routineMatrix, allRoom);
    // console.log(routineMatrix[0][3][2]);
    print2(roomAllocated);
    print(routineMatrix);
}

generateRandomRoutine();

module.exports = app;