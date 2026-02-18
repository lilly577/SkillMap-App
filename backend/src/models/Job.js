const mongoose = require('mongoose');


const JobSchema = new mongoose.Schema({
companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
title: String,
description: String,
requirements: [String],
location: String,
experienceYears: Number,
createdAt: { type: Date, default: Date.now }
});


module.exports = mongoose.model('Job', JobSchema);