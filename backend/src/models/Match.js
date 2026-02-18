const mongoose = require('mongoose');


const MatchSchema = new mongoose.Schema({
specialistId: { type: mongoose.Schema.Types.ObjectId, ref: 'Specialist', required: true },
jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
matchScore: Number,
status: { type: String, default: 'new' },
createdAt: { type: Date, default: Date.now }
});


module.exports = mongoose.model('Match', MatchSchema);