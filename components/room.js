const express = require('express');
const app = express.Router();
const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
    theory: Array,
    lab: Object
});

const Room = mongoose.model('room', roomSchema);
const createRoom = async () => {
    try {
        const newRoom = new Room({
            theory: ['809', '810'],
            lab: {
                computer: ['808', '812'],
                electrical: ['813']
            }
        });

        const room = await newRoom.save();
        //console.log('Room saved:', room);
    } catch (err) {
        console.error('Error saving classroom:', err);
    }
};
// createRoom();

// get room
app.get("/", async (req, res) => {
    try {
        const room = await Room.find({});
        res.json({ success: true, data: room }); // Send the users as a JSON response
    } catch (error) {
        console.error("An error occurred in classroom get function:", error);
        res.send({ success: false, data: "Internal Server Error" });
    }
});

app.post("/", async (req, res) => {
    try {
        const { no, type } = req.body;

        //console.log(no, type);

        if (!no || !type) {
            return res.status(400).json({ success: false, error: "Missing classroom number or type" });
        }

        // Find the first room document (or create one if none exists)
        let room = await Room.findOne();
        if (!room) {
            room = new Room({ theory: [], lab: {} });
        }

        //console.log(room);

        // Add based on type
        if (type === "theory") {
            if (!room.theory.includes(no)) room.theory.push(no);
        } else if (type.endsWith("lab")) {
            const labType = type.replace(" lab", "");
            if (!room.lab[labType]) room.lab[labType] = [];

            if (room.lab[labType].includes(no)) {
                return res.status(400).json({ success: false, error: "Your provided classroom No is already included!" });
            } else {
                room.lab[labType].push(no);
                
                // Tell Mongoose the nested object has been modified
                room.markModified("lab");
            }
        } else {
            return res.status(400).json({ success: false, error: "Invalid classroom type" });
        }

        //console.log(room);

        await room.save();
        res.json({ success: true, data: room });
    } catch (error) {
        console.error("An error occurred in classroom post function:", error);
        res.status(500).json({ success: false, error: "Internal Server Error" });
    }
});


app.delete("/delete/:roomNo", async (req, res) => {
    const roomNoToDelete = req.params.roomNo;

    //console.log(roomNoToDelete);

    try {
        const room = await Room.findOne(); // Assuming there's only one Room document

        if (!room) {
            return res.status(404).json({ success: false, error: "Classroom document not found" });
        }

        let found = false;

        // Remove from theory
        if (room.theory && room.theory.includes(roomNoToDelete)) {
            room.theory = room.theory.filter(no => no !== roomNoToDelete);
            found = true;
        }

        // Remove from lab categories
        for (const [labType, rooms] of Object.entries(room.lab || {})) {
            if (rooms.includes(roomNoToDelete)) {
                room.lab[labType] = rooms.filter(no => no !== roomNoToDelete);
                found = true;

                // Tell Mongoose the nested object has been modified
                room.markModified("lab");
            }
        }

        if (!found) {
            return res.status(404).json({ success: false, error: "Classroom number not found" });
        }

        await room.save();
        res.json({ success: true, data: room });
    } catch (error) {
        console.error("An error occurred while removing classroom number:", error);
        res.status(500).json({ success: false, error: "Internal Server Error" });
    }
});


module.exports = app;