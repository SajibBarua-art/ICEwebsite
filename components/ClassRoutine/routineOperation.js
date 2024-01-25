const express = require('express');
const app = express.Router();
const mongoose = require('mongoose');
const Routine = mongoose.model('routine');

// Define a route to get routine data
app.get('/', async (req, res) => {
  try {
    // Retrieve routine data from the MongoDB database
    const routineData = await Routine.find({});

    // Send the routine data as a JSON response
    res.json(routineData);
  } catch (error) {
    console.error("An error occurred in the get routine route:", error);
    res.status(500).send("Internal Server Error");
  }
});

module.exports = app;
