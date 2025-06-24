const express = require('express');
const app = express.Router();
const mongoose = require('mongoose');

const pendingServiceSchema = new mongoose.Schema({
    id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        unique: true
    },
    senderName: {
        type: String,
        required: true
    },
    serviceName: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
    }
});

const PendingService = mongoose.model('PendingService', pendingServiceSchema);
const { getDataByIdAndModel, deleteDataByIdAndModel } = require('../CommonOperation/commonOperation');

// Route to post data
app.post('/', async(req, res) => {
    const { id, serviceName, senderName } = req.body;
    // console.log(req.body);

    try {
        const newService = new PendingService({ id, serviceName, senderName });
        console.log(id, serviceName, senderName);
        await newService.save();
        res.json({ success: true });
    } catch (err) {
        res.json({ success: false, error: 'Internal Server Error' });
    }
})

// Route to get all data
app.get('/', async(req, res) => {
    try {
        const result = await PendingService.find({});

        if(result) {
            res.json({ success: true, result });
        } else {
            res.json({ success: false, error: 'Data is unable to store. Try again!'});
        } 
    } catch (error) {
        console.error("An error occurred while retrieving data:", error);
        res.send({ success: false, error: "Internal Server Error" });
    }
})

// Route to get data by MongoDB ObjectID
app.get('/data/:id/:serviceName', getDataByIdAndModel());

// Route to delete object by id
app.delete('/deleteObject/:id/:serviceName', deleteDataByIdAndModel());

// Route to delete object by service
app.delete('/delete/:serviceName', async(req, res) => {
    const { serviceName } = req.params;

    try {
        // Delete data that matches the service name
        const result = await PendingService.deleteMany({ serviceName });

        if (result.deletedCount > 0) {
            res.json({ success: true });
        } else {
            res.status(404).json({ success: false, error: 'No matching objects found for deletion.' });
        }
    } catch (error) {
        console.error("Error occurred while deleting objects:", error);
        res.status(500).json({ success: false, error: "An error occurred while deleting objects." });
    }
});

// Route to delete all
app.delete('/deleteAll', async(req, res) => {
    try {
        // Use deleteMany to delete all documents in the collection
        await PendingService.deleteMany({});
        res.json({ success: true });
    } catch (error) {
        console.error("Error occurred while deleting documents:", error);
        res.status(500).json({ success: false, error: "An error occurred while deleting documents." });
    }
})

module.exports = app;
