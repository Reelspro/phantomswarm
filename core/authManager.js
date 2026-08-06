const fs = require('fs');
const path = require('path');

const dataRoot = process.env.APP_USER_DATA || path.join(__dirname, '..');
const dbDir = path.join(dataRoot, 'db');

const USERS_FILE   = path.join(dbDir, 'users.json');
const SESSION_FILE = path.join(dbDir, 'session.json');

if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

const ensureFile = (filePath, defaultVal) => {
  if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, JSON.stringify(defaultVal, null, 2));
};

ensureFile(USERS_FILE, []);
ensureFile(SESSION_FILE, null);

const readJSON  = (file) => { try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return null; } };
const writeJSON = (file, data) => fs.writeFileSync(file, JSON.stringify(data, null, 2));

function login({ email, password }) {
  if (!email || !password) return Promise.resolve({ success: false, error: 'Email and password are required.' });
  
  const cleanEmail = email.toLowerCase().trim();
  const users = readJSON(USERS_FILE) || [];
  const user = users.find(u => u.email.toLowerCase() === cleanEmail);

  if (!user || user.password !== password) {
    return Promise.resolve({ success: false, error: 'Invalid email or password. Please check your credentials.' });
  }

  const session = {
    userId: user.id,
    email: user.email,
    name: user.name,
    loggedInAt: new Date().toISOString()
  };
  writeJSON(SESSION_FILE, session);

  return Promise.resolve({
    success: true,
    user: { id: user.id, email: user.email, name: user.name }
  });
}

function register({ name, email, password }) {
  if (!name || !email || !password) {
    return Promise.resolve({ success: false, error: 'All fields are required.' });
  }

  const cleanEmail = email.toLowerCase().trim();
  const users = readJSON(USERS_FILE) || [];

  const existing = users.find(u => u.email.toLowerCase() === cleanEmail);
  if (existing) {
    return Promise.resolve({ success: false, error: 'An account with this Gmail address already exists.' });
  }

  const newUser = {
    id: Date.now().toString(),
    name: name.trim(),
    email: cleanEmail,
    password: password,
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  writeJSON(USERS_FILE, users);

  const session = {
    userId: newUser.id,
    email: newUser.email,
    name: newUser.name,
    loggedInAt: new Date().toISOString()
  };
  writeJSON(SESSION_FILE, session);

  return Promise.resolve({
    success: true,
    user: { id: newUser.id, email: newUser.email, name: newUser.name }
  });
}

function resetPassword({ email, newPassword }) {
  if (!email || !newPassword) {
    return Promise.resolve({ success: false, error: 'Email and new password are required.' });
  }

  const cleanEmail = email.toLowerCase().trim();
  const users = readJSON(USERS_FILE) || [];
  const idx = users.findIndex(u => u.email.toLowerCase() === cleanEmail);

  if (idx === -1) {
    return Promise.resolve({ success: false, error: 'No registered account found with this Gmail address.' });
  }

  users[idx].password = newPassword;
  users[idx].updatedAt = new Date().toISOString();
  writeJSON(USERS_FILE, users);

  return Promise.resolve({
    success: true,
    message: 'Password updated successfully! Please sign in with your new password.'
  });
}

function getCurrentUser() {
  const session = readJSON(SESSION_FILE);
  if (session && session.userId && session.email) {
    return Promise.resolve({
      id: session.userId,
      email: session.email,
      name: session.name
    });
  }
  return Promise.resolve(null);
}

function logout() {
  writeJSON(SESSION_FILE, null);
  return Promise.resolve({ success: true });
}

module.exports = {
  login,
  register,
  resetPassword,
  getCurrentUser,
  logout
};
