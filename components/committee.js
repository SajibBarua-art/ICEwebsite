const express = require('express');
const app = express.Router();
const mongoose = require('mongoose');

const Teacher = mongoose.model('teachers');

// Update isAdmin status
app.put('/updateAdminStatus', async (req, res) => {
  const { email, isAdmin } = req.body;

  try {
    const teacher = await Teacher.findOneAndUpdate({ email }, { isAdmin }, { new: true });

    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    return res.json({ message: 'Admin status updated successfully', teacher });
  } catch (error) {
    console.error('Error updating admin status:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Update isInExamCommittee status
app.put('/updateExamCommitteeStatus', async (req, res) => {
    const { email, isInExamCommittee } = req.body;
  
    try {
      const teacher = await Teacher.findOneAndUpdate({ email }, { isInExamCommittee }, { new: true });
  
      if (!teacher) {
        return res.status(404).json({ message: 'Teacher not found' });
      }
  
      return res.json({ message: 'Exam Committee Status status updated successfully', teacher });
    } catch (error) {
      console.error('Error updating exam committee status:', error);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Update isInExamCommittee status
app.put('/updateRoutineCommitteeStatus', async (req, res) => {
    const { email, isInRoutineCommittee } = req.body;
  
    try {
      const teacher = await Teacher.findOneAndUpdate({ email }, { isInRoutineCommittee }, { new: true });
  
      if (!teacher) {
        return res.status(404).json({ message: 'Teacher not found' });
      }
  
      return res.json({ message: 'Routine Committee Status status updated successfully', teacher });
    } catch (error) {
      console.error('Error updating Routine committee status:', error);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
});

module.exports = app;
