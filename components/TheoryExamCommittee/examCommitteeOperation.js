const express = require('express');
const app = express.Router();
const mongoose = require('mongoose');
const ExamCommittee = mongoose.model('examcommittees');
const { getDataById, deleteDataById } = require('../CommonOperation/commonOperation');

// Route to get data by MongoDB ObjectID
app.get('/data/:id', getDataById(ExamCommittee));

// Route to delete object by examYear and semester
app.delete('/deleteObject/:year/:semester', deleteDataById(ExamCommittee));

module.exports = app;
