/* eslint-disable no-undef */
const express = require('express');
const axios = require('axios');
const { upsertUser } = require('../db');

const router = express.Router();

const DISCORD_API = 'https://discord.com/api/v10';
const TOKEN_URL = 'https://discord.com/api/oauth2/token';

/**
 * POST /auth/discord/callback
 * Body: { code }
 * Returns: { token, user }
 */
router.post('/discord/callback', async (req, res) => {
  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ error: 'Missing authorization code' });
  }

  // Exchange code for tokens
  const params = new URLSearchParams({
    client_id: process.env.DISCORD_CLIENT_ID,
    client_secret: process.env.DISCORD_CLIENT_SECRET,
    grant_type: 'authorization_code',
    code,
    redirect_uri: process.env.DISCORD_REDIRECT_URI,
  });

  const tokenResponse = await axios.post(TOKEN_URL, params.toString(), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });

  const { access_token, refresh_token, token_type } = tokenResponse.data;

  // Fetch Discord user
  const userResponse = await axios.get(`${DISCORD_API}/users/@me`, {
    headers: { Authorization: `Bearer ${access_token}` },
  });

  const discordUser = userResponse.data;

  // Store user in DB
  upsertUser(discordUser.id, {
    access_token,
    refresh_token: refresh_token || null,
    user_data: {
      id: discordUser.id,
      username: discordUser.username,
      discriminator: discordUser.discriminator,
      global_name: discordUser.global_name || discordUser.username,
      avatar: discordUser.avatar,
      email: discordUser.email || null,
    },
  });

  res.json({
    token: access_token,
    user: {
      id: discordUser.id,
      username: discordUser.username,
      global_name: discordUser.global_name || discordUser.username,
      avatar: discordUser.avatar,
      discriminator: discordUser.discriminator,
    },
  });
});

module.exports = router;