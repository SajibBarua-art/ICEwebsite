const mongoose = require('mongoose');

// Create a reusable function to handle GET requests for different Mongoose models
const postData = (model) => async (req, res) => {
    try {
        const Model = mongoose.model(model); 
        const TemModel = mongoose.model('routine'); 
        const { id } = req.body; // Destructure the id from the request body

        const data = await TemModel.findById(id).lean(); // Correctly find by id
        delete data._id;
        console.log("tem: ", data);

        // Save the current routine to the RoutineManagement Model
        const management = new Model(data);
        await management.save();

        res.json({ success: true, data });
    } catch (error) {
        console.error('Error publishing routine:', error);
        res.json({ success: false, error: 'Internal Server Error' });
    }
};


const getDataByYearSemester = (model) => async (req, res) => {
    const { year, semester } = req.params;
    const yearSemester = year.toString() + semester.toString();
    const Model = mongoose.Model(model);

    try {
        const result = await Model.findById( yearSemester );

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

const updateDataByYearSemester = (model) => async (req, res) => {
    const { year, semester } = req.params;
    const yearSemester = year.toString() + semester.toString();
    const Model = mongoose.Model(model);

    try {
        const result = await Model.findByIdAndUpdate(yearSemester, newData, { new: true });

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

const deleteDataByYearSemester = (model) => async (req, res) => {
    const { year, semester } = req.params;
    const yearSemester = year.toString() + semester.toString();
    const Model = mongoose.Model(model);

    try {
        // Find and delete the object
        const deletedObject = await Model.findOneAndDelete({ yearSemester });

        if (!deletedObject) {
            return res.json({ success: false, error: 'Not found! Check provided year and Semester.' });
        }

        return res.json({ success: true });
    } catch (error) {
        console.error('Error deleting object:', error);
        return res.json({ success: false, error: 'Internal server error' });
    }
};

const getDataByArrayIndex = (model) => async (req, res) => {
    try {
        const Model = mongoose.Model(model);
        const arrayIndex = parseInt(req.params.arrayIndex, 10);

        // Find the routine and project only the specified array element by index
        const routine = await RoutineManagement.findOne({}, { overall: { $slice: [arrayIndex, 1] } });

        if (!routine) {
            return res.json({ success: false, error: 'Routine not found!' });
        }

        // Extract the desired array element
        const arrayElement = routine.overall[0]; // $slice returns an array, so we pick the first element

        res.json({ success: true, data: arrayElement });
    } catch (error) {
        console.error('Error retrieving routine by index:', error);
        res.json({ success: false, error: 'Internal Server Error' });
    }
}

// Export the middleware function for use in other routes
module.exports = {
    postData,
    getDataByYearSemester,
    updateDataByYearSemester,
    deleteDataByYearSemester,
    getDataByArrayIndex
};
