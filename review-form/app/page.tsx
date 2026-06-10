'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authenticate } from '@/lib/auth';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await authenticate(email, password);
      if (user) {
        localStorage.setItem('user', JSON.stringify(user));
        router.push('/dashboard');
      } else {
        setError('Invalid email or password');
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #f0f4f8 0%, #d9e2ec 100%)',
      padding: '32px'
    }}>
      <div style={{width: '100%', maxWidth: '420px'}}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          borderRadius: '24px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.08)',
          border: '1px solid rgba(255, 255, 255, 0.8)',
          padding: '56px 48px'
        }}>
          {/* Logo */}
          <div style={{display: 'flex', justifyContent: 'center', marginBottom: '36px'}}>
            <img
              src="/tassure-logo.png"
              alt="Tassure"
              style={{height: '48px', width: 'auto'}}
            />
          </div>

          {/* Title */}
          <div style={{textAlign: 'center', marginBottom: '48px'}}>
            <h1 style={{
              fontSize: '32px',
              fontWeight: '800',
              color: '#0f172a',
              marginBottom: '12px',
              letterSpacing: '-0.5px'
            }}>Review System</h1>
            <p style={{color: '#64748b', fontSize: '15px', lineHeight: '1.6'}}>Performance Evaluation Platform</p>
          </div>

          {/* Error Message */}
          {error && (
            <div style={{
              marginBottom: '24px',
              padding: '14px 16px',
              background: '#fee2e2',
              border: '1.5px solid #fecaca',
              borderRadius: '12px'
            }}>
              <p style={{fontSize: '14px', color: '#991b1b'}}>{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} style={{display: 'flex', flexDirection: 'column', gap: '24px'}}>
            {/* Email Field */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '12px',
                color: '#334155',
                fontWeight: '700',
                marginBottom: '12px',
                letterSpacing: '0.4px',
                textTransform: 'uppercase'
              }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  border: '1.5px solid #e2e8f0',
                  borderRadius: '12px',
                  fontSize: '14px',
                  color: '#1a1a2e',
                  background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                  fontFamily: 'inherit',
                  transition: 'all 0.3s',
                  cursor: loading ? 'not-allowed' : 'text'
                }}
                disabled={loading}
              />
            </div>

            {/* Password Field */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '12px',
                color: '#334155',
                fontWeight: '700',
                marginBottom: '12px',
                letterSpacing: '0.4px',
                textTransform: 'uppercase'
              }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  border: '1.5px solid #e2e8f0',
                  borderRadius: '12px',
                  fontSize: '14px',
                  color: '#1a1a2e',
                  background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                  fontFamily: 'inherit',
                  transition: 'all 0.3s',
                  cursor: loading ? 'not-allowed' : 'text'
                }}
                disabled={loading}
              />
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '14px 32px',
                background: 'linear-gradient(135deg, #1e3a5f, #162d4a)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontWeight: '700',
                fontSize: '15px',
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: '0 8px 24px rgba(30, 58, 95, 0.3)',
                transition: 'all 0.3s',
                marginTop: '12px',
                opacity: loading ? 0.6 : 1
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 12px 32px rgba(30, 58, 95, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(30, 58, 95, 0.3)';
                }
              }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p style={{
          textAlign: 'center',
          color: '#64748b',
          fontSize: '12px',
          marginTop: '32px'
        }}>
          © 2026 Tassure. All rights reserved.
        </p>
      </div>
    </div>
  );
}
