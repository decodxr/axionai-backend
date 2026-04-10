/* eslint-disable no-undef */
const express = require('express');
const router = express.Router();
const { requireBotAuth } = require('../middleware/botAuth');
const { getGuildConfig, saveGuildConfig } = require('../db');

/**
 * GET /bot/guilds/:id/config
 * 
 * Bot-only endpoint protected by static DASHBOARD_API_TOKEN.
 * Returns guild config, creating a default structure if none exists.
 */
router.get('/guilds/:id/config', requireBotAuth, async (req, res) => {
  const guildId = req.params.id;

  let config = getGuildConfig(guildId);

  if (!config) {
    // Create and persist a default config for this guild
    const defaultConfig = {
      guild_id: guildId,
      ai: {},
      economy: {},
      music: {},
      moderation: {},
      tickets: {},
      levels: {},
      commands: {},
      automation: {},
      images: {},
      billing: {},
    };
    saveGuildConfig(guildId, defaultConfig);
    config = defaultConfig;
  }

  res.json(config);
});

module.exports = router;
