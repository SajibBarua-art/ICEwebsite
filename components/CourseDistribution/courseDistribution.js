const express = require('express');
const app = express.Router();
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const { getDataByIdAndModel, updateDataByIdAndModel } = require('../CommonOperation/commonOperation');

// Create Mongoose schema and model for course distribution
const courseDistributionSchema = new mongoose.Schema({
    examYear: {
        type: String,
        required: true
    },
    semester: {
        type: String,
        required: true
    },
    yearSemester: {
        type: String,
        required: true,
        unique: true
    },
    courseDetails: {
        type: [
            {
                courseCode: String,
                teacherCode: []
            }
        ],
        required: true
    },
    totalBatch: String,
    sessions: [
        {
            session: String,
            startDate: Date,
            totalStudents: String,
            year: String,
            term: String
        },
    ],
});

const CourseDistribution = mongoose.model('coursedistributions', courseDistributionSchema);

// Middleware to parse JSON data
app.use(bodyParser.json());

// Define an Express route to handle the data retrieval
app.get('/', async (req, res) => {
    try {
        // Get examYear and semester from query parameters
        const { examYear, semester } = req.query;
        const yearSemester = examYear.toString() + semester.toString();

        // Using the find method to query the database
        const result = await CourseDistribution.findOne({ yearSemester: yearSemester });

        // Sending the result as JSON response
        res.json( { success: true, data: result });
    } catch (error) {
        console.error('Error retrieving data:', error);
        // Sending an error response
        res.json({ success: false, error: 'Internal Server Error' });
    }
});

// Route to post new courseDistribution
app.post('/', async (req, res) => {
    try {
        // // Extracting examYear, semester, and courseDetails from the request body
        // const { examYear, semester, courseDetails, totalBatch, sessions } = req.body;
        // const yearSemester = examYear.toString() + semester.toString();

        // // Creating a new CourseDistribution instance
        // const newCourseDistribution = new CourseDistribution({ examYear, semester, yearSemester, courseDetails, totalBatch, sessions });

        // // Saving the newCourseDistribution instance to the database
        // const result = await newCourseDistribution.save();

        // console.log(result);

        // // Sending the saved data as JSON response
        // res.json({ success: true, data: result });

        // Extracting examYear, semester, and courseDetails from the request body
        const { examYear, semester, courseDetails, totalBatch, sessions } = req.body;
        const yearSemester = examYear.toString() + semester.toString();

        // Using findOneAndUpdate to check if the document exists and update it, otherwise insert a new one
        const result = await CourseDistribution.findOneAndUpdate(
            { yearSemester }, // Find by examYear and semester
            { $set: { courseDetails, totalBatch, sessions, yearSemester } }, // Update fields
            { new: true, upsert: true } // Return the updated document and create a new one if not found
        );

        console.log(result);

        res.json({ success: true, data: result });
    } catch (error) {
        if (error.code === 11000) {
            res.json({ success: false, error: 'The specific exam year and semester are already stored in database!'});
        }
        else {
            res.json({ success: false, error: 'Internal Server Error' });
        }
    }
});

// Route to update course distribution data by id
app.put('/update/:id/:serviceName', updateDataByIdAndModel());

app.get('/update/:year/:semester', async (req, res) => {
    try {
        // Extract year and semester from request parameters
        const { year, semester } = req.params;

        // Validate input
        if (!year) {
            return res.json({ success: false, error: 'Year is required!' });
        }
        if (!semester) {
            return res.json({ success: false, error: 'Semester is required!' });
        }

        const yearSemester = year.toString() + semester.toString();

        console.log("year: ", year, " semester: ", semester, " ", yearSemester);

        // Query the database using examYear and semester
        const result = await CourseDistribution.findOne({ yearSemester });

        // If no data is found, return a meaningful response
        if (!result) {
            return res.json({ success: false, error: 'No course distribution found for the given year and semester.' });
        }

        // Sending the result as JSON response
        res.json({ success: true, data: result });
    } catch (error) {
        console.error('Error retrieving data:', error);
        res.json({ success: false, error: 'Internal Server Error' });
    }
});


app.get('/data/:id/:serviceName', getDataByIdAndModel());

module.exports = app;