const express = require('express');
const app = express.Router();
const mongoose = require('mongoose');
const Routine = mongoose.model('routine');
const { getDataById, deleteDataById } = require('../CommonOperation/commonOperation');

// Route to get data by MongoDB ObjectID
app.get('/data/:id', getDataById(Routine));

// Route to delete object by examYear and semester
app.delete('/deleteObject/:year/:semester', deleteDataById(Routine));

module.exports = app;