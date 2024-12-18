const express = require('express');
const router = express.Router();
const TruckLoadingController = require('../controllers/truckLoading.controller');
const { verifyAccessToken } = require("../Helpers/jwt_helper");

router.get('/', verifyAccessToken, TruckLoadingController.list);

router.get('/pos', TruckLoadingController.list);

router.post('/', TruckLoadingController.create);

router.get('/userId/:id',  TruckLoadingController.getByUser);

router.get('/getsummary', TruckLoadingController.getTransactionSummary);

router.get('/getWearhousesummary', TruckLoadingController.getWearhouseSummary);

router.get('/getWeightWearhousesummary', TruckLoadingController.getWearhouseWeightSummary);

router.get('/getWeightsummary', TruckLoadingController.getWeightSummary);

router.get('/truck-loading-details',  TruckLoadingController.getTruckLoadingAggregatedData);

router.get('/getDetails',  TruckLoadingController.getTruckLoadingDetails);

router.put('/:id', TruckLoadingController.update);

router.delete('/:id', TruckLoadingController.delete);

router.get('/:id', TruckLoadingController.get);







module.exports = router;