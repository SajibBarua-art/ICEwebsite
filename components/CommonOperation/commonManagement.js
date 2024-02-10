// Create a reusable function to handle GET requests for different Mongoose models
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

// Export the middleware function for use in other routes
module.exports = {
    getDataByYearSemester,
    updateDataByYearSemester,
    deleteDataByYearSemester
};
