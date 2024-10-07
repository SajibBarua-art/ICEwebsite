const arr = ['ice-3201', 'math-1101', 'ice-1202', 'math-3205'];

// array of course_code to rearrange by year and term
const rearrangeByYearAndTerm = (arr) => {
    var yearTermWiseCourse = new Array(7);
    for (let i = 0; i < 7; i++) {
        yearTermWiseCourse[i] = new Array(4);
        for (let j = 0; j < 4; j++) {
            yearTermWiseCourse[i][j] = [];
        }
    }

    for (const course of arr) {
        const splitCourse = course.split('-');
        yearTermWiseCourse[parseInt(splitCourse[1][0], 10)][parseInt(splitCourse[1][1], 10)].push(course);
    }

    const sortedCourses = [];
    for(let year = 1; year <= 4; year++) {
        for(let term = 1; term <= 2; term++) {
            if(yearTermWiseCourse[year][term].length) {
                sortedCourses.push(yearTermWiseCourse[year][term]);
            }
        }
    }
    console.log(sortedCourses);
}

rearrangeByYearAndTerm(arr);