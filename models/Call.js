const mongoose = require('mongoose');

const CallSchema = new mongoose.Schema({
    lead: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead', required: true },
    loggedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    type: { type: String, enum: ['Call Outbound', 'Call Inbound', 'WhatsApp', 'Email', 'In-person', 'SMS'], required: true },
    direction: {
        type: String,
        enum: ['outbound', 'inbound', 'n/a'],
        default: 'outbound'
    },
    outcome: {
        type: String,
        enum: ['Connected', 'No Answer', 'Busy', 'Wrong Number', 'Left Voicemail', 'Replied', 'Not Replied'],
        default: 'Connected'
    },

    durationMinutes: { type: Number, default: 0 },
    callDate: { type: Date, default: Date.now },
    summary: { type: String, trim: true },
    nextAction: { type: String, trim: true }
}, { timestamps: true });

CallSchema.index({ lead: 1, callDate: -1 });

module.exports = mongoose.model('Call', CallSchema);
