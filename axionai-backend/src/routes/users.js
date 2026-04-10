/* eslint-disable no-undef */
const express = require('express');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /users/@me
 * Returns the authenticated Discord user's data.
 */
router.get('/@me', requireAuth, (req, res) => {
  const { user_data, access_token } = req.user;
  res.json(user_data);
});

module.exports = router;
