const express = require('express');
const app = express.Router();
const mongoose = require('mongoose');

const routineManagementSchema = new mongoose.Schema({
    overall: {
        type: Array,
        required: true
    },
    yearTerm: {
        type: Array,
        required: true
    },
    routineTeachersName: {
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
    date: {
        type: Date,
        default: Date.now
    },
    yearSemester: { // yearSemester = year + semester
        type: String,
        unique: true,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const RoutineManagement = mongoose.model('RoutineManagement', routineManagementSchema);
const { postDataByYearSemester, getDataByYearSemester, updateDataByYearSemester, deleteDataByYearSemester, getDataByArrayIndex } = require('../CommonOperation/commonManagement');

// to store routine data permanently
app.post('/', postDataByYearSemester(RoutineManagement));

// Route to get routine by year and semester
app.get('/data/:year/:semester', getDataByYearSemester(RoutineManagement));

// Route to delete routine by year and semester
app.delete('/delete/:year/:semester', deleteDataByYearSemester(RoutineManagement));

// Route to update routine by year and semester
app.put('/update/:year/:semester', updateDataByYearSemester(RoutineManagement));

// Route to get routine data by array index
app.get('/byIndex/:arrayIndex', getDataByArrayIndex(RoutineManagement));

module.exports = app;
