/* eslint-disable no-undef */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const guildRoutes = require('./routes/guilds');
const statsRoutes = require('./routes/stats');

const app = express();
const PORT = process.env.PORT || 3001;

app.set('trust proxy', 1);
// ─── Security Middleware ────────────────────────────────────────────────────
app.use(helmet());
app.use(express.json());

// CORS — allow frontend origin
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'https://axionai-app.base44.app',
    'http://localhost:5173',
    'http://localhost:3000',
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: { error: 'Too many requests, please try again later.' },
});
app.use(limiter);

// ─── Routes ────────────────────────────────────────────────────────────────
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/guilds', guildRoutes);
app.use('/stats', statsRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.message);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`🚀 AxionAI Backend running on port ${PORT}`);
});
