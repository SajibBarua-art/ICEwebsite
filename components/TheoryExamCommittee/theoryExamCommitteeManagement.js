const express = require('express');
const app = express.Router();
const mongoose = require('mongoose');

const theoryExamCommitteeManagementSchema = new mongoose.Schema({
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
    year: {
        type: String,
        required: true
    },
    semester: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
    }
});

mongoose.model('TheoryExamCommitteeManagement', theoryExamCommitteeManagementSchema);
const { postData, getAllData, getDataByYearSemester, updateDataByYearSemester, deleteDataById, getDataByArrayIndex, getDataById } = require('../CommonOperation/commonManagement');

// to store dutyRoaster data permanently
app.post('/', postData('TheoryExamCommitteeManagement', 'examcommittees'));

// to get all data
app.get('/data', getAllData('TheoryExamCommitteeManagement'));

// Route to get dutyRoaster by year and semester
app.get('/data/:year/:semester', getDataByYearSemester('TheoryExamCommitteeManagement'));

// Route to delete dutyRoaster by year and semester
app.delete('/delete/:year/:semester', deleteDataById('TheoryExamCommitteeManagement'));

// Route to update dutyRoaster by year and semester
app.put('/update/:year/:semester', updateDataByYearSemester('TheoryExamCommitteeManagement'));

// Route to get dutyRoaster data by array index
app.get('/byIndex/:arrayIndex', getDataByArrayIndex('TheoryExamCommitteeManagement'));

// Route to get by id
app.get('/data/:id', getDataById('TheoryExamCommitteeManagement'));

module.exports = app;
