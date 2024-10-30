const Model = require("../models/truckLoading.model");
const createError = require("http-errors");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const StockModel = require("../models/stock.model");

module.exports = {
  create: async (req, res, next) => {
    try {
      const data = req.body;
      console.log("data", data);

      // Validate required fields
      if (!data.partyName) {
        return res.status(400).json({ error: "Party Name is required." });
      }
      // if (!data.vehicleNumber) {
      //   return res.status(400).json({ error: "Vehicle Number is required." });
      // }
      if (!data.assignedHammal) {
        return res.status(400).json({ error: "Assigned Hammal is required." });
      }
      if (!data.boraQuantity) {
        return res.status(400).json({ error: "Bora Quantity is required." });
      }
      if (!data.unitBora) {
        return res.status(400).json({ error: "Unit Bora is required." });
      }
      if (!data.crop) {
        return res.status(400).json({ error: "Crop is required." });
      }

      // Calculate netWeight using the formula: netWeight = boraQuantity * unitBora
      // data.netWeight = data.boraQuantity * data.unitBora;

      // Optional: You can check for duplicates or other conditions if required.
      // const existingTruckLoading = await Model.findOne({
      //   partyName: data.partyName,
      //   vehicleNumber: data.vehicleNumber,
      // });
      // if (existingTruckLoading) {
      //   return res.status(400).json({
      //     error:
      //       "A Truck Loading entry already exists with the same Party Name and Vehicle Number.",
      //   });
      // }

      // Create a new TruckLoading instance with the provided data
      const newTruckLoading = new Model(data);

      // Save the new TruckLoading entry to the database
      const result = await newTruckLoading.save();

      // Create a new Stock entry for the TruckLoading
      if (data.transferType === "Stock Transfer") {
        const stockData = {
          crop: data.crop,
          quantity: data.netWeight,
          warehouse: data.storage,
          price: data.rate,
          logType: "transfer out",
          meta_data: {
            truckLoading: result._id,
          },
        };

        const stockDataIn = {
          crop: data.crop,
          quantity: data.netWeight,
          warehouse: data.deliveryLocation,
          price: data.rate,
          logType: "transfer in",
          meta_data: {
            truckLoading: result._id,
          },
        };

        // Create a new Stock entry using the StockModel
        const stockResult = await StockModel.createOrUpdateStock(null, stockData);
      } else {
        // Create a new Stock entry for the TruckLoading
        const stockData = {
          crop: data.crop,
          quantity: data.netWeight,
          warehouse: data.storage,
          price: data.rate,
          logType: "sale",
          meta_data: {
            truckLoading: result._id,
          },
        };

        // Create a new Stock entry using the StockModel
        const stockResult = await StockModel.createOrUpdateStock(null, stockData);
      }

      // Respond with the saved TruckLoading and a status of 201 (Created)
      res.status(201).json(result);
    } catch (error) {
      console.error("Error saving TruckLoading:", error);
      next(createError(500, "Failed to save Truck Loading.")); // Handle errors and send a 500 response
    }
  },
  list: async (req, res, next) => {
    try {
      const {
        crop,
        partyName,
        vehicleNumber,
        page,
        limit,
        order_by,
        order_in,
      } = req.query;

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
      if (partyName) {
        query.partyName = mongoose.Types.ObjectId(partyName);
      }
      if (vehicleNumber) {
        query.vehicleNumber = new RegExp(vehicleNumber, "i");
      }
      if (crop) {
        query.crop = new mongoose.Types.ObjectId(crop);
      }

      query.disabled = { $ne: true };
      query.is_inactive = { $ne: true };

      console.log(query);

      // Aggregate query to get truck loading data with filters, pagination, and sorting
      let result = await Model.aggregate([
        { $match: query },
        { $sort: sorting },
        { $skip: _skip },
        { $limit: _limit },
        {
          $lookup: {
            from: "parties",
            localField: "partyName",
            foreignField: "_id",
            as: "partyDetails",
          },
        },
        {
          $lookup: {
            from: "deliveries",
            localField: "deliveryLocation",
            foreignField: "_id",
            as: "deliveryDetails",
          },
        },
        {
          $lookup: {
            from: "hammals",
            localField: "assignedHammal",
            foreignField: "_id",
            as: "hammalDetails",
          },
        },
        {
          $lookup: {
            from: "crops",
            localField: "crop",
            foreignField: "_id",
            as: "cropDetails",
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "createdBy",
            foreignField: "_id",
            as: "userDetails",
          },
        },
        {
          $lookup: {
            from: "storages",
            localField: "storage",
            foreignField: "_id",
            as: "wearhouseDetails",
          },
        },
        {
          $lookup: {
            from: "trucks",
            localField: "truck",
            foreignField: "_id",
            as: "truckDetails",
          },
        },
        {
          $unwind: {
            preserveNullAndEmptyArrays: true,
            path: "$truckDetails",
          },
        },
        {
          $unwind: "$cropDetails",
        },
        {
          $unwind: "$hammalDetails",
        },
        {
          $unwind: "$deliveryDetails",
        },
        {
          $unwind: "$partyDetails",
        },
        {
          $unwind: "$userDetails",
        },
        {
          $unwind: "$wearhouseDetails",
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
      const { id } = req.params;

      if (!id) {
        return res
          .status(400)
          .json({ error: "Invalid Parameters: Missing ID" });
      }

      const data = req.body;

      if (!data) {
        return res.status(400).json({ error: "No data provided for update." });
      }

      // Validate required fields
      // if (data.partyName === undefined) {
      //   return res.status(400).json({ error: "Party Name is required." });
      // }
      // if (data.vehicleNumber === undefined) {
      //   return res.status(400).json({ error: "Vehicle Number is required." });
      // }
      // if (data.deliveryLocation === undefined) {
      //   return res
      //     .status(400)
      //     .json({ error: "Delivery Location is required." });
      // }
      // if (data.assignedHammal === undefined) {
      //   return res.status(400).json({ error: "Assigned Hammal is required." });
      // }
      // if (data.boraQuantity === undefined) {
      //   return res.status(400).json({ error: "Bora Quantity is required." });
      // }
      // if (data.unitBora === undefined) {
      //   return res.status(400).json({ error: "Unit Bora is required." });
      // }
      // if (data.crop === undefined) {
      //   return res.status(400).json({ error: "Crop is required." });
      // }

      // Calculate netWeight using the formula: netWeight = boraQuantity * unitBora
      data.netWeight = data.boraQuantity * data.unitBora;

      // Assign the `updated_at` field
      data.updated_at = Date.now();

      // Update the TruckLoading document by ID and return the updated document
      const result = await Model.findByIdAndUpdate(
        id,
        { $set: data },
        { new: true, runValidators: true } // Return the updated document and run validators
      );

      if (!result) {
        return res.status(404).json({ error: "TruckLoading entry not found" });
      }

      res.json(result);
    } catch (error) {
      console.error("Error updating TruckLoading:", error);
      next(createError(500, "Failed to update TruckLoading.")); // Handle errors and send a 500 response
    }
  },
  delete: async (req, res, next) => {
    try {
      const { id } = req.params;

      if (!id) {
        throw createError.BadRequest("Invalid Parameters: Missing ID");
      }

      const deleted_at = Date.now();

      // Performing a soft delete by marking the TruckLoading as inactive and setting the deleted_at timestamp
      const result = await Model.updateOne(
        { _id: mongoose.Types.ObjectId(id) },
        { $set: { disabled: true, deleted_at } }
      );

      if (result.nModified === 0) {
        throw createError.NotFound("TruckLoading not found or already deleted");
      }

      res.json({ message: "TruckLoading deleted successfully", result });
    } catch (error) {
      next(error);
    }
  },
  get: async (req, res, next) => {
    try {
      const { id } = req.params;

      if (!id) {
        throw createError.BadRequest("Invalid Parameters: Missing ID");
      }

      // Finding the TruckLoading document by its ID
      // const result = await Model.findOne({ _id: mongoose.Types.ObjectId(id) });
      const result = await Model.aggregate([
        { $match: { _id: mongoose.Types.ObjectId(id) } },
        {
          $lookup: {
            from: "parties",
            localField: "partyName",
            foreignField: "_id",
            as: "partyDetails",
          },
        },
        {
          $lookup: {
            from: "deliveries",
            localField: "deliveryLocation",
            foreignField: "_id",
            as: "deliveryDetails",
          },
        },
        {
          $lookup: {
            from: "hammals",
            localField: "assignedHammal",
            foreignField: "_id",
            as: "hammalDetails",
          },
        },
        {
          $lookup: {
            from: "crops",
            localField: "crop",
            foreignField: "_id",
            as: "cropDetails",
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "createdBy",
            foreignField: "_id",
            as: "userDetails",
          },
        },
        {
          $lookup: {
            from: "storages",
            localField: "storage",
            foreignField: "_id",
            as: "wearhouseDetails",
          },
        },
        {
          $lookup: {
            from: "trucks",
            localField: "truck",
            foreignField: "_id",
            as: "truckDetails",
          },
        },
        {
          $lookup: {
            from: "transports",
            localField: "transport",
            foreignField: "_id",
            as: "transportDetails",
          },
        },
        {
          $unwind: {
            preserveNullAndEmptyArrays: true,
            path: "$truckDetails",
          },
        },
        {
          $unwind: "$cropDetails",
        },
        {
          $unwind: "$hammalDetails",
        },
        {
          $unwind: "$deliveryDetails",
        },
        {
          $unwind: "$partyDetails",
        },
        {
          $unwind: "$userDetails",
        },
        {
          $unwind: "$wearhouseDetails",
        },
        {
          $unwind: {
            path: "$transportDetails",
            preserveNullAndEmptyArrays: true,
          },
        }
      ]);

      if (!result.length) {
        throw createError.NotFound("No TruckLoading Found");
      }

      res.json(result[0]);
    } catch (error) {
      next(error);
    }
  },

  getTruckLoadingAggregatedData: async (req, res) => {
    try {
      const result = await Model.aggregate([
        {
          $lookup: {
            from: "crops",
            localField: "crop",
            foreignField: "_id",
            as: "cropDetails",
          },
        },
        { $unwind: "$cropDetails" },
        {
          $group: {
            _id: "$crop",
            crop_name: { $first: "$cropDetails.name" },
            totalBoraValue: {
              $sum: {
                $multiply: ["$unitBora", "$boraQuantity"],
              },
            },
            totalBharti: { $sum: "$bharti" },
            totalRate: {
              $sum: {
                $add: [
                  { $multiply: ["$unitBora", "$boraQuantity"] },
                  "$bharti",
                ],
              },
            },
          },
        },
      ]);

      res.status(200).json(result);
    } catch (error) {
      console.error("Error executing aggregation:", error);
      res
        .status(500)
        .json({ message: "Internal server error", error: error.message });
    }
  },
  getTruckLoadingDetails: async (req, res) => {
    try {
      const results = await Model.aggregate([
        {
          $lookup: {
            from: "parties",
            localField: "partyName",
            foreignField: "_id",
            as: "partyDetails",
          },
        },
        {
          $lookup: {
            from: "deliveries",
            localField: "deliveryLocation",
            foreignField: "_id",
            as: "deliveryDetails",
          },
        },
        {
          $lookup: {
            from: "hammals",
            localField: "assignedHammal",
            foreignField: "_id",
            as: "hammalDetails",
          },
        },
        {
          $lookup: {
            from: "crops",
            localField: "crop",
            foreignField: "_id",
            as: "cropDetails",
          },
        },
        {
          $project: {
            _id: 1,
            partyName: { $arrayElemAt: ["$partyDetails.name", 0] },
            deliveryLocation: { $arrayElemAt: ["$deliveryDetails.name", 0] },
            assignedHammal: { $arrayElemAt: ["$hammalDetails.name", 0] },
            cropName: { $arrayElemAt: ["$cropDetails.name", 0] },
          },
        },
      ]);

      res.status(200).json(results);
    } catch (error) {
      throw new Error(error);
    }
  },
  getTransactionSummary: async (req, res) => {
    try {
      const {
        partyName,
        vehicleNumber,
        page,
        limit,
        order_by,
        order_in,
        from,
        to,
      } = req.query;

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
      if (partyName) {
        query.partyName = mongoose.Types.ObjectId(partyName);
      }
      if (vehicleNumber) {
        query.vehicleNumber = new RegExp(vehicleNumber, "i");
      }

      // Add date range filter based on 'from' and 'to' params
      if (from || to) {
        query.created_at = {};
        if (from) {
          query.created_at.$gte = new Date(from);
        }
        if (to) {
          query.created_at.$lte = new Date(to);
        }
      }

      query.disabled = { $ne: true };
      query.is_inactive = { $ne: true };

      console.log(query);

      // Aggregate query to get truck loading data with filters, pagination, and sorting
      let result = await Model.aggregate([
        { $match: query },
        { $sort: sorting },

        {
          $lookup: {
            from: "crops",
            localField: "crop",
            foreignField: "_id",
            as: "cropDetails",
          },
        },
        { $unwind: "$cropDetails" },

        // Grouping by crop to calculate sum of rates
        {
          $group: {
            _id: "$cropDetails._id",
            cropName: { $first: "$cropDetails.name" },
            totalRate: { $sum: "$rate" },
          },
        },
        {
          $sort: sorting,
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
      throw new Error(error);
    }
  },
  getWeightSummary: async (req, res) => {
    try {
      const {
        partyName,
        vehicleNumber,
        page,
        limit,
        order_by,
        order_in,
        from,
        to,
      } = req.query;

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
      if (partyName) {
        query.partyName = mongoose.Types.ObjectId(partyName);
      }
      if (vehicleNumber) {
        query.vehicleNumber = new RegExp(vehicleNumber, "i");
      }

      // Add date range filter based on 'from' and 'to' params
      if (from || to) {
        query.created_at = {};
        if (from) {
          query.created_at.$gte = new Date(from);
        }
        if (to) {
          query.created_at.$lte = new Date(to);
        }
      }

      query.disabled = { $ne: true };
      query.is_inactive = { $ne: true };

      console.log(query);

      // Aggregate query to get truck loading data with filters, pagination, and sorting
      let result = await Model.aggregate([
        { $match: query },
        { $sort: sorting },

        {
          $lookup: {
            from: "crops",
            localField: "crop",
            foreignField: "_id",
            as: "cropDetails",
          },
        },
        { $unwind: "$cropDetails" },

        // Grouping by crop to calculate total weight and sum of weights
        {
          $group: {
            _id: "$cropDetails._id",
            cropName: { $first: "$cropDetails.name" },
            totalWeight: {
              $sum: { $multiply: ["$boraQuantity", "$unitBora"] },
            }, // Calculate total weight
          },
        },
        {
          $sort: sorting,
        },
      ]);

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
      throw new Error(error);
    }
  },
  // getByUserRole: async function (req, res) {
  //   const { id } = req.params;
  //   const page = parseInt(req.query.page) || 1;
  //   const limit = parseInt(req.query.limit) || 10;

  //   try {
  //     const skip = (page - 1) * limit;

  //     const users = await Model.find({ createdBy: id, disabled: false })
  //       .skip(skip)
  //       .limit(limit);

  //     const totalCount = await Model.countDocuments({
  //       createdBy: id,
  //       disabled: false,
  //     });

  //     const totalPages = Math.ceil(totalCount / limit);

  //     res.status(200).json({ users, totalPages });
  //   } catch (error) {
  //     res.status(500).json({ message: "Failed to retrieve Users", error });
  //   }
  // },
  getByUser: async function (req, res) {
    const { id } = req.params;
    const { page, limit, order_by, order_in } = req.query;

    const _page = page ? parseInt(page) : 1;
    const _limit = limit ? parseInt(limit) : 10;
    const _skip = (_page - 1) * _limit;

    try {
      // Define sorting logic
      let sorting = {};
      if (order_by) {
        sorting[order_by] = order_in === "desc" ? -1 : 1;
      } else {
        sorting["_id"] = -1; // Default sorting by _id (descending)
      }

      // Aggregation pipeline to filter by createdBy and disabled fields
      const query = {
        createdBy: mongoose.Types.ObjectId(id),
        disabled: false
      };

      let result = await Model.aggregate([
        { $match: query }, // Match the query for createdBy and disabled fields
        { $sort: sorting }, // Apply sorting
        { $skip: _skip }, // Pagination: Skip results based on page
        { $limit: _limit }, // Limit results per page
        {
          $lookup: {
            from: "users", // Lookup related user details (adjust this as per your schema)
            localField: "createdBy",
            foreignField: "_id",
            as: "userDetails",
          },
        },
        {
          $lookup: {
            from: "parties",
            localField: "partyName",
            foreignField: "_id",
            as: "partyDetails",
          },
        },
        {
          $lookup: {
            from: "deliveries",
            localField: "deliveryLocation",
            foreignField: "_id",
            as: "deliveryDetails",
          },
        },
        {
          $lookup: {
            from: "hammals",
            localField: "assignedHammal",
            foreignField: "_id",
            as: "hammalDetails",
          },
        },
        {
          $lookup: {
            from: "crops",
            localField: "crop",
            foreignField: "_id",
            as: "cropDetails",
          },
        },
        { $unwind: "$userDetails" },
        {
          $unwind: "$cropDetails",
        },
        {
          $unwind: "$hammalDetails",
        },
        {
          $unwind: "$deliveryDetails",
        },
        {
          $unwind: "$partyDetails",
        }, // Unwind the user details if necessary
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
      res.status(500).json({ message: 'Failed to retrieve users', error });
    }
  },
  // getWearhouseSummary: async (req, res) => {
  //   try {
  //     const { partyName,
  //       vehicleNumber,
  //       page,
  //       limit,
  //       order_by,
  //       order_in,
  //       from,
  //       to, } = req.query;

  //     const _page = page ? parseInt(page) : 1;
  //     const _limit = limit ? parseInt(limit) : 20;
  //     const _skip = (_page - 1) * _limit;

  //     let sorting = {};
  //     if (order_by) {
  //       sorting[order_by] = order_in === "desc" ? -1 : 1;
  //     } else {
  //       sorting["_id"] = -1;
  //     }

  //     const query = {};
  //     if (partyName) {
  //       query.partyName = new RegExp(partyName, "i");
  //     }

  //     if (from || to) {
  //       query.created_at = {};
  //       if (from) {
  //         query.created_at.$gte = new Date(from);
  //       }
  //       if (to) {
  //         query.created_at.$lte = new Date(to);
  //       }
  //     }

  //     query.disabled = { $ne: true };
  //     query.is_inactive = { $ne: true };

  //     console.log(query);

  //     let result = await Model.aggregate([
  //       { $match: query },
  //       { $sort: sorting },
  //       { $skip: _skip },
  //       { $limit: _limit },
  //       {
  //         $lookup: {
  //           from: "farmers",
  //           localField: "farmer",
  //           foreignField: "_id",
  //           as: "farmerDetails",
  //         },
  //       },
  //       {
  //         $lookup: {
  //           from: "crops",
  //           localField: "crop",
  //           foreignField: "_id",
  //           as: "cropDetails",
  //         },
  //       },
  //       {
  //         $lookup: {
  //           from: "storages",
  //           localField: "storage",
  //           foreignField: "_id",
  //           as: "wearhouseDetails",
  //         },
  //       },
  //       { $unwind: "$farmerDetails" },
  //       { $unwind: "$cropDetails" },
  //       { $unwind: "$wearhouseDetails" }, // Unwind the wearhouse details

  //       {
  //         $group: {
  //           _id: "$wearhouseDetails._id", // Group by wearhouseDetails
  //           storageName: { $first: "$wearhouseDetails.name" }, // Use the wearhouse name
  //           totalRate: { $sum: "$rate" }, // Calculate totalRate for each wearhouse
  //         },
  //       },
  //       { $sort: sorting },
  //     ]);

  //     console.log("result", result);
  //     const resultCount = await Model.countDocuments(query);

  //     res.json({
  //       data: result,
  //       meta: {
  //         current_page: _page,
  //         from: _skip + 1,
  //         last_page: Math.ceil(resultCount / _limit),
  //         per_page: _limit,
  //         to: _skip + result.length,
  //         total: resultCount,
  //       },
  //     });
  //   } catch (error) {
  //     throw new Error(error);
  //   }
  // }

  getWearhouseSummary: async (req, res) => {
    try {
      const {
        partyName,
        vehicleNumber,
        page,
        limit,
        order_by,
        order_in,
        from,
        to,
      } = req.query;

      const _page = page ? parseInt(page) : 1;
      const _limit = limit ? parseInt(limit) : 20;
      const _skip = (_page - 1) * _limit;

      let sorting = {};
      if (order_by) {
        sorting[order_by] = order_in === "desc" ? -1 : 1;
      } else {
        sorting["_id"] = -1;
      }

      // Build query object
      const query = {};
      if (partyName) {
        query.partyName = new RegExp(partyName, "i");
      }

      if (from || to) {
        query.created_at = {};
        if (from) {
          query.created_at.$gte = new Date(from);
        }
        if (to) {
          query.created_at.$lte = new Date(to);
        }
      }

      query.disabled = { $ne: true };
      query.is_inactive = { $ne: true };

      console.log("Query being used:", query);

      // Debugging: Test base query without lookups and grouping
      let baseResult = await Model.aggregate([
        { $match: query },
        { $sort: sorting },
        { $skip: _skip },
        { $limit: _limit },
      ]);

      console.log("Base query result:", baseResult);

      // If baseResult is empty, there's an issue with the query, sorting, or pagination
      if (baseResult.length === 0) {
        console.log("No records found for base query.");
      }

      // Now reintroduce the lookups and grouping step-by-step to identify issues
      let result = await Model.aggregate([
        { $match: query },
        { $sort: sorting },
        { $skip: _skip },
        { $limit: _limit },
        {
          $lookup: {
            from: "farmers",
            localField: "farmer",
            foreignField: "_id",
            as: "farmerDetails",
          },
        },
        {
          $lookup: {
            from: "crops",
            localField: "crop",
            foreignField: "_id",
            as: "cropDetails",
          },
        },
        {
          $lookup: {
            from: "storages",
            localField: "storage",
            foreignField: "_id",
            as: "wearhouseDetails",
          },
        },
        // Removed $unwind temporarily for debugging
        // { $unwind: "$farmerDetails" },
        // { $unwind: "$cropDetails" },
        // { $unwind: "$wearhouseDetails" },

        // Test result after lookups without grouping
        {
          $project: {
            farmerDetails: 1,
            cropDetails: 1,
            wearhouseDetails: 1,
            rate: 1
          }
        }
      ]);

      console.log("Aggregation result before grouping:", result);

      // If there’s no data, it's likely an issue with the lookups or matching conditions.
      if (result.length === 0) {
        console.log("No results found after lookup stages.");
      }

      // Now proceed with the grouping step if there is data
      let groupedResult = await Model.aggregate([
        { $match: query },
        { $sort: sorting },
        { $skip: _skip },
        { $limit: _limit },
        {
          $lookup: {
            from: "farmers",
            localField: "farmer",
            foreignField: "_id",
            as: "farmerDetails",
          },
        },
        {
          $lookup: {
            from: "crops",
            localField: "crop",
            foreignField: "_id",
            as: "cropDetails",
          },
        },
        {
          $lookup: {
            from: "storages",
            localField: "storage",
            foreignField: "_id",
            as: "wearhouseDetails",
          },
        },
        { $unwind: "$farmerDetails" },
        { $unwind: "$cropDetails" },
        { $unwind: "$wearhouseDetails" }, // Unwind the wearhouse details
        {
          $group: {
            _id: "$wearhouseDetails._id", // Group by wearhouseDetails
            storageName: { $first: "$wearhouseDetails.name" }, // Use the wearhouse name
            totalRate: { $sum: "$rate" }, // Calculate totalRate for each wearhouse
          },
        },
        { $sort: sorting },
      ]);

      console.log("Grouped result:", groupedResult);

      const resultCount = await Model.countDocuments(query);

      res.json({
        data: groupedResult,
        meta: {
          current_page: _page,
          from: _skip + 1,
          last_page: Math.ceil(resultCount / _limit),
          per_page: _limit,
          to: _skip + groupedResult.length,
          total: resultCount,
        },
      });
    } catch (error) {
      console.error("Error in getWearhouseSummary:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },
  getWearhouseWeightSummary: async (req, res) => {
    try {
      const {
        partyName,
        vehicleNumber,
        page,
        limit,
        order_by,
        order_in,
        from,
        to,
      } = req.query;

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
      if (partyName) {
        query.partyName = mongoose.Types.ObjectId(partyName);
      }
      if (vehicleNumber) {
        query.vehicleNumber = new RegExp(vehicleNumber, "i");
      }

      // Add date range filter based on 'from' and 'to' params
      if (from || to) {
        query.created_at = {};
        if (from) {
          query.created_at.$gte = new Date(from);
        }
        if (to) {
          query.created_at.$lte = new Date(to);
        }
      }

      query.disabled = { $ne: true };
      query.is_inactive = { $ne: true };

      console.log(query);

      // Aggregate query to get truck loading data with filters, pagination, and sorting
      let result = await Model.aggregate([
        { $match: query },
        { $sort: sorting },

        {
          $lookup: {
            from: "crops",
            localField: "crop",
            foreignField: "_id",
            as: "cropDetails",
          },
        },
        {
          $lookup: {
            from: "storages",
            localField: "storage",
            foreignField: "_id",
            as: "wearhouseDetails",
          },
        },
        { $unwind: "$cropDetails" },
        { $unwind: "$wearhouseDetails" },

        // Grouping by crop to calculate total weight and sum of weights
        {
          $group: {
            _id: "$wearhouseDetails._id",
            storageName: { $first: "$wearhouseDetails.name" },
            totalWeight: {
              $sum: { $multiply: ["$boraQuantity", "$unitBora"] },
            }, // Calculate total weight
          },
        },
        {
          $sort: sorting,
        },
      ]);

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
      throw new Error(error);
    }
  },
};
