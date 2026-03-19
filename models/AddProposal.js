const mongoose = require('mongoose');
const {Schema} = mongoose;


const addProposal = new Schema({
    clientName: {
        type: String,
        required: true,
        trim:true
    },
    contactperson:{
type: String,

trim: true
    },
    city:{
        type: String,
        
        trim: true
    },
   category: {
   type: String,
   enum: [
     "Website Development",
     "Mobile App",
     "E-Commerce",
     "Web Platform",
     "Digital Marketing",
     "2D Animation",
     "CRM / Software",
     "3D + AR Website",
     "Website + CRM",
     "Corporate Video",
     "SEO",
     "Other"
   ],
   required: true
},
    dealValue:{
        type: Number,
        required: true,
        min:0
    },
    Stage:{
        type: String,
        enum: ["Lead", "Proposal Sent","Negotiation","Won","Lost", "On Hold"],
        default: 'Lead'
    },
    proposalDate:{
        type: Date,
        default: Date.now
    },
    expectedClose: {
        type: Date,
        validate:{
            validator: function(value){
                if(!value) return true;
                return value >= this.proposalDate;
            },
            message: 'Expected closed date cannot be before proposal date',
        }
       
    },
    probability:{
        type: Number,
        required: true,
        min: 5,
        max: 100,
        default: 50
    },
    notes:{
        type: String,
        trim: true,
    },
    createdBy:{
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    }
},{timestamps: true});


addProposal.index({clientName: 1});
addProposal.index({stage: 1});
addProposal.index({category: 1});


const Proposal = mongoose.model("Proposal", addProposal);
module.exports = Proposal;