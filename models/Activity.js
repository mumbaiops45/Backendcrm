const mongoose = require("mongoose");


const ActivitySchema = new mongoose.Schema({
     lead: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead',     required: true },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    type: {
        type: String,
        enum: ['Call', "WhatsApp", "Email", "Stage Change", "Note", 'Document', 'Deal Lost', 'Lead Created', 'Follow-up', 'Meeting', 'In-Person', "SMS"],
        required: true
    },
    description: {
        type: String, 
        required: true
    },
    outcome: {
        type: String,
        default: ''
    },

    duration: {
        type: Number
    },
    direction:{
        type: String,
        enum: ['Inbound', 'Outbound', ''],
        default: ''
    },

    fromStage: {
        type: String
    },
    toStage:{
        type: String
    },

    metadata: {
        type:mongoose.Schema.Types.Mixed
    }
}, {timestamps: true});


ActivitySchema.index({lead: 1, createdAt: -1});
ActivitySchema.index({user:1, createdAt: -1});
ActivitySchema.index({branch:1, createdAt: -1});


module.exports = mongoose.model('Activity', ActivitySchema);