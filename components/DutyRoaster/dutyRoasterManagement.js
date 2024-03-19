const express = require('express');
const app = express.Router();
const mongoose = require('mongoose');

const dutyRoasterManagementSchema = new mongoose.Schema({
    year: {
        type: String,
        required: true
    },
    semester: {
        type: String,
        required: true
    },
    theory: {
        type: Array,
        required: true
    },
    teachers: {
        type: Map,
        of: [
            {
                courseCode: { type: String },
                courseName: { type: String },
                remark: { type: String }
            }
        ]
    },
    createdAt: {
        type: Date,
        default: Date.now,
    }
});

mongoose.model('DutyRoasterManagement', dutyRoasterManagementSchema);
const { postData, getDataByYearSemester, updateDataByYearSemester, deleteDataByYearSemester, getDataByArrayIndex, getDataById } = require('../CommonOperation/commonManagement');

// to store dutyRoaster data permanently
app.post('/', postData('DutyRoasterManagement', 'theorydutyroaster'));

// Route to get dutyRoaster by year and semester
app.get('/data/:year/:semester', getDataByYearSemester('DutyRoasterManagement'));

// Route to delete dutyRoaster by year and semester
app.delete('/delete/:year/:semester', deleteDataByYearSemester('DutyRoasterManagement'));

// Route to update dutyRoaster by year and semester
app.put('/update/:year/:semester', updateDataByYearSemester('DutyRoasterManagement'));

// Route to get dutyRoaster data by array index
app.get('/byIndex/:arrayIndex', getDataByArrayIndex('DutyRoasterManagement'));

// Route to get by id
app.get('/data/:id', getDataById('DutyRoasterManagement'));

module.exports = app;
