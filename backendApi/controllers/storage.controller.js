const Model = require("../models/storage.model"); // Assuming the model file is named storage.model.js
const createError = require("http-errors");
const mongoose = require("mongoose");

module.exports = {
    create: async (req, res, next) => {
        try {
            const data = req.body; // Extracting data from request body

            // Check if the name is provided
            if (!data.name) {
                return res.status(400).json({ error: "Name is required." });
            }

            // Check for duplicate name
            const existingStorage = await Model.findOne({ name: data.name });
            if (existingStorage) {
                return res.status(400).json({ error: "Name must be unique." });
            }

            // Assign the `created_by` field from the authenticated user's ID
            if (req.user) {
                data.created_by = req.user.id;
            }

            // Create a new Storage instance with the provided data
            const newStorage = new Model(data);

            // Save the new storage item to the database
            const result = await newStorage.save();

            // Respond with the saved storage item and a status of 201 (Created)
            res.status(201).json(result);
        } catch (error) {
            console.error("Error saving storage item:", error);
            next(createError(500, "Failed to save storage item.")); // Handle errors and send a 500 response
        }
    },

    list: async (req, res, next) => {
        try {
            const { name, disabled, page, limit, order_by, order_in } = req.query;

            const _page = page ? parseInt(page) : 1;
            const _limit = limit ? parseInt(limit) : 20;
            const _skip = (_page - 1) * _limit;

            // Define sorting logic
            let sorting = {};
            if (order_by) {
                sorting[order_by] = order_in === "desc" ? -1 : 1;
            } else {
                sorting["_id"] = -1; // Default sorting by _id (descending)
            }

            const query = {};

            // Filter by name if provided (case-insensitive)
            if (name) {
                query.name = new RegExp(name, "i");
            }

            query.disabled = { $ne: true };
            query.is_inactive = { $ne: true };


            // Aggregate query to get storage items with applied filters, pagination, and sorting
            let result = await Model.aggregate([
                {
                    $match: query, // Apply query filters
                },
                {
                    $sort: sorting, // Apply sorting
                },
                {
                    $skip: _skip, // Skip for pagination
                },
                {
                    $limit: _limit, // Limit for pagination
                },
            ]);

            // Count total number of results for pagination metadata
            const resultCount = await Model.countDocuments(query);

            // Respond with data and pagination metadata
            res.json({
                data: result,
                meta: {
                    current_page: _page,
                    from: _skip + 1,
                    last_page: Math.ceil(resultCount / _limit),
                    per_page: _limit,
                    to: _skip + result.length,
                    total: resultCount,
                },
            });
        } catch (error) {
            next(error); // Handle errors
        }
    },

    update: async (req, res, next) => {
        try {
            const { id } = req.params; // Extracting storage ID from the request parameters

            if (!id) {
                throw createError.BadRequest("Invalid Parameters: Missing ID");
            }

            const data = req.body; // Extracting the update data from the request body

            if (!data || Object.keys(data).length === 0) {
                throw createError.BadRequest("Invalid Parameters: No data provided");
            }

            data.updated_at = Date.now(); // Updating the 'updated_at' field with the current time

            // Updating the Storage document by ID and returning the updated document
            const result = await Model.findByIdAndUpdate(
                id,                    // The Storage document ID
                { $set: data },       // Setting the new data
                { new: true }         // Returning the updated document
            );

            if (!result) {
                throw createError.NotFound("Storage item not found");
            }

            res.json(result); // Sending the updated Storage document as a response
        } catch (error) {
            if (error.isJoi === true) error.status = 422; // Handling validation errors
            res.status(error.status || 500).send({
                error: {
                    status: error.status || 500,
                    message: error.message,
                },
            });
        }
    },

    delete: async (req, res, next) => {
        try {
            const { id } = req.params; // Extracting storage ID from the request parameters

            if (!id) {
                throw createError.BadRequest("Invalid Parameters: Missing ID");
            }

            const deleted_at = Date.now(); // Setting the current timestamp for the deleted_at field

            // Performing a soft delete by marking the storage item as inactive and setting the deleted_at timestamp
            const result = await Model.updateOne(
                { _id: mongoose.Types.ObjectId(id) }, // Finding the storage item by ID
                { $set: { disabled: true, deleted_at } } // Marking as disabled (inactive) and updating deleted_at field
            );

            if (result.nModified === 0) {
                throw createError.NotFound("Storage item not found or already deleted");
            }

            res.json({ message: "Storage item deleted successfully", result });
        } catch (error) {
            next(error); // Handling errors and passing them to the error handler
        }
    },

    get: async (req, res, next) => {
        try {
            const { id } = req.params; // Extracting storage ID from the request parameters

            if (!id) {
                throw createError.BadRequest("Invalid Parameters: Missing ID");
            }

            // Finding the storage document by its ID
            const result = await Model.findOne({ _id: mongoose.Types.ObjectId(id) });

            if (!result) {
                throw createError.NotFound("No Storage Item Found");
            }

            // Sending the found storage document as a response
            res.json(result);
        } catch (error) {
            next(error); // Handling any errors that occur
        }
    },
};
