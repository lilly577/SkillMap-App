const Specialist = require('../models/Specialist');
const Job = require('../models/Job');
const Match = require('../models/Match');
const { notifySpecialist } = require('../wsServer');
const { sendEmail } = require('../mailer');


function normalizeText(value) {
  return String(value || '').trim().toLowerCase();
}

function uniqueNormalized(values) {
  return [...new Set((values || []).map(normalizeText).filter(Boolean))];
}

function buildSpecialistSkills(specialist) {
  return uniqueNormalized([
    ...(specialist.programmingLanguages || []),
    specialist.expertise
  ]);
}

function buildJobRequirements(job) {
  return uniqueNormalized(job.requirements || []);
}

function calculateMatchScore(job, specialist) {
  const reqs = buildJobRequirements(job);
  if (reqs.length === 0) return 0;

  const candidateSkills = new Set(buildSpecialistSkills(specialist));
  const matchedCount = reqs.filter(r => candidateSkills.has(r)).length;

  return matchedCount / reqs.length;
}

async function upsertMatch(specialistId, jobId, score) {
  return Match.findOneAndUpdate(
    { specialistId, jobId },
    { matchScore: score, status: 'new' },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
}

// Matching by percentage of job requirements present in specialist skills.
async function runMatchingForJob(jobId) {
  const job = await Job.findById(jobId);
  if (!job) return [];

  const specialists = await Specialist.find();
  const matches = [];

  for (const specialist of specialists) {
    const score = calculateMatchScore(job, specialist);

    if (score <= 0) {
      await Match.deleteOne({ specialistId: specialist._id, jobId: job._id });
      continue;
    }

    const match = await upsertMatch(specialist._id, job._id, score);
    matches.push(match);

    // Notify via websocket if connected
    try {
      notifySpecialist(specialist._id.toString(), {
        type: 'match',
        matchId: match._id,
        jobId: job._id,
        score
      });
    } catch (e) {}

    try {
      await sendEmail(
        specialist.email,
        'New match found',
        `You have a new match for job: ${job.title} (score ${(score * 100).toFixed(0)}%)`
      );
    } catch (e) {
      console.error('email error', e);
    }
  }

  return matches;
}

async function runMatchingForSpecialist(specialistId) {
  const specialist = await Specialist.findById(specialistId);
  if (!specialist) return [];

  const jobs = await Job.find();
  const matches = [];

  for (const job of jobs) {
    const score = calculateMatchScore(job, specialist);

    if (score <= 0) {
      await Match.deleteOne({ specialistId: specialist._id, jobId: job._id });
      continue;
    }

    const match = await upsertMatch(specialist._id, job._id, score);
    matches.push(match);
  }

  return matches;
}

module.exports = { runMatchingForJob, runMatchingForSpecialist };
