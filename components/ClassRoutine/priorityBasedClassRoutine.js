const express = require('express');
const app = express.Router();
const mongoose = require('mongoose');
const Teacher = mongoose.model('teachers');
const CourseDetails = mongoose.model('courseDetails');
const TimeSlot = mongoose.model('timeSlot');
const Room = mongoose.model('room');
const TeacherSlotsPriority = mongoose.model('slotPriority');

const priorityBasedRoutineManagementSchema = new mongoose.Schema({
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
    createdAt: {
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
    room: {
        type: Object,
        required: true
    },
    timeslot: {
        type: Array,
        required: true
    }
});

const PriorityBasedRoutine = mongoose.model('priorityBasedRoutine', priorityBasedRoutineManagementSchema);
const { shuffleArray, buildTeacherCourse, toGetTeachersName, buildYearTermMatrix, extraSlots } = require('./generateRandomRoutine');

app.post('/', async(req, res) => {
    try {
        const { year, semester } = req.body;
        const yearSemester = year.toString() + semester.toString();

        // Retrieve all teachers info from the MongoDB database
        const CourseDistributionManagement = mongoose.model('CourseDistributionManagement');
        const courseDistributionManagement = await CourseDistributionManagement.find({ yearSemester }).lean();

        // console.log(courseDistributionManagement);

        if(courseDistributionManagement.length === 0) {
            res.send({ success: false, error: "No data found on your specific year and semester!!!" });
            return;
        }

        const teachersInfo = await Teacher.find({}).lean(); // Use .lean() to get plain JavaScript objects
        const coursesInfo = await CourseDetails.find({}).lean();
        const timeSlot = await TimeSlot.find({}).lean();
        const room = await Room.find({}).lean();
        const teacherSlotsPriority = await TeacherSlotsPriority.find({}).lean();
        const slotPriority = teacherSlotsPriority[0].slots;
        const teacherPriority = teacherSlotsPriority[0].teachers;

        // console.log("teachers: ", teachersInfo);
        // console.log("courses: ", coursesInfo);
        // console.log("timeslot: ", timeSlot);
        // console.log("room: ", room);
        // console.log("teacherSlotsPriority: ", teacherSlotsPriority);
        // console.log("slotPriority: ", slotPriority);
        // console.log("teacherPriority: ", teacherPriority);

        const allTeacherCourse = buildTeacherCourse(courseDistributionManagement[0], teachersInfo, coursesInfo);
        // console.log("courses: ", allTeacherCourse);

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

        // console.log(theoryDetails);

        const electricalRoom = room[0].lab.electrical;
        const computerRoom = room[0].lab.computer;
        const theoryRoom = room[0].theory;
        const timeSlots = timeSlot[0].timeSlot;
        const allRoom = [...electricalRoom, ...computerRoom, ...theoryRoom];

        // Build routine matrix
        // routineMatrix[day][year][timeslot]
        // initializing a 4D array
        const totalDay = 5, totalYear = 4, totalTerm = 2, totalTimeslot = timeSlots.length, consecutiveSlotsCount = 3;
        let routineMatrix = new Array(totalDay);
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

        // let's find the lunchHourIdx
        let lunchHourIdx = -1;
        for(let i = 0; i < timeSlots.length; i++) {
            if(timeSlots[i].isLunchHour) {
                lunchHourIdx = i;
            }
        }

        // console.log("lunch Hour idx: ", lunchHourIdx);

        // To handle Teacher Slots Priority
        let allocatedRoom = buildRoomAllocationMatrix(totalDay, timeSlots);
        let allocatedTeacher = buildTeacherAllocationMatrix(totalDay, timeSlots);
        let allocatedCourse = buildAllocatedCourse(totalDay);
        const teacherPriorityMapped = buildTeacherPriorityMapped(teacherPriority);
        const slotPriorityReverse = convertSlotPriorityReverse(slotPriority);
        let unallocatedSlots = buildAllSlots(teacherPriority, slotPriority, consecutiveSlotsCount, totalDay, totalTimeslot);

        let allocatedRoomTimeslot = new Array(allRoom.length);
        for(let roomIndex = 0; roomIndex < allRoom.length; roomIndex++) {
            allocatedRoomTimeslot[roomIndex] = new Array(timeSlots.length);
            for(let slotIdx = 0; slotIdx < timeSlots.length; slotIdx++) {
                allocatedRoomTimeslot[roomIndex][slotIdx] = new Array(totalDay);
                for(let day = 0; day < totalDay; day++) {
                    allocatedRoomTimeslot[roomIndex][slotIdx][day] = false;
                }
            }
        }
        // console.log("c3: ", allocatedCourse);

        // --------------------------------start-------------------------------------------------------
        // To handle Teacher Slots Priority
        // To handle electrical lab
        let indexIncrement = 0;
        let courseAllocationElectrical = buildCourseAllocationMatrix(electricalLabDetails);
        let teacherCodeToCourseDetailsElectricals = buildTeacherCodeToCourseDetails(electricalLabDetails, teacherPriorityMapped);
        unallocatedSlots = buildPriorityRoutineMatrix(routineMatrix, electricalRoom, teacherCodeToCourseDetailsElectricals, 
            teacherPriority, unallocatedSlots, allocatedRoom, allocatedTeacher, allocatedCourse,
             courseAllocationElectrical, totalTimeslot, lunchHourIdx, allocatedRoomTimeslot, indexIncrement);

        // To handle computer lab
        indexIncrement = electricalRoom.length;
        let courseAllocationComputer = buildCourseAllocationMatrix(computerLabDetails);
        let teacherCodeToCourseDetailsComputer = buildTeacherCodeToCourseDetails(computerLabDetails, teacherPriorityMapped);
        buildPriorityRoutineMatrix(routineMatrix, computerRoom, teacherCodeToCourseDetailsComputer, 
            teacherPriority, unallocatedSlots, allocatedRoom, allocatedTeacher, allocatedCourse,
             courseAllocationComputer, totalTimeslot, lunchHourIdx, allocatedRoomTimeslot, indexIncrement);

        // To handle theory courses
        indexIncrement = electricalRoom.length + computerRoom.length;
        let courseAllocationTheory = buildCourseAllocationMatrix(theoryDetails);indexIncrement
        let teacherCodeToCourseDetailsTheory = buildTeacherCodeToCourseDetails(theoryDetails, teacherPriorityMapped);
        buildPriorityRoutineMatrix(routineMatrix, theoryRoom, teacherCodeToCourseDetailsTheory, 
            teacherPriority, unallocatedSlots, allocatedRoom, allocatedTeacher, allocatedCourse, 
            courseAllocationTheory, totalTimeslot, lunchHourIdx, allocatedRoomTimeslot, indexIncrement);
        // --------------------------------end-----------------------------------------------------------
        
        //---------------------------------start----------------------------------------------------------
        // To handle random slots allocation
        // To handle electrical lab
        indexIncrement = 0;
        const electricalRoomTimeSlots = divideBySlots(electricalRoom, timeSlots, totalDay, true, indexIncrement, allocatedRoomTimeslot, false, []);
        buildRandomRoutineMatrix(routineMatrix, electricalRoomTimeSlots, electricalLabDetails, allRoom, allocatedRoom, allocatedTeacher, allocatedCourse);

        // To handle computer lab
        indexIncrement = electricalRoom.length;
        let computerAvoidedSlots = [];
        const computerRoomTimeSlots = divideBySlots(computerRoom, timeSlots, totalDay, true, indexIncrement, allocatedRoomTimeslot, true, computerAvoidedSlots);
        buildRandomRoutineMatrix(routineMatrix, computerRoomTimeSlots, computerLabDetails, allRoom, allocatedRoom, allocatedTeacher, allocatedCourse);
        const extraComputerLabSlots = extraSlots(computerRoom, totalDay, indexIncrement);
        
        // To handle theory courses
        indexIncrement = electricalRoom.length + computerRoom.length;
        let theoryRoomTimeslots = divideBySlots(computerRoom, timeSlots, totalDay, false, indexIncrement, allocatedRoomTimeslot, false, []);
        theoryRoomTimeslots.push(...computerAvoidedSlots);
        theoryRoomTimeslots.push(...extraComputerLabSlots);
        buildRandomRoutineMatrix(routineMatrix, theoryRoomTimeslots, theoryDetails, allRoom, allocatedRoom, allocatedTeacher, allocatedCourse)
        // --------------------------------end-----------------------------------------------------------

        // To memorize all the year-term
        const yearTerm = buildYearTermMatrix(theoryDetails);

        // To memorize all the teachers name
        const teachersName = toGetTeachersName(teachersInfo);

        const data = {
            overall: routineMatrix,
            yearTerm,
            routineTeachersName: teachersName,
            year,
            semester
        }

        res.json({ success: true, data });
    } catch (err) {
        console.error('Error saving priority based routine:', err);
    }
});


const divideBySlots = (rooms, timeslots, totalDay, isLab, indexIncrement, allocatedRoomTimeslot, isComputerLab, computerAvoidedSlots) => {
    const roomTimeSlots = [];
    var inc = 1; if (isLab) inc = 2;

    for (let roomIndex = 0; roomIndex < rooms.length; roomIndex++) {
        for (let slotIndex = inc - 1; slotIndex < timeslots.length; slotIndex += inc) {
            for (let day = 0; day < totalDay; day++) {
                if(isLab) {
                    if(!allocatedRoomTimeslot[roomIndex][slotIndex][day] && (slotIndex + 1) < timeslots.length && !allocatedRoomTimeslot[roomIndex][slotIndex + 1][day]) {
                        roomTimeSlots.push({
                            roomInd: indexIncrement + roomIndex,
                            timeSlotInd: slotIndex,
                            dayInd: day
                        });
                    }
                } else {
                    if(!allocatedRoomTimeslot[roomIndex][slotIndex][day]) {
                        roomTimeSlots.push({
                            roomInd: indexIncrement + roomIndex,
                            timeSlotInd: slotIndex,
                            dayInd: day
                        });
                    }
                }

                if(isComputerLab) {
                    if(!allocatedRoomTimeslot[roomIndex][slotIndex][day] && (slotIndex + 1) < timeslots.length && allocatedRoomTimeslot[roomIndex][slotIndex + 1][day]) {
                        computerAvoidedSlots.push({
                            roomInd: indexIncrement + roomIndex,
                            timeSlotInd: slotIndex,
                            dayInd: day
                        });
                    }
                }
            }
        }
    }

    console.log("clab: ", isComputerLab);

    console.log("computerAvoidedSlots: ", computerAvoidedSlots);
    console.log("roomTimeSlots: ", roomTimeSlots.length);

    return roomTimeSlots;
}

const buildRandomRoutineMatrix = (routineMatrix, roomTimeSlots, coursesDetails, allRoom, 
    isRoomTaken, isTeacherAllocated, courseAllocation) => {

    let slotIndex = 0, cnt = 0;
    for (const courseDetails of coursesDetails) {
        const year = courseDetails.course.year;
        const term = courseDetails.course.term;
        const courseCode = courseDetails.course.code;
        const credit = courseAllocation[courseCode];
        
        if(courseDetails['teacher'] === undefined) {
            console.log(courseDetails);
        }
        let teacherCode = courseDetails.teacher.teacherCode;
        let teacher2Code = '';
        if (courseDetails.hasOwnProperty('teacher2')) {
            teacher2Code = courseDetails.teacher2.teacherCode;
        }

        for (let j = 0; j < credit; j++) {
            let curSlotIndex = slotIndex;
            let day = roomTimeSlots[curSlotIndex].dayInd;
            let timeSlot = roomTimeSlots[curSlotIndex].timeSlotInd;
            let roomInd = roomTimeSlots[slotIndex].roomInd;

            while (routineMatrix[day][year][term][timeSlot].isAllocated ||
                isRoomTaken[day][timeSlot].has(allRoom[roomInd]) ||
                courseAllocation[day].has(courseCode) ||
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

            isRoomTaken[day][timeSlot].add(allRoom[roomInd]);
            courseAllocation[day].add(courseCode);
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

const buildAllocatedCourse = (days) => {
    let allocatedCourse = new Array(days);
    for(let i = 0; i < days; i++) {
        allocatedCourse[i] = new Set();
    }

    return allocatedCourse;
}

const buildTeacherAllocationMatrix = (days, timeSlots) => {
    console.log("buildTeacherAllocationMatrix started");

    let isTeacherAllocated = new Array(days);
    for(let day = 0; day < days; day++) {
        isTeacherAllocated[day] = new Array(timeSlots.length);
        for(let timeslot = 0; timeslot < timeSlots.length; timeslot++) {
            isTeacherAllocated[day][timeslot] = new Set();
        }
    }

    console.log("buildTeacherAllocationMatrix ended");

    return isTeacherAllocated;
}

const buildRoomAllocationMatrix = (totalDay, timeSlots) => {
    console.log("buildRoomAllocationMatrix started");

    let roomMatrix = new Array(totalDay);
    for (let day = 0; day < totalDay; day++) {
        roomMatrix[day] = new Array(timeSlots.length);
        for(let timeslot = 0; timeslot < timeSlots.length; timeslot++) {
            roomMatrix[day][timeslot] = new Set();
        }
    }

    // console.log(roomMatrix);

    console.log("buildRoomAllocationMatrix ended");

    return roomMatrix;
}

const buildAllSlots = (teacherPriority, slotPriority, consecutiveSlotsCount, totalDays, totalTimeslot) => {
    // console.log("teacherPriority: ", teacherPriority);
    // console.log("slotPriority: ", slotPriority);

    let allSlots = [];
    let isSlotsTaken = new Array(totalDays);

    for(let i = 0; i < totalDays; i++) {
        isSlotsTaken[i] = new Array(totalTimeslot);
        for(let j = 0; j < totalTimeslot; j++) {
            isSlotsTaken[i][j] = false;
        }
    }

    let totalSlotsCount = 0;
    for(const teacherCode of teacherPriority) {
        totalSlotsCount += slotPriority[teacherCode].length;
    }

    let teacherIdx = 0;
    let currentTeacherWiseSlotsCount = 0;
    let teacherIdxToSlotIdx = new Array(teacherPriority.length);
    for(let i = 0; i < teacherPriority.length; i++) {
        teacherIdxToSlotIdx[i] = 0;
    }

    while(totalSlotsCount > 0) {
        let slotsIdx = teacherIdxToSlotIdx[teacherIdx];
        const slots = slotPriority[teacherPriority[teacherIdx]];

        // console.log("total slots count: ", totalSlotsCount, "teacherIdx: ", teacherIdx, "slotsIdx: ", slotsIdx);

        let currentSlot = undefined;
        if(slots.length > slotsIdx) {
            currentSlot = slots[slotsIdx];
            const day = currentSlot.day, timeslot = currentSlot.timeslot;

            totalSlotsCount--;

            if(!isSlotsTaken[day][timeslot]) {
                allSlots.push({
                    day, timeslot,
                    teacherCode: teacherPriority[teacherIdx]
                });
                isSlotsTaken[day][timeslot] = true;
                currentTeacherWiseSlotsCount++;
            }

            // to jump at the next slot
            teacherIdxToSlotIdx[teacherIdx]++;

            if(currentTeacherWiseSlotsCount >= consecutiveSlotsCount) {
                teacherIdx++;
                currentTeacherWiseSlotsCount = 0;
            }
        } else {
            teacherIdx++;
        }

        if(teacherIdx >= teacherPriority.length) {
            teacherIdx = 0;
        }
    }

    // console.log("all slots: ", allSlots);
    return allSlots;
}

const checkAvailability = (day, year, term, timeslot, roomInd, routineMatrix, allocatedRoom, 
    allocatedTeacher, allocatedCourse, currentCourse, teacherCode, courseCode) => {
    // console.log("day: ", day, "timeslot: ", timeslot);

    if(routineMatrix[day][year][term][timeslot].isAllocated) {
        return false;
    }

    // console.log("one");

    if(allocatedTeacher[day][timeslot].has(teacherCode)) {
        return false;
    }

    if(allocatedCourse[day].has(courseCode)) {
        return false;
    }

    // console.log("two");

    if(currentCourse.teacher2 && allocatedTeacher[day][timeslot].has(currentCourse.teacher2.teacherCode)) {
        return false;
    }
    
    // console.log("three");

    if (allocatedRoom[day][timeslot].has(roomInd)) {
        return false;
    }

    // console.log("four");

    return true;
}

const setSlot = (routineMatrix, allocatedRoom, allocatedTeacher, allocatedCourse,
    currentCourse, courseDetailsIdx, teacherCodeToCourseDetailsIdx,
    courseAllocation, day, year, term, timeslot,
    rooms, roomInd, teacherCode, coursesDetails, courseCode, allocatedRoomTimeslot, indexIncrement
) => {
    routineMatrix[day][year][term][timeslot] = {
        isAllocated: true,
        ...currentCourse,
        room: rooms[roomInd]
    }

    allocatedRoomTimeslot[indexIncrement + roomInd][timeslot][day] = true;

    allocatedRoom[day][timeslot].add(roomInd);
    allocatedTeacher[day][timeslot].add(teacherCode);
    if(currentCourse.teacher2) {
        allocatedTeacher[day][timeslot].add(currentCourse.teacher2.teacherCode);
    }
    allocatedCourse[day].add(courseCode);

    let nextCourseDetailsIdx = courseDetailsIdx + 1;
    if(coursesDetails.length <= nextCourseDetailsIdx) {
        nextCourseDetailsIdx = 0;
    }
    teacherCodeToCourseDetailsIdx[teacherCode]
    courseAllocation[courseCode]--;
}

const buildPriorityRoutineMatrix = (routineMatrix, rooms, teacherCodeToCourseDetails, teacherPriority, 
    allSlots, allocatedRoom, allocatedTeacher, allocatedCourse,
    courseAllocation, totalTimeslot, lunchHourIdx, allocatedRoomTimeslot, indexIncrement) => {
    
    // console.log("c2: ", allocatedCourse);
    
    let teacherCodeToCourseDetailsIdx = {};
    for(const teacherCode of teacherPriority) {
        teacherCodeToCourseDetailsIdx[teacherCode] = 0;

        // console.log("teacherCode: ", teacherCode, " courseDetails: ", teacherCodeToCourseDetails[teacherCode]);
    }
    
    let unallocatedSlots = [];
    
    for(const slot of allSlots) {
        const teacherCode = slot.teacherCode;
        const day = slot.day;
        const timeslot = slot.timeslot;

        const courseDetailsIdx = teacherCodeToCourseDetailsIdx[teacherCode];
        const coursesDetails = teacherCodeToCourseDetails[teacherCode];

        // console.log("teacherCode: ", teacherCode);
        if(!coursesDetails) {
            unallocatedSlots.push(slot);
            continue;
        }

        const currentCourse = coursesDetails[courseDetailsIdx];

        const year = currentCourse.course.year;
        const term = currentCourse.course.term;
        const courseCode = currentCourse.course.code;
        const type = currentCourse.course.type;

        if(courseAllocation[courseCode] <= 0) {
            unallocatedSlots.push(slot);
            continue;
        }
        if(routineMatrix[day][year][term][timeslot].isAllocated) {
            unallocatedSlots.push(slot);
            continue;
        }
        if(allocatedTeacher[day][timeslot].has(teacherCode)) {
            unallocatedSlots.push(slot);
            continue;
        }

        if(allocatedCourse[day].has(courseCode)) {
            unallocatedSlots.push(slot);
            continue;
        }
        if(currentCourse.teacher2 && allocatedTeacher[day][timeslot].has(currentCourse.teacher2.teacherCode)) {
            unallocatedSlots.push(slot);
            continue;
        }

        let roomInd = undefined;
        for (let r = 0; r < rooms.length; r++) {
            if (!allocatedRoom[day][timeslot].has(r)) { // Check if room index r is available
                roomInd = r;
                break;
            }
        }

        if (roomInd === undefined) {
            unallocatedSlots.push(slot);
            // console.log(`No available room at ${day}-${timeslot} for course ${courseCode}.`);
            continue; // No room found for this slot, try next slot
        }

        // If we reach here, slot and room are available
        // when the course type is lab
        // you have to allocate two consecutive slots
        // with same room
        if(type !== "theory") {
            const prevTimeslot = timeslot - 1, nextTimeslot = timeslot + 1;

            // take the most appropriate slot first
            // if it fails then take the any consecutive slot
            // otherwise leave the slot
            if(timeslot%2 === 1 && nextTimeslot < totalTimeslot && timeslot + 1 !== lunchHourIdx &&
                checkAvailability(day, year, term, nextTimeslot, roomInd,
                    routineMatrix, allocatedRoom, allocatedTeacher, allocatedCourse, currentCourse, teacherCode, courseCode
                )
            ) {
                setSlot(routineMatrix, allocatedRoom, allocatedTeacher, allocatedCourse,
                    currentCourse, courseDetailsIdx, teacherCodeToCourseDetailsIdx,
                    courseAllocation, day, year, term, nextTimeslot,
                    rooms, roomInd, teacherCode, coursesDetails, courseCode, allocatedRoomTimeslot, indexIncrement
                )
            }
            else if(timeslot%2 === 0 && prevTimeslot >= 0 && timeslot !== lunchHourIdx &&
                checkAvailability(day, year, term, prevTimeslot, roomInd,
                    routineMatrix, allocatedRoom, allocatedTeacher, allocatedCourse, currentCourse, teacherCode, courseCode
                )
            ) {
                setSlot(routineMatrix, allocatedRoom, allocatedTeacher, allocatedCourse,
                    currentCourse, courseDetailsIdx, teacherCodeToCourseDetailsIdx,
                    courseAllocation, day, year, term, prevTimeslot,
                    rooms, roomInd, teacherCode, coursesDetails, courseCode, allocatedRoomTimeslot, indexIncrement
                )
            }
            else if(prevTimeslot >= 0 && timeslot !== lunchHourIdx && 
                checkAvailability(day, year, term, prevTimeslot, roomInd,
                    routineMatrix, allocatedRoom, allocatedTeacher, allocatedCourse, currentCourse, teacherCode, courseCode
                )) {

                    // console.log("slots allocating for: ", prevTimeslot);

                    setSlot(routineMatrix, allocatedRoom, allocatedTeacher, allocatedCourse,
                        currentCourse, courseDetailsIdx, teacherCodeToCourseDetailsIdx,
                        courseAllocation, day, year, term, prevTimeslot,
                        rooms, roomInd, teacherCode, coursesDetails, courseCode, allocatedRoomTimeslot, indexIncrement
                    )
            } 
            else if(nextTimeslot < totalTimeslot && timeslot + 1 !== lunchHourIdx &&
                checkAvailability(day, year, term, nextTimeslot, roomInd,
                    routineMatrix, allocatedRoom, allocatedTeacher, allocatedCourse, currentCourse, teacherCode, courseCode
                )) {

                    setSlot(routineMatrix, allocatedRoom, allocatedTeacher, allocatedCourse,
                        currentCourse, courseDetailsIdx, teacherCodeToCourseDetailsIdx,
                        courseAllocation, day, year, term, nextTimeslot,
                        rooms, roomInd, teacherCode, coursesDetails, courseCode, allocatedRoomTimeslot, indexIncrement
                    )
            } 
            else {
                unallocatedSlots.push(slot);
                continue;
            }
        }

        setSlot(routineMatrix, allocatedRoom, allocatedTeacher, allocatedCourse,
            currentCourse, courseDetailsIdx, teacherCodeToCourseDetailsIdx,
            courseAllocation, day, year, term, timeslot,
            rooms, roomInd, teacherCode, coursesDetails, courseCode, allocatedRoomTimeslot, indexIncrement
        )
    }

    return unallocatedSlots;
}

const buildTeacherPriorityMapped = (teacherPriority) => {
    const teacherPriorityMapped = {};
    for(let i = 0; i<teacherPriority.length; i++) {
        teacherPriorityMapped[teacherPriority[i]] = i;
    }

    // console.log(teacherPriorityMapped);

    return teacherPriorityMapped;
}

const compareTeacherCode = (code1, code2, teacherPriorityMapped) => {
    if(teacherPriorityMapped[code1] === undefined) return code2;
    if(teacherPriorityMapped[code2] === undefined) return code1;

    if(teacherPriorityMapped[code1] < teacherPriorityMapped[code2]) {
        return code1;
    }

    return code2;
}

const buildCourseAllocationMatrix = (coursesDetails) => {
    let courseObject = {};
    for(const courseDetails of coursesDetails) {
        const courseCode = courseDetails.course.code;
        const credit = courseDetails.course.credit;

        courseObject[courseCode] = Math.ceil(parseFloat(credit));
    }

    // console.log("courseObject: ", courseObject);

    return courseObject;
}

const convertSlotPriorityReverse = (slotPriority) => {
    const newObj = {};

    for (const key in slotPriority) {
        if (Array.isArray(slotPriority[key])) {
            // Reverse a copy of the array to avoid mutating the original
            newObj[key] = [...slotPriority[key]].reverse();
        } else {
            newObj[key] = slotPriority[key];
        }
    }

    return newObj;
}

const buildTeacherCodeToCourseDetails = (coursesDetails, teacherPriorityMapped) => {
    let teacherCodeToCourseDetails = {};
    for(const courseDetails of coursesDetails) {
        let teacherCode = courseDetails.teacher.teacherCode;
       if(courseDetails.hasOwnProperty('teacher2')) {
            teacherCode = compareTeacherCode(teacherCode, courseDetails.teacher2.teacherCode, teacherPriorityMapped);
       }

       teacherCodeToCourseDetails[teacherCode] = teacherCodeToCourseDetails[teacherCode] || [];
       teacherCodeToCourseDetails[teacherCode].push(courseDetails);
    }

    // console.log(teacherCodeToCourseDetails);

    return teacherCodeToCourseDetails
}

module.exports = app;