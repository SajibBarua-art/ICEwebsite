console.log("buildPriorityRoutineMatrix started");

    for(let i = 0; i<teacherPriority.length; i++) {
        const teacherCode = teacherPriority[i];

        // Get a mutable copy of the courses for this teacher, as we might pop from it
        let coursesDetailsForTeacher = teacherCodeToCourseDetails[teacherCode] ? [...teacherCodeToCourseDetails[teacherCode]] : [];

        // Iterate while there are courses for this teacher to process
        // We process from the end of the list (highest priority if sorted that way, or just LIFO)
        while (coursesDetailsForTeacher.length > 0) {
            const courseDetails = coursesDetailsForTeacher[coursesDetailsForTeacher.length - 1]; // Peek at the last course

            const year = courseDetails.course.year;
            const term = courseDetails.course.term;
            const courseCode = courseDetails.course.code;

            console.log(`Teacher ${teacherCode}, Course ${courseCode}, Credits needed: ${courseAllocation[courseCode]}`);

            if (courseAllocation[courseCode] <= 0) {
                coursesDetailsForTeacher.pop(); // This course is already fully allocated, remove from teacher's list and continue
                continue;
            }

            // Make a copy of this teacher's slot priorities for this specific course attempt,
            // as we'll be popping from it. This ensures each course for the teacher gets a fresh look at slots.
            // If you intend for slots to be "consumed" by a teacher across their courses, pop from slotPriority[teacherCode] directly.
            let currentCourseSlotPriority = slotPriority[teacherCode] ? [...slotPriority[teacherCode]] : [];

            while (courseAllocation[courseCode] > 0) {
                if (currentCourseSlotPriority.length === 0) {
                    console.warn(`No more priority slots for teacher ${teacherCode} for course ${courseCode}. Remaining credits: ${courseAllocation[courseCode]}`);
                    break; // Break from trying to allocate more credits for THIS course (ran out of slots)
                }

                const dayTimeslot = currentCourseSlotPriority.pop(); // Try the highest priority remaining slot (LIFO)
                const day = dayTimeslot.day;
                const timeslot = dayTimeslot.timeslot;

                // --- Corrected Slot Availability Check ---
                // Skip if:
                // 1. The specific year/term slot is already taken by ANY class.
                // 2. The teacher is already busy at this day/timeslot.
                // 3. The second teacher (if any) is already busy at this day/timeslot.
                if (routineMatrix[day][year][term][timeslot].isAllocated) {
                    // console.log(`Slot ${day}-${timeslot} for ${year}-${term} already allocated in routineMatrix.`);
                    continue;
                }
                if (allocatedTeacher[day][timeslot].has(teacherCode)) {
                    // console.log(`Teacher ${teacherCode} busy at ${day}-${timeslot}.`);
                    continue;
                }
                if (courseDetails.teacher2 && allocatedTeacher[day][timeslot].has(courseDetails.teacher2.teacherCode)) {
                    // console.log(`Teacher2 ${courseDetails.teacher2.teacherCode} busy at ${day}-${timeslot}.`);
                    continue;
                }
                // --- End Corrected Slot Availability Check ---

                let roomInd = undefined;
                for (let r = 0; r < rooms.length; r++) {
                    if (!allocatedRoom[day][timeslot].has(r)) { // Check if room index r is available
                        roomInd = r;
                        break;
                    }
                }

                if (roomInd === undefined) {
                    // console.log(`No available room at ${day}-${timeslot} for course ${courseCode}.`);
                    continue; // No room found for this slot, try next slot
                }

                // If we reach here, slot and room are available
                console.log(`Allocating ${courseCode} to ${teacherCode} at ${day}-${timeslot} in room ${rooms[roomInd].name}`);
                routineMatrix[day][year][term][timeslot] = {
                    isAllocated: true,
                    ...courseDetails, // Spread course details (course object, teacher objects etc.)
                    room: rooms[roomInd]
                };

                allocatedRoom[day][timeslot].add(roomInd);
                allocatedTeacher[day][timeslot].add(teacherCode);
                if (courseDetails.teacher2) { // Check if teacher2 exists
                    allocatedTeacher[day][timeslot].add(courseDetails.teacher2.teacherCode);
                }
                // Redundant if teacherCode is already courseDetails.teacher.teacherCode
                // if (courseDetails.teacher && courseDetails.teacher.teacherCode !== teacherCode) {
                //     allocatedTeacher[day][timeslot].add(courseDetails.teacher.teacherCode);
                // }


                courseAllocation[courseCode]--;
                console.log(`Course ${courseCode} credits remaining: ${courseAllocation[courseCode]}`);

                // IMPORTANT: Since one credit is allocated, we break from the slot search loop for THIS credit.
                // The outer `while (courseAllocation[courseCode] > 0)` will then re-evaluate.
                // If you want to fill multiple credits of the SAME course in DIFFERENT preferred slots in one go,
                // you would not break here, but then the logic for currentCourseSlotPriority.pop() needs care.
                // For typical 1-hour-per-slot allocation, this break is correct.
                // You found a slot for *one* credit hour. Now look for another slot for the *next* credit hour.
                // break; // Remove this break if one course can take multiple subsequent priority slots sequentially in one go (less common)
            } // End while (courseAllocation[courseCode] > 0) for current course

            // After attempting to allocate all credits for the current courseDetails (or running out of slots for it):
            // Remove this courseDetails from the teacher's list for this pass.
            // This ensures we move to the next course for the teacher, preventing an infinite loop
            // if a course cannot be fully allocated due to slot/room constraints.
            coursesDetailsForTeacher.pop();

            if (courseAllocation[courseCode] === 0) {
                courseFullyAllocatedInThisPass = true; // Not strictly needed with pop, but good for clarity
                console.log(`Course ${courseCode} fully allocated.`);
            }

        } // End while (coursesDetailsForTeacher.length > 0)
    } // End for (const teacherCode of teacherPriority)

    console.log("buildPriorityRoutineMatrix ended");
    return routineMatrix; // Good practice to return the modified matrix