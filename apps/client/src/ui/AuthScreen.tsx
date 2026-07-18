import { useState } from 'react';

const API_URL = 'http://localhost:3001/auth';

export function AuthScreen({ onLogin }: { onLogin: (token: string, username: string) => void }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [hoverState, setHoverState] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = isLogin ? '/login' : '/register';
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Authentication failed. Professor Oak is disappointed.');
      }

      onLogin(data.token, data.username);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        fontFamily: '"Inter", "Roboto", sans-serif', // Modern sleek font
      }}
    >
      {/* Dynamic Background Orbs for personality */}
      <div style={{
        position: 'absolute',
        top: '10%',
        left: '20%',
        width: '300px',
        height: '300px',
        background: 'radial-gradient(circle, rgba(239, 68, 68, 0.15) 0%, rgba(0,0,0,0) 70%)',
        borderRadius: '50%',
        filter: 'blur(40px)',
      }} />
      <div style={{
        position: 'absolute',
        bottom: '10%',
        right: '20%',
        width: '400px',
        height: '400px',
        background: 'radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, rgba(0,0,0,0) 70%)',
        borderRadius: '50%',
        filter: 'blur(60px)',
      }} />

      <div
        style={{
          background: 'rgba(30, 41, 59, 0.7)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          padding: '48px',
          borderRadius: '24px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          width: '100%',
          maxWidth: '420px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Top subtle highlight */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '2px',
          background: 'linear-gradient(90deg, transparent, #3b82f6, #ef4444, transparent)',
          opacity: 0.8
        }} />

        {/* Branding Logo */}
        <div style={{ marginBottom: '32px', textAlign: 'center', width: '100%' }}>
          <img 
            src="/assets/images/logo.png" 
            alt="Pokemon Realms Logo" 
            style={{ 
              maxWidth: '100%', 
              height: 'auto', 
              maxHeight: '180px',
              filter: 'drop-shadow(0 0 20px rgba(0,0,0,0.5))',
              transform: 'scale(1.05)'
            }} 
          />
        </div>
        
        {error && (
          <div style={{ 
            background: 'rgba(239, 68, 68, 0.1)', 
            borderLeft: '4px solid #ef4444',
            color: '#fca5a5', 
            padding: '12px 16px', 
            marginBottom: '24px', 
            borderRadius: '0 8px 8px 0', 
            width: '100%',
            fontSize: '14px',
            boxSizing: 'border-box'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: '600', color: '#94a3b8', letterSpacing: '1px', textTransform: 'uppercase' }}>
              Trainer Name
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. Ash Ketchum"
              style={{ 
                width: '100%', 
                padding: '14px 16px', 
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.1)', 
                borderRadius: '12px', 
                color: '#f8fafc',
                fontSize: '16px',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.2s, box-shadow 0.2s'
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.boxShadow = '0 0 0 2px rgba(59, 130, 246, 0.2)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'; e.currentTarget.style.boxShadow = 'none'; }}
              required
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: '600', color: '#94a3b8', letterSpacing: '1px', textTransform: 'uppercase' }}>
              Secret ID (Password)
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{ 
                width: '100%', 
                padding: '14px 16px', 
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.1)', 
                borderRadius: '12px', 
                color: '#f8fafc',
                fontSize: '16px',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.2s, box-shadow 0.2s'
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.boxShadow = '0 0 0 2px rgba(59, 130, 246, 0.2)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'; e.currentTarget.style.boxShadow = 'none'; }}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            onMouseEnter={() => setHoverState('submit')}
            onMouseLeave={() => setHoverState('')}
            style={{
              background: hoverState === 'submit' ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' : 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
              color: '#ffffff',
              border: 'none',
              padding: '16px',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '700',
              letterSpacing: '0.5px',
              cursor: loading ? 'not-allowed' : 'pointer',
              marginTop: '12px',
              boxShadow: hoverState === 'submit' ? '0 10px 15px -3px rgba(239, 68, 68, 0.4)' : '0 4px 6px -1px rgba(239, 68, 68, 0.2)',
              transition: 'all 0.2s ease',
              transform: hoverState === 'submit' && !loading ? 'translateY(-2px)' : 'none'
            }}
          >
            {loading ? 'SYNCING PC DATA...' : (isLogin ? 'LOGIN TO WORLD' : 'CREATE ACCOUNT')}
          </button>
        </form>

        <div style={{ marginTop: '32px', textAlign: 'center', fontSize: '14px', color: '#94a3b8' }}>
          {isLogin ? (
            <p style={{ margin: 0 }}>
              New to Pokemon Realms?{' '}
              <span 
                style={{ 
                  color: hoverState === 'toggle' ? '#60a5fa' : '#3b82f6', 
                  cursor: 'pointer', 
                  fontWeight: '600',
                  transition: 'color 0.2s'
                }} 
                onMouseEnter={() => setHoverState('toggle')}
                onMouseLeave={() => setHoverState('')}
                onClick={() => { setIsLogin(false); setError(''); }}
              >
                Create an Account
              </span>
            </p>
          ) : (
            <p style={{ margin: 0 }}>
              Already have an account?{' '}
              <span 
                style={{ 
                  color: hoverState === 'toggle' ? '#60a5fa' : '#3b82f6', 
                  cursor: 'pointer', 
                  fontWeight: '600',
                  transition: 'color 0.2s'
                }} 
                onMouseEnter={() => setHoverState('toggle')}
                onMouseLeave={() => setHoverState('')}
                onClick={() => { setIsLogin(true); setError(''); }}
              >
                Login here
              </span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
