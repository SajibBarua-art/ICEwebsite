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
const { shuffleArray, buildTeacherCourse, toGetTeachersName, buildYearTermMatrix } = require('./generateRandomRoutine');

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

        // To handle Teacher Slots Priority
        let allocatedRoom = buildRoomAllocationMatrix(totalDay, timeSlots);
        let allocatedTeacher = buildTeacherAllocationMatrix(totalDay, timeSlots);
        const teacherPriorityMapped = buildTeacherPriorityMapped(teacherPriority);
        const slotPriorityReverse = convertSlotPriorityReverse(slotPriority);

        // To handle electrical lab
        let courseAllocationElectrical = buildCourseAllocationMatrix(electricalLabDetails);
        let teacherCodeToCourseDetailsElectricals = buildTeacherCodeToCourseDetails(electricalLabDetails, teacherPriorityMapped);
        let unallocatedSlots = buildAllSlots(teacherPriority, slotPriority, consecutiveSlotsCount, totalDay, totalTimeslot);
        unallocatedSlots = buildPriorityRoutineMatrix(routineMatrix, electricalRoom, teacherCodeToCourseDetailsElectricals, teacherPriority, unallocatedSlots, allocatedRoom, allocatedTeacher, courseAllocationElectrical);

        // // // To handle computer lab
        // let courseAllocationComputer = buildCourseAllocationMatrix(computerLabDetails);
        // let teacherCodeToCourseDetailsComputer = buildTeacherCodeToCourseDetails(computerLabDetails, teacherPriorityMapped);
        // unallocatedSlots = buildPriorityRoutineMatrix(routineMatrix, computerRoom, teacherCodeToCourseDetailsComputer, teacherPriority, unallocatedSlots, allocatedRoom, allocatedTeacher, courseAllocationComputer);

        // To handle theory courses
        let courseAllocationTheory = buildCourseAllocationMatrix(theoryDetails);
        let teacherCodeToCourseDetailsTheory = buildTeacherCodeToCourseDetails(theoryDetails, teacherPriorityMapped);
        buildPriorityRoutineMatrix(routineMatrix, theoryRoom, teacherCodeToCourseDetailsTheory, teacherPriority, unallocatedSlots, allocatedRoom, allocatedTeacher, courseAllocationTheory);



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

const checkAvailability = (day, year, term, timeslot, roomInd, routineMatrix, allocatedRoom, allocatedTeacher, currentCourse, teacherCode) => {
    console.log("day: ", day, "timeslot: ", timeslot);

    if(routineMatrix[day][year][term][timeslot].isAllocated) {
        return false;
    }

    console.log("one");

    if(allocatedTeacher[day][timeslot].has(teacherCode)) {
        return false;
    }

    console.log("two");

    if(currentCourse.teacher2 && allocatedTeacher[day][timeslot].has(currentCourse.teacher2.teacherCode)) {
        return false;
    }
    
    console.log("three");

    if (allocatedRoom[day][timeslot].has(roomInd)) {
        return false;
    }

    console.log("four");

    return true;
}

const setSlot = (routineMatrix, allocatedRoom, allocatedTeacher, 
    currentCourse, courseDetailsIdx, teacherCodeToCourseDetailsIdx,
    courseAllocation, day, year, term, timeslot,
    rooms, roomInd, teacherCode, coursesDetails, courseCode
) => {
    routineMatrix[day][year][term][timeslot] = {
        isAllocated: true,
        ...currentCourse,
        room: rooms[roomInd]
    }

    allocatedRoom[day][timeslot].add(roomInd);
    allocatedTeacher[day][timeslot].add(teacherCode);
    if(currentCourse.teacher2) {
        allocatedTeacher[day][timeslot].add(currentCourse.teacher2.teacherCode);
    }

    let nextCourseDetailsIdx = courseDetailsIdx + 1;
    if(coursesDetails.length <= nextCourseDetailsIdx) {
        nextCourseDetailsIdx = 0;
    }
    teacherCodeToCourseDetailsIdx[teacherCode]
    courseAllocation[courseCode]--;
}

const buildPriorityRoutineMatrix = (routineMatrix, rooms, teacherCodeToCourseDetails, teacherPriority, allSlots, allocatedRoom, allocatedTeacher, courseAllocation, totalTimeslot) => {
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
            if(prevTimeslot >= 0 && 
                checkAvailability(day, year, term, prevTimeslot, roomInd,
                    routineMatrix, allocatedRoom, allocatedTeacher, currentCourse, teacherCode
                )) {

                    // console.log("slots allocating for: ", prevTimeslot);

                    setSlot(routineMatrix, allocatedRoom, allocatedTeacher, 
                        currentCourse, courseDetailsIdx, teacherCodeToCourseDetailsIdx,
                        courseAllocation, day, year, term, prevTimeslot,
                        rooms, roomInd, teacherCode, coursesDetails, courseCode
                    )
            } else if(nextTimeslot < totalTimeslot && 
                checkAvailability(day, year, term, nextTimeslot, roomInd,
                    routineMatrix, allocatedRoom, allocatedTeacher, currentCourse, teacherCode
                )) {

                    setSlot(routineMatrix, allocatedRoom, allocatedTeacher, 
                        currentCourse, courseDetailsIdx, teacherCodeToCourseDetailsIdx,
                        courseAllocation, day, year, term, nextTimeslot,
                        rooms, roomInd, teacherCode, coursesDetails, courseCode
                    )
            } else {
                unallocatedSlots.push(slot);
                continue;
            }
        }

        setSlot(routineMatrix, allocatedRoom, allocatedTeacher, 
            currentCourse, courseDetailsIdx, teacherCodeToCourseDetailsIdx,
            courseAllocation, day, year, term, timeslot,
            rooms, roomInd, teacherCode, coursesDetails, courseCode
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