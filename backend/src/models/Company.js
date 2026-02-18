const mongoose = require('mongoose');

const CompanySchema = new mongoose.Schema({
    companyName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    location: String,
    website: String,
    industry: String,
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Company', CompanySchema);