const express = require('express');
const app = express.Router();
const mongoose = require('mongoose');

const TheoryExamRoutineManagementSchema = new mongoose.Schema({
    examYear: String,
    semester: String,
    totalBatch: String,
    gapBetweenExams: String,
    sessions: [
        {
            session: String,
            startDate: Date,
            totalStudents: String,
            year: String,
            term: String
        },
    ],
    unavailableDates: {
        type: [Date],
        default: []
    },
    theoryExamRoutine: {
        type: [
            {
                courseCode: { type: String, required: true },
                date: { type: String, required: true }
            }
        ],
        default: []
    },
    yearSemester: {
        type: String,
        required: true,
        unique: true
    }
});

const TheoryExamRoutineManagement = mongoose.model('TheoryExamRoutineManagement', TheoryExamRoutineManagementSchema);
const { postData, getDataByYearSemester, updateDataByYearSemester, deleteDataByYearSemester, getDataByArrayIndex } = require('../CommonOperation/commonManagement');

// to store dutyRoaster data permanently
app.post('/', postData(TheoryExamRoutineManagement));

// Route to get dutyRoaster by year and semester
app.get('/data/:year/:semester', getDataByYearSemester(TheoryExamRoutineManagement));

// Route to delete dutyRoaster by year and semester
app.delete('/delete/:year/:semester', deleteDataByYearSemester(TheoryExamRoutineManagement));

// Route to update dutyRoaster by year and semester
app.put('/update/:year/:semester', updateDataByYearSemester(TheoryExamRoutineManagement));

// Route to get dutyRoaster data by array index
app.get('/byIndex/:arrayIndex', getDataByArrayIndex(TheoryExamRoutineManagement));

module.exports = app;