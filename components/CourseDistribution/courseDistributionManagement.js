const express = require('express');
const app = express.Router();
const mongoose = require('mongoose');

// Create Mongoose schema and model for course distribution
const courseDistributionManagementSchema = new mongoose.Schema({
    id: {
        // To store pending service id
        // by doing so, we can avoid redundancy
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        unique: true
    },
    examYear: {
        type: String,
        required: true
    },
    yearSemester: {
        type: String,
        required: true,
        unique: true
    },
    semester: {
        type: String,
        required: true
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

mongoose.model('CourseDistributionManagement', courseDistributionManagementSchema);

const { postData, getDataByYearSemester, updateDataByYearSemester, deleteDataByYearSemester, getDataByArrayIndex, getDataById } = require('../CommonOperation/commonManagement');

// to store courseDistribution data permanently
app.post('/', postData('CourseDistributionManagement', 'coursedistributions'));

// Route to get courseDistribution by year and semester
app.get('/data/:year/:semester', getDataByYearSemester('CourseDistributionManagement'));

// Route to delete courseDistribution by year and semester
app.delete('/delete/:year/:semester', deleteDataByYearSemester('CourseDistributionManagement'));

// Route to update courseDistribution by year and semester
app.put('/update/:year/:semester', updateDataByYearSemester('CourseDistributionManagement'));

// Route to get courseDistribution data by array index
app.get('/byIndex/:arrayIndex', getDataByArrayIndex('CourseDistributionManagement'));

// Route to get by id
app.get('/data/:id', getDataById('CourseDistributionManagement'));

module.exports = app;
