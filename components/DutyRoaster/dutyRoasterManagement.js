const express = require('express');
const app = express.Router();
const mongoose = require('mongoose');

const dutyRoasterManagementSchema = new mongoose.Schema({
    examYear: {
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
    createdAt: {
        type: Date,
        default: Date.now,
    },
    yearSemester: {
        type: String,
        required: true,
        unique: true
    }
});

const DutyRoasterManagement = mongoose.model('DutyRoasterManagement', dutyRoasterManagementSchema);
const { postDataByYearSemester, getDataByYearSemester, updateDataByYearSemester, deleteDataByYearSemester, getDataByArrayIndex } = require('../CommonOperation/commonManagement');

// to store dutyRoaster data permanently
app.post('/', postDataByYearSemester(DutyRoasterManagement));

// Route to get dutyRoaster by year and semester
app.get('/data/:year/:semester', getDataByYearSemester(DutyRoasterManagement));

// Route to delete dutyRoaster by year and semester
app.delete('/delete/:year/:semester', deleteDataByYearSemester(DutyRoasterManagement));

// Route to update dutyRoaster by year and semester
app.put('/update/:year/:semester', updateDataByYearSemester(DutyRoasterManagement));

// Route to get dutyRoaster data by array index
app.get('/byIndex/:arrayIndex', getDataByArrayIndex(DutyRoasterManagement));

module.exports = app;
