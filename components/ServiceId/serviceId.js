const express = require('express');
const { ObjectId } = require('mongodb');
const app = express.Router();
const mongoose = require('mongoose');

const serviceIdSchema = new mongoose.Schema({
    classRoutine: mongoose.Schema.Types.ObjectId,
    theoryExamCommittee: mongoose.Schema.Types.ObjectId,
    labExamCommittee: mongoose.Schema.Types.ObjectId,
    theoryDutyRoaster: mongoose.Schema.Types.ObjectId,
    labDutyRoaster: mongoose.Schema.Types.ObjectId,
    theoryExamRoutine: mongoose.Schema.Types.ObjectId,
    labExamRoutine: mongoose.Schema.Types.ObjectId,
});

const ServiceId = mongoose.model('serviceId', serviceIdSchema);

app.get('/', async (req, res) => {
    try {
        // Fetch all service IDs
        const serviceIds = await ServiceId.find();
        res.json({ success: true, data: serviceIds });
    } catch (error) {
        console.error('Error fetching service IDs:', error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
});

// To create a default mongodb object id
app.post('/create', async (req, res) => {
    try {
        const newServiceIdData = {
            classRoutine: new ObjectId(),
            theoryExamCommittee: new ObjectId(),
            labExamCommittee: new ObjectId(),
            theoryDutyRoaster: new ObjectId(),
            labDutyRoaster: new ObjectId(),
            theoryExamRoutine: new ObjectId(),
            labExamRoutine: new ObjectId()
        }

        // Create a new service ID
        const newServiceId = await ServiceId.create(newServiceIdData);

        res.status(201).json({ success: true, data: newServiceId });
    } catch (error) {
        console.error('Error creating service ID:', error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
});

app.put('/update/:service', async (req, res) => {
    try {
        const { service } = req.params;
        const { id } = req.body;
        console.log(service, id);

        // call the old services id
        const oldServiceId = await ServiceId.find({});
        // console.log("old: ", oldServiceId);

        let updatedService = oldServiceId[0];
        // console.log("new: ", updatedService);
        updatedService[service] = id;

        try {
            const updatedServiceId = await ServiceId.findOneAndUpdate(
                {}, // Match all documents
                { 
                    $set: updatedService
                },
                { new: true } // Return the updated document
            );
    
            if (!updatedServiceId) {
                return res.status(404).json({ success: false, error: 'Service ID not found!' });
            }

            // console.log(updatedServiceId);
    
            res.json({ success: true, data: updatedServiceId });
        } catch (err) {
            console.error('Error updating routine:', err);
            res.json({ success: false, error: "Internal Server Error!" });
        }
    } catch (error) {
        console.error('Error updating service ID:', error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
});

module.exports = app;
