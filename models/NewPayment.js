const mongoose = require('mongoose');

const {Schema} = mongoose;

const paymentschema = new Schema({
    dateReceived: {
        type: Date,
        default: Date.now
    },
    invoiceNumber: {
        type: String,
        required: true,
        trim: true
    },
    client: {
        type: Schema.Types.ObjectId,
        ref: 'AddClient',
        required: true
    },
    project: {
        type: String,
        required: true,
        trim: true
    },
    amountReceived: {
        type: Number,
        required: true,
        min:0
    },
    paymentMode: {
        type: String,
        enum: ["NEFT", "RTGS", "UPI", "Cheque", "Cash", "IMPS", "Wire"],
        required: true,
        trim: true,
    },
    tdsClient:{
        type: Number,
        default: 0,
        min: 0
    },
    remarks:{
        type: String, 
        default: "",
        trim: true
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, { timestamps: true});

const Payment = mongoose.model("Payment", paymentschema );

module.exports = Payment;