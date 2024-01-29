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

// Route to delete object by examYear and semester
app.delete('/deleteObject/:year/:semester', async (req, res) => {
  const { year, semester } = req.params;
  const id = year + semester;

  try {
    // Find and delete the object
    const deletedObject = await YourModel.findOneAndDelete({ id });

    if (!deletedObject) {
      return res.status(404).json({ message: 'Object not found' });
    }

    return res.status(200).json({ message: 'Object deleted successfully', deletedObject });
  } catch (error) {
    console.error('Error deleting object:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = app;
