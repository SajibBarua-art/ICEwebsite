const express = require('express');
const app = express.Router();
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const { shuffleArray } = require('../ClassRoutine/generateRandomRoutine');

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

const createRoutineDatabase = async (examYear, semester, totalBatch, gapBetweenExams, sessions, unavailableDates, theoryExamRoutine) => {
    try {
        // Create a new routine object
        const newRoutine = new TheoryExamRoutine({
            examYear,
            semester,
            totalBatch,
            gapBetweenExams,
            sessions,
            unavailableDates,
            theoryExamRoutine
        });

        console.log(examYear, semester);

        // Save the new routine
        const savedRoutine = await newRoutine.save();
        console.log('TheoryExamRoutine saved');

        // Check if the total number of objects exceeds 10
        const routineCount = await TheoryExamRoutine.countDocuments();
        console.log("Document count: ", routineCount);

        if (routineCount > 10) {
            // Find and delete the oldest routine based on the classStartDate
            const oldestRoutine = await TheoryExamRoutine.findOne();
            await TheoryExamRoutine.findByIdAndDelete(oldestRoutine._id);
            console.log('Oldest theory exam routine deleted');
        }

        return savedRoutine;
    } catch (err) {
        console.error('Error saving theory exam routine:', err);
    }
};

app.post('/', async (req, res) => {
    try {
        // Extract data from the request body
        const newTheoryExamRoutine = new TheoryExamRoutine(req.body);
        const routine = newTheoryExamRoutine.toObject();
        const {
            examYear,
            semester,
            totalBatch,
            gapBetweenExams,
            sessions,
            unavailableDates
        } = routine;

        const yearSemester = examYear.toString() + semester.toString();

        const CourseDistributionManagement = mongoose.model('CourseDistributionManagement');
        const courseDistributionManagement = await CourseDistributionManagement.find({ yearSemester }).lean();

        let courses = [];
        if (courseDistributionManagement) {
            for (const courseDetails of courseDistributionManagement[0].courseDetails) {
                courses.push(courseDetails.courseCode);
            }
        }

        const newExamRoutine = buildTheoryExamRoutine(sessions, unavailableDates, courses, gapBetweenExams);

        const data = {
            examYear,
            semester,
            totalBatch,
            gapBetweenExams,
            sessions,
            unavailableDates,
            theoryExamRoutine: newExamRoutine
        }

        res.json({ success: true, data });
    } catch (error) {
        console.error('Error saving exam routine:', error);
        res.json({ success: false, error: 'Internal Server Error' });
    }
});

app.post('/data', async (req, res) => {
    try {
        const { data } = req.body;

        const result = await createRoutineDatabase(data.examYear, data.semester, data.totalBatch, data.gapBetweenExams, data.sessions, data.unavailableDates, data.theoryExamRoutine);
        // console.log(data);
        res.json({ success: true, data: result });
    } catch (error) {
        console.error("An error occurred into the save routine:", error);
        res.send({ success: false, error: "Internal Server Error! Try again." });
    }
});

app.get('/', async (req, res) => {
    try {
        // Get examYear and semester from query parameters
        const { examYear, semester } = req.query;

        // Using the find method to query the database
        const result = await TheoryExamRoutine.find({ examYear, semester });

        // Sending the result as JSON response
        res.json({ success: true, data: result });
    } catch (error) {
        console.error('Error retrieving theory exam routine:', error);
        res.json({ success: false, error: 'Internal Server Error' });
    }
})

app.put('/update', async (req, res) => {
    try {
        const { examYear, semester, newTheoryExamRoutine } = req.query;

        const existingData = await TheoryExamRoutine.findOne({ examYear, semester });

        if (!existingData) {
            return res.json({ success: false, error: 'Data not found for the given year and semester.' });
        }

        existingData.theoryExamRoutine = newTheoryExamRoutine;

        const updatedData = await existingData.save();

        res.json({ success: true, data: updatedData });
    } catch (error) {
        console.error("Error retrieving theory exam routine", error);
        res.json({ success: false, error: 'Internal Serval Error' })
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
    // shuffle courses array
    shuffleArray(courses);

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
        while (unavailableDates.length !== 0 && unavailableDates.has(currentDate.toISOString().split('T')[0])) {
            // add 1 day
            currentDate.setDate(currentDate.getDate() + 1);
            dayIndex = getDayOfWeek(currentDate);
        }

        const allocation = {
            date: formatDate(currentDate),
            courseCode: course
        };
        theoryExamRoutine.push(allocation);
        unavailableDates.add(currentDate.toISOString().split('T')[0]);

        // Add three days (3 * 24 hours) to the date for the next course
        currentDate.setDate(currentDate.getDate() + gap);
    }
    return theoryExamRoutine;
}

const buildTheoryExamRoutine = (sessions, unavailableDates, courses, gap) => {
    // to sorted courses by year and term
    const yearTermWiseCourses = rearrangeByYearAndTerm(courses);

    for(let i=0; i < unavailableDates.length; i++) {
        unavailableDates[i] = unavailableDates[i].toISOString();
    }

    let takenDates = new Set();
    unavailableDates.forEach(date => {
        const onlyDate = date.slice(0, 10);
        takenDates.add(onlyDate);
    })

    let routine = [];
    for (const session of sessions) {
        routine.push(...buildRoutine(session.startDate, takenDates, gap, yearTermWiseCourses[session.year][session.term]));
    }

    // Convert date strings to Date objects and sort
    routine.sort((a, b) => {
        const [dayA, monthA, yearA] = a.date.split('/').map(Number);
        const [dayB, monthB, yearB] = b.date.split('/').map(Number);
        const dateA = new Date(yearA, monthA - 1, dayA); // month is 0-indexed in Date constructor
        const dateB = new Date(yearB, monthB - 1, dayB);
        return dateA - dateB;
    });

    return routine;
}

module.exports = app;
