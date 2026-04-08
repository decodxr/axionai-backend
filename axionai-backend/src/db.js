/* eslint-disable no-undef */
/**
 * Simple JSON file database using lowdb v1
 * Zero config, works on Render/Railway out of the box.
 * To migrate to MongoDB later, just replace the functions below.
 */
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const path = require('path');
const fs = require('fs');

// Ensure db directory exists
const dbDir = path.join(__dirname, '..', 'db');
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

const adapter = new FileSync(path.join(dbDir, 'axionai.json'));
const db = low(adapter);

// Default structure
db.defaults({
  users: {},       // { [user_id]: { access_token, refresh_token, user_data, updated_at } }
  guilds: {},      // { [guild_id]: { config: {}, stats: {}, created_at, updated_at } }
}).write();

// ─── User helpers ───────────────────────────────────────────────────────────

function getUser(userId) {
  return db.get(`users.${userId}`).value();
}

function upsertUser(userId, data) {
  const existing = db.get(`users.${userId}`).value() || {};
  db.set(`users.${userId}`, {
    ...existing,
    ...data,
    updated_at: new Date().toISOString(),
  }).write();
}

function getUserByToken(token) {
  const users = db.get('users').value();
  return Object.values(users).find(u => u.access_token === token) || null;
}

// ─── Guild helpers ──────────────────────────────────────────────────────────

const DEFAULT_CONFIG = {
  ai_config: {
    enabled: false,
    personality: 'assistant',
    tone: 'neutro',
    creativity: 0.7,
    memory_limit: 10,
    per_user_memory: false,
    primary_provider: 'gemini',
    primary_model: 'gemini-1.5-flash',
    backup_model: 'gemini-1.5-pro',
    fallback_model: 'deepseek-chat',
  },
  economy_config: {
    enabled: false,
    currency_name: 'coins',
    currency_emoji: '🪙',
    starting_balance: 500,
    daily_reward: 100,
    work_reward: 50,
    daily_cooldown: 86400,
    work_cooldown: 3600,
    casino_multiplier: 2,
    min_bet: 10,
    max_bet: 10000,
    shop_enabled: false,
    ranking_enabled: true,
    shop_items: [],
  },
  music_config: {
    enabled: false,
    default_volume: 50,
    autoplay: false,
    loop_mode: 'off',
  },
  xp_config: {
    enabled: false,
    min_xp: 15,
    max_xp: 25,
    cooldown: 60,
    level_roles: [],
  },
  automod_config: {
    enabled: false,
    anti_spam: true,
    spam_limit: 5,
    flood_time: 5,
    block_links: false,
    blocked_words: [],
    admin_exception: true,
    alert_delete_time: 5,
  },
  logs_config: {
    join_leave: true,
    moderation: true,
    deleted_messages: true,
    edited_messages: true,
    role_changes: true,
    automod_logs: true,
  },
  ticket_config: {
    enabled: false,
    auto_close_hours: 48,
    transcript_enabled: true,
    open_button_label: 'Abrir Ticket',
    close_button_label: 'Fechar Ticket',
    ticket_categories: [],
    support_roles: [],
  },
  suggestion_config: {
    enabled: false,
    vote_type: 'buttons',
    approval_system: false,
  },
  welcome_config: {
    enabled: false,
    use_embed: true,
    embed_color: '#7c3aed',
  },
  custom_commands: [],
  automation_config: {
    auto_responses: [],
    auto_role_enabled: false,
  },
  image_config: {
    enabled: false,
    default_style: 'realistic',
    model: 'dall-e-3',
    max_per_day: 10,
  },
  billing_config: {
    plan: 'free',
    ai_requests_used: 0,
    image_gen_used: 0,
    commands_used: 0,
  },
  role_panel_config: { panels: [] },
  admin_config: {
    say_enabled: true,
    allowed_roles: [],
    admin_roles: [],
  },
  bot_status: 'online',
};

function getGuildConfig(guildId) {
  const guild = db.get(`guilds.${guildId}`).value();
  if (!guild) {
    // Create default
    const newGuild = {
      config: { ...DEFAULT_CONFIG },
      stats: {
        commands_executed: 0,
        ai_messages: 0,
        open_tickets: 0,
        active_members: 0,
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    db.set(`guilds.${guildId}`, newGuild).write();
    return newGuild.config;
  }
  // Merge with defaults so new fields always exist
  return { ...DEFAULT_CONFIG, ...guild.config };
}

function updateGuildModule(guildId, module, data) {
  // Ensure guild exists
  getGuildConfig(guildId);

  db.set(`guilds.${guildId}.config.${module}`, data)
    .set(`guilds.${guildId}.updated_at`, new Date().toISOString())
    .write();

  return db.get(`guilds.${guildId}.config`).value();
}

function getGuildStats(guildId) {
  const guild = db.get(`guilds.${guildId}`).value();
  if (!guild) return { commands_executed: 0, ai_messages: 0, open_tickets: 0, active_members: 0 };
  return guild.stats || { commands_executed: 0, ai_messages: 0, open_tickets: 0, active_members: 0 };
}

function getGlobalStats() {
  const guilds = db.get('guilds').value();
  const users = db.get('users').value();
  return {
    servers: Object.keys(guilds).length,
    users: Object.keys(users).length,
    commands: Object.values(guilds).reduce((sum, g) => sum + (g.stats?.commands_executed || 0), 0),
    ai_requests: Object.values(guilds).reduce((sum, g) => sum + (g.stats?.ai_messages || 0), 0),
  };
}

module.exports = {
  getUser,
  upsertUser,
  getUserByToken,
  getGuildConfig,
  updateGuildModule,
  getGuildStats,
  getGlobalStats,
};