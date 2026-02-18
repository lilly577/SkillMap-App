const express = require('express');
const cors = require('cors');
const path = require('path');

const specialistsRoutes = require('./routes/specialists');
const companiesRoutes = require('./routes/companies');
const jobsRoutes = require('./routes/jobs');
const matchesRoutes = require('./routes/matches');
const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chat');
const browseRoutes = require('./routes/browse');
const applicationsRoutes = require('./routes/applications');
const interviewsRoutes = require('./routes/interviews');

const app = express();
app.use(cors({ origin: 'http://localhost:8080', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static uploads
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/specialists', specialistsRoutes);
app.use('/api/companies', companiesRoutes);
app.use('/api/jobs', jobsRoutes);
app.use('/api/matches', matchesRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/browse', browseRoutes);
app.use('/api/applications', applicationsRoutes);
app.use('/api/interviews', interviewsRoutes);


app.get('/healthz', (req, res) => res.json({ ok: true }));

module.exports = app;