const express = require('express');
const app = express.Router();
const mongoose = require('mongoose');
const TheoryExamComittee = mongoose.model('TheoryExamRoutine');
const { getDataById, deleteDataById } = require('../CommonOperation/commonOperation');

// Route to get data by MongoDB ObjectID
app.get('/data/:id', getDataById(Routine));

// Route to delete object by examYear and semester
app.delete('/deleteObject/:year/:semester', deleteDataById(TheoryExamComittee));

module.exports = app;
