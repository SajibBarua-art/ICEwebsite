const mongoose = require('mongoose');

// Create a reusable function to handle GET requests for different Mongoose models
const postData = (model, temModel) => async (req, res) => {
    try {
        const Model = mongoose.model(model);
        const TemModel = mongoose.model(temModel);
        const { id } = req.body; // Destructure the id from the request body

        const data = await TemModel.findById(id).lean(); // Correctly find by id
        delete data._id;
        data.id = id;
        // console.log("tem: ", data);

        // Save the current temporary management to the permanent Management Model
        const management = new Model(data);
        const result = await management.save();

        res.json({ success: true, data: result });
    } catch (error) {
        console.error('Error publishing management:', error);
        res.json({ success: false, error: 'Internal Server Error' });
    }
};

const getAllData = (model) => async (req, res) => {
    const Model = mongoose.model(model);

    try {
        const result = await Model.find({});

        if (result.length !== 0) {
            res.json({ success: true, data: result, message: '' });
        } else {
            res.json({ success: true, data: result, message: 'There is no data found to this specific selected service!' });
        }
    } catch (error) {
        console.error("An error occurred while retrieving data:", error);
        res.send({ success: false, error: "Internal Server Error" });
    }
}

const getDataByYearSemester = (model) => async (req, res) => {
    let { year, semester } = req.params;
    year = year.toString(); semester = semester.toString();
    const Model = mongoose.model(model);

    try {
        let result = await Model.find({ year, semester });
        if(result.length === 0) {
            result = await Model.find({ examYear: year, semester });
        }

        if (result.length !== 0) {
            res.json({ success: true, data: result });
        } else {
            res.json({ success: false, error: 'Data not found! Your provided year and semester is not registered on the course distribution page!' });
        }
    } catch (error) {
        console.error("An error occurred while retrieving data:", error);
        res.send({ success: false, error: "Internal Server Error" });
    }
};

const updateDataByYearSemester = (model) => async (req, res) => {
    const { year, semester } = req.params;
    const yearSemester = year.toString() + semester.toString();
    const Model = mongoose.model(model);

    try {
        const result = await Model.findByIdAndUpdate(yearSemester, newData, { new: true });

        if (result) {
            res.json({ success: true, data: result });
        } else {
            res.json({ success: false, error: 'Data not found! Your provided year and semester is not registered yet!' });
        }
    } catch (error) {
        console.error("An error occurred while updating data:", error);
        res.send({ success: false, error: "Internal Server Error" });
    }
};

const deleteDataById = (model) => async (req, res) => {
    const { id } = req.params;
    const Model = mongoose.model(model);

    console.log(id);

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

const getDataByArrayIndex = (model) => async (req, res) => {
    try {
        const Model = mongoose.model(model);
        const arrayIndex = parseInt(req.params.arrayIndex, 10);

        // Find the management and project only the specified array element by index
        const management = await Model.findOne({}, { overall: { $slice: [arrayIndex, 1] } });

        if (!management) {
            return res.json({ success: false, error: 'Routine not found!' });
        }

        // Extract the desired array element
        const arrayElement = management.overall[0]; // $slice returns an array, so we pick the first element

        res.json({ success: true, data: arrayElement });
    } catch (error) {
        console.error('Error retrieving management by index:', error);
        res.json({ success: false, error: 'Internal Server Error' });
    }
}

const getDataByLastArrayIndex = (model) => async (req, res) => {
    try {
        const Model = mongoose.model(model);

        // Assuming the array field in the model is named 'dataArray'
        const result = await Model.findOne({}, { dataArray: -1 }); // Use -1 for last element

        console.log(result);

        // Check if result exists before accessing its properties
        if (!result) {
            return res.json({ success: false, error: 'No data found!' });
        }

        // Access the last element safely
        const lastElement = result.dataArray ? result.dataArray[0] : null; // Handle potential undefined dataArray

        res.json({ success: true, data: lastElement });
    } catch (error) {
        console.error('Error fetching data:', error);
        res.json({ success: false, error: 'Internal Server Error' });
    }
};

const getDataById = (model) => async (req, res) => {
    try {
        const id = req.params.id;
        console.log("id: ", id);

        const Model = mongoose.model(model);

        const result = await Model.findOne({ _id: id });
        if(!result) {
            return res.json({ success: false, error: 'No data found!' });
        }

        res.json({ success: true, data: result });
    } catch (error) {
        console.error('Error fetching data: ', error);
        res.json({ success: false, error: 'Internal Server Error' });
    }
}

// Export the middleware function for use in other routes
module.exports = {
    postData,
    getAllData,
    getDataByYearSemester,
    updateDataByYearSemester,
    deleteDataById,
    getDataByArrayIndex,
    getDataByLastArrayIndex,
    getDataById
};
