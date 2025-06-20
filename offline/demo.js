// console.log(teacherPriority);

for(const teacherCode of teacherPriority) {
  let coursesDetails = teacherCodeToCourseDetails[teacherCode];
  let lastIndex = coursesDetails.length - 1;
  // console.log(courseDetails);

  while(lastIndex >= 0) {
      lastIndex = coursesDetails.length - 1;
      const courseDetails = coursesDetails[lastIndex];

      const year = courseDetails.course.year;
      const term = courseDetails.course.term;
      const courseCode = courseDetails.course.code;

      while(courseAllocation[courseCode] > 0) {
          console.log("credit: ", courseAllocation[courseCode]);

          let slotsLastIndex = slotPriority[teacherCode].length - 1;
          while(slotsLastIndex >= 0) {
              const dayTimeslot = slotPriority[teacherCode][slotsLastIndex];
              const day = dayTimeslot.day;
              const timeslot = dayTimeslot.timeslot;

              slotPriority[teacherCode].pop();
              slotsLastIndex = slotPriority[teacherCode].length - 1;

              if(!routineMatrix[day][year][term][timeslot].isAllocated ||
                  !allocatedTeacher[day][timeslot].has(teacherCode)
              ) {
                  continue;
              }

              let roomInd = undefined;
              
              for(let room = 0; room < rooms.length; room++) {
                  if(!allocatedRoom[day][timeslot].has(room)) {
                      roomInd = room;
                      break;
                  }
              }

              if(roomInd === undefined) continue;

              if(roomInd) {
                  routineMatrix[day][year][term][timeslot] = {
                      isAllocated: true,
                      ...courseDetails,
                      room: rooms[roomInd]
                  }
      
                  allocatedRoom[day][timeslot].add(roomInd);
      
                  allocatedTeacher[day][timeslot].add(teacherCode);
                  if (courseDetails.hasOwnProperty('teacher2')) {
                      allocatedTeacher[day][timeslot].add(courseDetails.teacher2.teacherCode);
                      allocatedTeacher[day][timeslot].add(courseDetails.teacher.teacherCode);
                  }

                  courseAllocation[courseCode]--;
                  
                  break;
              }
          }
      }

      courseDetails.pop();
  }
}

console.log(routineMatrix);
console.log("buildPriorityRoutineMatrix ended");