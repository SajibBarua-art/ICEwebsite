const express = require('express');
const app = express.Router();
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const CourseDistribution = mongoose.model('courseDistribution');

const theoryExamRoutineSchema = new mongoose.Schema({
    examYear: String,
    semester: String,
    totalBatch: String,
    gapBetweenExams: String,
    sessions: [
        {
            session: String,
            startDate: Date,
            totalStudents: String,
            year: String,
            term: String
        },
    ],
    unavailableDates: {
        type: [Date],
        default: []
    },
    theoryExamRoutine: {
        type: [
            {
                courseCode: { type: String, required: true },
                date: { type: String, required: true }
            }
        ],
        default: []
    }
});

const TheoryExamRoutine = mongoose.model('TheoryExamRoutine', theoryExamRoutineSchema);

// Middleware to parse JSON data
app.use(bodyParser.json());

app.post('/', async (req, res) => {
    try {
        // Extract data from the request body
        const theoryExamRoutine = new TheoryExamRoutine(req.body);
        const routine = theoryExamRoutine.toObject();

        const yearSemester = routine.examYear.toString() + routine.semester.toString();

        const courseDistribution = await CourseDistribution.find({ yearSemester }).lean();

        let courses = [];
        if (courseDistribution.length) {
            for (const courseDetails of courseDistribution[0].courseDetails) {
                courses.push(courseDetails.courseCode);
            }
        }

        const newRoutine = buildTheoryExamRoutine(routine.sessions, routine.unavailableDates, courses, routine.gapBetweenExams);

        routine.theoryExamRoutine = newRoutine;

        // console.log(routine);
        const newTheoryExamRoutine = new TheoryExamRoutine(routine);

        const respRoutine = await newTheoryExamRoutine.save();

        res.json(respRoutine);
    } catch (error) {
        console.error('Error saving exam routine:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

app.get('/', async (req, res) => {
    try {
        // Get examYear and semester from query parameters
        const { examYear, semester } = req.query;
        const yearSemester = examYear + semester;

        // Using the find method to query the database
        const result = await TheoryExamRoutine.findOne({ yearSemester: yearSemester });

        // Sending the result as JSON response
        res.json(result);
    } catch (error) {
        console.error('Error retrieving theory exam routine:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
})

app.put('/update', async (req, res) => {
    try {
        const { examYear, semester, newTheoryExamRoutine } = req.query;
        const yearSemester = examYear + semester;

        const existingData = await TheoryExamRoutine.findOne({ yearSemester: yearSemester });

        if (!existingData) {
            return res.status(404).json({ error: 'Data not found for the given year and semester.' });
        }

        existingData.theoryExamRoutine = newTheoryExamRoutine;

        const updatedData = await existingData.save();

        res.json(updatedData);
    } catch (error) {
        console.error("Error retrieving theory exam routine", error);
        res.status(500).json({ error: 'Internal Serval Error' })
    }
})

const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.getMonth() + 1; // Months are zero-based
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
};

// Function to get the day of the week for the current date
const getDayOfWeek = (timestamp) => {
    // Get the current timestamp in milliseconds

    // Create a Date object from the current timestamp
    const currentDate = new Date(timestamp);

    // Get the day of the week (0 for Sunday, 1 for Monday, etc.)
    const dayOfWeek = currentDate.getDay();

    // Define an array of day names
    // ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    return dayOfWeek
}

// Function to sort an array of objects by year and term in descending order
const sortObjectsByYearAndTerm = (objectsArray) => {
    // Custom comparison function
    const compareObjects = (a, b) => {
        // Compare by year
        if (a.year < b.year) {
            return 1;
        } else if (a.year > b.year) {
            return -1;
        } else {
            // If the years are the same, compare by term
            if (a.term < b.term) {
                return 1;
            } else {
                return -1;
            }
        }
    }

    // Sort the array of objects using the custom comparison function
    return objectsArray.sort(compareObjects);
}

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

        // to ignore all lab classes
        if (parseInt(splitCourse[1][3]) % 2 === 0) continue;

        yearTermWiseCourse[parseInt(splitCourse[1][0], 10)][parseInt(splitCourse[1][1], 10)].push(course);
    }

    return yearTermWiseCourse;
}

const buildRoutine = (startDate, unavailableDates, dayGap, courses) => {
    let currentDate = new Date(startDate);
    let theoryExamRoutine = [];
    const gap = parseInt(dayGap, 10);

    for (const course of courses) {
        let dayIndex = getDayOfWeek(currentDate);

        // Skip weekends (Friday and Saturday)
        while (dayIndex === 5 || dayIndex === 6) {
            // add 1 day
            currentDate.setDate(currentDate.getDate() + 1);
            dayIndex = getDayOfWeek(currentDate);
        }

        // Skip unavailable dates
        while (unavailableDates.length !== 0 && unavailableDates.includes(currentDate.toISOString().split('T')[0])) {
            // add 1 day
            currentDate.setDate(currentDate.getDate() + 1);
            dayIndex = getDayOfWeek(currentDate);
        }

        const allocation = {
            date: formatDate(currentDate),
            courseCode: course
        };
        theoryExamRoutine.push(allocation);
        unavailableDates.push(currentDate);

        // Add three days (3 * 24 hours) to the date for the next course
        currentDate.setDate(currentDate.getDate() + gap);
    }
    return theoryExamRoutine;
}

const buildTheoryExamRoutine = (sessions, unavailableDates, courses, gap) => {
    // to sorted courses by year and term
    const yearTermWiseCourses = rearrangeByYearAndTerm(courses);
    let takenDates = unavailableDates.slice();

    let routine = [];
    for (const session of sessions) {
        routine.push(...buildRoutine(session.startDate, takenDates, gap, yearTermWiseCourses[session.year][session.term]));
    }

    return routine;
}

module.exports = app;
