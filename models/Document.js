const mongoose = require('mongoose');
const {Schema} = mongoose;

const DocumentSchema = new Schema({
    lead: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lead'
    },
    branch: {
        type:String
    },
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User' , required: true
    },
    docType: {
        type: String, enum: ['Invoice', 'Quotation','MoM', 'Client Input','Other'],
        required: true
    },
    docDate: {
        type: Date,
        default: Date.now
    },

    originalName: {
        type: String, required: true
    },
    fileName: {
        type: String, 
        required: true
    },
    filePath:{
        type: String,
        required: true
    },
    filleSize: {
        type: Number
    },
    mimeType:{
        type: String
    },
    extension:{
        type: String
    },


    reference: {
        type: String, default: ''
    },

    description: {
        type: String, 
        default: ''
    },
    amount: {
        type: Number
    },

    isDeleted: {
        type: Boolean,
        default: false
    }
}, {timestamps: true});


DocumentSchema.index({lead: 1});
DocumentSchema.index({docType:1});
DocumentSchema.index({uploadedBy: 1});
DocumentSchema.index({branch:1});


module.exports = mongoose.model('Document', DocumentSchema)