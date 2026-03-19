const Lead = require("../models/Lead");
const User = require("../models/User");
const { validationResult } = require('express-validator');


exports.GetAlldata = async (req, res) => {
    try {
        const Allleads = await Lead.find({}).populate("createdBy", "name")
            .populate("documents");
        res.json({ Allleads });
    } catch (error) {
        console.log(error.message);
        return res.status(500).send("Internal Server Error")
    }
}


exports.getTotal = async(req, res) =>{
    try {
        const result = await Lead.aggregate([
            {
                $match: { isDeleted: false}
            },
            {
                $group: {
                    _id: null,
                    totalAmount: {$sum: "$dealValue"}
                }
            }
        ]);

        const total = result[0]?.totalAmount || 0;

        const formattedAmount = `₹ ${total.toLocaleString("en-IN")}`;

        res.json({
            totalAmount: formattedAmount,
        });
    } catch (error) {
        res.status(500).json({message: error.message});
    }
};



exports.RecentActivity = async (req, res) => {
    try {
        const leads = await Lead.find({ isDeleted: false })
            .sort({ createdAt: -1 })
            .limit(10)
            .populate("createdBy", "name");

        const activities = leads.map((lead) => {
            let title = "";
            let value = "";
            let name = "";


            if (lead.stage === "Closed Won") {
                title = `Deal closed - ${lead.businessName}`;
                value = `₹${lead.dealValue} `;
                name = `${lead.createdBy?.name || ""}`;

            }

            else if (lead.stage === "Proposal Sent") {
                title = `Proposal send - ${lead.businessName}`;
                value = `₹${lead.dealValue} `;
                name = `${lead.createdBy?.name || ""}`;
            }

            else if (lead.stage === "Qualified") {
                title = `Quslified - ${lead.businessName}`;
                value = `₹${lead.dealValue} `;
                name = `${lead.createdBy?.name || ""}`;
            }

            else {
                title = `Lead created - ${lead.businessName}`;
                value = `₹${lead.dealValue} `;
                name = `${lead.createdBy?.name || ""}`;
            }

            return {
                id: lead._id,
                title,
                value,
                name,
                branch: lead.branch,
                createdAt: lead.createdAt
            };
        });

        res.json({
            success: true,
            count: activities.length,
            data: activities
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

exports.searchstate = async(req, res) =>{
    try {
        const {location} = req.query;
        let filter = {};

        if(location){
            filter.location = { $regex: `^${location}$`, $options: "i" };
        }

        const leads = await Lead.find(filter);

        if(!leads || leads.length === 0){
            return res.status(404).json({
                success: false,
                message: "No leads found for given filters"
            });
        }
       
        res.status(200).json({
            success: true,
            leads
        });
    } catch (error) {
      console.log(error.message)  
      res.status(500).json({message: "Internal Server Error"});
    }
}

exports.searchLeads = async(req, res)  =>{
    try {
        const {location, stage, priority, source , rep} = req.query;
        let filter = {};
        if(location){
            filter.location = { $regex: `^${location}$`, $options: "i" };
        }
        if(stage){
            filter.stage = { $regex: `^${stage}$`, $options: "i" }; 
        }
        if(priority){
            filter.priority = { $regex: `^${priority}$`, $options: "i" }; 
        }
        if(source){
            filter.source = { $regex: source, $options: "i" }; 
        }
        if(rep){
            filter["createdBy.name"] = {
                $regex: rep, $options: "i"
            };
        }

        console.log("FILTER:", filter);

        const leads = await Lead.find(filter);

        if(!leads || leads.length === 0){
            return res.status(404).json({
                success: false,
                message: "No leads found for given filters"
            });
        }
       
        res.status(200).json({
            success: true,
            leads
        });
    } catch (error) {
        console.log(error.message);
        res.status(500).json({message: "Internal Server Error"})
    }
}


exports.CreateLead = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, businessName, businessType, phone, email, location,
            branch, stage, priority, source, dealValue, invoiceValue,
            requirements, notes, bant, documents, assignedTo } = req.body;

        let closedAt = null;
        if (stage === "Closed Won" || stage === "Closed Lost") {
            closedAt = new Date();
        }

        const newLead = new Lead({
            name,
            businessName,
            businessType,
            phone,
            email,
            location,
            branch,
            stage,
            priority,
            source,
            dealValue,
            invoiceValue,
            requirements,
            assignedTo,
            notes,
            bant,
            documents,
            closedAt,
            createdBy: req.user.id
        });
        const savedLead = await newLead.save();
        res.json({ savedLead });

    } catch (error) {
        console.log(error.message);
        return res.status(500).send("Internal Server Error");
    }
}


exports.singleLeads = async (req, res) => {
    try {
        const lead = await Lead.findById(req.params.id);

        if (!lead) {
            return res.status(404).json({ error: "Leads are not Found" });
        }

        // if (lead.createdBy.toString() !== req.user.id) {
        //     return res.status(401).send("Not Allowed");
        // }

        res.json({ lead })
    } catch (error) {
        console.log(error.message);
        return res.status(500).send("Internal Server Error");

    }
}

exports.Update = async (req, res) => {
    try {
        const { name, businessName, businessType, phone, email, location,
            branch, stage, priority, source, dealValue, invoiceValue,
            requirements, notes } = req.body;
        const newLeads = {};
        if (name) newLeads.name = name;
        if (businessName) newLeads.businessName = businessName;
        if (businessType) newLeads.businessType = businessType;
        if (phone) newLeads.phone = phone;
        if (email) newLeads.email = email;
        if (location) newLeads.location = location;
        if (branch) newLeads.branch = branch;
        if (stage) newLeads.stage = stage;
        if (priority) newLeads.priority = priority;
        if (source) newLeads.source = source;
        if (dealValue) newLeads.dealValue = dealValue;
        if (invoiceValue) newLeads.invoiceValue = invoiceValue;
        if (requirements) newLeads.requirements = requirements;
        if (notes) newLeads.notes = notes;
        let basic = await Lead.findById(req.params.id);
        if (!basic) {
            return res.status(404).send("Lead not found");
        }
        console.log("basic.createdBy:", basic.createdBy);
        console.log("req.user.id:", req.user.id);
        if (basic.createdBy.toString() !== req.user.id) {
            return res.status(401).send("Not Allowed");
        }
        basic = await Lead.findByIdAndUpdate(
            req.params.id,
            { $set: newLeads },
            { new: true }
        );

        return res.json({ basic });
    } catch (error) {
        console.log(error.message);
        return res.status(500).send("Internal Server Error");
    }
}


exports.Delete = async (req, res) => {
    try {
        let lead = await Lead.findById(req.params.id);
        if (!lead) {
            return res.status(400).send("Not Found");
        }

        if (lead.createdBy.toString() !== req.user.id) {
            return res.status(401).send("Not Allowed");
        }

        lead = await Lead.findByIdAndDelete(req.params.id);
        return res.json({ "success": "Leads has been delete", basic: lead });
    } catch (error) {
        console.log(error.message);
        return res.status(500).send("Internal Server Error");
    }
}