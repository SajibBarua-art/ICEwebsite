const express = require('express');
const app = express.Router();
const mongoose = require('mongoose');
const LabExamCommittee = mongoose.model('labexamcommittees');
const { getDataById, deleteDataById } = require('../CommonOperation/commonOperation');

// Route to get data by MongoDB ObjectID
app.get('/data/:id', getDataById(LabExamCommittee));

// Route to delete object by examYear and semester
app.delete('/deleteObject/:year/:semester', deleteDataById(LabExamCommittee));

module.exports = app;
