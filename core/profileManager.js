const fs = require('fs');
const path = require('path');

// INSTALLER FIX: Packaged app mein __dirname read-only hota hai
// APP_USER_DATA env var main.js mein set hota hai app.whenReady() ke baad
// Dev mein fallback: project ke andar db folder
const dataRoot = process.env.APP_USER_DATA || path.join(__dirname, '..');

const dbDir = path.join(dataRoot, 'db');
const PROFILES_FILE = path.join(dbDir, 'profiles.json');
const PROXIES_FILE  = path.join(dbDir, 'proxies.json');
const SETTINGS_FILE = path.join(dbDir, 'settings.json');

// ── Ensure db directory & files exist ────────────────────────────────────────
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });
const ensureFile = (filePath, defaultVal) => {
  if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, JSON.stringify(defaultVal, null, 2));
};
ensureFile(PROFILES_FILE, []);
ensureFile(PROXIES_FILE,  []);
ensureFile(SETTINGS_FILE, {});

// ── Helpers ───────────────────────────────────────────────────────────────────
const readJSON  = (file) => { try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return null; } };
const writeJSON = (file, data) => fs.writeFileSync(file, JSON.stringify(data, null, 2));

// ── Profile Functions ─────────────────────────────────────────────────────────
function createProfile(profile) {
  const profiles = readJSON(PROFILES_FILE) || [];
  profiles.push(profile);
  writeJSON(PROFILES_FILE, profiles);
  return Promise.resolve();
}

function getProfiles() {
  return Promise.resolve(readJSON(PROFILES_FILE) || []);
}

function updateProfileStatus(id, status) {
  const profiles = readJSON(PROFILES_FILE) || [];
  const idx = profiles.findIndex(p => p.id === id);
  if (idx !== -1) { profiles[idx].status = status; writeJSON(PROFILES_FILE, profiles); }
  return Promise.resolve();
}

function updateProfileName(id, newName) {
  if (!id || !newName || typeof newName !== 'string') return Promise.reject(new Error('Invalid args'));
  const safeName = newName.trim();
  if (!safeName) return Promise.reject(new Error('Name cannot be empty'));
  const profiles = readJSON(PROFILES_FILE) || [];
  const idx = profiles.findIndex(p => p.id === id);
  if (idx === -1) return Promise.reject(new Error('Profile not found'));
  profiles[idx].name = safeName;
  writeJSON(PROFILES_FILE, profiles);
  return Promise.resolve({ success: true, id, name: safeName });
}

function deleteProfile(id) {
  const profiles = readJSON(PROFILES_FILE) || [];
  writeJSON(PROFILES_FILE, profiles.filter(p => p.id !== id));
  try {
    const pFolder = path.join(dataRoot, 'profiles', String(id));
    if (fs.existsSync(pFolder)) fs.rmSync(pFolder, { recursive: true, force: true });
  } catch (e) {}
  return Promise.resolve();
}

function deleteProfilesByIds(ids) {
  const profiles = readJSON(PROFILES_FILE) || [];
  writeJSON(PROFILES_FILE, profiles.filter(p => !ids.includes(p.id)));
  if (Array.isArray(ids)) {
    ids.forEach(id => {
      try {
        const pFolder = path.join(dataRoot, 'profiles', String(id));
        if (fs.existsSync(pFolder)) fs.rmSync(pFolder, { recursive: true, force: true });
      } catch (e) {}
    });
  }
  return Promise.resolve();
}

function updateProfile(updatedProfile) {
  if (!updatedProfile || !updatedProfile.id) return Promise.reject(new Error('Invalid profile data'));
  const profiles = readJSON(PROFILES_FILE) || [];
  const idx = profiles.findIndex(p => p.id === updatedProfile.id);
  if (idx === -1) return Promise.reject(new Error('Profile not found'));
  profiles[idx] = { ...profiles[idx], ...updatedProfile };
  writeJSON(PROFILES_FILE, profiles);
  return Promise.resolve({ success: true, profile: profiles[idx] });
}

function updateProfilesBulk(ids, updates) {
  if (!Array.isArray(ids) || ids.length === 0) return Promise.reject(new Error('No IDs provided'));
  const profiles = readJSON(PROFILES_FILE) || [];
  let updatedCount = 0;
  profiles.forEach(p => {
    if (ids.includes(p.id)) {
      Object.keys(updates).forEach(key => {
        if (updates[key] !== undefined && updates[key] !== '') {
          p[key] = updates[key];
        }
      });
      updatedCount++;
    }
  });
  writeJSON(PROFILES_FILE, profiles);
  return Promise.resolve({ success: true, count: updatedCount });
}

function deleteProfilesByPlatform(platform) {
  const profiles = readJSON(PROFILES_FILE) || [];
  writeJSON(PROFILES_FILE, profiles.filter(p => (p.platform || '').toLowerCase() !== platform.toLowerCase()));
  return Promise.resolve();
}

// ── Proxy Functions ───────────────────────────────────────────────────────────
function createProxy(proxy) {
  const proxies = readJSON(PROXIES_FILE) || [];
  proxies.push(proxy);
  writeJSON(PROXIES_FILE, proxies);
  return Promise.resolve();
}

function createProxiesBulk(newProxies) {
  const proxies = readJSON(PROXIES_FILE) || [];
  proxies.push(...newProxies);
  writeJSON(PROXIES_FILE, proxies);
  return Promise.resolve();
}

function getProxies() {
  return Promise.resolve(readJSON(PROXIES_FILE) || []);
}

function deleteProxy(id) {
  const proxies = readJSON(PROXIES_FILE) || [];
  writeJSON(PROXIES_FILE, proxies.filter(p => p.id !== id));
  return Promise.resolve();
}

// ── Settings Functions ────────────────────────────────────────────────────────
function getSettings() {
  return Promise.resolve(readJSON(SETTINGS_FILE) || {});
}

function updateSetting(key, value) {
  const settings = readJSON(SETTINGS_FILE) || {};
  settings[key] = value;
  writeJSON(SETTINGS_FILE, settings);
  return Promise.resolve();
}

module.exports = {
  createProfile, getProfiles, updateProfileStatus, updateProfileName,
  updateProfile, updateProfilesBulk,
  deleteProfile, deleteProfilesByIds, deleteProfilesByPlatform,
  createProxy, createProxiesBulk, getProxies, deleteProxy,
  getSettings, updateSetting
};
