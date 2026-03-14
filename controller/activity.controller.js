const Activity = require("../models/Activity");
const { validationResult } = require('express-validator');
const Lead = require("../models/Lead");
const Followup = require("../models/FollowUp");
const Document = require("../models/Document");
const Call = require("../models/Call");
const User = require("../models/User");


exports.GetActivity = async (req, res) => {
  try {
    const { leadId, type, limit = 50, page = 1 } = req.query;

    const limitNum = parseInt(limit) || 50;
    const pageNum = parseInt(page) || 1;

    const filter = {};
    if (leadId) filter.lead = leadId;
    if (type) filter.type = type;
    if (req.user.role === 'rep') filter.user = req.user.id;


    console.log('Filter:', filter);
    console.log('User ID:', req.user.id);
    console.log('Lead ID:', filter.lead);
    const total = await Activity.countDocuments(filter);
    const activities = await Activity.find(filter)
      .populate('user', 'name role')
      .populate('lead', 'clientName businessName')
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    res.json({ success: true, total, count: activities.length, data: activities });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


async function getUserName(userId) {
  const user = await User.findById(userId);
  return user ? user.name : 'Unknown';
}

function timeAgo(date) {
  const now = new Date();
  const diff = (now - new Date(date)) / 1000;
  if (diff < 60) return `${Math.floor(diff)} sec ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
  return `${Math.floor(diff / 86400)} days ago`;
}


// exports.Recent = async (req, res) => {
//   try {
//     const activities = [];
//     const leads = await Lead.find({ isDeleted: false }).limit(50);
//     for (const lead of leads) {
//       const userName = lead.assignedTo || (await getUserName(lead.createdBy));
//       activities.push({
//         type: lead.stage === 'Deal Closed' ? 'Deal Closed' : lead.stage,
//         leadName: lead.businessName,
//         amount: lead.dealValue || 0,
//         user: userName,
//         branch: lead.branch,
//         activityTime: lead.updatedAt,
//         timeAgo: timeAgo(lead.updatedAt),
//       });
//     }


//     const followups = await Followup.find().limit(50);
//     for (const followup of followups) {
//       const latestEntry = followup.entries.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))[0];
//       activities.push({
//         type: `Follow-up ${latestEntry.status}`,
//         leadName: followup.lead,
//         user: await getUserName(followup.createdBy),
//         branch: followup.branch,
//         activityTime: latestEntry.updatedAt,
//         timeAgo: timeAgo(latestEntry.updatedAt),
//       });
//     }


//     const documents = await Document.find({ isDeleted: false }).populate("lead", "name").limit(50);
//     for (const doc of documents) {
//       activities.push({
//         type: ` ${doc.docType} uploaded`,
//         leadName: doc.lead?.name,
//         user: await getUserName(doc.uploadedBy),
//         branch: doc.branch,
//         activityTime: doc.updatedAt,
//         timeAgo: timeAgo(doc.updatedAt),
//       });
//     }


//     const calls = await Call.find().limit(50);
//     for (const call of calls) {
//       activities.push({
//         type: `Call ${call.direction}`,
//         leadName: call.lead,
//         user: await getUserName(call.loggedBy),
//         branch: call.branch || 'N/A',
//         activityTime: call.callDate,
//         timeAgo: timeAgo(call.callDate),
//       });
//     }

//     activities.sort((a, b) => new Date(b.activityTime) - new Date(a.activityTime));

//     res.json(activities);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: 'Server error' });
//   }
// };

exports.Recent = async(req, res) =>{
  try {
    const activities = [];

    const twentyDaysAgo = new Date();
    twentyDaysAgo.setDate(twentyDaysAgo.getDate() - 20);

    const leads = await Lead.find({
      isDeleted: false,
      updatedAt: { $gte: twentyDaysAgo}
    }).limit(20);

    for(const lead of leads){
      const userName = lead.assignedTo || (await getUserName(lead.createdBy));

      activities.push({
        type: lead.stage === "Deal Closed" ? "Deal Closed" : lead.stage,
        leadName: lead.businessName,
        amount: lead.dealValue || 0,
        user: userName,
        branch: lead.branch,
        activityTime: lead.updatedAt,
        timeAgo: timeAgo(lead.updatedAt),
      });
    }

    const followups = await Followup.find({
      updatedAt: {$gte: twentyDaysAgo}
    }).limit(20);

    for(const followup of followups){
      const latestEntry = followup.entries.sort(
        (a,b) => new Date(b.updatedAt) - new Date(a.updatedAt)
      )[0];

      activities.push({
        type: `Follow-up ${latestEntry.status}`,
        leadName: followup.lead,
        user: await getUserName(followup.createdBy),
        branch: followup.branch,
        activityTime: latestEntry.updatedAt,
        timeAgo: timeAgo(latestEntry.updatedAt),
      });
    }

    const documents = await Document.find({
      isDeleted: false,
      updatedAt: {$gte: twentyDaysAgo},
    })
    .populate("lead", "businessName")
    .limit(20);

    for(const doc of documents){
      activities.push({
        type: `${doc.docType} uploaded`,
        leadName: doc.lead?.businessName,
        user: await getUserName(doc.uploadedBy),
        branch: doc.branch,
        activityTime: doc.updatedAt,
        timeAgo: timeAgo(doc.updatedAt),
      });
    }

    const calls = await Call.find({
      callDate: { $gte: twentyDaysAgo},
    }).limit(20);

    for(const call of calls){
      activities.push({
        type: `Call ${call.direction}`,
        leadName: call.lead,
        user: await getUserName(call.loggedBy),
        branch: call.branch || "N/A",
        activityTime: call.callDate,
        timeAgo: timeAgo(call.callDate),
      });
    }

    activities.sort((a,b) => new Date(b.activityTime) - new Date(a.activityTime));

    // 👇 Only return latest 5
    const latestActivities = activities.slice(0,5);

    res.json({
      count: latestActivities.length,
      activities: latestActivities
    });

  } catch (error) {
     console.log(error);
     res.status(500).json({message: "Server Error"});
  }
}





exports.RecentLast20Days = async(req, res) =>{
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const activities = [];

    const twentyDaysAgo = new Date();
    twentyDaysAgo.setDate(twentyDaysAgo.getDate() - 20);

    const leads = await Lead.find({
      isDeleted: false,
      updatedAt: { $gte: twentyDaysAgo}
    })
    .skip(skip)
    .limit(limit);

    for(const lead of leads){
      const userName = lead.assignedTo || (await getUserName(lead.createdBy));

      activities.push({
        type: lead.stage === "Deal Closed" ? "Deal Closed" : lead.stage,
        leadName: lead.businessName,
        amount: lead.dealValue || 0,
        user: userName,
        branch: lead.branch,
        activityTime: lead.updatedAt,
        timeAgo: timeAgo(lead.updatedAt),
      });
    }

    const followups = await Followup.find({
      updatedAt: {$gte: twentyDaysAgo}
    })
    .skip(skip)
    .limit(limit)

    for(const followup of followups){
      const latestEntry = followup.entries.sort((a,b) => new Date(b.updatedAt) - new Date(a.updatedAt))[0];

      activities.push({
        type: `Follow-up ${latestEntry.status}`,
        leadName: followup.lead,
        user: await getUserName(followup.createdBy),
        branch: followup.branch,
        activityTime: latestEntry.updatedAt,
        timeAgo: timeAgo(latestEntry.updatedAt),
      });
    }

    const documents = await Document.find({
      isDeleted: false,
      updatedAt: {$gte: twentyDaysAgo},
    })
    .populate("lead", "businessName")
    .skip(skip)
    .limit(limit);

    for(const doc of documents){
      activities.push({
        type: `${doc.docType} uploaded`,
        leadName: doc.lead?.businessName,
        user: await getUserName(doc.uploadedBy),
        branch: doc.branch,
        activityTime: doc.updatedAt,
        timeAgo: timeAgo(doc.updatedAt),
      });
    }

    const calls = await Call.find({
      callDate: { $gte: twentyDaysAgo},
    })
    .skip(skip)
    .limit(limit);

    for(const call of calls){
      activities.push({
        type: `Call ${call.direction}`,
        leadName: call.lead,
        user: await getUserName(call.loggedBy),
        branch: call.branch || "N/A",
        activityTime: call.callDate,
        timeAgo: timeAgo(call.callDate),
      });
    }

    activities.sort((a,b) => new Date(b.activityTime) - new Date(a.activityTime));

    res.json({page, limit, count: activities.length,
      activities,
    });
  } catch (error) {
     console.log(error);
     res.status(500).json({message: "Server Error"});
  }
}



exports.CreateActivity = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { lead, type, description, outcome, duration, direction, fromStage, toStage, metadata } = req.body;

    const newActivity = new Activity({
      lead, user: req.user.id,
      type,
      description, outcome, duration, direction, fromStage, toStage, metadata
    });

    const savedActivity = await newActivity.save();
    res.json({ success: true, message: "Activity created successfully", data: savedActivity });

  } catch (error) {
    console.log(error.message)
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
}