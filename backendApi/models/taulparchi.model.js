const mongoose = require("mongoose");

const TaulParchiSchema = new mongoose.Schema({
    purchase: {
        type: String,
        enum: ['directPurchase', 'AuctionMandiPurchase'],
    },
    farmer: {
        type: mongoose.Types.ObjectId,
        ref: 'farmers'
    },
    village: {
        type: mongoose.Types.ObjectId,
    },
    // mobile:{
    //     type: mongoose.Types.ObjectId,
    // },
    storage: {
        type: mongoose.Types.ObjectId,
    },
    firm_company: {
        type: mongoose.Types.ObjectId,
    },
    rate: {
        type: Number,
    },
    hammal: {
        type: mongoose.Types.ObjectId,
        ref: 'hammals',
        required: function () {
            return this.tulai === 'Labour';
        },
        default: null,

    },
    boraQuantity: {
        type: Number,
    },
    bharti: {
        type: Number,
    },
    looseQuantity: {
        type: Number,

    },
    netWeight: {
        type: Number,
    },
    crop: {
        type: mongoose.Types.ObjectId,
        ref: 'crop'
    },
    tulai: {
        type: String,
        enum: ['Labour', 'Dharamkata'],
    },
    exemptHammali: {
        type: String,
        enum: ['deduct', 'exempted'],
    },
    amount: {
        type: Number,
    },
    other:{
        type: String
    },
    hammali:{
        type: Number
    },
    created_at: {
        type: Date,
        default: Date.now
    },
    createdBy: {
        type: mongoose.Types.ObjectId,
        ref: 'user',
    },
    updated_at: {
        type: Date
    },
    deleted_at: {
        type: Date
    },
    disabled: {
        type: Boolean,
        default: false
    },
    is_inactive: {
        type: Boolean,
        default: false
    }
});

TaulParchiSchema.pre('save', function (next) {
    if (this.isModified()) {
        this.updated_at = Date.now();
    }
    next();
});

const TaulParchi = mongoose.model("TaulParchi", TaulParchiSchema);

module.exports = TaulParchi;
