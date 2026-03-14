// const mongoose = require('mongoose');
// const { Schema } = mongoose;


// const CHANNELS = ['Call', 'WhatsApp', 'Email', 'In-Person', 'SMS', 'Video Call'];


// const FOLLOWUP_STATUSES = ['Upcoming', 'Due', 'Done', 'Overdue', 'Skipped'];


// const CADENCE_TYPES = ['Standard 10-Day', 'Aggressive 7-Day', 'Nurture 14-Day', 'Custom'];


// const FollowUpEntrySchema = new Schema(
//   {
//     day: { type: Number, required: true, min: 0 }, 
//     scheduledAt: { type: Date, required: true },
//     completedAt: { type: Date },
//     channel: {
//       type: String,
//       enum: CHANNELS,
//       default: 'WhatsApp',
//     },
//     action: { type: String, required: true },
//     outcome: { type: String, default: '' },
//     status: {
//       type: String,
//       enum: FOLLOWUP_STATUSES,
//       default: 'Upcoming',
//     },
//     performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
//     notes: { type: String, default: '' },
//   },
//   { timestamps: true }
// );


// const FollowUpSchema = new Schema(
//   {
//     lead: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead', required: true },
//     branch: { type: String, required: true },
//     assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
//     createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
//     cadenceType: {
//       type: String,
//       enum: CADENCE_TYPES,
//       default: 'Standard 10-Day',
//     },
//     entries: [FollowUpEntrySchema],
//     status: {
//       type: String,
//       enum: ['Active', 'Completed', 'Abandoned'],
//       default: 'Active',
//     },
//     startedAt: { type: Date, default: Date.now },
//     completedAt: { type: Date },
//     totalEntries: { type: Number, default: 0 },
//     completedEntries: { type: Number, default: 0 },
//     overdueEntries: { type: Number, default: 0 },
//   },
//   { timestamps: true }
// );


// FollowUpSchema.pre('save', function (next) {
//   this.totalEntries = this.entries.length;
//   this.completedEntries = this.entries.filter((e) => e.status === 'Done').length;
//   this.overdueEntries = this.entries.filter((e) => e.status === 'Overdue').length;
//   next();
// });


// FollowUpSchema.methods.getOverdueEntries = function () {
//   const now = new Date();
//   return this.entries.filter(
//     (e) =>
//       e.status !== 'Done' &&
//       e.status !== 'Skipped' &&
//       new Date(e.scheduledAt) < now
//   );
// };


// FollowUpSchema.pre('save', function (next) {
//   if (this.entries.length > 1) {
//     for (let i = 1; i < this.entries.length; i++) {
//       if (this.entries[i].scheduledAt < this.entries[i - 1].scheduledAt) {
//         const error = new Error('Scheduled date must be in ascending order.');
//         return next(error);
//       }
//     }
//   }
//   next();
// });


// FollowUpSchema.index({ lead: 1 });
// FollowUpSchema.index({ assignedTo: 1, 'entries.scheduledAt': 1 });
// FollowUpSchema.index({ branch: 1 });
// FollowUpSchema.index({ 'entries.status': 1 });


// FollowUpSchema.post('save', function (doc, next) {

//   if (!doc) {
//     return next(new Error('Failed to save follow-up document.'));
//   }
//   next();
// });


// module.exports = mongoose.model('FollowUp', FollowUpSchema);

const mongoose = require('mongoose');
const { Schema } = mongoose;

const CHANNELS = ['Call', 'WhatsApp', 'Email', 'In-Person', 'SMS', 'Video Call'];
const FOLLOWUP_STATUSES = ['Upcoming', 'Due', 'Done', 'Overdue', 'Skipped'];
const CADENCE_TYPES = ['Standard 10-Day', 'Aggressive 7-Day', 'Nurture 14-Day', 'Custom'];

const FollowUpEntrySchema = new Schema(
  {
    day: { type: Number, required: true, min: 0 },
    scheduledAt: { type: Date, required: true },
    completedAt: { type: Date },
    channel: {
      type: String,
      enum: CHANNELS,
      default: 'WhatsApp',
    },
    action: { type: String, required: true },
    outcome: { type: String, default: '' },
    status: {
      type: String,
      enum: FOLLOWUP_STATUSES,
      default: 'Upcoming',
    },
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

const FollowUpSchema = new Schema(
  {
    lead: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead', required: true },
    branch: { type: String, required: true },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    cadenceType: {
      type: String,
      enum: CADENCE_TYPES,
      default: 'Standard 10-Day',
    },
    entries: [FollowUpEntrySchema],
    status: {
      type: String,
      enum: ['Active', 'Completed', 'Abandoned'],
      default: 'Active',
    },
    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
    totalEntries: { type: Number, default: 0 },
    completedEntries: { type: Number, default: 0 },
    overdueEntries: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Single pre-save middleware
// FollowUpSchema.pre('save', function(next) {
 
//   this.totalEntries = this.entries.length;
//   this.completedEntries = this.entries.filter(e => e.status === 'Done').length;
//   this.overdueEntries = this.entries.filter(e => e.status === 'Overdue').length;

//   if (this.entries.length > 1) {
//     for (let i = 1; i < this.entries.length; i++) {
//       if (this.entries[i].scheduledAt < this.entries[i - 1].scheduledAt) {
//         throw new Error('Scheduled date must be in ascending order.');
//       }
//     }
//   }
  
// });

FollowUpSchema.methods.getOverdueEntries = function() {
  const now = new Date();
  return this.entries.filter(e =>
    e.status !== 'Done' &&
    e.status !== 'Skipped' &&
    new Date(e.scheduledAt) < now
  );
};

// Indexes
FollowUpSchema.index({ lead: 1 });
FollowUpSchema.index({ assignedTo: 1, 'entries.scheduledAt': 1 });
FollowUpSchema.index({ branch: 1 });
FollowUpSchema.index({ 'entries.status': 1 });

// Post-save middleware


module.exports = mongoose.model('FollowUp', FollowUpSchema);