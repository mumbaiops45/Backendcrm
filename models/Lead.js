const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const BantSchema = new Schema({
    budget: {
        confirmed: { type: Boolean, default: false },
        amount: { type: String, default: '' }, notes: String
    },
    authority: {
        confirmed: { type: Boolean, default: false }, contactName: {
            type: String,
            default: ''
        },
        notes: String
    },
    need: {
        confirmed: { type: Boolean, default: false },
        description: { type: String, default: '' }, notes: String
    },
    timeline: { confirmed: { type: Boolean, default: false }, deadline: { type: String, default: '' }, notes: String },
    score: {
        type: Number, default: 0, min: 0, max: 4
    },
}, { _id: false });

const StageTimestampSchema = new mongoose.Schema({
    stage: { type: String },
    enteredAt: { type: Date, default: Date.now },
    exitedAt: { type: Date },
    daysSpent: { type: Number, default: 0 }
}, { _id: false });

const leadSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    businessName: {
        type: String,
        trim: true,
        default: ''
    },
    businessType: {
        type: String,
        trim: true,
        default: ''
    },
    phone: {
        type: String,
        trim: true,
        default: ''
    },
    email: {
        type: String,
        trim: true,
        default: ''
    },
    location: {
        type: String,
        trim: true,
        default: ''
    },

    // Assignment

    branch: {
        type: String,
        enum: ['Bangalore', 'Mumbai', 'Mysore'],
        required: true
    },
    // assignedTo: {
    //     type: mongoose.Schema.Types.ObjectId, ref: 'User'
    // },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },

    assignedTo: {
        type: String,
        enum: ["Arjun S", "Divya M", "Karthik R"],
        default: 'Arjun S'
    },

    // PipeLine
    stage: {
        type: String,
        enum: ['Lead Capture', 'Reachable', 'Qualified', 'Proposal Sent', 'Closed Won', 'Closed Lost'],
        default: 'Lead Capture'
    },
    priority: {
        type: String,
        enum: ['Hot', 'Warm', 'Cool'],
        default: 'Warm'
    },
    source: {
        type: String,
        enum: ["WhatsApp", 'Website Form', 'Phone Call', "Referral", 'Social Media', 'Walk-in', 'Other'],
        default: 'Other'
    },

    dealValue: {
        type: Number, default: 12300
    },
    invoiceValue: { type: Number, default: 0 },

    requirements: { type: String, default: '' },
    notes: { type: String, default: '' },
    // notes: {
    //     type: [
    //         {
    //             text: String,
    //             createdby: {
    //                 type: mongoose.Schema.Types.ObjectId,
    //                 ref: 'User'
    //             },
    //             createdAt: {
    //                 type: Date, 
    //                 default: Date.now
    //             }
    //         }
    //     ],
    //     default: []
    // },

   
    bant: { type: BantSchema, default: () => ({}) },

    statgeHistory: [StageTimestampSchema],

    closedAt: { type: Date },
    lastContact: { type: Date },

    tags: [{ type: String }],

    documents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Document' }],


    isDeleted: { type: Boolean, default: false }
}, { timestamps: true })


leadSchema.index({ branch: 1, stage: 1 });
leadSchema.index({ assigned: 1 });
leadSchema.index({ createdAt: -1 });
leadSchema.index({ phone: 1 });


const Lead = mongoose.model('Lead', leadSchema);

module.exports = Lead;