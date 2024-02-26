const express = require('express');
const app = express.Router();
const mongoose = require('mongoose');
const Routine = mongoose.model('courseDistribution');

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

const { postData, getDataByYearSemester, updateDataByYearSemester, deleteDataByYearSemester, getDataByArrayIndex } = require('../CommonOperation/commonManagement');

// to store courseDistribution data permanently
app.post('/', postData(CourseDistributionManagement));

// Route to get courseDistribution by year and semester
app.get('/data/:year/:semester', getDataByYearSemester(CourseDistributionManagement));

// Route to delete courseDistribution by year and semester
app.delete('/delete/:year/:semester', deleteDataByYearSemester(CourseDistributionManagement));

// Route to update courseDistribution by year and semester
app.put('/update/:year/:semester', updateDataByYearSemester(CourseDistributionManagement));

// Route to get courseDistribution data by array index
app.get('/byIndex/:arrayIndex', getDataByArrayIndex(CourseDistributionManagement));

module.exports = app;
