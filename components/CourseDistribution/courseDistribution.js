const express = require('express');
const app = express.Router();
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const { getDataByIdAndModel } = require('../CommonOperation/commonOperation');

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
        const yearSemester = examYear + semester;

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
        // Extracting examYear, semester, and courseDetails from the request body
        const { examYear, semester, courseDetails, totalBatch, sessions } = req.body;
        const yearSemester = examYear.toString() + semester.toString();

        // Creating a new CourseDistribution instance
        const newCourseDistribution = new CourseDistribution({ examYear, semester, yearSemester, courseDetails, totalBatch, sessions });

        // Saving the newCourseDistribution instance to the database
        const result = await newCourseDistribution.save();

        console.log(result);

        // Sending the saved data as JSON response
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

// Route to update course distribution data
app.put('/update', async (req, res) => {
    try {
        const { examYear, semester, newCourseDetails } = req.body;
        const yearSemester = examYear + semester;

        // Find the document to update
        const existingData = await CourseDistribution.findOne({ yearSemester: yearSemester });

        if (!existingData) {
            return res.json({ success: false, error: 'Data not found for the given year and semester.' });
        }

        // Update the courseDetails field with newCourseDetails
        existingData.courseDetails = newCourseDetails;

        // Save the updated document
        const updatedData = await existingData.save();

        res.json({ success: true, data: updatedData });
    } catch (error) {
        console.error('Error updating course distribution:', error);
        res.json({ success: false, error: 'Internal Server Error' });
    }
});

app.get('/data/:id/:serviceName', getDataByIdAndModel());

module.exports = app;