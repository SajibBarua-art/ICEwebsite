// Create a reusable function to handle GET requests for different Mongoose models
const postDataByYearSemester = (model) => async (req, res) => {
    try {
        // Retrieve the current routine data from the request body
        const currentRoutineData = req.body;

        // Save the current routine to the RoutineManagement model
        const routineManagement = new RoutineManagement({ routine: currentRoutineData });
        await routineManagement.save();

        res.json({ success: true, data: routineManagement });
    } catch (error) {
        console.error('Error publishing routine:', error);
        res.json({ success: false, message: 'Internal Server Error' });
    }
}
const getDataByYearSemester = (model) => async (req, res) => {
    const { year, semester } = req.params;
    const yearSemester = year.toString() + semester.toString();

    try {
        const result = await model.findById( yearSemester );

        if (result) {
            res.json({ success: true, result });
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

    try {
        const result = await model.findByIdAndUpdate(yearSemester, newData, { new: true });

        if (result) {
            res.json({ success: true, result });
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

    try {
        // Find and delete the object
        const deletedObject = await model.findOneAndDelete({ yearSemester });

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
    postDataByYearSemester,
    getDataByYearSemester,
    updateDataByYearSemester,
    deleteDataByYearSemester,
    getDataByArrayIndex
};
