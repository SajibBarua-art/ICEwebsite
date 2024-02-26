const express = require('express');
const app = express.Router();
const mongoose = require('mongoose');

const labExamCommitteeManagementSchema = new mongoose.Schema({
    lab: {
        type: Array,
        required: true
    },
    year: {
        type: String,
        required: true
    },
    semester: {
        type: String,
        required: true
    },
    classStartDate: {
        type: Date,
        default: Date.now
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

const LabExamCommitteeManagement = mongoose.model('LabExamCommitteeManagement', labExamCommitteeManagementSchema);
const { postData, getDataByYearSemester, updateDataByYearSemester, deleteDataByYearSemester, getDataByArrayIndex } = require('../CommonOperation/commonManagement');

// to store dutyRoaster data permanently
app.post('/', postData(LabExamCommitteeManagement));

// Route to get dutyRoaster by year and semester
app.get('/data/:year/:semester', getDataByYearSemester(LabExamCommitteeManagement));

// Route to delete dutyRoaster by year and semester
app.delete('/delete/:year/:semester', deleteDataByYearSemester(LabExamCommitteeManagement));

// Route to update dutyRoaster by year and semester
app.put('/update/:year/:semester', updateDataByYearSemester(LabExamCommitteeManagement));

// Route to get dutyRoaster data by array index
app.get('/byIndex/:arrayIndex', getDataByArrayIndex(LabExamCommitteeManagement));

module.exports = app;
