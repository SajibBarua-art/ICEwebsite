// Create a reusable function to handle GET requests for different Mongoose models
const getDataById = (model) => async (req, res) => {
    const id = req.params.id;

    try {
        const result = await model.findById(id);

        if (result) {
            res.json(result);
        } else {
            res.status(404).json({ error: 'Data not found' });
        }
    } catch (error) {
        console.error("An error occurred while retrieving data:", error);
        res.status(500).send("Internal Server Error");
    }
};

const deleteDataById = (model) => async (req, res) => {
    const { year, semester } = req.params;
    const yearSemester = year.toString() + semester.toString();;

    try {
        // Find and delete the object
        const deletedObject = await model.findOneAndDelete({ yearSemester });

        if (!deletedObject) {
            return res.status(404).json({ error: 'Object not found' });
        }

        return res.status(200).json({ error: 'Object deleted successfully', deletedObject });
    } catch (error) {
        console.error('Error deleting object:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

// Export the middleware function for use in other routes
module.exports = {
    getDataById,
    deleteDataById
};
