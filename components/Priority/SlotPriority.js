const express = require('express');
const app = express.Router();
const mongoose = require('mongoose');

const slotPrioritySchema = new mongoose.Schema({
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
    slots: Object
});

const SlotPriority = mongoose.model('slotPriority', slotPrioritySchema);
 
app.post("/", async (req, res) => {
    try {
        const { year, semester, yearSemester, slots } = req.body;

        // console.log(year, semester, yearSemester, slots);

        if(!year) {
            return res.send({success: false, error: "Year field cannot be empty!"});
        }

        if(!semester) {
            return res.send({success: false, error: "You need to select one from semester!"});
        }

        if(!slots || slots.length === 0) {
            return res.send({success: false, error: "You need to add atleast one slot at the priority table!"});
        }

        // Check if yearSemester already exists
        const existing = await SlotPriority.findOne({ yearSemester });
        if (existing) {
            return res.send({ success: false, error: "Your given Year and Semester is already in used!" });
        }

        const slotPriority = new SlotPriority({ year, semester, yearSemester, slots });

        let result = await slotPriority.save();
        res.send({ success: true, data: result });

    } catch (e) {
        console.log(e);
        res.status(500).send({ success: false, error: "Internal Server Error" });
    }
});

app.get("/data/:year/:semester", async (req, res) => {
    const { year, semester } = req.params;

    console.log(year, semester);

    try {
        // Retrieve slots matching the given year and semester
        const filteredSlots = await SlotPriority.find({ year: year, semester: semester });

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
        console.error("An error occurred while fetching filtered slot data:", error);
        res.status(500).json({ success: false, error: "Internal Server Error" });
    }
});

// Update a slot Priority by yearSemester
app.put('/update/:yearSemester', async (req, res) => {
    const { newData } = req.body;
    const {yearSemester} = req.params;
  
    try {
      // Find the slot Priority by year & semester and update
      const updatedSlotPriority = await SlotPriority.findOneAndUpdate(
        { yearSemester },
        newData,
        { new: true } // Return the updated document
      );
  
      if (!updatedSlotPriority) {
        return res.json({ success: false, error: 'Your provided year and semester has no slots priority list!' });
      }
  
      res.json({ success: true, data: updatedSlotPriority });
    } catch (error) {
      console.error('Error updating Teacher Priority:', error);
      res.json({ success: false, error: 'Internal Server Error' });
    }
});

// delete an external slot Priority by year and semester
app.delete('/delete/:id', async (req, res) => {
    const { id } = req.params;

    try {
        // Find the slotPriority by ID
        const slotPriority = await SlotPriority.findById(id);

        if (!slotPriority) {
            return res.json({ success: false, error: "Teacher Priority not found!" });
        }

        // Delete the slotPriority
        await SlotPriority.findByIdAndDelete(id);

        res.json({ success: true, message: "Teacher Priority deleted successfully!" });
    } catch (error) {
        console.error("Error deleting Teacher Priority:", error);
        res.json({ success: false, error: "Internal Server Error" });
    }
});



module.exports = app;