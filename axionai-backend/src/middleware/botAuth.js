/* eslint-disable no-undef */

/**
 * Bot API Token Authentication Middleware
 * 
 * Validates the static DASHBOARD_API_TOKEN used by the Discord bot
 * to securely read guild configs from the dashboard backend.
 * 
 * Usage: Authorization: Bearer <DASHBOARD_API_TOKEN>
 */
function requireBotAuth(req, res, next) {
  const apiToken = process.env.DASHBOARD_API_TOKEN;

  if (!apiToken) {
    return res.status(500).json({ error: 'DASHBOARD_API_TOKEN is not configured on the server.' });
  }

  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }

  const token = authHeader.split(' ')[1];
  if (token !== apiToken) {
    return res.status(401).json({ error: 'Invalid bot API token' });
  }

  next();
}

module.exports = { requireBotAuth };
