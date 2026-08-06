const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electron", {
  getProfiles: () => ipcRenderer.invoke("get-profiles"),
  getProxies: () => ipcRenderer.invoke("get-proxies"),
  getDevices: () => ipcRenderer.invoke("get-devices"),
  getSettings: () => ipcRenderer.invoke("get-settings"),
  getAppVersion: () => ipcRenderer.invoke("get-app-version"),
  updateSetting: (key, value) => ipcRenderer.invoke("update-setting", key, value),
  createProfile: (profile) => ipcRenderer.invoke("create-profile", profile),
  updateProfile: (profile) => ipcRenderer.invoke("update-profile", profile),
  updateProfilesBulk: (ids, updates) => ipcRenderer.invoke("update-profiles-bulk", { ids, updates }),
  createProxy: (proxy) => ipcRenderer.invoke("create-proxy", proxy),
  createProxiesBulk: (proxies) => ipcRenderer.invoke("create-proxies-bulk", proxies),
  deleteProfile: (id) => ipcRenderer.invoke("delete-profile", id),
  deleteProfilesByIds: (ids) => ipcRenderer.invoke("delete-profiles-by-ids", ids),
  deleteProfilesBulk: (platform) => ipcRenderer.invoke("delete-profiles-bulk", platform),
  deleteProxy: (id) => ipcRenderer.invoke("delete-proxy", id),
  renameAllToEuropean: () => ipcRenderer.invoke("rename-all-to-european"),
  generateEuropeanName: () => ipcRenderer.invoke("generate-name"),
  generateFingerprint: (template) => ipcRenderer.invoke("generate-fingerprint", template),
  launchProfile: (profile) => ipcRenderer.invoke("launch-profile", profile),
  stopProfile: (id) => ipcRenderer.invoke("stop-profile", id),
  launchAll: (profiles) => ipcRenderer.invoke("launch-all", profiles),
  useTiktokSound: (id) => ipcRenderer.invoke("use-tiktok-sound", id),
  askAi: (data) => ipcRenderer.invoke("ask-ai", data),
  checkForUpdates: () => ipcRenderer.invoke("check-for-updates"),
  restartAndInstall: () => ipcRenderer.invoke("restart-and-install"),
  onUpdateStatus: (callback) => {
    const subscription = (event, value) => callback(value);
    ipcRenderer.on("update-status", subscription);
    return () => ipcRenderer.removeListener("update-status", subscription);
  },
  invoke: (channel, data) => ipcRenderer.invoke(channel, data)
});
