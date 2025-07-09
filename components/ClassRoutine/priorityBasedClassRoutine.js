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
const { shuffleArray, buildTeacherCourse, toGetTeachersName, buildYearTermMatrix, extraSlots, buildMappedCourses, buildMappedTeachers } = require('./generateRandomRoutine');

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

        const mappedTeachers = buildMappedTeachers(teachersInfo);
        const mappedCourses = buildMappedCourses(coursesInfo);

        // console.log("teachers: ", teachersInfo);
        // console.log("courses: ", coursesInfo);
        // console.log("timeslot: ", timeSlot);
        // console.log("room: ", room);
        // console.log("teacherSlotsPriority: ", teacherSlotsPriority);
        // console.log("slotPriority: ", slotPriority);
        // console.log("teacherPriority: ", teacherPriority);

        const allTeacherCourse = buildTeacherCourse(courseDistributionManagement[0], mappedTeachers, mappedCourses);
        // console.log("courses: ", allTeacherCourse);

        // divide the courses according to the electrical lab, computer lab and theory
        const electricalLabDetails = [], computerLabDetails = [], theoryDetails = [];
        for (const teacherCourse of allTeacherCourse) {
            const course = teacherCourse.course;
            if(course && teacherCourse.teacher) {
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
        const totalDay = 5, totalYear = 4, totalTerm = 2, totalTimeslot = timeSlots.length - 1, consecutiveSlotsCount = 1;
        let routineMatrix = new Array(totalDay);
        for (let day = 0; day < totalDay; day++) {
            routineMatrix[day] = new Array(totalYear);
            for (let year = 1; year <= totalYear; year++) {
                routineMatrix[day][year] = new Array(totalTerm);
                for (let term = 1; term <= totalTerm; term++) {
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
        let dayWiseAllocatedCourse = buildAllocatedCourse(totalDay);
        const teacherPriorityMapped = buildTeacherPriorityMapped(teacherPriority);
        const slotPriorityReverse = convertSlotPriorityReverse(slotPriority);
        let unallocatedSlots = buildAllSlots(teacherPriority, slotPriority, consecutiveSlotsCount, totalDay, totalTimeslot);
        let teacherAllocationByDay = buildTeacherAllocationByDay(totalDay, totalYear, totalTerm);

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
        // console.log("c3: ", dayWiseAllocatedCourse);

        // --------------------------------start-------------------------------------------------------
        // To handle Teacher Slots Priority
        // To handle electrical lab
        let indexIncrement = 0;
        let courseAllocationElectrical = buildCourseAllocationMatrix(electricalLabDetails);
        let teacherCodeToCourseDetailsElectricals = buildTeacherCodeToCourseDetails(electricalLabDetails, teacherPriorityMapped);
        unallocatedSlots = buildPriorityRoutineMatrix(routineMatrix, electricalRoom, teacherCodeToCourseDetailsElectricals, 
            teacherPriority, unallocatedSlots, allocatedRoom, allocatedTeacher, dayWiseAllocatedCourse, teacherAllocationByDay,
             courseAllocationElectrical, totalTimeslot, lunchHourIdx, allocatedRoomTimeslot, indexIncrement);

        // To handle computer lab
        indexIncrement = electricalRoom.length;
        let courseAllocationComputer = buildCourseAllocationMatrix(computerLabDetails);
        let teacherCodeToCourseDetailsComputer = buildTeacherCodeToCourseDetails(computerLabDetails, teacherPriorityMapped);
        unallocatedSlots = buildPriorityRoutineMatrix(routineMatrix, computerRoom, teacherCodeToCourseDetailsComputer, 
            teacherPriority, unallocatedSlots, allocatedRoom, allocatedTeacher, dayWiseAllocatedCourse, teacherAllocationByDay,
             courseAllocationComputer, totalTimeslot, lunchHourIdx, allocatedRoomTimeslot, indexIncrement);

        // To handle theory courses
        indexIncrement = electricalRoom.length + computerRoom.length;
        let courseAllocationTheory = buildCourseAllocationMatrix(theoryDetails);
        let teacherCodeToCourseDetailsTheory = buildTeacherCodeToCourseDetails(theoryDetails, teacherPriorityMapped);
        unallocatedSlots = buildPriorityRoutineMatrix(routineMatrix, theoryRoom, teacherCodeToCourseDetailsTheory, 
            teacherPriority, unallocatedSlots, allocatedRoom, allocatedTeacher, dayWiseAllocatedCourse, teacherAllocationByDay,
            courseAllocationTheory, totalTimeslot, lunchHourIdx, allocatedRoomTimeslot, indexIncrement);
        // --------------------------------end-----------------------------------------------------------

        // console.log("unallocatedSlots: ", unallocatedSlots);
        // console.log("courseAllocationElectrical: ", courseAllocationElectrical);
        // console.log("courseAllocationComputer: ", courseAllocationComputer);
        // console.log("courseAllocationTheory: ", courseAllocationTheory);
        
        //---------------------------------start----------------------------------------------------------
        // To handle random slots allocation
        // To handle electrical lab
        indexIncrement = 0;
        const electricalRoomTimeSlots = divideBySlots(electricalRoom, timeSlots, totalDay, true, indexIncrement, allocatedRoomTimeslot, false, []);
        const response1 = buildRandomRoutineMatrix(routineMatrix, electricalRoomTimeSlots, electricalLabDetails, allRoom, 
            allocatedRoom, allocatedTeacher, courseAllocationElectrical, dayWiseAllocatedCourse, teacherAllocationByDay);
        
        if(response1.success === false) {
            res.json(response1);
            return;
        }
        

        // To handle computer lab
        indexIncrement = electricalRoom.length;
        let computerAvoidedSlots = [];
        const computerRoomTimeSlots = divideBySlots(computerRoom, timeSlots, totalDay, true, indexIncrement, allocatedRoomTimeslot, true, computerAvoidedSlots);
        const response2 = buildRandomRoutineMatrix(routineMatrix, computerRoomTimeSlots, computerLabDetails, allRoom, 
            allocatedRoom, allocatedTeacher, courseAllocationComputer, dayWiseAllocatedCourse, teacherAllocationByDay);
        const extraComputerLabSlots = extraSlots(computerRoom, totalDay, indexIncrement);

        if(response2.success === false) {
            res.json(response2);
            return;
        }

        
        // To handle theory courses
        indexIncrement = electricalRoom.length + computerRoom.length;
        let theoryRoomTimeslots = divideBySlots(theoryRoom, timeSlots, totalDay, false, indexIncrement, allocatedRoomTimeslot, false, []);
        theoryRoomTimeslots.push(...computerAvoidedSlots);
        theoryRoomTimeslots.push(...extraComputerLabSlots);
        const response3 = buildRandomRoutineMatrix(routineMatrix, theoryRoomTimeslots, theoryDetails, allRoom, 
            allocatedRoom, allocatedTeacher, courseAllocationTheory, dayWiseAllocatedCourse, teacherAllocationByDay);
        
        if(response3.success === false) {
            res.json(response3);
            return;
        }
        // --------------------------------end-----------------------------------------------------------

        // console.log("electricalRoomTimeSlots: ", electricalRoomTimeSlots.length);
        // console.log("electricalLabDetails: ", electricalLabDetails.length);
        
        // console.log("computerRoomTimeSlots: ", computerRoomTimeSlots.length);
        // console.log("computerLabDetails: ", computerLabDetails.length);
        
        // console.log("theoryRoomTimeslots: ", theoryRoomTimeslots.length);
        // console.log("theoryDetails: ", theoryDetails.length);



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

const buildTeacherAllocationByDay = (totalDay, totalYear, totalTerm) => {
    console.log("totalDay: ", totalDay, "totalYear: ", totalYear, "totalTerm: ", totalTerm);

    let isTeacherAllocated = new Array(totalDay + 5);
    for(let day = 0; day <= totalDay + 2; day++) {
        isTeacherAllocated[day] = new Array(totalYear + 5);
        for(let year = 0; year <= totalYear + 2; year++) {
            isTeacherAllocated[day][year] = new Array(totalTerm + 5);
            for(let term = 0; term <= totalTerm + 2; term++) {
                isTeacherAllocated[day][year][term] = new Set();
            }
        }
    }

    return isTeacherAllocated;
}


const divideBySlots = (rooms, timeslots, totalDay, isLab, indexIncrement, allocatedRoomTimeslot, isComputerLab, computerAvoidedSlots) => {
    const roomTimeSlots = [];
    let inc = 1; if (isLab) inc = 2;
    const timeslotLength = timeslots.length - 1; // Exclude lunch hour

    console.log("rooms: ", rooms);

    for (let roomIndex = 0; roomIndex < rooms.length; roomIndex++) {
        for (let slotIndex = inc - 1; slotIndex < timeslotLength; slotIndex += inc) {
            for (let day = 0; day < totalDay; day++) {
                if(isLab) {
                    if(!allocatedRoomTimeslot[roomIndex][slotIndex][day] && (slotIndex + 1) < timeslotLength && !allocatedRoomTimeslot[roomIndex][slotIndex + 1][day]) {
                        roomTimeSlots.push({
                            roomInd: indexIncrement + roomIndex,
                            timeSlotInd: slotIndex,
                            dayInd: day
                        });
                    }
                    else if(isComputerLab) {
                        if(!allocatedRoomTimeslot[roomIndex][slotIndex][day]) {
                            computerAvoidedSlots.push({
                                roomInd: indexIncrement + roomIndex,
                                timeSlotInd: slotIndex,
                                dayInd: day
                            });
                        }
                        else if((slotIndex + 1) < timeslotLength && !allocatedRoomTimeslot[roomIndex][slotIndex + 1][day]) {
                            computerAvoidedSlots.push({
                                roomInd: indexIncrement + roomIndex,
                                timeSlotInd: slotIndex + 1,
                                dayInd: day
                            });
                        }
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
            }
        }
    }

    // console.log("clab: ", isComputerLab);

    // console.log("computerAvoidedSlots: ", computerAvoidedSlots);
    console.log("after creation of roomTimeSlots");
    console.log("roomTimeSlots: ", roomTimeSlots.length);
    console.log(roomTimeSlots);

    return roomTimeSlots;
}

const buildRandomRoutineMatrix = (routineMatrix, roomTimeSlots, coursesDetails, allRoom, 
    isRoomTaken, isTeacherAllocated, courseAllocation, dayWiseAllocatedCourse, teacherAllocationByDay) => {

    // console.log("teacherAllocationByDay: ", teacherAllocationByDay);

    console.log("roomTimeSlots: ", roomTimeSlots.length);
    console.log(roomTimeSlots);


    let slotIndex = 0, cnt = 0;
    for (const courseDetails of coursesDetails) {
        const year = courseDetails.course.year;
        const term = courseDetails.course.term;
        const courseCode = courseDetails.course.code;
        const type = courseDetails.course.type;
        const credit = courseAllocation[courseCode];
        
        if(courseDetails['teacher'] === undefined) {
            console.log("undefined course: ", courseDetails);
        }
        let teacherCode = courseDetails.teacher.teacherCode;
        let teacher2Code = '';
        if (courseDetails.hasOwnProperty('teacher2')) {
            teacher2Code = courseDetails.teacher2.teacherCode;
        }

        if(!courseCode || courseCode === '' || !teacherCode || teacherCode === '') {
            console.log("Invalid course details: ", courseDetails);
            continue;
        }

        // console.log(`course: ${courseCode}, credit: ${credit}, teacher: ${teacherCode}`);

        for (let j = 0; j < credit; j++) {
            let curSlotIndex = slotIndex;
            let day = roomTimeSlots[curSlotIndex].dayInd;
            let timeSlot = roomTimeSlots[curSlotIndex].timeSlotInd;
            let roomInd = roomTimeSlots[slotIndex].roomInd;

            // console.log("-------------------------------------start--------------------------------------");

            while (routineMatrix[day][year][term][timeSlot].isAllocated ||
                isRoomTaken[day][timeSlot].has(allRoom[roomInd]) ||
                dayWiseAllocatedCourse[day].has(courseCode) ||
                isTeacherAllocated[day][timeSlot].has(teacherCode) ||
                teacherAllocationByDay[day][year][term].has(teacherCode) ||
                (teacher2Code !== '' && isTeacherAllocated[day][timeSlot].has(teacher2Code) && teacherAllocationByDay[day][year][term].has(teacher2Code))) {
                curSlotIndex++;



                // aikhane kaj kora lagbe 
                // console.log({day, year, term, timeSlot, roomInd, courseCode, teacherCode, teacher2Code});
                // console.log("routine: ", routineMatrix[day][year][term][timeSlot].isAllocated, "room: ", isRoomTaken[day][timeSlot].has(allRoom[roomInd]),
                //     "course: ", dayWiseAllocatedCourse[day].has(courseCode), "teacher: ", isTeacherAllocated[day][timeSlot].has(teacherCode),
                //     teacherAllocationByDay[day][year][term].has(teacherCode), isTeacherAllocated[day][timeSlot].has(teacher2Code));  


                if (curSlotIndex === roomTimeSlots.length) {
                    console.log({ success: false, error: `Not enough slots for ${type} room! Please add a room for ${type}.`});
                    
                    console.log("course Allocation: ", courseAllocation);
                    
                    return { success: false, error: `Not enough slots for ${type} room! Try again to generate routine.` };
                }
                day = roomTimeSlots[curSlotIndex].dayInd;
                timeSlot = roomTimeSlots[curSlotIndex].timeSlotInd;
                roomInd = roomTimeSlots[curSlotIndex].roomInd;
            }

            // console.log("day: ", day, "year: ", year, "term: ", term, "timeSlot: ", timeSlot, "roomInd: ", roomInd);

            courseAllocation[courseCode]--;

            isRoomTaken[day][timeSlot].add(allRoom[roomInd]);
            dayWiseAllocatedCourse[day].add(courseCode);
            teacherAllocationByDay[day][year][term].add(teacherCode);
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

            // console.log({ day, year, term, timeSlot, room: allRoom[roomInd], courseCode, teacherCode });

            if (type !== "theory") {
                routineMatrix[day][year][term][timeSlot + 1] = {
                    isAllocated: true,
                    ...courseDetails,
                    room: allRoom[roomInd]
                }
                isRoomTaken[day][timeSlot + 1].add(allRoom[roomInd]);
                isTeacherAllocated[day][timeSlot + 1].add(teacherCode);
                if (teacher2Code !== '') {
                    isTeacherAllocated[day][timeSlot + 1].add(teacher2Code);
                }
            }

            // swapping
            [roomTimeSlots[curSlotIndex], roomTimeSlots[slotIndex]] = [roomTimeSlots[slotIndex], roomTimeSlots[curSlotIndex]];
        }
        slotIndex++; cnt++;
    }

    console.log("course Allocation: ", courseAllocation);

    return { success: true };
}

const buildAllocatedCourse = (days) => {
    let dayWiseAllocatedCourse = new Array(days);
    for(let i = 0; i < days; i++) {
        dayWiseAllocatedCourse[i] = new Set();
    }

    return dayWiseAllocatedCourse;
}

const buildTeacherAllocationMatrix = (days, timeSlots) => {
    // console.log("buildTeacherAllocationMatrix started");

    let isTeacherAllocated = new Array(days);
    for(let day = 0; day < days; day++) {
        isTeacherAllocated[day] = new Array(timeSlots.length);
        for(let timeslot = 0; timeslot < timeSlots.length; timeslot++) {
            isTeacherAllocated[day][timeslot] = new Set();
        }
    }

    // console.log("buildTeacherAllocationMatrix ended");

    return isTeacherAllocated;
}

const buildRoomAllocationMatrix = (totalDay, timeSlots) => {
    // console.log("buildRoomAllocationMatrix started");

    let roomMatrix = new Array(totalDay);
    for (let day = 0; day < totalDay; day++) {
        roomMatrix[day] = new Array(timeSlots.length);
        for(let timeslot = 0; timeslot < timeSlots.length; timeslot++) {
            roomMatrix[day][timeslot] = new Set();
        }
    }

    // console.log(roomMatrix);

    // console.log("buildRoomAllocationMatrix ended");

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
    allocatedTeacher, dayWiseAllocatedCourse, currentCourse, teacherCode, courseCode, teacherAllocationByDay) => {
    // console.log("day: ", day, "timeslot: ", timeslot);

    if(teacherCode === undefined || teacherCode === '' || courseCode === undefined) {
        console.log("Invalid teacherCode or courseCode: ", { teacherCode, courseCode });
        return false;
    }

    if(routineMatrix[day][year][term][timeslot].isAllocated) {
        return false;
    }

    // console.log("one");

    if(allocatedTeacher[day][timeslot].has(teacherCode)) {
        return false;
    }

    if(dayWiseAllocatedCourse[day].has(courseCode)) {
        return false;
    }

    if(teacherAllocationByDay[day][year][term].has(teacherCode)) {
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

const setSlot = (routineMatrix, allocatedRoom, allocatedTeacher, dayWiseAllocatedCourse,
    currentCourse, courseDetailsIdx, teacherCodeToCourseDetailsIdx,
    courseAllocation, day, year, term, timeslot,rooms, roomInd, teacherCode, coursesDetails, 
    courseCode, allocatedRoomTimeslot, indexIncrement, courseAllocationDecrement, teacherAllocationByDay
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
    dayWiseAllocatedCourse[day].add(courseCode);

    let nextCourseDetailsIdx = courseDetailsIdx + 1;
    if(coursesDetails.length <= nextCourseDetailsIdx) {
        nextCourseDetailsIdx = 0;
    }
    teacherCodeToCourseDetailsIdx[teacherCode]
    courseAllocation[courseCode] -= courseAllocationDecrement;
    if(courseAllocationDecrement === 1) {
        teacherAllocationByDay[day][year][term].add(teacherCode);
    }
}

const buildPriorityRoutineMatrix = (routineMatrix, rooms, teacherCodeToCourseDetails, teacherPriority, 
    allSlots, allocatedRoom, allocatedTeacher, dayWiseAllocatedCourse, teacherAllocationByDay,
    courseAllocation, totalTimeslot, lunchHourIdx, allocatedRoomTimeslot, indexIncrement) => {

        // console.log("teacherAllocationByDay: ");
    
    // console.log("c2: ", dayWiseAllocatedCourse);
    
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

        // console.log({day, year, term, timeslot});

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

        if(dayWiseAllocatedCourse[day].has(courseCode)) {
            unallocatedSlots.push(slot);
            continue;
        }

        // console.log("day: ", day, "year: ", year, "term: ", term, "timeslot: ", timeslot, "courseCode: ", courseCode);

        if(teacherAllocationByDay[day][year][term].has(teacherCode)) {
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
                    routineMatrix, allocatedRoom, allocatedTeacher, dayWiseAllocatedCourse, currentCourse, teacherCode, courseCode, teacherAllocationByDay
                )
            ) {
                setSlot(routineMatrix, allocatedRoom, allocatedTeacher, dayWiseAllocatedCourse,
                    currentCourse, courseDetailsIdx, teacherCodeToCourseDetailsIdx,
                    courseAllocation, day, year, term, nextTimeslot,
                    rooms, roomInd, teacherCode, coursesDetails, courseCode, allocatedRoomTimeslot, indexIncrement, 0, teacherAllocationByDay
                )
            }
            else if(timeslot%2 === 0 && prevTimeslot >= 0 && timeslot !== lunchHourIdx &&
                checkAvailability(day, year, term, prevTimeslot, roomInd,
                    routineMatrix, allocatedRoom, allocatedTeacher, dayWiseAllocatedCourse, currentCourse, teacherCode, courseCode, teacherAllocationByDay
                )
            ) {
                setSlot(routineMatrix, allocatedRoom, allocatedTeacher, dayWiseAllocatedCourse,
                    currentCourse, courseDetailsIdx, teacherCodeToCourseDetailsIdx,
                    courseAllocation, day, year, term, prevTimeslot,
                    rooms, roomInd, teacherCode, coursesDetails, courseCode, allocatedRoomTimeslot, indexIncrement, 0, teacherAllocationByDay
                )
            }
            else if(prevTimeslot >= 0 && timeslot !== lunchHourIdx && 
                checkAvailability(day, year, term, prevTimeslot, roomInd,
                    routineMatrix, allocatedRoom, allocatedTeacher, dayWiseAllocatedCourse, currentCourse, teacherCode, courseCode, teacherAllocationByDay
                )) {

                    // console.log("slots allocating for: ", prevTimeslot);

                    setSlot(routineMatrix, allocatedRoom, allocatedTeacher, dayWiseAllocatedCourse,
                        currentCourse, courseDetailsIdx, teacherCodeToCourseDetailsIdx,
                        courseAllocation, day, year, term, prevTimeslot,
                        rooms, roomInd, teacherCode, coursesDetails, courseCode, allocatedRoomTimeslot, indexIncrement, 0, teacherAllocationByDay
                    )
            } 
            else if(nextTimeslot < totalTimeslot && timeslot + 1 !== lunchHourIdx &&
                checkAvailability(day, year, term, nextTimeslot, roomInd,
                    routineMatrix, allocatedRoom, allocatedTeacher, dayWiseAllocatedCourse, currentCourse, teacherCode, courseCode, teacherAllocationByDay
                )) {

                    setSlot(routineMatrix, allocatedRoom, allocatedTeacher, dayWiseAllocatedCourse,
                        currentCourse, courseDetailsIdx, teacherCodeToCourseDetailsIdx,
                        courseAllocation, day, year, term, nextTimeslot,
                        rooms, roomInd, teacherCode, coursesDetails, courseCode, allocatedRoomTimeslot, indexIncrement, 0, teacherAllocationByDay
                    )
            } 
            else {
                unallocatedSlots.push(slot);
                continue;
            }
        }

        setSlot(routineMatrix, allocatedRoom, allocatedTeacher, dayWiseAllocatedCourse,
            currentCourse, courseDetailsIdx, teacherCodeToCourseDetailsIdx,
            courseAllocation, day, year, term, timeslot,
            rooms, roomInd, teacherCode, coursesDetails, courseCode, allocatedRoomTimeslot, indexIncrement, 1, teacherAllocationByDay
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

        courseObject[courseCode] = Math.round(parseFloat(credit) - 0.2);
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
        // console.log("courseDetails: ", courseDetails);

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