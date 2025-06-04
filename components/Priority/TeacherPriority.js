const express = require('express');
const app = express.Router();
const mongoose = require('mongoose');

const teacherPrioritySchema = new mongoose.Schema({
    year: {
        type: String,
        required: true
    },
    semester: {
        type: String,
        required: true
    },
    yearSemester: {
        type: String,
        required: true,
        unique: true
    },
    teachers: [{ type: String }]
});

const TeacherPriority = mongoose.model('teacherPriority', teacherPrioritySchema);
 
app.post("/", async (req, res) => {
    try {
        const { year, semester, yearSemester, teachers } = req.body;

        if(!year) {
            return res.send({success: false, error: "Year field cannot be empty!"});
        }

        if(!semester) {
            return res.send({success: false, error: "You need to select one from semester!"});
        }

        if(!teachers || teachers.length === 0) {
            return res.send({success: false, error: "You need to add atleast one teacher at the priority table!"});
        }

        // Check if yearSemester already exists
        const existing = await TeacherPriority.findOne({ yearSemester });
        if (existing) {
            return res.send({ success: false, error: "Your given Year and Semester is already in used!" });
        }

        const teacherPriority = new TeacherPriority({ year, semester, yearSemester, teachers });

        let result = await teacherPriority.save();
        res.send({ success: true, data: result });

    } catch (e) {
        console.log(e);
        res.status(500).send({ success: false, error: "Internal Server Error" });
    }
});

app.get("/", async (req, res) => {
    try {
        // Retrieve all teachers priority list from the MongoDB database
        const users = await TeacherPriority.find({});
        res.json({ success: true, data: users }); // Send the users as a JSON response
    } catch (error) {
        console.error("An error occurred in teachers priority get function:", error);
        res.send({ success: false, error: "Internal Server Error" });
    }
});

app.get("/data/:year/:semester", async (req, res) => {
    const { year, semester } = req.params;

    try {
        // Retrieve slots matching the given year and semester
        const filteredSlots = await TeacherPriority.find({ year: year, semester: semester });

        // Check if any results were found
        if (filteredSlots.length === 0) {
            return res.status(404).json({
                success: false,
                error: "Year and Semester not found!"
            });
        }

        // Return the matched results
        res.json({ success: true, data: filteredSlots });
    } catch (error) {
        console.error("An error occurred while fetching filtered teacher priority data:", error);
        res.status(500).json({ success: false, error: "Internal Server Error" });
    }
});

// Update a teacher Priority by yearSemester
app.put('/update/:yearSemester', async (req, res) => {
    const { newData } = req.body;
    const {yearSemester} = req.params;
  
    try {
      // Find the teacher Priority by year & semester and update
      const updatedTeacherPriority = await TeacherPriority.findOneAndUpdate(
        { yearSemester },
        newData,
        { new: true } // Return the updated document
      );
  
      if (!updatedTeacherPriority) {
        return res.json({ success: false, error: 'Your provided year and semester has no teachers priority list!' });
      }
  
      res.json({ success: true, data: updatedTeacherPriority });
    } catch (error) {
      console.error('Error updating Teacher Priority:', error);
      res.json({ success: false, error: 'Internal Server Error' });
    }
});

// delete an external teacher Priority by year and semester
app.delete('/delete/:id', async (req, res) => {
    const { id } = req.params;

    try {
        // Find the teacherPriority by ID
        const teacherPriority = await TeacherPriority.findById(id);

        if (!teacherPriority) {
            return res.json({ success: false, error: "Teacher Priority not found!" });
        }

        // Delete the teacherPriority
        await TeacherPriority.findByIdAndDelete(id);

        res.json({ success: true, message: "Teacher Priority deleted successfully!" });
    } catch (error) {
        console.error("Error deleting Teacher Priority:", error);
        res.json({ success: false, error: "Internal Server Error" });
    }
});



module.exports = app;