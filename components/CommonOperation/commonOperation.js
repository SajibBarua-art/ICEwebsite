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
    let newData = req.body;
    const Model = mongoose.model(serviceName);

    // console.log(newData);

    let yearSemester = null;
    if(newData.examYear) {
        yearSemester = newData.examYear.toString() + newData.semester.toString();
    } else if(newData.year) {
        yearSemester = newData.year.toString() + newData.semester.toString();
    }
    
    if(yearSemester) newData.yearSemester = yearSemester;

    try {
        const result = await Model.findByIdAndUpdate(_id, newData, { new: true });

        if (result) {
            // console.log("update: ", result.courseDetails[0].teacherCode);
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
