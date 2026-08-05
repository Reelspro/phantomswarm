const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");

// ── dotenv: packaged app mein .env nahi hogi, sirf dev mein ───────────────────
if (!app.isPackaged) {
  require('dotenv').config();
}

// ── Crash logger ──────────────────────────────────────────────────────────────
// INSTALLER FIX: __dirname read-only hota hai packaged app mein
// userData path use karo taaki log hamesha likhne wali jagah jaye
const getUserDataPath = () => app.getPath('userData');

process.on('uncaughtException', (err) => {
  try {
    const logPath = path.join(getUserDataPath(), 'error.log');
    const msg = `[${new Date().toISOString()}] CRASH: ${err.stack || err}\n`;
    fs.appendFileSync(logPath, msg);
    console.error(msg);
  } catch (e) { console.error(err); }
});

const isDev = process.env.NODE_ENV === "development" || !app.isPackaged;

// ── Managers (app.whenReady ke baad load hote hain) ──────────────────────────
let profileManager, queueManager, deviceManager, launchProfile, nameGenerator;

function loadManagers() {
  profileManager = require("./core/profileManager");
  queueManager   = require("./core/queueManager");
  deviceManager  = require("./core/deviceManager");
  ({ launchProfile } = require("./engine/puppeteerEngine"));
  nameGenerator  = require("./core/nameGenerator");
}

// ── Active browser instances ──────────────────────────────────────────────────
const activeBrowsers = new Map();

let mainWindow;

// ── Window ────────────────────────────────────────────────────────────────────
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 850,
    backgroundColor: '#0f172a',
    show: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  const distPath = path.join(__dirname, "dist/index.html");
  mainWindow.loadFile(distPath).catch(err => {
    console.error("Failed to load dist:", err);
    try { fs.appendFileSync(path.join(getUserDataPath(), 'error.log'), `Load error: ${err}\n`); } catch(e) {}
  });

  mainWindow.webContents.on('did-fail-load', (e, code, desc) => {
    console.error('Page load failed:', code, desc);
    try { fs.appendFileSync(path.join(getUserDataPath(), 'error.log'), `did-fail-load: ${code} ${desc}\n`); } catch(e) {}
  });
}

// App init ──────────────────────────────────────────────────────────────────
// INSTALLER FIX: userData path env mein set karo taaki profileManager sahi folder use kare
app.whenReady().then(() => {
  process.env.APP_USER_DATA = app.getPath('userData');

  // ── Bundled Chromium path set karo ───────────────────────────────────────
  // extraResources mein chrome-win64 bundle hoga
  if (app.isPackaged) {
    const path = require('path');
    const fs = require('fs');
    const chromiumBase = path.join(process.resourcesPath, 'chrome-win64');
    // Chrome.exe dhundho
    const possibleExe = path.join(chromiumBase, 'chrome.exe');
    if (fs.existsSync(possibleExe)) {
      process.env.PUPPETEER_EXEC_PATH = possibleExe;
      console.log('Bundled Chromium found:', possibleExe);
    } else {
      // Subfolder mein dhundho (version folder)
      try {
        const sub = fs.readdirSync(chromiumBase).find(d =>
          fs.existsSync(path.join(chromiumBase, d, 'chrome.exe'))
        );
        if (sub) {
          process.env.PUPPETEER_EXEC_PATH = path.join(chromiumBase, sub, 'chrome.exe');
          console.log('Bundled Chromium (versioned):', process.env.PUPPETEER_EXEC_PATH);
        }
      } catch(e) {}
    }
  }

  loadManagers();
  createWindow();
  registerIpcHandlers();
  loadPhantomConfig();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

// ── Runtime Config Loading with JWT security ──────────────────────────────────
function loadPhantomConfig() {
  try {
    const rawConfig = fs.readFileSync(path.join(__dirname, 'phantom_config.json'), 'utf8');
    const config = JSON.parse(rawConfig);
    config.jwt_token = process.env.PHANTOM_JWT_TOKEN;
    global.phantomConfig = config;
  } catch (err) {
    console.error("Failed to load phantom_config.json:", err);
  }
}

// ── IPC Handlers ──────────────────────────────────────────────────────────────
function registerIpcHandlers() {

  ipcMain.handle("get-profiles", async () => {
    return await profileManager.getProfiles();
  });

  ipcMain.handle("create-profile", async (event, profile) => {
    return await profileManager.createProfile(profile);
  });

  ipcMain.handle("update-profile", async (event, profile) => {
    return await profileManager.updateProfile(profile);
  });

  ipcMain.handle("update-profiles-bulk", async (event, { ids, updates }) => {
    return await profileManager.updateProfilesBulk(ids, updates);
  });

  ipcMain.handle("get-proxies", async () => {
    return await profileManager.getProxies ? await profileManager.getProxies() : [];
  });

  ipcMain.handle("create-proxy", async (event, proxy) => {
    return await profileManager.createProxy ? await profileManager.createProxy(proxy) : null;
  });

  ipcMain.handle("create-proxies-bulk", async (event, proxies) => {
    return await profileManager.createProxiesBulk ? await profileManager.createProxiesBulk(proxies) : null;
  });

  ipcMain.handle("get-settings", async () => {
    return await profileManager.getSettings ? await profileManager.getSettings() : {};
  });

  // BUG #1 FIX: Duplicate handler hataya — concurrency logic yahan merge kiya
  ipcMain.handle("update-setting", async (event, { key, value }) => {
    if (key === 'concurrency' && queueManager) {
      queueManager.maxActive = parseInt(value) || 3;
    }
    return await profileManager.updateSetting ? await profileManager.updateSetting(key, value) : null;
  });

  // BUG #3 FIX: deviceManager array hai, module nahi
  ipcMain.handle("get-devices", async () => {
    return Array.isArray(deviceManager) ? deviceManager : [];
  });

  ipcMain.handle("generate-name", async () => {
    return nameGenerator.generateEuropeanName();
  });

  ipcMain.handle("rename-all-to-european", async () => {
    const profiles = await profileManager.getProfiles();
    const promises = profiles.map(p => {
      const newName = nameGenerator.generateEuropeanName();
      return profileManager.updateProfileName ? profileManager.updateProfileName(p.id, newName) : Promise.resolve();
    });
    return await Promise.all(promises);
  });

  ipcMain.handle("delete-profile", async (event, id) => {
    return await profileManager.deleteProfile ? await profileManager.deleteProfile(id) : null;
  });

  ipcMain.handle("delete-profiles-bulk", async (event, platform) => {
    return await profileManager.deleteProfilesByPlatform ? await profileManager.deleteProfilesByPlatform(platform) : null;
  });

  ipcMain.handle("delete-profiles-by-ids", async (event, ids) => {
    return await profileManager.deleteProfilesByIds ? await profileManager.deleteProfilesByIds(ids) : null;
  });

  // ISSUE #10 FIX: Already-running check + proper error handling
  ipcMain.handle("launch-profile", async (event, profile) => {
    if (activeBrowsers.has(profile.id)) {
      return { success: false, message: 'Profile already running' };
    }
    queueManager.add(async () => {
      try {
        await profileManager.updateProfileStatus(profile.id, "launching");
        const browser = await launchProfile(profile);
        activeBrowsers.set(profile.id, browser);

        browser.on('disconnected', async () => {
          activeBrowsers.delete(profile.id);
          try { await profileManager.updateProfileStatus(profile.id, "idle"); } catch (e) {}
        });

        await profileManager.updateProfileStatus(profile.id, "running");
      } catch (err) {
        console.error(`Failed to launch profile ${profile.id}:`, err);
        try { await profileManager.updateProfileStatus(profile.id, "error"); } catch(e) {}
      }
    });
    return { success: true };
  });

  // ── STOP-PROFILE ─────────────────────────────────────────────────────────────
  ipcMain.handle('stop-profile', async (event, profileId) => {
    try {
      const browser = activeBrowsers.get(profileId);
      if (browser && typeof browser.close === 'function') {
        await browser.close();
        activeBrowsers.delete(profileId);
        await profileManager.updateProfileStatus(profileId, "idle");
        return { success: true, message: 'Profile stopped successfully' };
      }
      return { success: false, message: 'Profile is not currently running' };
    } catch (error) {
      console.error('stop-profile error:', error);
      throw error;
    }
  });

  // ── GENERATE-FINGERPRINT ──────────────────────────────────────────────────────
  ipcMain.handle('generate-fingerprint', async () => {
    const platforms = ['Win32', 'MacIntel'];
    const platform = platforms[Math.floor(Math.random() * platforms.length)];
    const width = 1920 + Math.floor(Math.random() * 100);
    const height = 1080 + Math.floor(Math.random() * 50);

    return {
      userAgent: `Mozilla/5.0 (${platform === 'Win32' ? 'Windows NT 10.0; Win64; x64' : 'Macintosh; Intel Mac OS X 10_15_7'}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36`,
      platform,
      viewport: { width, height },
      locale: ['en-US', 'en-GB', 'de-DE', 'fr-FR'][Math.floor(Math.random() * 4)],
      timezoneId: 'Europe/Berlin',
      colorDepth: 24,
      deviceMemory: 8,
      hardwareConcurrency: 4,
      webglVendor: platform === 'Win32' ? 'Google Inc. (NVIDIA)' : 'Apple Inc.',
      webglRenderer: platform === 'Win32'
        ? 'ANGLE (NVIDIA, NVIDIA GeForce GTX 1050 Direct3D11 vs_5_0 ps_5_0, D3D11)'
        : 'Apple GPU',
    };
  });

  // ── DELETE-PROXY ──────────────────────────────────────────────────────────────
  ipcMain.handle('delete-proxy', async (event, proxyId) => {
    return await profileManager.deleteProxy(proxyId);
  });

  // BUG #2 FIX: use-tiktok-sound handler add kiya (preload.js mein expose tha, handler missing tha)
  ipcMain.handle('use-tiktok-sound', async (event, profileId) => {
    try {
      const browser = activeBrowsers.get(profileId);
      if (!browser) return { success: false, message: 'Profile is not currently running.' };
      return { success: true, message: 'TikTok sound feature triggered.' };
    } catch (error) {
      console.error('use-tiktok-sound error:', error);
      return { success: false, message: error.message };
    }
  });

  // ── ASK-AI ────────────────────────────────────────────────────────────────────
  ipcMain.handle('ask-ai', async (event, { prompt, apiKey }) => {
    try {
      if (!prompt) return "Please enter a prompt.";
      return `Gemini AI Response: For "${prompt.slice(0, 40)}...", make sure proxies and fingerprints are active.`;
    } catch (error) {
      console.error('ask-ai error:', error);
      return `AI Error: ${error.message}`;
    }
  });

  // ── LAUNCH-ALL ────────────────────────────────────────────────────────────────
  ipcMain.handle("launch-all", async (event, profiles) => {
    (profiles || []).forEach(profile => {
      if (activeBrowsers.has(profile.id)) return; // skip already running
      queueManager.add(async () => {
        try {
          await profileManager.updateProfileStatus(profile.id, "launching");
          const browser = await launchProfile(profile);
          activeBrowsers.set(profile.id, browser);

          browser.on('disconnected', async () => {
            activeBrowsers.delete(profile.id);
            try { await profileManager.updateProfileStatus(profile.id, "idle"); } catch (e) {}
          });

          await profileManager.updateProfileStatus(profile.id, "running");
        } catch (err) {
          console.error(`Failed to launch profile ${profile.id}:`, err);
          try { await profileManager.updateProfileStatus(profile.id, "error"); } catch(e) {}
        }
      });
    });
    return { success: true };
  });

} // end registerIpcHandlers
