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



exports.getTotal = async (req, res) => {
    try {
        const result = await Lead.aggregate([
            {
                $match: { isDeleted: false }
            },
            {
                $group: {
                    _id: null,
                    totalAmount: { $sum: "$dealValue" }
                }
            }
        ]);

        const total = result[0]?.totalAmount || 0;

        const formattedAmount = `₹ ${total.toLocaleString("en-IN")}`;

        res.json({
            totalAmount: formattedAmount,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
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

exports.searchstate = async (req, res) => {
    try {
        const { location } = req.query;
        let filter = {};

        if (location) {
            filter.location = { $regex: `^${location}$`, $options: "i" };
        }

        const leads = await Lead.find(filter);

        if (!leads || leads.length === 0) {
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
        res.status(500).json({ message: "Internal Server Error" });
    }
}

exports.searchLeads = async (req, res) => {
    try {
        const { location, stage, priority, source, rep } = req.query;
        let filter = {};
        if (location) {
            filter.location = { $regex: `^${location}$`, $options: "i" };
        }
        if (stage) {
            filter.stage = { $regex: `^${stage}$`, $options: "i" };
        }
        if (priority) {
            filter.priority = { $regex: `^${priority}$`, $options: "i" };
        }
        if (source) {
            filter.source = { $regex: source, $options: "i" };
        }
        if (rep) {
            filter["createdBy.name"] = {
                $regex: rep, $options: "i"
            };
        }

        console.log("FILTER:", filter);

        const leads = await Lead.find(filter);

        if (!leads || leads.length === 0) {
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
        res.status(500).json({ message: "Internal Server Error" })
    }
}

exports.getBant = async (req, res) => {
  try {
    const leads = await Lead.find({ isDeleted: false });
    const bants = leads.map(lead => {
      const { bant, name, businessName } = lead;
      const filteredBant = {};
      if (bant.budget?.confirmed || bant.budget?.amount) {
        filteredBant.budget = bant.budget;
      }
      if (bant.authority?.confirmed || bant.authority?.contactName) {
        filteredBant.authority = bant.authority;
      }
      if (bant.need?.confirmed || bant.need?.description) {
        filteredBant.need = bant.need;
      }
      if (bant.timeline?.confirmed || bant.timeline?.deadline) {
        filteredBant.timeline = bant.timeline;
      }
      if (Object.keys(filteredBant).length > 0) {
        return {
          leadId: lead._id,
          name,
          businessName,
          bant: filteredBant
        };
      } else {
        return null;
      }
    }).filter(Boolean); 

    res.json({ success: true, data: bants });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

exports.getLeaderboard = async (req, res) => {
    try {
        const leads = await Lead.find();

        const map = {};

        leads.forEach((lead) => {
            // Skip if not Closed Won
            if (lead.stage !== "Closed Won") return;
            
            let repName = lead.assignedTo;
            if (!repName) {
                if (lead.branch === "Mumbai") repName = "Unassigned Mumbai";
                else if (lead.branch === "Bangalore") repName = "Unassigned Bangalore";
                else if (lead.branch === "Mysore") repName = "Unassigned Mysore";
                else repName = "Unknown";
            }

            if (!map[repName]) {
                map[repName] = {
                    name: repName,
                    closed: 0,
                    revenue: 0,
                    branches: new Set(),
                };
            }

            const rep = map[repName];

            if (lead.branch) {
                rep.branches.add(lead.branch.toLowerCase().trim());
            }

            rep.closed += 1;
            rep.revenue += lead.dealValue || 0;
        });

        // Function to determine branch label based on branches
        function getBranchLabel(branchesSet) {
            const branches = [...branchesSet];
            
            const hasBangalore = branches.some(b => b === "bangalore");
            const hasMysore = branches.some(b => b === "mysore");
            const hasMumbai = branches.some(b => b === "mumbai");
            
            // Priority: BLR + MYS > Bangalore > Mumbai > Mysore
            if (hasBangalore && hasMysore) return "BLR + MYS";
            if (hasBangalore) return "Bangalore";
            if (hasMumbai) return "Mumbai";
            if (hasMysore) return "Mysore";
            
            return "Other";
        }

        // Convert map to array and calculate branch label
        let result = Object.values(map).map((rep) => ({
            name: rep.name,
            closed: rep.closed,
            revenue: rep.revenue,
            branch: getBranchLabel(rep.branches),
        }));

        // Sort by revenue within each branch category
        result.sort((a, b) => b.revenue - a.revenue);

        // Function to format revenue
        function formatRevenue(val) {
            if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
            if (val >= 1000) return `₹${(val / 1000).toFixed(1)}K`;
            return `₹${val}`;
        }

        // Get top performer from each branch category
        const branchCategories = ["BLR + MYS", "Bangalore", "Mumbai", "Mysore"];
        const selectedReps = [];
        
        for (const category of branchCategories) {
            const bestInCategory = result.find(rep => rep.branch === category);
            if (bestInCategory && selectedReps.length < 3) {
                selectedReps.push(bestInCategory);
            }
        }
        
        // If we still don't have 3 reps, fill with remaining top performers
        if (selectedReps.length < 3) {
            for (const rep of result) {
                if (!selectedReps.includes(rep) && selectedReps.length < 3) {
                    selectedReps.push(rep);
                }
            }
        }

        // Format the leaderboard data
        const leaderboardData = selectedReps.slice(0, 3).map((rep, index) => ({
            rank: index + 1,
            initials: rep.name
                .split(" ")
                .map(n => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2),
            name: rep.name,
            branch: rep.branch,
            closed: rep.closed,
            revenue: formatRevenue(rep.revenue),
        }));

        res.json({
            success: true,
            data: leaderboardData,
        });
    } catch (error) {
        console.error("Leaderboard Error:", error);
        res.status(500).json({
            success: false,
            message: "Server Error",
            error: error.message
        });
    }
};

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