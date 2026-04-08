/* eslint-disable no-undef */
const express = require('express');
const { getGlobalStats } = require('../db');

const router = express.Router();

/**
 * GET /stats
 * Returns global bot statistics (public — no auth required).
 */
router.get('/', (req, res) => {
  const stats = getGlobalStats();
  res.json({
    servers: stats.servers || 0,
    users: stats.users || 0,
    commands: stats.commands || 0,
    ai_requests: stats.ai_requests || 0,
    uptime: process.uptime(),
  });
});

module.exports = router;