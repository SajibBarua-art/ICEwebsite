const express = require('express');
const app = express.Router();
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const theoryExamRoutineSchema = new mongoose.Schema({
    examYear: String,
    semester: String,
    totalBatch: Number,
    gapBetweenExams: Number,
    sessions: [
        {
            sessionName: String,
            startDate: Date,
            totalStudents: Number,
        },
    ],
    unavailableDates: {
        type: [Date],
        default: []
    },
    theoryExamRoutine: {
        type: [
            {
                course: {
                    code: String,
                    name: String
                },
                date: Date
            },
        ],
        default: []
    },
    yearSemester: {
        type: String,
        unique: true
    }
});

const TheoryExamRoutine = mongoose.model('TheoryExamRoutine', theoryExamRoutineSchema);

// Middleware to parse JSON data
app.use(bodyParser.json());

app.post('/', async (req, res) => {
    try {
        // Extract data from the request body
        const {
            examYear,
            semester,
            totalBatch,
            gapBetweenExams,
            sessions,
            unavailableDates,
        } = req.body;
        const yearSemester = examYear + semester;

        // Validate and save the exam routine
        const newTheoryExamRoutine = new TheoryExamRoutine({
            examYear,
            semester,
            totalBatch,
            gapBetweenExams,
            sessions,
            unavailableDates,
            yearSemester
        });

        await newTheoryExamRoutine.save();

        res.json({ success: true, message: 'Theory exam routine saved successfully.' });
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

        if(!existingData) {
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

const buildTheoryExamRoutine = (startDate, courses, unavailableDates) => {
    let currentDate = new Date(startDate);
    // const courses = ['3201', '3202', '3203', '3205', '2201', '2202', '2203', '2204'];
    // const unavailableDates = ['2024-01-28', '2024-01-29', '2024-01-24', '2022-11-05'];
    let theoryExamRoutine = [];

    for (const course of courses) {
        let dayIndex = getDayOfWeek(currentDate);

        // Skip weekends (Friday and Saturday)
        while (dayIndex === 5 || dayIndex === 6) {
            currentDate.setDate(currentDate.getDate() + 1);
            dayIndex = getDayOfWeek(currentDate);
        }

        // Skip unavailable dates
        while (unavailableDates.includes(currentDate.toISOString().split('T')[0])) {
            currentDate.setDate(currentDate.getDate() + 1);
            dayIndex = getDayOfWeek(currentDate);
        }

        const allocation = {
            date: new Date(currentDate),
            course: course
        };
        theoryExamRoutine.push(allocation);

        // Add three days (3 * 24 hours) to the date for the next course
        currentDate.setDate(currentDate.getDate() + 3);
    }

    return theoryExamRoutine;
}

module.exports = app;
