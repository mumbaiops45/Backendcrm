const mongoose = require('mongoose');
const {Schema} = mongoose;

const addClientSchema  = new Schema({
    clientName :{
        type: String, 
        required: true,
        trim: true
    },
    contactPerson : {
        type: String,
      required: true,
      trim: true,
    },
    location: {
        type: String,
        required: true,
        trim: true,
    },
    service: {
        type: String,
        required: true,
        enum: ["WebSite Development", "Mobile App","E-Commerce", "Web Platform", "Digital Marketing", "2D Animation", "CRM/ Software", "Corporate Video", "SEO", "3D+AR Website", "Website + CRM", "Website + App", "Others"],
    },
    description:{
        type:String,
        required: true,
        trim: true,
    },
    totalValue: {
        type: Number,
        required: true,
        min: 0
    },
    amountReceived: {
        type: Number,
        default:0,
        min: 0
    },
    proposalDate: {
        type: Date,
        default: Date.now
    },
    followUpDeadline:{
        type: Date,
    },
    priority:{
        type: String,
        enum: ["Hot", "Warm", "Watch", "Done"],
        required: true
    },
    paymentStatus: {
        type: String,
        enum: ["Pending", "Partial", "Paid", "Followed Up", "Not Finalised", "Declined"],
        required: true
    },
    nextAction:{
        type: String,
        required: true,
        trim: true,
    },
    lastFollowUpDate:{
        type: Date,
        required: true
    },
    notes: {
        type: String,  
        trim: true
    },
    createdBy:{
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
}, {
    timestamps: true
}

);

const AddClient = mongoose.model("AddClient", addClientSchema);

module.exports = AddClient;