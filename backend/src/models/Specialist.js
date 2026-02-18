const mongoose = require('mongoose');

const SpecialistSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    expertise: String,
    yearsExperience: Number,
    education: String,
    portfolio: String,
    programmingLanguages: [String],
    cvUrl: String,
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Specialist', SpecialistSchema);