const Lead = require("../models/Lead");
const moment = require('moment');


exports.GetBranch =  async (req, res) => {
  try {

    const branches = ["Bangalore", "Mumbai", "Mysore"];

    const stages = [
    "Enquiries",
      "Lead Capture",
      "Reachable",
      "Qualified",
      "Proposal Sent",
      "Closed Won",
    ];

    const report = {};

    for (const b of branches) {

      const data = await Lead.aggregate([
        {
          $match: {
            branch: b,
            isDeleted: false
          }
        },
        {
          $group: {
            _id: "$stage",
            count: { $sum: 1 },
            totalValue: { $sum: "$dealValue" },
            closedValue: {
              $sum: {
                $cond: [
                  { $eq: ["$stage", "Closed Won"] },
                  "$dealValue",
                  0
                ]
              }
            }
          }
        }
      ]);

      const stageMap = {};
      data.forEach(d => stageMap[d._id] = d);

      const total = data.reduce((sum, d) => sum + d.count, 0);

      const closed = stageMap["Closed Won"]?.count || 0;

      report[b] = {
        stages: stages.map(s => ({
          stage: s,
          count: stageMap[s]?.count || 0,
          value: stageMap[s]?.totalValue || 0
        })),

        total,
        closed,

        revenue: stageMap["Closed Won"]?.closedValue || 0,

        convRate: total > 0
          ? Number(((closed / total) * 100).toFixed(1))
          : 0
      };
    }

    res.json({
      success: true,
      data: report
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
}

exports.GetBranchFunnel = async (req, res) => {
  try {

    const branches = ["Bangalore", "Mumbai", "Mysore"];

    const stageOrder = [
      "Enquiries",
      "Lead Capture",
      "Reachable",
      "Qualified",
      "Proposal Sent",
      "Closed Won"
    ];

    const report = [];

    for (const branch of branches) {

      const data = await Lead.aggregate([
        {
          $match: {
            branch,
            isDeleted: false
          }
        },
        {
          $group: {
            _id: "$stage",
            count: { $sum: 1 },
            value: { $sum: "$dealValue" }
          }
        }
      ]);

      const stageMap = {};
      data.forEach(d => stageMap[d._id] = d);

      const enquiries =
        (stageMap["Enquiries"]?.count || 0) +
        (stageMap["Lead Capture"]?.count || 0);

      const reachable = stageMap["Reachable"]?.count || 0;
      const qualified = stageMap["Qualified"]?.count || 0;
      const proposal = stageMap["Proposal Sent"]?.count || 0;
      const closed = stageMap["Closed Won"]?.count || 0;

      const revenue = stageMap["Closed Won"]?.value || 0;

      const totalValue = data.reduce((s, d) => s + d.value, 0);

      const pct = (val) =>
        enquiries > 0 ? Number(((val / enquiries) * 100).toFixed(0)) : 0;

      const stages = [
        { stage: "Enquiries", count: enquiries, percent: 100 },
        { stage: "Reachable", count: reachable, percent: pct(reachable) },
        { stage: "Qualified", count: qualified, percent: pct(qualified) },
        { stage: "Proposal", count: proposal, percent: pct(proposal) },
        { stage: "Closed", count: closed, percent: pct(closed) }
      ];

      const closeRate = pct(closed);
      const reachRate = pct(reachable);

      let insight = "";

      if (closeRate < 25) {
        insight = `⚠ Raise close rate ${closeRate}% → ${closeRate + 12}%`;
      } else if (reachRate < 70) {
        insight = `⚠ Reachability ${reachRate}% — improve first contact`;
      } else {
        insight = "✅ Best close rate — scale lead volume here.";
      }

      report.push({
        branch,
        enquiries,
        revenue,
        totalValue,
        closeRate,
        stages,
        insight
      });

    }

    // Find best and lowest branches
    const sorted = [...report].sort((a, b) => b.closeRate - a.closeRate);

    if (sorted.length) {
      sorted[0].tag = "Best";
      sorted[sorted.length - 1].tag = "Lowest";
    }

    res.json({
      success: true,
      data: report
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

exports.Performance = async (req, res) => {
  try {
    const leads = await Lead.find({ isDeleted: false });

    const totalLeads = leads.length;
    const stageCounts = leads.reduce(
      (acc, lead) => {
        const stage = lead.stage;
        if (!acc[stage]) acc[stage] = 0;
        acc[stage]++;
        return acc;
      },
      {}
    );
    const totalInvoice = leads.reduce((sum, lead) => sum + (lead.invoiceValue || 0), 0);
    const closedWonDeals = leads.filter(lead => lead.stage === "Closed Won");
    const totalDealValue = closedWonDeals.reduce((sum, lead) => sum + (lead.dealValue || 0), 0);
    const kpis = [
      {
        name: "Reachability",
        value: totalLeads ? Math.round(((stageCounts["Lead Capture"] || 0) + (stageCounts["Qualified"] || 0) + (stageCounts["Proposal Sent"] || 0) + (stageCounts["Closed Won"] || 0)) / totalLeads * 100) : 0,
        target: 85,
        unit: "%"
      },
      {
        name: "Qualification",
        value: totalLeads ? Math.round(((stageCounts["Qualified"] || 0) / totalLeads) * 100) : 0,
        target: 70,
        unit: "%"
      },
      {
        name: "Proposal Conversion",
        value: totalLeads ? Math.round(((stageCounts["Proposal Sent"] || 0) / totalLeads) * 100) : 0,
        target: 60,
        unit: "%"
      },
      {
        name: "Close Rate",
        value: totalLeads ? Math.round(((stageCounts["Closed Won"] || 0) / totalLeads) * 100) : 0,
        target: 37,
        unit: "%"
      },
      {
        name: "Revenue per Enquiry",
        value: totalLeads ? Math.round(totalInvoice / totalLeads) : 0,
        target: 1050,
        unit: "₹"
      },
      {
        name: "Avg Deal Value",
        value: closedWonDeals.length ? Math.round(totalDealValue / closedWonDeals.length) : 0,
        target: 15000,
        unit: "₹"
      }
    ];

    return res.json({ success: true, data: kpis });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
}


exports.Monthly = async(req, res) =>{
  try {
    const months = parseInt(req.query.months) || 6;
    const result = [];

    for(let i = months -1; i>=0;i--){
      const m = moment().subtract(i, "months");
      const start = m.startOf("month").toDate();
      const end = m.endOf("month").toDate();

      const [enquiries, closed, revenue] = await Promise.all([
        Lead.countDocuments({
          isDeleted: false,
          createdAt: {$gte: start, $lte: end}
        }),

        Lead.countDocuments({
          isDeleted: false,
          stage: "Closed Won",
          closedAt: {$gte: start, $lte: end}
        }),

        Lead.aggregate([
          {
            $match:{
              isDeleted: false,
              stage: "Closed Won",
              closedAt: {$gte: start, $lte: end}
            }
          },
          {
            $group:{
              _id: null,
              total: {$sum: "$dealValue"}
            }
          }
        ])
      ]);

      result.push({
        month: m.format("MMM YYYY"),
        enquiries,
        closed,
        revenue: revenue[0]?.total || 0,
        convRate: enquiries >0 ?
        Number(((closed / enquiries) * 100).toFixed(1)) : 0
      })
    }

    res.json({success: true, data: result});
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
}


exports.Source =  async(req, res) =>{
  try {
    const data = await Lead.aggregate([
      {
        $match: {isDeleted: false}
      },
      {
        $group:{
          _id: "$source",
          total: {$sum: 1},

          closed:{
            $sum:{
              $cond:[
                {$eq: ['$stage', 'Closed Won']},
                1, 0
              ]
            }
          },

          revenue:{
            $sum: {
              $cond: [
                {$eq: ['$stage', "Closed Won"]},
                "$dealValue", 0
              ]
            }
          }
        }
      },
      {
        $addFields:{
          conRate: {
            $cond: [
              {$eq: ["$total", 0]}, 0,
              {
                $multiply:[
                  {$divide: ["$closed", "$total"]}, 100
                ]
              }
            ]
          }
        }
      },
      {$sort: {total: -1}}
    ]);

    res.json({success: true, data});
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
}


exports.Duration = async (req, res) => {
  try {

    const leads = await Lead.find(
      {
        isDeleted: false,
        "stageHistory.1": { $exists: true }
      },
      "stageHistory"
    );

    const stageData = {};

    leads.forEach(l => {

      l.stageHistory.forEach(sh => {

        if (sh.daysSpent != null) {

          if (!stageData[sh.stage]) {
            stageData[sh.stage] = [];
          }

          stageData[sh.stage].push(sh.daysSpent);

        }

      });

    });

    const result = Object.entries(stageData).map(([stage, days]) => ({

      stage,

      avgDays: Number(
        (days.reduce((a, b) => a + b, 0) / days.length).toFixed(1)
      ),

      sampleSize: days.length

    }));

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });

  }
}


exports.Projection = async(req,res) =>{
    try {
        const leads = await Lead.find({isDeleted: false});
        const totalLeads = leads.length;
        const closedWonDeals = leads.filter(lead => lead.stage === "Closed Won");

        const currentRevenue = closedWonDeals.reduce((sum, lead) => sum + (lead.invoiceValue || 0), 0);
        const currentDeals = closedWonDeals.length;

        const targetReachability = 0.85;
        const targetQualification = 0.71;
        const targetCloseRate = 0.37;

        const targetDeals = Math.round(totalLeads * targetReachability * targetQualification * targetCloseRate);

        const avgDealValue = currentDeals ? currentRevenue / currentDeals : 0;

        const optimisedRevenue = Math.round(targetDeals * avgDealValue);

        const potentialUplift = optimisedRevenue - currentRevenue;

        const result = {
            currentRevenue: Math.round(currentRevenue),
            optimisedTarget: optimisedRevenue,
            potentialUplift: potentialUplift,
            currentDeals: currentDeals,
            targetDeals: targetDeals
        };

        return res.json({success: true, data: result});
    } catch (error) {
        console.log(error);
        return res.status(500).json({success: false, message: error.message});
    }
}


