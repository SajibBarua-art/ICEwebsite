const mongoose = require('mongoose');

const getDataByIdAndModel = () => async (req, res) => {
    const _id = req.params.id, serviceName = req.params.serviceName;
    const Model = mongoose.model(serviceName);

    try {
        const result = await Model.findById( _id );

        if (result) {
            res.json({ success: true, data: result });
        } else {
            res.json({ success: false, error: 'Data not found!' });
        }
    } catch (error) {
        console.error("An error occurred while retrieving data:", error);
        res.send({ success: false, error: "Internal Server Error" });
    }
};

const updateDataByIdAndModel = () => async (req, res) => {
    const _id = req.params.id, serviceName = req.params.serviceName;
    const newData = req.body;
    const Model = mongoose.model(serviceName);

    const yearSemester = newData.examYear.toString() + newData.semester.toString();
    newData.yearSemester = yearSemester;

    console.log("update: ", newData);

    try {
        const result = await Model.findByIdAndUpdate(_id, newData, { new: true });

        if (result) {
            res.json({ success: true, data: result });
        } else {
            res.json({ success: false, error: 'Data not found!' });
        }
    } catch (error) {
        console.error("An error occurred while updating data:", error);
        res.send({ success: false, error: "Internal Server Error" });
    }
};

const deleteDataByIdAndModel = () => async (req, res) => {
    const id = req.params.id, serviceName = req.params.serviceName;
    const Model = mongoose.model(serviceName);

    try {
        // Find and delete the object
        const deletedObject = await Model.findOneAndDelete({ id });

        if (!deletedObject) {
            return res.json({ success: false, error: 'Not found! Check provided year and Semester.' });
        }

        return res.json({ success: true });
    } catch (error) {
        console.error('Error deleting object:', error);
        return res.json({ success: false, error: 'Internal server error' });
    }
};

// Export the middleware function for use in other routes
module.exports = {
    getDataByIdAndModel,
    updateDataByIdAndModel,
    deleteDataByIdAndModel
};
