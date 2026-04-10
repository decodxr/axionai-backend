/* eslint-disable no-undef */
const express = require('express');
const axios = require('axios');
const { requireAuth } = require('../middleware/auth');
const { getGuildConfig, updateGuildModule, getGuildStats, addGuildEvent, getGuildEvents } = require('../db');

const router = express.Router();

const DISCORD_API = 'https://discord.com/api/v10';

// Bot headers for fetching member counts
function botHeaders() {
  return { Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}` };
}

/**
 * GET /guilds
 * Fetches guilds the user manages from Discord, enriches with bot presence.
 */
router.get('/', requireAuth, async (req, res) => {
  const { access_token } = req.user;

  // Fetch guilds the user is in
  const response = await axios.get(`${DISCORD_API}/users/@me/guilds`, {
    headers: { Authorization: `Bearer ${access_token}` },
  });

  const allGuilds = response.data;

  // Filter guilds where user has MANAGE_GUILD permission (0x20)
  const managedGuilds = allGuilds.filter(g => (BigInt(g.permissions) & BigInt(0x20)) !== BigInt(0));

  // Enrich guilds with bot presence + member count
  const enriched = await Promise.allSettled(
    managedGuilds.map(async (guild) => {
      let memberCount = 0;
      let botPresent = false;

      if (process.env.DISCORD_BOT_TOKEN) {
        try {
          const guildRes = await axios.get(`${DISCORD_API}/guilds/${guild.id}?with_counts=true`, {
            headers: botHeaders(),
          });
          memberCount = guildRes.data.approximate_member_count || 0;
          botPresent = true;
        } catch {
          botPresent = false;
        }
      }

      const config = getGuildConfig(guild.id);

      return {
        id: guild.id,
        guild_id: guild.id,
        guild_name: guild.name,
        guild_icon: guild.icon
          ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`
          : null,
        member_count: memberCount,
        bot_present: botPresent,
        bot_status: botPresent ? (config.bot_status || 'online') : 'offline',
      };
    })
  );

  const result = enriched
    .filter(r => r.status === 'fulfilled')
    .map(r => r.value);

  res.json(result);
});

/**
 * GET /guilds/:id/config
 * Returns full config for a guild. Creates default if not exists.
 */
router.get('/:id/config', requireAuth, (req, res) => {
  const { id } = req.params;
  const config = getGuildConfig(id);
  res.json(config);
});

/**
 * PUT /guilds/:id/config
 * Body: { module: "ai_config" | "economy_config" | ..., data: {} }
 * Updates only the specified module.
 */
router.put('/:id/config', requireAuth, (req, res) => {
  const { id } = req.params;
  const { module, data } = req.body;

  if (!module || data === undefined) {
    return res.status(400).json({ error: 'Missing "module" or "data" in request body' });
  }

  const VALID_MODULES = [
    'ai_config', 'economy_config', 'music_config', 'xp_config',
    'automod_config', 'logs_config', 'ticket_config', 'suggestion_config',
    'welcome_config', 'custom_commands', 'automation_config', 'image_config',
    'billing_config', 'role_panel_config', 'admin_config', 'bot_status',
  ];

  if (!VALID_MODULES.includes(module)) {
    return res.status(400).json({ error: `Invalid module: ${module}` });
  }

  const updatedConfig = updateGuildModule(id, module, data);
  res.json(updatedConfig);
});

/**
 * GET /guilds/:id/stats
 * Returns usage stats for a guild.
 */
router.get('/:id/stats', requireAuth, (req, res) => {
  const { id } = req.params;
  const stats = getGuildStats(id);
  res.json(stats);
});

/**
 * GET /guilds/:id/events?limit=100
 * Returns event history for a guild.
 */
router.get('/:id/events', requireAuth, (req, res) => {
  const { id } = req.params;
  const limit = parseInt(req.query.limit) || 100;
  const events = getGuildEvents(id, limit);
  res.json(events);
});

/**
 * POST /guilds/:id/events
 * Body: { type, description, user? }
 * Adds a new event to the guild log (called by the bot).
 */
router.post('/:id/events', (req, res) => {
  const { id } = req.params;
  const { type, description, user } = req.body;
  if (!type || !description) {
    return res.status(400).json({ error: 'Missing type or description' });
  }
  const event = addGuildEvent(id, { type, description, user });
  res.status(201).json(event);
});

module.exports = router;
