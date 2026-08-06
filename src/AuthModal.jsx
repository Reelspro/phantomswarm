import React, { useState } from 'react';
import { 
  Zap, Lock, Mail, User, KeyRound, Eye, EyeOff, ArrowRight, 
  CheckCircle, AlertCircle, Loader2, ShieldCheck, RefreshCw 
} from 'lucide-react';

export default function AuthModal({ onAuthSuccess }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register' | 'forgot'
  
  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const clearState = () => {
    setError('');
    setSuccessMsg('');
  };

  const handleModeSwitch = (newMode) => {
    clearState();
    setMode(newMode);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    clearState();
    if (!email || !password) {
      setError('Please fill in both email and password.');
      return;
    }
    setLoading(true);
    try {
      const res = await window.electron.authLogin({ email, password });
      if (res.success) {
        if (onAuthSuccess) onAuthSuccess(res.user);
      } else {
        setError(res.error || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      console.error('Login Error:', err);
      setError('Login failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    clearState();
    if (!name.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!email.trim() || !password) {
      setError('Please enter both email and password.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match. Please check again.');
      return;
    }

    setLoading(true);
    try {
      const res = await window.electron.authRegister({ name, email, password });
      if (res.success) {
        setSuccessMsg('Account created successfully! Logging you in...');
        setTimeout(() => {
          if (onAuthSuccess) onAuthSuccess(res.user);
        }, 800);
      } else {
        setError(res.error || 'Registration failed.');
      }
    } catch (err) {
      console.error('Register Error:', err);
      setError('Registration failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    clearState();
    if (!email.trim() || !password) {
      setError('Please enter your registered Gmail address and new password.');
      return;
    }

    setLoading(true);
    try {
      const res = await window.electron.authResetPassword({ email, newPassword: password });
      if (res.success) {
        setSuccessMsg(res.message || 'Password updated successfully! Redirecting to login...');
        setTimeout(() => setMode('login'), 1500);
      } else {
        setError(res.error || 'Password reset failed.');
      }
    } catch (err) {
      console.error('Reset Error:', err);
      setError('Failed to reset password: ' + err.message);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      background: 'radial-gradient(circle at center, rgba(15, 23, 42, 0.96) 0%, rgba(5, 10, 20, 0.99) 100%)',
      backdropFilter: 'blur(16px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      {/* Cyberpunk Green Grid Overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: 'linear-gradient(rgba(0, 255, 100, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 100, 0.03) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
        pointerEvents: 'none'
      }} />

      <div style={{
        position: 'relative',
        width: '100%',
        maxWidth: '440px',
        background: 'rgba(10, 18, 30, 0.85)',
        border: '1px solid rgba(0, 255, 130, 0.3)',
        borderRadius: '24px',
        boxShadow: '0 0 50px rgba(0, 255, 130, 0.15), inset 0 0 20px rgba(0, 255, 130, 0.05)',
        padding: '36px 30px',
        color: 'white'
      }}>
        {/* Header Logo */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #00ff87, #60efff)',
            boxShadow: '0 0 25px rgba(0, 255, 135, 0.5)',
            marginBottom: '12px'
          }}>
            <Zap size={28} color="#05101a" />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '900', letterSpacing: '1px', margin: 0 }}>
            PHANTOM <span style={{ color: '#00ff87' }}>SWARM</span>
          </h1>
          <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>
            {mode === 'login' && 'Sign in to access your automation workspace'}
            {mode === 'register' && 'Create your account to start automating'}
            {mode === 'forgot' && 'Reset your password via Email OTP link'}
          </p>
        </div>

        {/* Error / Success Notifications */}
        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            borderRadius: '12px',
            padding: '10px 14px',
            fontSize: '0.78rem',
            color: '#fca5a5',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '20px'
          }}>
            <AlertCircle size={16} flexShrink={0} />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div style={{
            background: 'rgba(34, 197, 94, 0.15)',
            border: '1px solid rgba(34, 197, 94, 0.4)',
            borderRadius: '12px',
            padding: '10px 14px',
            fontSize: '0.78rem',
            color: '#86efac',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '20px'
          }}>
            <CheckCircle size={16} flexShrink={0} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* ── MODE: LOGIN ─────────────────────────────────────────────────── */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '0.72rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px', display: 'block' }}>
                Email / Gmail
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} color="#00ff87" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@gmail.com"
                  required
                  style={{
                    width: '100%',
                    padding: '12px 14px 12px 42px',
                    background: 'rgba(15, 23, 42, 0.7)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '12px',
                    color: 'white',
                    fontSize: '0.85rem',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '0.72rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => handleModeSwitch('forgot')}
                  style={{ background: 'none', border: 'none', color: '#60efff', fontSize: '0.72rem', fontWeight: '700', cursor: 'pointer' }}
                >
                  Forgot Password?
                </button>
              </div>
              <div style={{ position: 'relative' }}>
                <Lock size={16} color="#00ff87" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter password"
                  required
                  style={{
                    width: '100%',
                    padding: '12px 42px 12px 42px',
                    background: 'rgba(15, 23, 42, 0.7)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '12px',
                    color: 'white',
                    fontSize: '0.85rem',
                    outline: 'none'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px',
                marginTop: '8px',
                background: 'linear-gradient(135deg, #00ff87, #00b8ff)',
                border: 'none',
                borderRadius: '14px',
                color: '#05101a',
                fontSize: '0.9rem',
                fontWeight: '900',
                letterSpacing: '0.5px',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 0 20px rgba(0, 255, 135, 0.4)'
              }}
            >
              {loading ? <Loader2 size={18} className="spin" /> : <>Sign In <ArrowRight size={18} /></>}
            </button>

            <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '0.8rem', color: '#94a3b8' }}>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => handleModeSwitch('register')}
                style={{ background: 'none', border: 'none', color: '#00ff87', fontWeight: '800', cursor: 'pointer' }}
              >
                Create Account
              </button>
            </div>
          </form>
        )}

        {/* ── MODE: REGISTER ──────────────────────────────────────────────── */}
        {mode === 'register' && (
          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '0.72rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px', display: 'block' }}>
                Full Name
              </label>
              <div style={{ position: 'relative' }}>
                <User size={16} color="#00ff87" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="John Smith"
                  required
                  style={{
                    width: '100%',
                    padding: '12px 14px 12px 42px',
                    background: 'rgba(15, 23, 42, 0.7)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '12px',
                    color: 'white',
                    fontSize: '0.85rem',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.72rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px', display: 'block' }}>
                Gmail Address
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} color="#00ff87" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@gmail.com"
                  required
                  style={{
                    width: '100%',
                    padding: '12px 14px 12px 42px',
                    background: 'rgba(15, 23, 42, 0.7)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '12px',
                    color: 'white',
                    fontSize: '0.85rem',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.72rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px', display: 'block' }}>
                Set New Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} color="#00ff87" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  required
                  style={{
                    width: '100%',
                    padding: '12px 42px 12px 42px',
                    background: 'rgba(15, 23, 42, 0.7)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '12px',
                    color: 'white',
                    fontSize: '0.85rem',
                    outline: 'none'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.72rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px', display: 'block' }}>
                Confirm Password
              </label>
              <div style={{ position: 'relative' }}>
                <ShieldCheck size={16} color="#00ff87" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  required
                  style={{
                    width: '100%',
                    padding: '12px 14px 12px 42px',
                    background: 'rgba(15, 23, 42, 0.7)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '12px',
                    color: 'white',
                    fontSize: '0.85rem',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px',
                marginTop: '8px',
                background: 'linear-gradient(135deg, #00ff87, #00b8ff)',
                border: 'none',
                borderRadius: '14px',
                color: '#05101a',
                fontSize: '0.9rem',
                fontWeight: '900',
                letterSpacing: '0.5px',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 0 20px rgba(0, 255, 135, 0.4)'
              }}
            >
              {loading ? <Loader2 size={18} className="spin" /> : <>Create Account & Start <ArrowRight size={18} /></>}
            </button>

            <div style={{ textAlign: 'center', marginTop: '14px', fontSize: '0.8rem', color: '#94a3b8' }}>
              Already registered?{' '}
              <button
                type="button"
                onClick={() => handleModeSwitch('login')}
                style={{ background: 'none', border: 'none', color: '#00ff87', fontWeight: '800', cursor: 'pointer' }}
              >
                Sign In
              </button>
            </div>
          </form>
        )}

        {/* ── MODE: FORGOT PASSWORD ───────────────────────────────────────── */}
        {mode === 'forgot' && (
          <form onSubmit={handleForgotPassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '0.72rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px', display: 'block' }}>
                Your Registered Gmail
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} color="#00ff87" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@gmail.com"
                  required
                  style={{
                    width: '100%',
                    padding: '12px 14px 12px 42px',
                    background: 'rgba(15, 23, 42, 0.7)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '12px',
                    color: 'white',
                    fontSize: '0.85rem',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px',
                marginTop: '8px',
                background: 'linear-gradient(135deg, #00ff87, #00b8ff)',
                border: 'none',
                borderRadius: '14px',
                color: '#05101a',
                fontSize: '0.9rem',
                fontWeight: '900',
                letterSpacing: '0.5px',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 0 20px rgba(0, 255, 135, 0.4)'
              }}
            >
              {loading ? <Loader2 size={18} className="spin" /> : <>Send Reset Email <RefreshCw size={18} /></>}
            </button>

            <div style={{ textAlign: 'center', marginTop: '14px', fontSize: '0.8rem', color: '#94a3b8' }}>
              Remembered your password?{' '}
              <button
                type="button"
                onClick={() => handleModeSwitch('login')}
                style={{ background: 'none', border: 'none', color: '#00ff87', fontWeight: '800', cursor: 'pointer' }}
              >
                Back to Sign In
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
