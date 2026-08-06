import React, { useState, useEffect } from 'react';
import deviceDataJson from '../core/deviceData.json';
import { 
  Users, Plus, Play, Settings, Globe, Monitor, Layers, 
  CheckCircle, Clock, Search, Shield, Smartphone, Save, 
  Trash2, Copy, Zap, Fingerprint, Upload, Bot, Send, Loader2,
  Facebook, Instagram, Twitter, Compass, LayoutGrid, UserPlus, RefreshCw, Music, X, LogIn,
  AtSign, Hash, BookOpen, Flag,
  BookMarked, Camera, Wind, MessageSquare, ShoppingBag, Share2, Edit, Pencil
} from 'lucide-react';

const PLATFORM_INFO = {
  facebook:       { country: 'Global',    flag: '🌍', language: 'English', localLang: null },
  instagram:      { country: 'Global',    flag: '🌍', language: 'English', localLang: null },
  twitter:        { country: 'Global',    flag: '🌍', language: 'English', localLang: null },
  tiktok:         { country: 'Global',    flag: '🌍', language: 'English', localLang: null },
  youtube:        { country: 'Global',    flag: '🌍', language: 'English', localLang: null },
  pinterest:      { country: 'USA',       flag: '🇺🇸', language: 'English', localLang: null },
  threads:        { country: 'Global',    flag: '🌍', language: 'English', localLang: null },
  reddit:         { country: 'USA',       flag: '🇺🇸', language: 'English', localLang: null },
  quora:          { country: 'Global',    flag: '🌍', language: 'English', localLang: null },
  'truth social': { country: 'USA',       flag: '🇺🇸', language: 'English', localLang: null },
  tumblr:         { country: 'USA',       flag: '🇺🇸', language: 'English', localLang: null },
  bereal:         { country: 'France',    flag: '🇫🇷', language: 'English', localLang: 'Français' },
  bluesky:        { country: 'USA',       flag: '🇺🇸', language: 'English', localLang: null },
  kaskus:         { country: 'Indonesia', flag: '🇮🇩', language: 'English', localLang: 'Bahasa Indonesia' },
  tokopedia:      { country: 'Indonesia', flag: '🇮🇩', language: 'English', localLang: 'Bahasa Indonesia' },
  sharechat:      { country: 'India',     flag: '🇮🇳', language: 'English', localLang: 'हिंदी / Regional' },
};

// ── Bulletproof electron bridge fallback ─────────────────────────────────────
if (typeof window !== 'undefined' && !window.electron) {
  window.electron = {
    getProfiles: async () => [],
    getProxies: async () => [],
    getDevices: async () => deviceDataJson,
    getSettings: async () => ({ concurrency: '10' }),
    updateSetting: async () => ({}),
    createProfile: async () => ({}),
    updateProfile: async () => ({}),
    updateProfilesBulk: async () => ({}),
    createProxy: async () => ({}),
    createProxiesBulk: async () => ({}),
    deleteProfile: async () => ({}),
    deleteProfilesByIds: async () => ({}),
    deleteProfilesBulk: async () => ({}),
    deleteProxy: async () => ({}),
    renameAllToEuropean: async () => ([]),
    generateEuropeanName: async () => 'Alexander Smith',
    generateFingerprint: async () => ({ userAgent: 'Mozilla/5.0', width: 390, height: 844, name: 'iPhone 14' }),
    launchProfile: async () => ({ success: true }),
    stopProfile: async () => ({ success: true }),
    launchAll: async () => ({ success: true }),
    useTiktokSound: async () => ({ success: true }),
    askAi: async () => "AI Assistant ready.",
    checkForUpdates: async () => ({}),
    restartAndInstall: async () => ({}),
    onUpdateStatus: () => () => {},
    invoke: async () => ({})
  };
}

const App = () => {
  const [activeTab, setActiveTab] = useState('profiles');
  const [profiles, setProfiles] = useState([]);
  const [proxies, setProxies] = useState([]);
  const [deviceTemplates, setDeviceTemplates] = useState([]);
  const [settings, setSettings] = useState({ theme: 'dark', concurrency: '10', geminiKey: '' });
  
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showProxyModal, setShowProxyModal] = useState(false);
  const [showBulkProxyModal, setShowBulkProxyModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProfile, setEditingProfile] = useState(null);
  const [showBulkEditModal, setShowBulkEditModal] = useState(false);
  const [bulkEditData, setBulkEditData] = useState({
    platform: '', action: '', viewMode: '', postLanguage: '', proxyId: '', password: ''
  });

  const [newProfile, setNewProfile] = useState({
    name: '', platform: 'facebook', proxyMode: 'saved', proxyId: '',
    manualProxy: { host: '', port: '', username: '', password: '' }, deviceTemplate: 'random',
    count: 1, email: '', password: '', action: 'signin', viewMode: 'mobile', postLanguage: 'english'
  });

  const [newProxy, setNewProxy] = useState({ name: '', host: '', port: '', username: '', password: '' });
  const [bulkProxyText, setBulkProxyText] = useState('');
  const [deviceSearch, setDeviceSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [showBulkLoginModal, setShowBulkLoginModal] = useState(false);
  const [bulkLoginText, setBulkLoginText] = useState('');

  // AI Chat State
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState([
    { role: 'ai', text: 'Hello! I am your Gemini AI Assistant. How can I help you with your browser automation today?' }
  ]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isCreatingProfile, setIsCreatingProfile] = useState(false);

  const [filterPlatform, setFilterPlatform] = useState('all');
  const [updateStatus, setUpdateStatus] = useState(null);
  const [currentAppVersion, setCurrentAppVersion] = useState('1.0.2');

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      if (activeTab === 'profiles') fetchProfiles();
    }, 3000);

    const unsubscribeUpdate = window.electron.onUpdateStatus ? window.electron.onUpdateStatus((data) => {
      console.log('Update status:', data);
      setUpdateStatus(data);
    }) : () => {};

    return () => {
      clearInterval(interval);
      if (typeof unsubscribeUpdate === 'function') unsubscribeUpdate();
    };
  }, [activeTab]);

  const fetchData = async () => {
    await fetchProfiles();
    await fetchProxies();
    await fetchDevices();
    await fetchSettings();
    if (window.electron.getAppVersion) {
      try {
        const v = await window.electron.getAppVersion();
        if (v) setCurrentAppVersion(v);
      } catch (e) {}
    }
  };

  const fetchProfiles = async () => {
    try {
      const data = await window.electron.getProfiles();
      setProfiles(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setProfiles([]);
    }
  };

  const LANG_GROUP_KEYS = ['english', 'urdu-hindi', 'indonesian'];

  const matchesLangGroup = (p, key) => {
    if (key === 'english') return !p.postLanguage || p.postLanguage === 'english';
    if (key === 'urdu-hindi') return ['urdu', 'hindi', 'urdu+hindi', 'urdu-hindi'].includes((p.postLanguage || '').toLowerCase());
    if (key === 'indonesian') return (p.postLanguage || '').toLowerCase() === 'indonesian'
      || ['kaskus', 'tokopedia'].includes((p.platform || '').toLowerCase());
    return false;
  };

  const filteredProfiles = (Array.isArray(profiles) ? profiles : []).filter(p => {
    if (!p) return false;
    if (LANG_GROUP_KEYS.includes(filterPlatform)) return matchesLangGroup(p, filterPlatform);
    if (filterPlatform === 'all') return true;
    return p.platform && p.platform.toLowerCase() === filterPlatform.toLowerCase();
  });


  const fetchProxies = async () => {
    try {
      const data = await window.electron.getProxies();
      setProxies(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setProxies([]);
    }
  };

  const fetchDevices = async () => {
    try {
      const data = await window.electron.getDevices();
      setDeviceTemplates(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setDeviceTemplates([]);
    }
  };

  const fetchSettings = async () => {
    try {
      const data = await window.electron.getSettings();
      setSettings(prev => ({ ...prev, ...data }));
    } catch (err) { console.error(err); }
  };

  const updateGlobalSetting = async (key, value) => {
    await window.electron.updateSetting(key, value);
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const parseProxyLine = (line) => {
    line = line.trim(); if (!line) return null;
    // Remove protocol if present (http://, socks5://, etc)
    line = line.replace(/(^\w+:|^)\/\//, '');
    
    let host, port, username = '', password = '';
    
    // Format: user:pass@host:port
    if (line.includes('@')) {
      const atIdx = line.lastIndexOf('@');
      const auth = line.substring(0, atIdx);
      const addr = line.substring(atIdx + 1);
      // BUG #6 FIX: nested colons wale passwords ke liye indexOf use kiya
      const colonIdx = auth.indexOf(':');
      if (colonIdx !== -1) {
        username = auth.substring(0, colonIdx);
        password = auth.substring(colonIdx + 1);
      }
      const addrParts = addr.split(':');
      if (addrParts.length === 2) {
        host = addrParts[0]; port = addrParts[1];
      }
    } else {
      const parts = line.split(':');
      // Format: host:port:user:pass
      if (parts.length === 4) {
        host = parts[0]; port = parts[1]; username = parts[2]; password = parts[3];
      } 
      // Format: host:port
      else if (parts.length === 2) {
        host = parts[0]; port = parts[1];
      }
    }

    if (host && port) {
      return { id: Math.random().toString(36).substr(2, 9), name: `Proxy ${host}`, host, port, username, password };
    }
    return null;
  };

  const handleOpenProfileModal = async () => {
    try {
      const randomName = await window.electron.generateEuropeanName();
      setNewProfile(prev => ({ ...prev, name: randomName || 'New Profile' }));
    } catch (err) {
      console.error("Error generating name:", err);
    }
    setShowProfileModal(true);
  };

  const handleCreateProfile = async () => {
    if (!newProfile.name && newProfile.count === 1) return;
    
    setIsCreatingProfile(true); 
    try {
      const availableDevices = (deviceTemplates && deviceTemplates.length > 0) ? deviceTemplates : [];

      for (let i = 0; i < newProfile.count; i++) {
        let profileName = newProfile.name;
        if (newProfile.count > 1 || !profileName) {
           const baseName = await window.electron.generateEuropeanName();
           profileName = newProfile.count > 1 ? `${baseName} ${String(i + 1).padStart(2, '0')}` : baseName;
        }
        
        let selectedProxy = newProfile.proxyMode === 'saved' ? proxies.find(p => p.id === newProfile.proxyId) || {} : newProfile.manualProxy;
        
        let profileDevice = null;
        if (newProfile.deviceTemplate && newProfile.deviceTemplate !== 'random') {
          profileDevice = availableDevices.find(d => d.name === newProfile.deviceTemplate || d.id === newProfile.deviceTemplate);
        }

        // If 'random' or single template reused in batch, pick a unique random device per profile
        if (!profileDevice || newProfile.count > 1) {
          if (availableDevices.length > 0) {
            const randomIndex = Math.floor(Math.random() * availableDevices.length);
            profileDevice = { ...availableDevices[randomIndex] };
          }
        }

        // Fallback fingerprint if devices list is empty
        if (!profileDevice) {
          profileDevice = await window.electron.generateFingerprint('random');
        }

        // Guarantee a unique MAC Address per profile
        profileDevice.macAddress = "XX:XX:XX:XX:XX:XX".replace(/X/g, () => "0123456789ABCDEF".charAt(Math.floor(Math.random() * 16)));
        
        const profile = { 
          id: `${Date.now()}-${i}`, 
          name: profileName, 
          platform: newProfile.platform, 
          proxy: selectedProxy, 
          device: {
            ...profileDevice,
            viewMode: newProfile.viewMode || 'mobile'
          },
          action: newProfile.action || 'signin',
          viewMode: newProfile.viewMode || 'mobile',
          email: newProfile.count === 1 ? (newProfile.email || '') : '',
          password: newProfile.count === 1 ? (newProfile.password || '') : '',
          postLanguage: newProfile.postLanguage || 'english',
          status: 'idle' 
        };
        await window.electron.createProfile(profile);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsCreatingProfile(false);
      setShowProfileModal(false);
      fetchProfiles();
      // ISSUE #9 FIX: Poori state reset karo, sirf count nahi
      setNewProfile({
        name: '', platform: 'facebook', proxyMode: 'saved', proxyId: '',
        manualProxy: { host: '', port: '', username: '', password: '' }, deviceTemplate: 'random',
        count: 1, email: '', password: '', action: 'signin', viewMode: 'mobile', postLanguage: 'english'
      });
    }
  };

  const handleCreateProxy = async () => {
    if (!newProxy.host || !newProxy.port) {
      alert("Invalid proxy format. Please use host:port or host:port:user:pass");
      return;
    }
    const proxy = { ...newProxy, id: Date.now().toString() };
    await window.electron.createProxy(proxy);
    setShowProxyModal(false);
    fetchProxies();
  };

  const handleBulkProxyAdd = async () => {
    const lines = bulkProxyText.split('\n');
    const parsed = lines.map(parseProxyLine).filter(p => p !== null);
    if (parsed.length > 0) { 
      await window.electron.createProxiesBulk(parsed); 
      setBulkProxyText(''); 
      setShowBulkProxyModal(false); 
      fetchProxies(); 
    } else {
      alert("No valid proxies found in text. Use host:port or host:port:user:pass format.");
    }
  };

  const handleDeleteProxy = async (id) => {
    if (confirm("Delete this proxy?")) {
      await window.electron.deleteProxy(id);
      fetchProxies();
    }
  };

  const handleOpenEditModal = (profile) => {
    setEditingProfile({ ...profile });
    setShowEditModal(true);
  };

  const handleSaveEditedProfile = async () => {
    if (!editingProfile || !editingProfile.id) return;
    try {
      await window.electron.updateProfile(editingProfile);
      setShowEditModal(false);
      setEditingProfile(null);
      fetchProfiles();
    } catch (err) {
      console.error("Error updating profile:", err);
      alert("Failed to update profile: " + err.message);
    }
  };

  const handleSaveBulkEdit = async () => {
    if (selectedIds.length === 0) return;
    try {
      const updates = {};
      if (bulkEditData.platform) updates.platform = bulkEditData.platform;
      if (bulkEditData.action) updates.action = bulkEditData.action;
      if (bulkEditData.viewMode) updates.viewMode = bulkEditData.viewMode;
      if (bulkEditData.postLanguage) updates.postLanguage = bulkEditData.postLanguage;
      if (bulkEditData.password) updates.password = bulkEditData.password;
      if (bulkEditData.proxyId) {
        const selProxy = proxies.find(p => p.id === bulkEditData.proxyId);
        if (selProxy) updates.proxy = selProxy;
      }

      await window.electron.updateProfilesBulk(selectedIds, updates);
      setShowBulkEditModal(false);
      setBulkEditData({ platform: '', action: '', viewMode: '', postLanguage: '', proxyId: '', password: '' });
      setSelectedIds([]);
      fetchProfiles();
    } catch (err) {
      console.error("Error updating bulk profiles:", err);
      alert("Failed to update profiles: " + err.message);
    }
  };

  const handleRenameAll = async () => {
    if (confirm("Are you sure you want to rename all profiles to European names?")) {
      await window.electron.renameAllToEuropean();
      fetchProfiles();
    }
  };

  const handleAiChat = async () => {
    if (!chatInput.trim()) return;
    const userMsg = { role: 'user', text: chatInput };
    setChatHistory(prev => [...prev, userMsg]);
    const sentInput = chatInput;
    setChatInput('');
    setIsAiLoading(true);
    try {
      const response = await window.electron.askAi({ prompt: sentInput, apiKey: settings.geminiKey || '' });
      setChatHistory(prev => [...prev, { role: 'ai', text: response }]);
    } catch (err) {
      setChatHistory(prev => [...prev, { role: 'ai', text: `❌ Error: ${err.message}` }]);
    } finally { setIsAiLoading(false); }
  };

  const PLATFORM_COLORS = {
    'all':          { bg: '#1a1060', border: '#818cf8', icon: '#a5b4fc' },
    'facebook':     { bg: '#0a3580', border: '#4a9aff', icon: '#60aaff' },
    'instagram':    { bg: '#6b0f3a', border: '#f472b6', icon: '#f9a8d4' },
    'twitter':      { bg: '#063b5c', border: '#38bdf8', icon: '#7dd3fc' },
    'pinterest':    { bg: '#7a0a14', border: '#f87171', icon: '#fca5a5' },
    'tiktok':       { bg: '#3a0a3a', border: '#e879f9', icon: '#f0abfc' },
    'youtube':      { bg: '#7a0a0a', border: '#f87171', icon: '#fca5a5' },
    'threads':      { bg: '#222222', border: '#d1d5db', icon: '#f9fafb' },
    'reddit':       { bg: '#7a2400', border: '#fb923c', icon: '#fdba74' },
    'quora':        { bg: '#6b0a0a', border: '#f87171', icon: '#fca5a5' },
    'truth social': { bg: '#0a2a5c', border: '#60a5fa', icon: '#93c5fd' },
    'tumblr':       { bg: '#0a1a40', border: '#67e8f9', icon: '#a5f3fc' },
    'bereal':       { bg: '#1a1a1a', border: '#e5e7eb', icon: '#ffffff' },
    'bluesky':      { bg: '#063a80', border: '#38bdf8', icon: '#7dd3fc' },
    'kaskus':       { bg: '#6b0a0a', border: '#ef4444', icon: '#fca5a5' },
    'tokopedia':    { bg: '#064a14', border: '#4ade80', icon: '#86efac' },
    'sharechat':    { bg: '#7a2d00', border: '#fb923c', icon: '#fdba74' },
  };

  const LANGUAGE_GROUP_COLORS = {
    'english':    { bg: '#062038', border: '#3b82f6', icon: '#60a5fa', flag: '🇬🇧', label: 'English' },
    'urdu-hindi': { bg: '#1a0830', border: '#a855f7', icon: '#c084fc', flag: '🇵🇰🇮🇳', label: 'Urdu + Hindi' },
    'indonesian': { bg: '#052210', border: '#22c55e', icon: '#4ade80', flag: '🇮🇩', label: 'Indonesian' },
  };

  const getPlatformIcon = (platform) => {
    const key = platform ? platform.toLowerCase() : 'all';
    const color = PLATFORM_COLORS[key]?.icon || 'var(--accent-purple)';
    if (!platform) return <Globe size={18} color={color} />;
    switch (platform.toLowerCase()) {
      case 'facebook': return <Facebook size={18} color={color} />;
      case 'instagram': return <Instagram size={18} color={color} />;
      case 'twitter': return <Twitter size={18} color={color} />;
      case 'pinterest': return <Compass size={18} color={color} />;
      case 'tiktok': return <Music size={18} color={color} />;
      case 'youtube': return <Play size={18} color={color} />;
      case 'threads': return <AtSign size={18} color={color} />;
      case 'reddit': return <Hash size={18} color={color} />;
      case 'quora': return <BookOpen size={18} color={color} />;
      case 'truth social': return <Flag size={18} color={color} />;
      case 'tumblr':        return <BookMarked size={18} color={color} />;
      case 'bereal':        return <Camera size={18} color={color} />;
      case 'bluesky':       return <Wind size={18} color={color} />;
      case 'kaskus':        return <MessageSquare size={18} color={color} />;
      case 'tokopedia':     return <ShoppingBag size={18} color={color} />;
      case 'sharechat':     return <Share2 size={18} color={color} />;
      default: return <Globe size={18} color={color} />;
    }
  };

  const handleBulkLoginImport = async () => {
    if (filterPlatform === 'all') {
      alert("⚠️ ACTION REQUIRED: Please select a specific social group (e.g., Facebook) before using Bulk Login so your accounts are correctly categorized.");
      setShowBulkLoginModal(false);
      return;
    }
    const lines = bulkLoginText.split('\n');
    setIsAiLoading(true);
    let successCount = 0;
    try {
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const [email, password] = line.split(':');
        if (!email || !password) continue;

        const baseName = await window.electron.generateEuropeanName();
        const profileName = `${baseName} ${String(i + 1).padStart(2, '0')}`;
        
        const fingerprint = await window.electron.generateFingerprint('random');
        
        const profile = { 
          id: `${Date.now()}-${i}`, 
          name: profileName, 
          platform: filterPlatform, 
          proxy: {}, // Default to no proxy, user can add later
          device: fingerprint, 
          email,
          password,
          status: 'idle' 
        };
        await window.electron.createProfile(profile);
        successCount++;
      }
      if (successCount > 0) alert(`✅ SUCCESS: ${successCount} profiles created for ${filterPlatform.toUpperCase()}.`);
    } catch (err) { 
      console.error(err); 
      alert("❌ ERROR: Profile creation failed. Please check your data format.");
    }
    finally {
      // BUG #5 FIX: isAiLoading reset karna bhool gaye tha, ab dono states reset hongi
      setIsAiLoading(false);
      setIsCreatingProfile(false);
      setShowBulkLoginModal(false);
      setBulkLoginText('');
      fetchProfiles();
    }
  };

  const launchProfile = (profile) => window.electron.launchProfile(profile);
  const stopProfile = (profileId) => window.electron.stopProfile(profileId);

  const [saveStatus, setSaveStatus] = useState('');

  const handleSaveSettings = async () => {
    try {
      const promises = Object.entries(settings).map(([key, value]) => 
        window.electron.updateSetting(key, value)
      );
      await Promise.all(promises);
      
      setSaveStatus('Saved!');
      setTimeout(() => setSaveStatus(''), 2000);
    } catch (err) {
      setSaveStatus('Failed to save');
      console.error(err);
    }
  };

  return (
    <div className="app-container">
      <div className="sidebar">
        <div className="logo">
          <div className="logo-icon"><Zap size={20} fill="white" /></div>
          <span>PHANTOM SWARM</span>
        </div>
        <div className="nav-links">
          <div className={`nav-item ${activeTab === 'profiles' ? 'active' : ''}`} onClick={() => setActiveTab('profiles')}><Layers size={20} /> Profiles</div>
          <div className={`nav-item ${activeTab === 'proxies' ? 'active' : ''}`} onClick={() => setActiveTab('proxies')}><Globe size={20} /> Proxies</div>
          <div className={`nav-item ${activeTab === 'devices' ? 'active' : ''}`} onClick={() => setActiveTab('devices')}><Monitor size={20} /> Devices</div>
          <div className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}><Settings size={20} /> Settings</div>
        </div>
      </div>

      <div className="main-content">
        {updateStatus && (updateStatus.status === 'downloaded' || updateStatus.status === 'downloading' || updateStatus.status === 'available') && (
          <div style={{
            background: updateStatus.status === 'downloaded' ? 'linear-gradient(90deg, #ff0050, #7928ca)' : 'rgba(255, 0, 80, 0.15)',
            border: '1px solid var(--primary)',
            borderRadius: '12px',
            padding: '12px 20px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justify: 'space-between',
            gap: '15px',
            boxShadow: '0 4px 15px rgba(255, 0, 80, 0.2)'
          }}>
            <div style={{display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', fontWeight: 'bold', color: 'white'}}>
              <Zap size={18} color="var(--primary-bright)" />
              <span>{updateStatus.message}</span>
            </div>
            {updateStatus.status === 'downloaded' && (
              <button 
                className="btn btn-primary" 
                style={{background: 'white', color: 'black', fontWeight: 'bold', border: 'none', padding: '6px 14px', fontSize: '0.8rem'}}
                onClick={() => window.electron.restartAndInstall()}
              >
                🔄 Restart & Install Now
              </button>
            )}
          </div>
        )}
        {activeTab === 'profiles' && (
          <>
            <div className="header">
              <div><h1>Profiles</h1><p style={{color: 'var(--text-dim)', fontSize: '0.8rem'}}>Manage and automate social accounts</p></div>
              <div style={{display: 'flex', gap: '12px'}}>
                <button className="btn btn-secondary" onClick={handleRenameAll} title="Rename all to European Names"><RefreshCw size={16} /> Rename All</button>
                <button className="btn btn-primary" onClick={handleOpenProfileModal}><Plus size={16} /> Add Profile</button>
              </div>
            </div>

            {selectedIds.length > 0 && (
              <div style={{background: 'rgba(255, 0, 80, 0.1)', padding: '15px 25px', borderRadius: '18px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--primary)'}}>
                <div style={{fontWeight: '800'}}>{selectedIds.length} / {filteredProfiles.length} Selected</div>
                <div style={{display: 'flex', gap: '12px'}}>
                  <button className="btn btn-secondary" onClick={() => setSelectedIds(filteredProfiles.map(p => p.id))}>
                    ✅ Select All
                  </button>
                  <button className="btn btn-secondary" onClick={() => setSelectedIds([])}>Cancel</button>
                  <button className="btn btn-secondary" style={{borderColor: 'var(--primary)', color: 'var(--primary-bright)'}} onClick={() => setShowBulkEditModal(true)}>
                    ✏️ Edit Selected
                  </button>
                  <button className="btn btn-primary" onClick={() => {
                    selectedIds.forEach(id => {
                      const profile = profiles.find(p => p.id === id);
                      if (profile && profile.status !== 'running') launchProfile(profile);
                    });
                    setSelectedIds([]);
                  }}>🚀 Run Selected</button>
                  <button className="btn btn-secondary" style={{color: 'var(--danger)', borderColor: 'var(--danger)'}} onClick={() => {
                    selectedIds.forEach(id => {
                      const profile = profiles.find(p => p.id === id);
                      if (profile && profile.status === 'running') stopProfile(id);
                    });
                    setSelectedIds([]);
                  }}>🛑 Stop Selected</button>
                  <button className="btn btn-primary" style={{background: 'var(--danger)'}} onClick={async () => {
                    if(confirm(`Delete ${selectedIds.length} selected profiles?`)) {
                      await window.electron.deleteProfilesByIds(selectedIds);
                      setSelectedIds([]);
                      fetchProfiles();
                    }
                  }}>🗑️ Delete Selected</button>
                </div>
              </div>
            )}

            <div className="group-grid">
              {/* All Groups Card */}
              <div
                className={`group-card ${filterPlatform === 'all' ? 'active' : ''}`}
                onClick={() => setFilterPlatform('all')}
                style={{
                  background: PLATFORM_COLORS['all'].bg,
                  borderColor: filterPlatform === 'all' ? PLATFORM_COLORS['all'].border : `${PLATFORM_COLORS['all'].border}55`,
                  boxShadow: filterPlatform === 'all' ? `0 0 20px ${PLATFORM_COLORS['all'].border}55` : 'none',
                }}
              >
                <div className="group-card-header">
                  <LayoutGrid size={20} color={PLATFORM_COLORS['all'].icon} />
                  <span className="group-card-count">{profiles.length}</span>
                </div>
                <div className="group-card-label">All Groups</div>
              </div>

              {/* Platform Cards */}
              {['Facebook', 'Instagram', 'Twitter', 'Pinterest', 'TikTok', 'YouTube', 'Threads', 'Reddit', 'Quora', 'Truth Social', 'Tumblr', 'BeReal', 'Bluesky', 'Kaskus', 'Tokopedia', 'ShareChat'].map(platform => {
                const count = profiles.filter(p => p && p.platform && p.platform.toLowerCase() === platform.toLowerCase()).length;
                const pKey = platform.toLowerCase();
                const pColor = PLATFORM_COLORS[pKey] || { bg: '#0c0e27', border: '#6366f1', icon: '#818cf8' };
                const isActive = filterPlatform === pKey;
                return (
                  <div
                    key={platform}
                    className={`group-card ${isActive ? 'active' : ''}`}
                    onClick={() => setFilterPlatform(pKey)}
                    style={{
                      background: pColor.bg,
                      borderColor: isActive ? pColor.border : `${pColor.border}55`,
                      boxShadow: isActive ? `0 0 22px ${pColor.border}60` : 'none',
                    }}
                  >
                    <div className="group-card-header">
                      {getPlatformIcon(platform)}
                      <span className="group-card-count">{count}</span>
                    </div>
                    <div className="group-card-label" style={{ color: '#ffffff' }}>{platform}</div>
                    <div style={{fontSize:'0.62rem', color:'rgba(255,255,255,0.5)', marginTop:'3px', lineHeight:'1.5'}}>
                      {PLATFORM_INFO[platform.toLowerCase()]?.flag} {PLATFORM_INFO[platform.toLowerCase()]?.country}
                      {PLATFORM_INFO[platform.toLowerCase()]?.localLang && (
                        <span style={{display:'block', color: pColor.border, fontSize:'0.57rem'}}>
                          {PLATFORM_INFO[platform.toLowerCase()]?.localLang}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 🌐 Language Groups Row */}
            <div style={{ marginTop: '20px', marginBottom: '8px' }}>
              <div style={{ fontSize: '0.62rem', fontWeight: '800', color: 'var(--text-muted)', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Globe size={11} /> Language Groups
              </div>
              <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                {Object.entries(LANGUAGE_GROUP_COLORS).map(([key, lc]) => {
                  const langProfiles = (Array.isArray(profiles) ? profiles : []).filter(p => p && matchesLangGroup(p, key));
                  const count = langProfiles.length;
                  const isActive = filterPlatform === key;
                  // Per-platform breakdown
                  const platformBreakdown = ['Facebook','Instagram','Twitter','TikTok','YouTube','Pinterest','Threads','Reddit','Quora','Truth Social','Tumblr','BeReal','Bluesky','Kaskus','Tokopedia','ShareChat']
                    .map(plat => ({ plat, c: langProfiles.filter(p => (p.platform||'').toLowerCase() === plat.toLowerCase()).length }))
                    .filter(x => x.c > 0);
                  return (
                    <div
                      key={key}
                      className={`group-card ${isActive ? 'active' : ''}`}
                      onClick={() => setFilterPlatform(key)}
                      style={{
                        background: lc.bg,
                        borderColor: isActive ? lc.border : `${lc.border}55`,
                        boxShadow: isActive ? `0 0 24px ${lc.border}70` : 'none',
                        minWidth: '150px', flex: '1', maxWidth: '220px',
                      }}
                    >
                      <div className="group-card-header">
                        <span style={{ fontSize: '1.3rem' }}>{lc.flag}</span>
                        <span className="group-card-count" style={{ color: lc.icon, fontSize: '1.4rem' }}>{count}</span>
                      </div>
                      <div className="group-card-label" style={{ color: '#ffffff', fontWeight: '800' }}>{lc.label}</div>
                      <div style={{ marginTop: '6px', display: 'flex', flexWrap: 'wrap', gap: '3px' }}>
                        {platformBreakdown.length === 0
                          ? <span style={{ fontSize: '0.58rem', color: 'rgba(255,255,255,0.3)' }}>No profiles</span>
                          : platformBreakdown.map(({ plat, c }) => (
                            <span key={plat} style={{
                              fontSize: '0.58rem', fontWeight: '700',
                              background: `${lc.border}22`, border: `1px solid ${lc.border}55`,
                              color: lc.icon, borderRadius: '4px', padding: '1px 5px'
                            }}>
                              {plat.substring(0,2).toUpperCase()}: {c}
                            </span>
                          ))
                        }
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="stats-grid">
              <div className="stat-card"><div className="stat-label">Total Profiles</div><div className="stat-value">{profiles.length}</div></div>
              <div className="stat-card"><div className="stat-label">Active</div><div className="stat-value">{profiles.filter(p => p.status === 'running').length}</div></div>
              <div className="stat-card"><div className="stat-label">Queued</div><div className="stat-value">{profiles.filter(p => p.status === 'launching').length}</div></div>
            </div>
            
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', padding: '10px 0', borderBottom: '1px solid var(--border)'}}>
              <div style={{display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap'}}>
                <h2 style={{fontSize: '1rem', textTransform: 'capitalize'}}>
                  {LANG_GROUP_KEYS.includes(filterPlatform)
                    ? `${LANGUAGE_GROUP_COLORS[filterPlatform]?.flag} ${LANGUAGE_GROUP_COLORS[filterPlatform]?.label} Group`
                    : `${filterPlatform} Group`}
                </h2>
                <span className="chip" style={{background: 'var(--primary)', color: 'white'}}>{filteredProfiles.length} Profiles</span>
                {LANG_GROUP_KEYS.includes(filterPlatform) && (() => {
                  const lc = LANGUAGE_GROUP_COLORS[filterPlatform];
                  return ['Facebook','Instagram','Twitter','TikTok','YouTube','Pinterest','Threads','Reddit','Quora','Truth Social','Tumblr','BeReal','Bluesky','Kaskus','Tokopedia','ShareChat'].map(plat => {
                    const pCount = filteredProfiles.filter(p => (p.platform||'').toLowerCase() === plat.toLowerCase()).length;
                    if (!pCount) return null;
                    const pColor = PLATFORM_COLORS[plat.toLowerCase()];
                    return (
                      <span key={plat} style={{
                        display: 'inline-flex', alignItems: 'center', gap: '4px',
                        background: pColor ? pColor.bg : '#111',
                        border: `1px solid ${pColor ? pColor.border : '#6366f1'}`,
                        color: pColor ? pColor.icon : '#818cf8',
                        borderRadius: '6px', padding: '2px 8px',
                        fontSize: '0.65rem', fontWeight: '800'
                      }}>
                        {getPlatformIcon(plat)} {plat}: {pCount}
                      </span>
                    );
                  });
                })()}
              </div>

              <div style={{display: 'flex', gap: '8px'}}>
                {filterPlatform !== 'all' && (
                  <>
                    <button className="btn btn-secondary" style={{color: 'var(--danger)', borderColor: 'var(--danger)', padding: '6px 12px'}} onClick={async () => {
                      if(confirm(`WARNING: Delete ALL ${filterPlatform.toUpperCase()} profiles?`)) {
                        if(confirm("Are you absolutely sure? This cannot be undone.")) {
                          await window.electron.deleteProfilesBulk(filterPlatform);
                          fetchProfiles();
                        }
                      }
                    }}><Trash2 size={14} /> Delete Group</button>
                    <button className="btn btn-secondary" style={{padding: '6px 12px'}}
                      onClick={() => {
                        const allIds = filteredProfiles.map(p => p.id);
                        const allSelected = allIds.every(id => selectedIds.includes(id));
                        setSelectedIds(allSelected ? [] : allIds);
                      }}
                    >
                      {filteredProfiles.every(p => selectedIds.includes(p.id)) && filteredProfiles.length > 0 ? '☑ Deselect All' : '☐ Select All'}
                    </button>
                    <button className="btn btn-secondary" style={{padding: '6px 12px'}} onClick={() => setShowBulkLoginModal(true)}>
                      <LogIn size={14} /> Bulk Login
                    </button>
                    <button className="btn btn-primary" style={{padding: '6px 12px'}} onClick={() => {
                      setNewProfile(p => ({...p, platform: filterPlatform}));
                      setShowProfileModal(true);
                    }}>
                      <Plus size={14} /> Add Profile
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="profile-grid">
              {filteredProfiles.map((profile, idx) => {
                // Per-platform numbering inside language groups
                let numBadge;
                if (LANG_GROUP_KEYS.includes(filterPlatform)) {
                  const samePlat = filteredProfiles.filter(p => (p.platform||'').toLowerCase() === (profile.platform||'').toLowerCase());
                  const platIdx = samePlat.indexOf(profile) + 1;
                  const platPrefix = (profile.platform || '?').substring(0,2).toUpperCase();
                  numBadge = `${platPrefix}#${String(platIdx).padStart(3,'0')}`;
                } else {
                  numBadge = `#${String(idx + 1).padStart(3, '0')}`;
                }
                return (
                <div key={profile.id} className="profile-card" style={{position: 'relative', border: selectedIds.includes(profile.id) ? '2px solid var(--primary)' : '2px solid var(--border)'}}>
                  <div style={{position: 'absolute', top: '15px', left: '15px', zIndex: 10}}>
                    <input type="checkbox" checked={selectedIds.includes(profile.id)} 
                      onClick={(e) => {
                        e.stopPropagation(); // ✅ Yeh prevent karega accidental launch
                      }}
                      onChange={(e) => {
                        if(e.target.checked) setSelectedIds([...selectedIds, profile.id]);
                        else setSelectedIds(selectedIds.filter(id => id !== profile.id));
                      }} style={{width: '20px', height: '20px', cursor: 'pointer', accentColor: 'var(--primary)'}} />
                  </div>
                  <div style={{position: 'absolute', top: '15px', right: '75px', fontSize: '0.65rem', fontWeight: '900', color: 'var(--primary-bright)', background: 'rgba(0,0,0,0.5)', padding: '2px 6px', borderRadius: '4px'}}>
                    {numBadge}
                  </div>

                  <button onClick={(e) => {
                    e.stopPropagation();
                    handleOpenEditModal(profile);
                  }} style={{position: 'absolute', top: '15px', right: '45px', background: 'none', border: 'none', color: 'var(--neon-cyan)', cursor: 'pointer', zIndex: 10}} title="Edit Profile">
                    <Edit size={17} />
                  </button>
                  <button onClick={async (e) => { 
                    e.stopPropagation(); 
                    if(confirm(`Delete profile "${profile.name}"?`)) {
                      await window.electron.deleteProfile(profile.id);
                      fetchProfiles();
                    }
                  }} style={{position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', zIndex: 10}}>
                    <Trash2 size={18} />
                  </button>
                  <div className={`status-badge status-${profile.status || 'idle'}`}>{profile.status || 'idle'}</div>
                  <div style={{display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px'}}>
                    {getPlatformIcon(profile.platform)}
                    <div style={{display:'flex', alignItems:'center', gap:'6px', overflow:'hidden'}}>
                      <span style={{
                        fontSize: '0.7rem', fontWeight: '900', color: 'var(--primary-bright)',
                        background: 'rgba(255,0,80,0.15)', border: '1px solid rgba(255,0,80,0.3)',
                        borderRadius: '6px', padding: '1px 7px', flexShrink: 0
                      }}>{idx + 1}</span>
                      <h3 className="profile-name" style={{margin:0}}>{profile.name}</h3>
                    </div>
                  </div>
                  <div style={{display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap'}}>
                    <span className="chip">{profile.platform || 'Unknown'}</span>
                    <span className="chip" style={{color: profile.action === 'signup' ? 'var(--neon-pink)' : 'var(--neon-cyan)'}}>
                      {profile.action === 'signup' ? '📝 Sign Up' : '🔑 Sign In'}
                    </span>
                    <span className="chip">
                      {profile.device?.viewMode === 'desktop' || profile.viewMode === 'desktop' ? '🖥️ Desktop' : '📱 Mobile'}
                    </span>
                    <span className="chip">
                    <Fingerprint size={10} /> {profile.device?.name ? profile.device.name.split(' ')[0] : 'Generic'}
                  </span>
                  {PLATFORM_INFO[profile.platform?.toLowerCase()] && (
                    <span className="chip" style={{fontSize:'0.6rem', opacity:0.85}}>
                      {PLATFORM_INFO[profile.platform?.toLowerCase()]?.flag} {PLATFORM_INFO[profile.platform?.toLowerCase()]?.country}
                    </span>
                  )}
                  {profile.postLanguage && profile.postLanguage !== 'english' && (
                    <span className="chip" style={{color:'var(--primary-bright)', fontSize:'0.6rem'}}>
                      🌐 {profile.postLanguage === 'local'
                        ? (PLATFORM_INFO[profile.platform?.toLowerCase()]?.localLang || 'Local')
                        : 'Bilingual'}
                    </span>
                  )}
                </div>
                  <div className="info-row" style={{justifyContent: 'space-between'}}>
                    <div style={{display: 'flex', alignItems: 'center', gap: '6px'}}>
                      <Globe size={14} /> {profile.proxy?.host ? `${profile.proxy.host}:${profile.proxy.port}` : 'No Proxy'}
                    </div>
                    {(profile.platform?.toLowerCase() === 'tiktok') && profile.status === 'running' && (
                      <button 
                        className="btn btn-primary" 
                        style={{padding: '4px 10px', fontSize: '0.6rem', background: 'var(--primary-bright)', color: 'black'}}
                        onClick={async (e) => {
                          e.stopPropagation();
                          const res = await window.electron.useTiktokSound(profile.id);
                          if (!res.success) alert(res.message);
                        }}
                      >
                        🎵 Use Sound
                      </button>
                    )}
                  </div>
                  {profile.status === 'running' ? (
                    <button className="btn btn-secondary" style={{width: '100%', color: 'var(--danger)', borderColor: 'var(--danger)'}} onClick={(e) => { e.stopPropagation(); stopProfile(profile.id); }}>🛑 Stop Session</button>
                  ) : (
                    <button className="btn btn-primary" style={{width: '100%'}} onClick={(e) => { e.stopPropagation(); launchProfile(profile); }}>Launch Session</button>
                  )}
                </div>
              );})}
              {filteredProfiles.length === 0 && <div className="empty-state" style={{gridColumn: '1/-1'}}><Search size={48} /><p>No profiles found for this category</p></div>}

            </div>
          </>
        )}

        {activeTab === 'proxies' && (
          <>
            <div className="header">
              <div><h1>Proxy Manager</h1><p style={{color: 'var(--text-dim)', fontSize: '0.8rem'}}>Manage your IP pool with bulk import support</p></div>
              <div style={{display: 'flex', gap: '12px'}}>
                <button className="btn btn-secondary" onClick={() => setShowBulkProxyModal(true)}><Upload size={16} /> Bulk Import</button>
                <button className="btn btn-primary" onClick={() => setShowProxyModal(true)}><Plus size={16} /> Add Single</button>
              </div>
            </div>
            <div className="profile-grid">
              {proxies.map(proxy => (
                <div key={proxy.id} className="profile-card" style={{position: 'relative'}}>
                  <button onClick={(e) => { e.stopPropagation(); handleDeleteProxy(proxy.id); }} style={{position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer'}}><X size={18} /></button>
                  <div style={{color: 'var(--primary-bright)', marginBottom: '12px'}}><Shield size={24} /></div>
                  <h3 className="profile-name">{proxy.host}:{proxy.port}</h3>
                  <div className="info-row" style={{marginTop: '12px'}}>Auth: {proxy.username ? proxy.username : 'None'}</div>
                </div>
              ))}
              {proxies.length === 0 && <div className="empty-state"><Globe size={48} /><p>No proxies saved</p></div>}
            </div>
          </>
        )}

        {activeTab === 'devices' && (
          <>
            <div className="header">
              <div><h1>Device Templates</h1><p style={{color: 'var(--text-dim)', fontSize: '0.85rem', marginTop: '4px'}}>{deviceTemplates.length} static mobile configurations</p></div>
              <input placeholder="Search devices..." value={deviceSearch} onChange={e => setDeviceSearch(e.target.value)} style={{maxWidth: '300px', margin: 0}} />
            </div>
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px',
              maxHeight: 'calc(100vh - 200px)', overflowY: 'auto', paddingRight: '10px'
            }}>
              {deviceTemplates.filter(d => d.name.toLowerCase().includes(deviceSearch.toLowerCase())).map((device, idx) => (
                <div key={idx} style={{
                  background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px',
                  padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px',
                  transition: 'all 0.25s ease', cursor: 'default'
                }} onMouseOver={e => {
                  e.currentTarget.style.borderColor = 'var(--accent-purple)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(124, 58, 237, 0.25)';
                }} onMouseOut={e => {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.boxShadow = 'none';
                }}>
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                    <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                      <Smartphone size={16} color="var(--accent-purple)" />
                      <span style={{fontSize: '0.9rem', fontWeight: '800', color: '#ffffff'}}>{device.name}</span>
                    </div>
                  </div>
                  <div style={{fontSize: '0.75rem', color: 'var(--text-dim)', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                    <span style={{fontWeight: '600'}}>{device.platform}</span>
                    <span style={{background: 'rgba(99, 102, 241, 0.15)', padding: '4px 10px', borderRadius: '8px', color: 'var(--accent-lime)', fontWeight: 'bold'}}>
                      {device.width}x{device.height}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {activeTab === 'settings' && (
          <div style={{maxWidth: '600px'}}>
            <h1>Settings</h1>
            <div className="stat-card" style={{marginTop: '24px', padding: '32px'}}>
              <label>Concurrency Limit</label><input type="number" value={settings.concurrency} onChange={e => setSettings({...settings, concurrency: e.target.value})} />
              <label>Gemini API Key</label><input type="password" value={settings.geminiKey} onChange={e => setSettings({...settings, geminiKey: e.target.value})} />
              <div style={{display: 'flex', alignItems: 'center', gap: '15px', marginTop: '24px'}}>
                <button className="btn btn-primary" style={{flex: 1}} onClick={handleSaveSettings}><Save size={18} /> Save Settings</button>
                {saveStatus && <span className="save-toast" style={{color: 'var(--primary-bright)', fontWeight: 'bold'}}>{saveStatus}</span>}
              </div>

              <div style={{marginTop: '32px', paddingTop: '24px', borderTop: '1px solid var(--border)'}}>
                <h3 style={{fontSize: '1.1rem', marginBottom: '8px'}}>🔄 Software Updates</h3>
                <p style={{fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '16px'}}>
                  Current Installed Version: <b style={{color: 'var(--accent-lime)'}}>v{currentAppVersion}</b>
                </p>
                <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                  <button 
                    className="btn btn-secondary" 
                    onClick={() => {
                      setUpdateStatus({ status: 'checking', message: 'Checking for updates...' });
                      window.electron.checkForUpdates();
                    }}
                  >
                    <RefreshCw size={16} /> Check for Updates
                  </button>
                  {updateStatus?.status === 'downloaded' && (
                    <button 
                      className="btn btn-primary" 
                      onClick={() => window.electron.restartAndInstall()}
                    >
                      🚀 Install & Restart Now
                    </button>
                  )}
                </div>
                {updateStatus && (
                  <div style={{
                    marginTop: '14px', 
                    padding: '12px 16px', 
                    background: 'rgba(255,255,255,0.03)', 
                    border: '1px solid var(--border)', 
                    borderRadius: '8px', 
                    fontSize: '0.8rem',
                    color: updateStatus.status === 'error' ? 'var(--danger)' : 'var(--text-main)'
                  }}>
                    {updateStatus.message}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {showBulkLoginModal && (
        <div className="modal-overlay">
          <div className="modal" style={{width: '500px'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
              <h2 style={{textTransform: 'capitalize'}}>{filterPlatform} Bulk Login</h2>
              <button onClick={() => setShowBulkLoginModal(false)} style={{background: 'none', border: 'none', color: 'white'}}><X size={24} /></button>
            </div>
            <p style={{fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '15px'}}>
              Paste your accounts below. Format: <b>email:password</b> (one per line)
            </p>
            <textarea 
              value={bulkLoginText}
              onChange={e => setBulkLoginText(e.target.value)}
              placeholder="user1@gmail.com:pass123&#10;user2@gmail.com:pass456"
              style={{
                width: '100%', height: '200px', background: '#111', border: '1px solid var(--border)', 
                borderRadius: '10px', color: 'white', padding: '15px', fontFamily: 'monospace', fontSize: '0.8rem',
                marginBottom: '20px'
              }}
            />
            <div style={{display: 'flex', gap: '12px'}}>
              <button className="btn btn-secondary" style={{flex: 1}} onClick={() => setShowBulkLoginModal(false)}>Cancel</button>
              <button className="btn btn-primary" style={{flex: 1}} onClick={handleBulkLoginImport}>Import & Create</button>
            </div>
          </div>
        </div>
      )}


      {showProfileModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'20px'}}>
              <h2 style={{textTransform:'capitalize'}}>{newProfile.platform} — New Profile</h2>
              <button onClick={() => setShowProfileModal(false)} style={{background:'none',border:'none',color:'white'}}><X size={22}/></button>
            </div>
            <label>Profile Name</label>
            <div style={{display:'flex',gap:'8px'}}>
              <input placeholder="Profile Name" value={newProfile.name} onChange={e => setNewProfile({...newProfile,name:e.target.value})} />
              <button className="btn btn-secondary" style={{marginBottom:'20px'}} onClick={async()=>setNewProfile({...newProfile,name:await window.electron.generateEuropeanName()})}><RefreshCw size={16}/></button>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px'}}>
              <div><label>Platform</label>
                <select value={newProfile.platform} onChange={e=>setNewProfile({...newProfile,platform:e.target.value})}>
                  <option value="facebook">Facebook</option>
                  <option value="instagram">Instagram</option>
                  <option value="twitter">X / Twitter</option>
                  <option value="tiktok">TikTok</option>
                  <option value="youtube">YouTube</option>
                  <option value="pinterest">Pinterest</option>
                  <option value="threads">Threads</option>
                  <option value="reddit">Reddit</option>
                  <option value="quora">Quora</option>
                  <option value="truth social">Truth Social</option>
                  <option value="tumblr">Tumblr 🇺🇸</option>
                  <option value="bereal">BeReal 🇫🇷 — Français</option>
                  <option value="bluesky">Bluesky 🇺🇸</option>
                  <option value="kaskus">Kaskus 🇮🇩 — Bahasa Indonesia</option>
                  <option value="tokopedia">Tokopedia 🇮🇩 — Bahasa Indonesia</option>
                  <option value="sharechat">ShareChat 🇮🇳 — हिंदी / Regional</option>
                </select>
              </div>
              <div><label>Device Template</label>
                <select value={newProfile.deviceTemplate} onChange={e=>setNewProfile({...newProfile,deviceTemplate:e.target.value})}>
                  <option value="random">🎲 Random / Auto-Select</option>
                  {deviceTemplates.map((d,i)=><option key={i} value={d.name}>{d.name}</option>)}
                </select>
              </div>
            </div>

            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px', marginTop: '12px'}}>
              <div><label>Action / Mode</label>
                <select value={newProfile.action} onChange={e=>setNewProfile({...newProfile,action:e.target.value})}>
                  <option value="signin">🔑 Sign In (Login Mode)</option>
                  <option value="signup">📝 Sign Up (Register Mode)</option>
                </select>
              </div>
              <div><label>View Mode</label>
                <select value={newProfile.viewMode} onChange={e=>setNewProfile({...newProfile,viewMode:e.target.value})}>
                  <option value="mobile">📱 Mobile View (Emulation)</option>
                  <option value="desktop">🖥️ Desktop Mode (Full Screen)</option>
                </select>
              </div>
            </div>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginTop:'12px'}}>
              <div>
                <label>Platform Region</label>
                <div style={{padding:'10px 14px', background:'rgba(255,255,255,0.04)', border:'1px solid var(--border)', borderRadius:'10px', fontSize:'0.8rem', color:'var(--text-dim)', minHeight:'40px', display:'flex', alignItems:'center', gap:'6px'}}>
                  <span style={{fontSize:'1rem'}}>{PLATFORM_INFO[newProfile.platform]?.flag}</span>
                  <span>{PLATFORM_INFO[newProfile.platform]?.country}</span>
                  <span style={{opacity:0.4}}>|</span>
                  <span>{PLATFORM_INFO[newProfile.platform]?.language}</span>
                  {PLATFORM_INFO[newProfile.platform]?.localLang && (
                    <span style={{color:'var(--primary-bright)', fontSize:'0.7rem'}}>+ {PLATFORM_INFO[newProfile.platform]?.localLang}</span>
                  )}
                </div>
              </div>
              <div>
                <label>Post Language</label>
                <select value={newProfile.postLanguage} onChange={e=>setNewProfile({...newProfile, postLanguage:e.target.value})}>
                  <option value="english">🌐 English</option>
                  {PLATFORM_INFO[newProfile.platform]?.localLang && (
                    <option value="local">{PLATFORM_INFO[newProfile.platform]?.flag} {PLATFORM_INFO[newProfile.platform]?.localLang} (Local)</option>
                  )}
                  <option value="bilingual">🔀 Bilingual (English + Local)</option>
                </select>
              </div>
            </div>
            <div style={{marginTop:'20px'}}>
              <label>Quantity (1–100)</label>
              <div style={{display:'flex',alignItems:'center',gap:'15px'}}>
                <input type="range" min="1" max="100" value={newProfile.count} onChange={e=>setNewProfile({...newProfile,count:parseInt(e.target.value)})} style={{flex:1,margin:0}}/>
                <div style={{width:'50px',textAlign:'center',background:'var(--primary)',color:'white',padding:'8px',borderRadius:'10px',fontWeight:'bold'}}>{newProfile.count}</div>
              </div>
            </div>
            <div style={{marginTop:'16px', padding:'14px', background:'rgba(255,0,80,0.05)', border:'1px solid rgba(255,0,80,0.2)', borderRadius:'12px'}}>
              <label style={{color:'var(--primary)', fontWeight:'bold', fontSize:'0.75rem', marginBottom:'10px', display:'block'}}>🔑 Auto-Login Credentials (Optional)</label>
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px'}}>
                <div>
                  <label style={{fontSize:'0.72rem'}}>Email / Username</label>
                  <input 
                    placeholder="email@gmail.com" 
                    value={newProfile.email} 
                    onChange={e => setNewProfile({...newProfile, email: e.target.value})}
                    style={{marginBottom:0}}
                  />
                </div>
                <div>
                  <label style={{fontSize:'0.72rem'}}>Password</label>
                  <input 
                    type="password"
                    placeholder="password" 
                    value={newProfile.password} 
                    onChange={e => setNewProfile({...newProfile, password: e.target.value})}
                    style={{marginBottom:0}}
                  />
                </div>
              </div>
              <div style={{fontSize:'0.68rem', color:'var(--text-dim)', marginTop:'8px'}}>
                ✅ Session & cookies auto-saved. Login once, stays logged in forever.
              </div>
            </div>
            <label style={{marginTop:'16px'}}>Proxy</label>
            <div style={{display:'flex',gap:'8px',marginBottom:'12px'}}>
              <button className={`btn ${newProfile.proxyMode==='saved'?'btn-primary':'btn-secondary'}`} style={{flex:1}} onClick={()=>setNewProfile({...newProfile,proxyMode:'saved'})}>Saved</button>
              <button className={`btn ${newProfile.proxyMode==='manual'?'btn-primary':'btn-secondary'}`} style={{flex:1}} onClick={()=>setNewProfile({...newProfile,proxyMode:'manual'})}>Manual</button>
            </div>
            {newProfile.proxyMode==='saved'
              ?<select value={newProfile.proxyId} onChange={e=>setNewProfile({...newProfile,proxyId:e.target.value})}><option value="">No Proxy</option>{proxies.map(p=><option key={p.id} value={p.id}>{p.host}:{p.port}</option>)}</select>
              :<input placeholder="host:port:user:pass" onChange={e=>setNewProfile({...newProfile,manualProxy:parseProxyLine(e.target.value)||{}})}/>
            }
            <div style={{display:'flex',gap:'12px',marginTop:'16px'}}>
              <button className="btn btn-secondary" style={{flex:1}} onClick={()=>setShowProfileModal(false)}>Cancel</button>
              <button className="btn btn-primary" style={{flex:2}} onClick={handleCreateProfile}>{isCreatingProfile?<Loader2 size={16} className="animate-spin"/>:'Create'}</button>
            </div>
          </div>
        </div>
      )}

      {showBulkProxyModal && (
        <div className="modal-overlay">
          <div className="modal" style={{width: '600px'}}>
            <h2>Bulk Import</h2>
            <textarea style={{width: '100%', height: '300px', background: 'rgba(0,0,0,0.5)', border: '1px solid var(--border)', borderRadius: '18px', color: 'white', padding: '20px'}} 
              placeholder="host:port:user:pass" value={bulkProxyText} onChange={e => setBulkProxyText(e.target.value)} />
            <div style={{display: 'flex', gap: '12px', marginTop: '24px'}}>
              <button className="btn btn-secondary" style={{flex: 1}} onClick={() => setShowBulkProxyModal(false)}>Cancel</button>
              <button className="btn btn-primary" style={{flex: 2}} onClick={handleBulkProxyAdd}>Import</button>
            </div>
          </div>
        </div>
      )}

      {showProxyModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Add Proxy</h2>
            <input placeholder="host:port:user:pass" onChange={e => setNewProxy(parseProxyLine(e.target.value) || {})} />
            <div style={{display: 'flex', gap: '12px', marginTop: '24px'}}>
              <button className="btn btn-secondary" style={{flex: 1}} onClick={() => setShowProxyModal(false)}>Cancel</button>
              <button className="btn btn-primary" style={{flex: 2}} onClick={handleCreateProxy}>Save</button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && editingProfile && (
        <div className="modal-overlay">
          <div className="modal">
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'20px'}}>
              <h2>✏️ Edit Profile</h2>
              <button onClick={() => setShowEditModal(false)} style={{background:'none',border:'none',color:'white',cursor:'pointer'}}><X size={22}/></button>
            </div>
            
            <label>Profile Name</label>
            <input 
              value={editingProfile.name || ''} 
              onChange={e => setEditingProfile({...editingProfile, name: e.target.value})} 
            />

            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px', marginTop:'12px'}}>
              <div>
                <label>Platform</label>
                <select value={editingProfile.platform || 'facebook'} onChange={e => setEditingProfile({...editingProfile, platform: e.target.value})}>
                  <option value="facebook">Facebook</option>
                  <option value="instagram">Instagram</option>
                  <option value="twitter">X / Twitter</option>
                  <option value="tiktok">TikTok</option>
                  <option value="youtube">YouTube</option>
                  <option value="pinterest">Pinterest</option>
                  <option value="threads">Threads</option>
                  <option value="reddit">Reddit</option>
                  <option value="quora">Quora</option>
                  <option value="truth social">Truth Social</option>
                  <option value="tumblr">Tumblr 🇺🇸</option>
                  <option value="bereal">BeReal 🇫🇷</option>
                  <option value="bluesky">Bluesky 🇺🇸</option>
                  <option value="kaskus">Kaskus 🇮🇩</option>
                  <option value="tokopedia">Tokopedia 🇮🇩</option>
                  <option value="sharechat">ShareChat 🇮🇳</option>
                </select>
              </div>
              <div>
                <label>View Mode</label>
                <select value={editingProfile.viewMode || editingProfile.device?.viewMode || 'mobile'} onChange={e => setEditingProfile({...editingProfile, viewMode: e.target.value, device: {...editingProfile.device, viewMode: e.target.value}})}>
                  <option value="mobile">📱 Mobile View</option>
                  <option value="desktop">🖥️ Desktop Mode</option>
                </select>
              </div>
            </div>

            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px', marginTop:'12px'}}>
              <div>
                <label>Action / Mode</label>
                <select value={editingProfile.action || 'signin'} onChange={e => setEditingProfile({...editingProfile, action: e.target.value})}>
                  <option value="signin">🔑 Sign In (Login)</option>
                  <option value="signup">📝 Sign Up (Register)</option>
                </select>
              </div>
              <div>
                <label>Post Language</label>
                <select value={editingProfile.postLanguage || 'english'} onChange={e => setEditingProfile({...editingProfile, postLanguage: e.target.value})}>
                  <option value="english">🌐 English</option>
                  <option value="local">Local Language</option>
                  <option value="bilingual">🔀 Bilingual</option>
                </select>
              </div>
            </div>

            <div style={{marginTop:'16px', padding:'14px', background:'rgba(255,0,80,0.05)', border:'1px solid rgba(255,0,80,0.2)', borderRadius:'12px'}}>
              <label style={{color:'var(--primary)', fontWeight:'bold', fontSize:'0.75rem', marginBottom:'10px', display:'block'}}>🔑 Account Credentials</label>
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px'}}>
                <div>
                  <label style={{fontSize:'0.72rem'}}>Email / Username</label>
                  <input 
                    value={editingProfile.email || ''} 
                    onChange={e => setEditingProfile({...editingProfile, email: e.target.value})}
                    style={{marginBottom:0}}
                  />
                </div>
                <div>
                  <label style={{fontSize:'0.72rem'}}>Password</label>
                  <input 
                    type="password"
                    value={editingProfile.password || ''} 
                    onChange={e => setEditingProfile({...editingProfile, password: e.target.value})}
                    style={{marginBottom:0}}
                  />
                </div>
              </div>
            </div>

            <label style={{marginTop:'16px'}}>Assign Proxy</label>
            <select 
              value={editingProfile.proxy?.id || ''} 
              onChange={e => {
                const selProxy = proxies.find(p => p.id === e.target.value) || {};
                setEditingProfile({...editingProfile, proxy: selProxy});
              }}
            >
              <option value="">No Proxy</option>
              {proxies.map(p => <option key={p.id} value={p.id}>{p.host}:{p.port} ({p.name})</option>)}
            </select>

            <div style={{display:'flex',gap:'12px',marginTop:'20px'}}>
              <button className="btn btn-secondary" style={{flex:1}} onClick={() => setShowEditModal(false)}>Cancel</button>
              <button className="btn btn-primary" style={{flex:2}} onClick={handleSaveEditedProfile}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {showBulkEditModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'20px'}}>
              <h2>✏️ Bulk Edit ({selectedIds.length} Selected)</h2>
              <button onClick={() => setShowBulkEditModal(false)} style={{background:'none',border:'none',color:'white',cursor:'pointer'}}><X size={22}/></button>
            </div>
            
            <p style={{fontSize:'0.75rem', color:'var(--text-dim)', marginBottom:'15px'}}>
              Select fields to update for all <b>{selectedIds.length}</b> selected profiles. Leave fields blank to keep current values.
            </p>

            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px'}}>
              <div>
                <label>Platform</label>
                <select value={bulkEditData.platform} onChange={e => setBulkEditData({...bulkEditData, platform: e.target.value})}>
                  <option value="">(Keep Unchanged)</option>
                  <option value="facebook">Facebook</option>
                  <option value="instagram">Instagram</option>
                  <option value="twitter">X / Twitter</option>
                  <option value="tiktok">TikTok</option>
                  <option value="youtube">YouTube</option>
                  <option value="pinterest">Pinterest</option>
                  <option value="threads">Threads</option>
                  <option value="reddit">Reddit</option>
                  <option value="quora">Quora</option>
                  <option value="truth social">Truth Social</option>
                  <option value="tumblr">Tumblr</option>
                  <option value="bereal">BeReal</option>
                  <option value="bluesky">Bluesky</option>
                  <option value="kaskus">Kaskus</option>
                  <option value="tokopedia">Tokopedia</option>
                  <option value="sharechat">ShareChat</option>
                </select>
              </div>
              <div>
                <label>View Mode</label>
                <select value={bulkEditData.viewMode} onChange={e => setBulkEditData({...bulkEditData, viewMode: e.target.value})}>
                  <option value="">(Keep Unchanged)</option>
                  <option value="mobile">📱 Mobile View</option>
                  <option value="desktop">🖥️ Desktop Mode</option>
                </select>
              </div>
            </div>

            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px', marginTop:'12px'}}>
              <div>
                <label>Action / Mode</label>
                <select value={bulkEditData.action} onChange={e => setBulkEditData({...bulkEditData, action: e.target.value})}>
                  <option value="">(Keep Unchanged)</option>
                  <option value="signin">🔑 Sign In (Login)</option>
                  <option value="signup">📝 Sign Up (Register)</option>
                </select>
              </div>
              <div>
                <label>Post Language</label>
                <select value={bulkEditData.postLanguage} onChange={e => setBulkEditData({...bulkEditData, postLanguage: e.target.value})}>
                  <option value="">(Keep Unchanged)</option>
                  <option value="english">🌐 English</option>
                  <option value="local">Local Language</option>
                  <option value="bilingual">🔀 Bilingual</option>
                </select>
              </div>
            </div>

            <label style={{marginTop:'12px'}}>Assign Proxy to All</label>
            <select value={bulkEditData.proxyId} onChange={e => setBulkEditData({...bulkEditData, proxyId: e.target.value})}>
              <option value="">(Keep Unchanged)</option>
              {proxies.map(p => <option key={p.id} value={p.id}>{p.host}:{p.port} ({p.name})</option>)}
            </select>

            <label style={{marginTop:'12px'}}>Password (Set for All)</label>
            <input 
              type="password" 
              placeholder="Leave blank to keep unchanged" 
              value={bulkEditData.password} 
              onChange={e => setBulkEditData({...bulkEditData, password: e.target.value})} 
            />

            <div style={{display:'flex',gap:'12px',marginTop:'20px'}}>
              <button className="btn btn-secondary" style={{flex:1}} onClick={() => setShowBulkEditModal(false)}>Cancel</button>
              <button className="btn btn-primary" style={{flex:2}} onClick={handleSaveBulkEdit}>Apply to {selectedIds.length} Profiles</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
