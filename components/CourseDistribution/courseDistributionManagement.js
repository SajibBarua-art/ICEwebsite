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
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

mongoose.model('CourseDistributionManagement', courseDistributionManagementSchema);

const { postData, getAllData, getDataByYearSemester, updateDataByYearSemester, deleteDataById, getDataByArrayIndex, getDataById } = require('../CommonOperation/commonManagement');

// to store courseDistribution data permanently
app.post('/', postData('CourseDistributionManagement', 'coursedistributions'));

// to get all data
app.get('/data', getAllData('CourseDistributionManagement'));

// Route to get courseDistribution by year and semester
app.get('/data/:year/:semester', getDataByYearSemester('CourseDistributionManagement'));

// Route to delete courseDistribution by year and semester
app.delete('/delete/:id', deleteDataById('CourseDistributionManagement'));

// Route to update courseDistribution by year and semester
app.put('/update/:year/:semester', updateDataByYearSemester('CourseDistributionManagement'));

// Route to get courseDistribution data by array index
app.get('/byIndex/:arrayIndex', getDataByArrayIndex('CourseDistributionManagement'));

// Route to get by id
app.get('/data/:id', getDataById('CourseDistributionManagement'));

module.exports = app;
