const mongoose =  require('mongoose');

const revenueSchema = new mongoose.Schema({
    amount:{
        type: Number,
        required: true,
        min:0
    } ,
    date: {
        type: Date,
        default: Date.now
    },
    proposalId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Proposal",
        required: true
    },
    createdBy:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    note: {
        type: String,
        trim: true
    }
},{timestamps: true});


revenueSchema.index({date: 1});
revenueSchema.index({proposalId: 1});

module.exports = mongoose.model("Revenue", revenueSchema);