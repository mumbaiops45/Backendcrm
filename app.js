const express = require('express');
const app = express();
const port = 8080
const mongoose = require('mongoose');
const { body,check, validationResult } = require('express-validator');
const User = require('./models/User');
const Lead = require("./models/Lead")
const UserRouter = require("./router/user.router");
const { Auth, authorizeRoles } = require("./middleware/Auth")
const LeadRouter = require("./router/lead.router");
const cors = require('cors');
const dotenv = require("dotenv");
dotenv.config();


const ActivityRouter = require("./router/activity.router")
const CreateCall = require("./router/call.router");
const Follow = require("./models/FollowUp");
const FollowUp = require('./models/FollowUp');
const moment = require('moment');
const DocumentRouter = require("./router/document.router");
const Reports = require("./router/report.router")
const Payments = require("./router/payment.router");
const AddClient = require("./router/addclient.router");
const Proposal = require("./router/proposal.router");



app.use(cors());

app.use(express.json());


main()
  .then((res) => {
    console.log("Connection Successfull");
  })
  .catch(err => console.log(err));

async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/test220');
}


// mongoose.connect(process.env.MONGOURL)
//   .then(() => console.log("MongoDB Connected"))
//   .catch(err => console.log(err));


app.use("/", UserRouter);
app.use("/", LeadRouter);
app.use("/", ActivityRouter);
app.use("/", CreateCall);     
app.use("/", DocumentRouter);
app.use("/", Reports);
app.use("/", Payments);
app.use("/", AddClient);
app.use("/", Proposal);





app.get("/lead/:id", Auth, async (req, res) => {
  try {
    const fu = await FollowUp.findOne({ lead: req.params.id })
      .populate('lead', 'name businessName stage')
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email');

    if (!fu) {
      return res.status(404).json({
        success: false,
        message: 'No follow-up cadence found fot this lead'
      });
    }

    return res.json({ success: true, data: fu });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    })
  }
})


const cadencePresets = {
  'Standard 10-Day': [
    { day: 0, action: 'Send proposal + walkthrough call', channel: 'WhatsApp' },
    { day: 2, action: 'Check-in: Did you review?', channel: 'Call' },
    { day: 4, action: 'Send relevant case study', channel: 'WhatsApp' },
    { day: 6, action: 'Follow-up call — address objections', channel: 'Call' },
    { day: 8, action: 'Final value reminder', channel: 'WhatsApp' },
    { day: 10, action: 'Last attempt — close or mark lost', channel: 'Call' }
  ],
  'Aggressive 7-Day': [
    { day: 0, action: 'Send proposal + immediate call', channel: 'Call' },
    { day: 1, action: 'WhatsApp check-in', channel: 'WhatsApp' },
    { day: 3, action: 'Call — discuss requirements', channel: 'Call' },
    { day: 5, action: 'Case study + testimonials', channel: 'WhatsApp' },
    { day: 7, action: 'Final decision call', channel: 'Call' }
  ],
  'Nurture 14-Day': [
    { day: 0, action: 'Send proposal', channel: 'Email' },
    { day: 2, action: 'Introductory call', channel: 'Call' },
    { day: 5, action: 'Share portfolio link', channel: 'WhatsApp' },
    { day: 7, action: 'Mid-cadence check-in', channel: 'Call' },
    { day: 10, action: 'Send case study', channel: 'WhatsApp' },
    { day: 12, action: 'Follow-up email', channel: 'Email' },
    { day: 14, action: 'Final call', channel: 'Call' }
  ]
};


app.post("/createfollow", Auth, async (req, res) => {
  try {
    console.log("Step 1: Route hit");
    const { leadId, cadenceType, cadenceStartDate, customTasks, branch } = req.body;
    console.log("Step 2: Body parsed", req.body);

    const lead = await Lead.findById(leadId);
    console.log("Step 3: Lead found", lead);

    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }

    await FollowUp.deleteOne({ lead: leadId });
    console.log("Step 4: Old followup deleted");

    const start = cadenceStartDate ? new Date(cadenceStartDate) : new Date();
    const cadenceTasks = cadencePresets[cadenceType] || cadencePresets['Standard 10-Day'];
    const tasks = cadenceTasks.map((task) => ({
      ...task,
      scheduledAt: moment(start).add(task.day, 'days').toDate(),
      status: task.day === 0 ? 'Due' : 'Upcoming'
    }));
    console.log("Step 5: Tasks built", tasks.length);

    const followUp = await FollowUp.create({
      lead: leadId,
      branch: branch || lead.branch,
      assignedTo: lead.assignedTo,
      createdBy: req.user.id,
      cadenceType: cadenceType || 'Standard 10-Day',
      entries: tasks,

      totalEntries: tasks.length,
      completedEntries: 0,
      overdueEntries: 0,
    });
    console.log("Step 6: FollowUp created", followUp._id);
    return res.status(201).json({
      success: true,
      data: followUp
    });

  } catch (error) {
    console.log("ERROR:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

app.get("/kpis", Auth, );


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});