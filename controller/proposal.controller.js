const Proposal = require("../models/AddProposal");
const Revenues = require("../models/Revenue");

exports.getAllProposal = async(req, res) =>{
  try {
    const allProposal = await Proposal.find({});
    return res.json({allProposal});
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
}

exports.filterProposal = async (req, res) => {
  try {
    const { q } = req.query; 
    if (!q || q.trim() === "") {
      return res.status(400).json({ message: "Search query is required" });
    }

    const words = q.trim().split(/\s+/); 
    const searchConditions = words.map(word => {
      const regex = new RegExp(word, "i");
      return {
        $or: [
          { clientName: regex },
          { city: regex },
          { category: regex },
          { Stage: regex },
        ]
      };
    });

    const proposals = await Proposal.find({ $and: searchConditions });

    res.status(200).json({ proposals });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};



exports.searchProposals = async (req, res) => {
  try {
    const { q } = req.query; 
    if (!q || q.trim() === "") {
      return res.status(400).json({ message: "Search query is required" });
    }

   
    const words = q.trim().split(/\s+/);

    
    const searchConditions = words.map(word => {
      const regex = new RegExp(word, "i"); 
      return {
        $or: [
          { clientName: regex },
          { category: regex },
          { city: regex },
        ]
      };
    });

    
    const proposals = await Proposal.find({ $and: searchConditions }).sort({ proposalDate: -1 });

    if (proposals.length === 0) {
      return res.status(404).json({ message: "No proposals found matching your query" });
    }

    res.status(200).json({ proposals });
  } catch (error) {
    console.error("Search Proposals Error:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// exports.getDashboardStats = async(req, res) =>{
//   try {
//     const {startDate, endDate} = req.query;

//     const matchDateFilter = {};
//     if(startDate && endDate){
//       matchDateFilter.proposalDate = {
//         $gte: new Date(startDate),
//         $lte: new Date(endDate),
//       }
//     }

//     const activePipeline = await Proposal.aggregate([
//       {
//         $match: {
//           Stage: {$nim: ["Won", "Lost"]},
//           ...matchDateFilter,
//         },
//       },
//       {
//         $group:{
//           _id:null,
//           totalValue: {$sum: "$dealValue"},
//           count: {$sum: 1},
//         },
//       },
//     ]);

//     const weightedForecast = await Proposal.aggregate([
//       {
//         $match: {
//           Stage: {$nin: ["won", "Lost"]},
//           ...matchDateFilter,
//         },
//       },
//       {
//         $group:{
//           _id: null,
//           totalWeighted: {
//             $sum: {
//               $multiply: ["$dealValue", {$divide:
//                 ["$probability", 100]
//               }],
//             },
//           },
//         },
//       },
//     ]);

//     const wonDeals = await Proposal.aggregate([
//       {
//         $match: {
//           Stage: "Won",
//           ...matchDateFilter,
//         },
//       },
//       {
//         $group: {
//           Stage: "Won",
//           ...matchDateFilter,
//         },
//       },
//       {
//         $group:{
//           _id: null,
//           totalValue: {$sum: "$dealValue"},
//           count: {$sum: 1},
//         },
//       },
//     ]);

//     const totalDeals = await Proposal.countDocuments(matchDateFilter);

//    const wonCount = wonDeals[0]?.count || 0;

//     const conversionRate = totalDeals > 0 ? ((wonCount / totalDeals) * 100).toFixed(2): 0;

//     const avgDealValue = totalDeals > 0 ?(
//       (await Proposal.aggregate([
//         {$match: matchDateFilter},
//         {$group: {_id: null, avg: {$avg: "$dealValue"}}},
//       ]))[0]?.avg || 0
//     ).toFixed(2) : 0;

//     res.status(200).json({
//       activePipeline: {
//         value: activePipeline[0]?.totalValue || 0,
//         count: activePipeline[0]?.count || 0,
//       },
//       weightedForecast: weightedForecast[0]?.totalWeighted || 0,
//       wonThisPeriod:{
//         value:wonDeals[0]?.totalValue ||0,
//         count: wonCount,
//       },
//       conversionRate,
//       avgDealValue,
//     });
//   } catch (error) {
//     console.error("Dashboard Error:", error.message);
//     res.status(500).json({message: "Internal Server Error"});
//   }
// }

exports.getDashboardStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Build date filter if provided
    const matchDateFilter = {};
    if (startDate && endDate) {
      matchDateFilter.proposalDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    // Active pipeline (deals not Won or Lost)
    const activePipeline = await Proposal.aggregate([
      {
        $match: {
          Stage: { $nin: ["Won", "Lost"] },
          ...matchDateFilter,
        },
      },
      {
        $group: {
          _id: null,
          totalValue: { $sum: "$dealValue" },
          count: { $sum: 1 },
        },
      },
    ]);

    // Weighted forecast (not Won or Lost)
    const weightedForecast = await Proposal.aggregate([
      {
        $match: {
          Stage: { $nin: ["Won", "Lost"] },
          ...matchDateFilter,
        },
      },
      {
        $group: {
          _id: null,
          totalWeighted: {
            $sum: {
              $multiply: ["$dealValue", { $divide: ["$probability", 100] }],
            },
          },
        },
      },
    ]);

    // Won deals
    const wonDeals = await Proposal.aggregate([
      {
        $match: {
          Stage: "Won",
          ...matchDateFilter,
        },
      },
      {
        $group: {
          _id: null,
          totalValue: { $sum: "$dealValue" },
          count: { $sum: 1 },
        },
      },
    ]);

    // Total deals for conversion rate
    const totalDeals = await Proposal.countDocuments(matchDateFilter);

    const wonCount = wonDeals[0]?.count || 0;

    // Conversion rate
    const conversionRate =
      totalDeals > 0 ? ((wonCount / totalDeals) * 100).toFixed(2) : "0.00";

    // Average deal value
    const avgDealAgg = await Proposal.aggregate([
      { $match: matchDateFilter },
      { $group: { _id: null, avg: { $avg: "$dealValue" } } },
    ]);
    const avgDealValue = avgDealAgg[0]?.avg
      ? parseFloat(avgDealAgg[0].avg.toFixed(2))
      : 0;

    // Response
    res.status(200).json({
      activePipeline: {
        value: activePipeline[0]?.totalValue || 0,
        count: activePipeline[0]?.count || 0,
      },
      weightedForecast: weightedForecast[0]?.totalWeighted || 0,
      wonThisPeriod: {
        value: wonDeals[0]?.totalValue || 0,
        count: wonCount,
      },
      conversionRate,
      avgDealValue,
    });
  } catch (error) {
    console.error("Dashboard Error:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.getMonthlyCollection = async(req, res) =>{
  try {
    const {month, year} = req.query;

    const start = new Date(year, month -1 , 1);
    const end = new Date(year, month, 0 , 23, 59, 59);

    const result = await Revenues.aggregate([
      {
        $match: {
          date: {$gte: start, $lte: end}
        }
      },
      {
        $group: {
          _id:null,
          totalCollected: {$sum: "$amount"},
          count: {$sum: 1}
        }
      }
    ]);

    res.json({
      totalCollected: result[0]?.totalCollected || 0,
      entries: result[0]?.count || 0
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({message: "Internal Server Error"});
  }
};

exports.getWinLossSummary = async(req, res) =>{
  try {
    const totalProposals = await Proposal.countDocuments();

    const activePipeline = await Proposal.countDocuments({
      Stage: { $nin: ["Won", "Lost"]}
    });

    const Won = await Proposal.countDocuments({Stage: "Won"});

    const lost = await Proposal.countDocuments({
      Stage: "Lost"
    });

    const avgResult = await Proposal.aggregate([
      {
        $group: {
          _id: null,
          avgDeal: {$avg: "$dealValue"}
        }
      }
    ]);

    const avgDealSize = avgResult[0]?.avgDeal || 0;

    const conversionRate = totalProposals >0 ? ((Won / totalProposals) * 100).toFixed(2) : 0;

    res.json({
      totalProposals,
      activePipeline,
      Won,
      lost,
      conversionRate,
      avgDealSize: avgDealSize.toFixed(2)
    });
  
  } catch (error) {
    console.log(error.message);
    res.status(500).json({message: "Internal Server Error"});
  }
}

exports.addCollection = async (req, res) => {
  try {
    const { amount, proposalId, note } = req.body;

    if (!amount || !proposalId) {
      return res.status(400).json({ message: "Amount and proposalId required" });
    }

    const proposal = await Proposal.findById(proposalId);
    if (!proposal) {
      return res.status(404).json({ message: "Proposal not found" });
    }

    const revenue = new Revenues({
      amount,
      proposalId,
      note,
      createdBy: req.user.id
    });

    const saverevenue = await revenue.save(); 

    res.status(201).json({
      message: "Collection added successfully",
      saverevenue
    });

  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.CreateProposal = async(req, res) =>{
  try {
    const {clientName, contactperson,city, category,dealValue, Stage, proposalDate, expectedClose, probability,notes, createdBy} = req.body;

    const newProposal = new Proposal({
      clientName,
      contactperson,
      city, category,
      dealValue,
      Stage,
      proposalDate,
      expectedClose,
      probability,
      notes ,
      createdBy: req.user.id
    });

    const savedProposal = await newProposal.save();
    res.status(201).json({savedProposal});
  } catch (error) {
    console.error(
      'Error Show', error
    );
    res.status(500).json({message:"Internal Server Error"})

  }
}