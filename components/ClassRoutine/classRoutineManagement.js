const express = require('express');
const app = express.Router();
const mongoose = require('mongoose');

const routineManagementSchema = new mongoose.Schema({
    id: {
        // To store pending service id
        // by doing so, we can avoid redundancy of routine management
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        unique: true
    },
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
    createdAt: {
        type: Date,
        default: Date.now,
    },
    timeslot: {
        type: Array,
        required: true
    }
});

mongoose.model('RoutineManagement', routineManagementSchema);
const { postData, getAllData, 
    getDataByYearSemester, 
    updateDataByYearSemester, 
    deleteDataById, 
    getDataByArrayIndex, 
    getDataByLastArrayIndex, 
    getDataById } = require('../CommonOperation/commonManagement');

// to store routine data permanently
app.post('/', postData('RoutineManagement', 'routine'));

// to get all data
app.get('/data', getAllData('RoutineManagement'));

// Route to get routine by year and semester
app.get('/data/:year/:semester', getDataByYearSemester('RoutineManagement'));

// Route to delete routine by year and semester
app.delete('/delete/:id', deleteDataById('RoutineManagement'));

// Route to update routine by year and semester
app.put('/update/:year/:semester', updateDataByYearSemester('RoutineManagement'));

// Route to get routine data by array index
app.get('/byIndex/:arrayIndex', getDataByArrayIndex('RoutineManagement'));

// Route to get last element
app.get('/lastElement', getDataByLastArrayIndex('RoutineManagement'));

// Route to get by id
app.get('/data/:id', getDataById('RoutineManagement'));

module.exports = app;
