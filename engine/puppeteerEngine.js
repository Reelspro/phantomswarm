const puppeteer = require("puppeteer");

async function launchProfile(profile) {
  const device = profile.device || {};
  const viewMode = (device.viewMode || profile.viewMode || 'mobile').toLowerCase();
  const isDesktop = viewMode === 'desktop';

  const width = isDesktop ? (device.width && device.width > 900 ? device.width : 1920) : (device.width || 390);
  const height = isDesktop ? (device.height && device.height > 600 ? device.height : 1080) : (device.height || 844);
  
  let userAgent = device.userAgent;
  if (!userAgent || (isDesktop && (userAgent.includes('iPhone') || userAgent.includes('Android')))) {
    userAgent = isDesktop 
      ? 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      : 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1';
  }

  const args = [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-infobars',
    '--ignore-certificate-errors',
    '--ignore-certificate-errors-spki-list',
  ];

  if (isDesktop) {
    args.push('--start-maximized');
  } else {
    args.push('--window-size=480,920');
    args.push('--window-position=100,100');
  }

  if (profile.proxy && profile.proxy.host && profile.proxy.port) {
    args.push(`--proxy-server=${profile.proxy.host}:${profile.proxy.port}`);
  }

  const fs = require("fs");
  const path = require("path");

  const dataRoot = process.env.APP_USER_DATA || path.join(__dirname, '..');
  const profilesDir = path.join(dataRoot, 'profiles');
  const profileDir = path.join(profilesDir, String(profile.id || 'default'));

  if (!fs.existsSync(profilesDir)) {
    fs.mkdirSync(profilesDir, { recursive: true });
  }

  const launchOptions = {
    headless: false,
    userDataDir: profileDir,
    args: args,
    defaultViewport: isDesktop ? null : {
      width: width,
      height: height,
      isMobile: true,
      hasTouch: true
    }
  };

  // ── Bundled Chromium path detect karo ────────────────────────────────────────
  // Packaged app mein PUPPETEER_EXEC_PATH main.js set karta hai
  // Dev mein system Chrome/Edge fallback use hota hai
  const bundledExecPath = process.env.PUPPETEER_EXEC_PATH || null;
  if (bundledExecPath) {
    const fs = require('fs');
    if (fs.existsSync(bundledExecPath)) {
      launchOptions.executablePath = bundledExecPath;
      console.log('Using bundled Chromium:', bundledExecPath);
    }
  }

  let browser;
  try {
    // 1st Attempt: Bundled Chromium (packaged app) ya default
    browser = await puppeteer.launch(launchOptions);
  } catch (err1) {
    console.warn("Default launch failed, trying system Chrome...", err1.message);
    try {
      // 2nd Attempt: Installed Chrome
      browser = await puppeteer.launch({ ...launchOptions, executablePath: undefined, channel: 'chrome' });
    } catch (err2) {
      console.warn("System Chrome failed, trying Edge...", err2.message);
      // 3rd Attempt: Installed Microsoft Edge
      browser = await puppeteer.launch({ ...launchOptions, executablePath: undefined, channel: 'msedge' });
    }
  }

  const page = await browser.newPage();

  // Set User Agent
  await page.setUserAgent(userAgent);

  // Authenticate proxy if credentials exist
  if (profile.proxy && profile.proxy.host && profile.proxy.username && profile.proxy.password) {
    await page.authenticate({
      username: profile.proxy.username,
      password: profile.proxy.password
    });
  }

  const action = (profile.action || 'signin').toLowerCase();
  const url = getURL(profile.platform, action, isDesktop);
  console.log(`Launching profile ${profile.name} [${viewMode.toUpperCase()} | ${action.toUpperCase()}] on ${profile.platform} -> ${url}`);
  
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    
    // Auto-fill credentials if provided
    if (profile.email || profile.password) {
      console.log(`Auto-filling credentials for profile: ${profile.name}`);
      await page.evaluate(async (emailVal, passVal, mode) => {
        const sleep = (ms) => new Promise(res => setTimeout(res, ms));
        
        // Find email/username field
        const emailSelectors = [
          'input[type="email"]', 'input[name="email"]', 'input[name="username"]', 
          'input[name="login"]', 'input[autocomplete="username"]', 'input[type="text"]'
        ];
        let emailInput = null;
        for (const sel of emailSelectors) {
          emailInput = document.querySelector(sel);
          if (emailInput) break;
        }

        if (emailInput && emailVal) {
          emailInput.focus();
          emailInput.value = emailVal;
          emailInput.dispatchEvent(new Event('input', { bubbles: true }));
          emailInput.dispatchEvent(new Event('change', { bubbles: true }));
        }

        // Find password field
        const passSelectors = [
          'input[type="password"]', 'input[name="password"]', 'input[name="pass"]', 
          'input[autocomplete="current-password"]', 'input[autocomplete="new-password"]'
        ];
        let passInput = null;
        for (const sel of passSelectors) {
          passInput = document.querySelector(sel);
          if (passInput) break;
        }

        if (passInput && passVal) {
          passInput.focus();
          passInput.value = passVal;
          passInput.dispatchEvent(new Event('input', { bubbles: true }));
          passInput.dispatchEvent(new Event('change', { bubbles: true }));
        }

        // Scroll form into clear focus view
        const form = document.querySelector('form, #loginform, .login_form, [role="main"], main');
        if (form) form.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, profile.email || '', profile.password || '', action).catch(() => {});
    }
  } catch (navErr) {
    console.warn("Navigation timeout, proceeding anyway:", navErr.message);
  }

  return browser;
}

function getURL(platform, action = 'signin', isDesktop = false) {
  if (!platform || typeof platform !== 'string') return "https://google.com";
  const p = platform.toLowerCase().trim();
  const isSignup = action === 'signup';

  switch (p) {
    case "facebook":
      if (isDesktop) {
        return isSignup ? "https://www.facebook.com/r.php" : "https://www.facebook.com/login";
      } else {
        return isSignup ? "https://m.facebook.com/reg" : "https://m.facebook.com/login";
      }
    case "instagram":
      return isSignup ? "https://www.instagram.com/accounts/emailsignup/" : "https://www.instagram.com/accounts/login/";
    case "pinterest":
      // BUG #8 FIX: Signup ka URL galat tha, same as signin tha
      return isSignup ? "https://www.pinterest.com/register/" : "https://www.pinterest.com/login/";
    case "twitter":
    case "x":
      return isSignup ? "https://x.com/i/flow/signup" : "https://x.com/i/flow/login";
    case "tiktok":
      return isSignup ? "https://www.tiktok.com/signup" : "https://www.tiktok.com/login";
    case "youtube":
      return isSignup ? "https://accounts.google.com/SignUp" : "https://accounts.google.com/ServiceLogin";
    case "threads":
      return "https://www.threads.net/login";
    case "reddit":
      return isSignup ? "https://www.reddit.com/register/" : "https://www.reddit.com/login/";
    case "quora":
      return "https://www.quora.com/";
    case "truth social":
    case "truthsocial":
    case "truth":
      return isSignup ? "https://truthsocial.com/sign-up" : "https://truthsocial.com/login";
    case "tumblr":
      return isSignup ? "https://www.tumblr.com/register" : "https://www.tumblr.com/login";
    case "bereal":
      return "https://bereal.com/";
    case "bluesky":
    case "bsky":
      return "https://bsky.app/";
    case "kaskus":
      return isSignup ? "https://www.kaskus.co.id/register" : "https://www.kaskus.co.id/";
    case "tokopedia":
      return isSignup ? "https://www.tokopedia.com/register" : "https://www.tokopedia.com/login";
    case "sharechat":
      return "https://sharechat.com/";
    default:
      return "https://google.com";
  }
}

module.exports = { launchProfile };
