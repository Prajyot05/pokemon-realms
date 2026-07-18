import { useState } from 'react';

const API_URL = 'http://localhost:3001/auth';

export function AuthScreen({ onLogin }: { onLogin: (token: string, username: string) => void }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
        throw new Error(data.message || 'Authentication failed');
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
        background: '#2c3e50', // Dark retro blue background
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        fontFamily: 'monospace',
      }}
    >
      <div
        style={{
          background: '#ecf0f1',
          padding: 32,
          borderRadius: 8,
          border: '4px solid #34495e',
          width: 320,
          boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
        }}
      >
        <h1 style={{ margin: '0 0 24px 0', textAlign: 'center', color: '#2c3e50' }}>
          {isLogin ? 'TRAINER LOGIN' : 'NEW TRAINER'}
        </h1>
        
        {error && (
          <div style={{ background: '#e74c3c', color: '#fff', padding: 8, marginBottom: 16, borderRadius: 4, textAlign: 'center' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>USERNAME</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{ width: '100%', padding: 8, border: '2px solid #bdc3c7', borderRadius: 4, boxSizing: 'border-box' }}
              required
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>PASSWORD</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: '100%', padding: 8, border: '2px solid #bdc3c7', borderRadius: 4, boxSizing: 'border-box' }}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              background: '#3498db',
              color: '#fff',
              border: 'none',
              padding: 12,
              borderRadius: 4,
              fontWeight: 'bold',
              cursor: loading ? 'not-allowed' : 'pointer',
              marginTop: 8,
            }}
          >
            {loading ? 'PROCESSING...' : (isLogin ? 'ENTER WORLD' : 'REGISTER')}
          </button>
        </form>

        <div style={{ marginTop: 24, textAlign: 'center', fontSize: 14 }}>
          {isLogin ? (
            <p>
              Don't have an account?{' '}
              <span style={{ color: '#3498db', cursor: 'pointer', fontWeight: 'bold' }} onClick={() => setIsLogin(false)}>
                Register here
              </span>
            </p>
          ) : (
            <p>
              Already a trainer?{' '}
              <span style={{ color: '#3498db', cursor: 'pointer', fontWeight: 'bold' }} onClick={() => setIsLogin(true)}>
                Login here
              </span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
