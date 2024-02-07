const express = require('express');
const app = express.Router();
const mongoose = require('mongoose');
const Routine = mongoose.model('routine');

// Create Mongoose schema and model for course distribution
const courseDistributionManagementSchema = new mongoose.Schema({
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
    }
});

const CourseDistributionManagement = mongoose.model('CourseDistributionManagement', courseDistributionManagementSchema);

// to store routine data permanently
app.post('/', async (req, res) => {
    try {
        // Retrieve the current routine data from the request body
        const currentCourseDistributionData = req.body;

        // Save the current routine to the Routine model
        const currentCourseDistribution = new Routine(currentCourseDistributionData);
        await currentCourseDistribution.save();

        // Save the current routine to the CourseDistributionManagement model
        const courseDistribution = new CourseDistributionManagement({ routine: currentCourseDistributionData });
        const data = await courseDistribution.save();

        res.json({ success: true, data });
    } catch (error) {
        console.error('Error publishing routine:', error);
        res.json({ success: false, error: 'Internal Server Error' });
    }
});

// Route to get routine by ID
app.get('/:year/:semester', async (req, res) => {
    try {
        const year = req.params.year, semester = req.params.semester;
        const routineId = year + semester;

        // Find the routine by yearSemester
        const routine = await CourseDistributionManagement.findOne({ yearSemester: routineId });

        if (!routine) {
            return res.json({ success: false, error: 'Routine not found' });
        }

        res.json({ success: true, data: routine });
    } catch (error) {
        console.error('Error retrieving routine by ID:', error);
        res.json({ success: false, error: 'Internal Server Error' });
    }
});

// Route to get routine data by array index
app.get('/:arrayIndex', async (req, res) => {
    try {
        const arrayIndex = parseInt(req.params.arrayIndex, 10);

        // Find the routine and project only the specified array element by index
        const routine = await CourseDistributionManagement.findOne({}, { overall: { $slice: [arrayIndex, 1] } });

        if (!routine) {
            return res.json({ success: false, error: 'Routine not found' });
        }

        // Extract the desired array element
        const arrayElement = routine.overall[0]; // $slice returns an array, so we pick the first element

        res.json({ success: true, data: arrayElement });
    } catch (error) {
        console.error('Error retrieving routine by index:', error);
        res.json({ success: false, error: 'Internal Server Error' });
    }
});

module.exports = app;
