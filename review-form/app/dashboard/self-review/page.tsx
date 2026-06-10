'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@/lib/auth';
import Link from 'next/link';

export default function SelfReviewForm() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/');
      return;
    }
    setUser(JSON.parse(userData));
    setLoading(false);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    router.push('/');
  };

  if (loading) {
    return <div style={{minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #f0f4f8 0%, #d9e2ec 100%)'}}>
      <div style={{color: '#64748b'}}>Loading...</div>
    </div>;
  }

  if (!user) {
    return null;
  }

  return (
    <div style={{background: 'linear-gradient(135deg, #f0f4f8 0%, #d9e2ec 100%)', minHeight: '100vh'}}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
        borderBottom: '1px solid rgba(30, 58, 95, 0.08)',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        boxShadow: '0 2px 12px rgba(0, 0, 0, 0.04)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          maxWidth: '1100px',
          margin: '0 auto',
          padding: '0 32px',
          height: '70px'
        }}>
          <Link href="/dashboard" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            textDecoration: 'none',
            opacity: 1,
            transition: 'opacity 0.3s'
          }}
          onMouseEnter={(e) => {e.currentTarget.style.opacity = '0.8'}}
          onMouseLeave={(e) => {e.currentTarget.style.opacity = '1'}}
          >
            <img src="/tassure-logo.png" alt="Tassure" style={{height: '32px', width: 'auto'}} />
            <div style={{fontSize: '14px', fontWeight: '800', color: '#1e3a5f'}}>Review System</div>
          </Link>
          <div style={{display: 'flex', alignItems: 'center', gap: '16px'}}>
            <span style={{fontSize: '14px', color: '#64748b'}}>{user.name}</span>
            <button
              onClick={handleLogout}
              style={{
                padding: '8px 16px',
                fontSize: '14px',
                fontWeight: '600',
                color: '#1e3a5f',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.3s',
                borderRadius: '10px'
              }}
              onMouseEnter={(e) => {e.currentTarget.style.background = 'rgba(30, 58, 95, 0.04)'}}
              onMouseLeave={(e) => {e.currentTarget.style.background = 'transparent'}}
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{padding: '48px 32px', maxWidth: '1100px', margin: '0 auto'}}>
        <Link href="/dashboard" style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          color: '#7eb8d4',
          textDecoration: 'none',
          fontWeight: '600',
          marginBottom: '32px',
          fontSize: '14px'
        }}>
          ← Back to Dashboard
        </Link>

        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          borderRadius: '24px',
          padding: '48px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.08)',
          border: '1px solid rgba(30, 58, 95, 0.06)'
        }}>
          {/* Form Header */}
          <div style={{
            textAlign: 'center',
            marginBottom: '48px',
            paddingBottom: '32px',
            borderBottom: '1px solid rgba(30, 58, 95, 0.08)'
          }}>
            <h1 style={{fontSize: '36px', fontWeight: '800', color: '#0f172a', marginBottom: '8px', letterSpacing: '-0.5px'}}>Employee Self Review</h1>
            <p style={{color: '#64748b', fontSize: '15px', lineHeight: '1.6'}}>Please complete your honest evaluation of your performance this period</p>
          </div>

          {/* Form Section 1: Basic Info */}
          <div style={{marginBottom: '40px'}}>
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '32px'}}>
              <div>
                <label style={{fontSize: '12px', color: '#334155', fontWeight: '700', marginBottom: '10px', letterSpacing: '0.4px', textTransform: 'uppercase', display: 'block'}}>Department</label>
                <select style={{
                  width: '100%',
                  padding: '13px 16px',
                  border: '1.5px solid #e2e8f0',
                  borderRadius: '12px',
                  fontSize: '14px',
                  color: '#1a1a2e',
                  background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                  fontFamily: 'inherit',
                  cursor: 'pointer',
                  transition: 'all 0.3s'
                }}>
                  <option>-- Select Department --</option>
                  <option>{user.department}</option>
                </select>
              </div>
              <div>
                <label style={{fontSize: '12px', color: '#334155', fontWeight: '700', marginBottom: '10px', letterSpacing: '0.4px', textTransform: 'uppercase', display: 'block'}}>Your Name</label>
                <input type="text" value={user.name} readOnly style={{
                  width: '100%',
                  padding: '13px 16px',
                  border: '1.5px solid #e2e8f0',
                  borderRadius: '12px',
                  fontSize: '14px',
                  color: '#1a1a2e',
                  background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                  fontFamily: 'inherit'
                }} />
              </div>
              <div>
                <label style={{fontSize: '12px', color: '#334155', fontWeight: '700', marginBottom: '10px', letterSpacing: '0.4px', textTransform: 'uppercase', display: 'block'}}>Review Period</label>
                <input type="text" placeholder="e.g. June 2026" style={{
                  width: '100%',
                  padding: '13px 16px',
                  border: '1.5px solid #e2e8f0',
                  borderRadius: '12px',
                  fontSize: '14px',
                  color: '#1a1a2e',
                  background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                  fontFamily: 'inherit',
                  transition: 'all 0.3s'
                }} />
              </div>
            </div>
          </div>

          {/* Form Section 2: Client KPIs */}
          <div style={{marginBottom: '40px'}}>
            <div style={{display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px'}}>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                background: 'linear-gradient(135deg, #7eb8d4, #6ba3c5)',
                color: 'white',
                borderRadius: '8px',
                fontSize: '11px',
                fontWeight: '800',
                letterSpacing: '0.4px',
                boxShadow: '0 4px 12px rgba(126, 184, 212, 0.25)'
              }}>CLIENT</span>
              <span style={{fontSize: '17px', fontWeight: '800', color: '#1e3a5f', letterSpacing: '-0.3px'}}>Client Stability & Relationships</span>
            </div>
            <div style={{display: 'flex', flexDirection: 'column', gap: '14px'}}>
              {['Client Complaints / Issues', 'Client Attrition'].map((name, idx) => (
                <div key={idx} style={{
                  background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                  border: '1.5px solid #e2e8f0',
                  borderRadius: '14px',
                  padding: '20px',
                  transition: 'all 0.3s'
                }}>
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px', gap: '20px'}}>
                    <div style={{flex: 1}}>
                      <div style={{fontSize: '14px', fontWeight: '800', color: '#0f172a', marginBottom: '6px'}}>{name}</div>
                      <div style={{fontSize: '13px', color: '#64748b', lineHeight: '1.6'}}>Please provide relevant information for this metric</div>
                    </div>
                    <div style={{display: 'flex', gap: '12px', alignItems: 'flex-end'}}>
                      <div>
                        <label style={{fontSize: '11px', color: '#94a3b8', fontWeight: '700', marginBottom: '6px', display: 'block'}}>Count</label>
                        <input type="number" min="0" defaultValue="0" style={{
                          width: '100px',
                          padding: '10px 12px',
                          border: '1.5px solid #e2e8f0',
                          borderRadius: '10px',
                          fontSize: '14px',
                          textAlign: 'center',
                          fontWeight: '700',
                          color: '#1e3a5f',
                          background: '#f8fafc'
                        }} />
                      </div>
                    </div>
                  </div>
                  <div style={{marginTop: '12px'}}>
                    <label style={{fontSize: '11px', color: '#94a3b8', fontWeight: '700', marginBottom: '8px', display: 'block'}}>Your Comment</label>
                    <textarea placeholder="Explain any issues..." style={{
                      width: '100%',
                      minHeight: '70px',
                      padding: '11px 14px',
                      border: '1.5px solid #e2e8f0',
                      borderRadius: '10px',
                      fontSize: '13px',
                      fontFamily: 'inherit',
                      resize: 'vertical'
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Form Actions */}
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
            marginTop: '48px',
            paddingTop: '32px',
            borderTop: '1px solid rgba(30, 58, 95, 0.08)'
          }}>
            <button style={{
              padding: '13px 32px',
              background: 'linear-gradient(135deg, #f1f5f9, #e2e8f0)',
              color: '#334155',
              border: '1.5px solid #cbd5e1',
              borderRadius: '12px',
              fontWeight: '700',
              cursor: 'pointer',
              fontSize: '14px',
              letterSpacing: '0.3px',
              transition: 'all 0.3s'
            }}>
              Clear Form
            </button>
            <button style={{
              padding: '13px 32px',
              background: 'linear-gradient(135deg, #1e3a5f, #162d4a)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontWeight: '700',
              cursor: 'pointer',
              fontSize: '14px',
              letterSpacing: '0.3px',
              boxShadow: '0 8px 24px rgba(30, 58, 95, 0.3)',
              transition: 'all 0.3s'
            }}>
              Submit Self Review
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
