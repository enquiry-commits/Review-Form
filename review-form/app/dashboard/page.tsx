'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, hasAccess } from '@/lib/auth';
import Link from 'next/link';

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('self-review');

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
    return <div className="min-h-screen flex items-center justify-center" style={{background: 'linear-gradient(135deg, #f0f4f8 0%, #d9e2ec 100%)'}}>
      <div style={{color: '#64748b'}}>Loading...</div>
    </div>;
  }

  if (!user) {
    return null;
  }

  const tabs = [
    { id: 'self-review', label: 'Employee Self Review', allowed: true },
    { id: 'leader-review', label: 'Leader Review', allowed: hasAccess(user.role, 'leader-review') },
    { id: 'admin-dashboard', label: 'Admin Dashboard', allowed: hasAccess(user.role, 'admin-dashboard') },
  ];

  const visibleTabs = tabs.filter(t => t.allowed);

  return (
    <div style={{background: 'linear-gradient(135deg, #f0f4f8 0%, #d9e2ec 100%)', minHeight: '100vh'}}>
      {/* Navbar */}
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
          maxWidth: '1600px',
          margin: '0 auto',
          padding: '0 32px',
          height: '70px'
        }}>
          <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
            <img src="/tassure-logo.png" alt="Tassure" style={{height: '45px', width: 'auto'}} />
            <div>
              <div style={{fontSize: '18px', fontWeight: '800', color: '#1e3a5f'}}>Review System</div>
              <div style={{fontSize: '12px', color: '#64748b'}}>Performance Evaluation Platform</div>
            </div>
          </div>
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
              transition: 'all 0.3s'
            }}
            onMouseEnter={(e) => {e.currentTarget.style.background = 'rgba(30, 58, 95, 0.04)'}}
            onMouseLeave={(e) => {e.currentTarget.style.background = 'transparent'}}
          >
            Logout
          </button>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          gap: 0,
          borderBottom: '2px solid transparent',
          marginLeft: '60px',
          maxWidth: '1600px',
          margin: '0 auto',
          padding: '0 32px'
        }}>
          {visibleTabs.map(tab => (
            <div
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '16px 20px',
                cursor: 'pointer',
                borderBottom: activeTab === tab.id ? '3px solid #7eb8d4' : '3px solid transparent',
                fontWeight: 600,
                color: activeTab === tab.id ? '#1e3a5f' : '#64748b',
                fontSize: '13px',
                letterSpacing: '0.5px',
                transition: 'all 0.3s'
              }}
              onMouseEnter={(e) => {
                if (activeTab !== tab.id) {
                  e.currentTarget.style.color = '#1e3a5f';
                  e.currentTarget.style.background = 'rgba(30, 58, 95, 0.04)';
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== tab.id) {
                  e.currentTarget.style.color = '#64748b';
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              {tab.label}
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{padding: '48px 32px', maxWidth: '1100px', margin: '0 auto'}}>
        {/* Welcome Card */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          borderRadius: '24px',
          padding: '48px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(255, 255, 255, 0.8)',
          border: '1px solid rgba(30, 58, 95, 0.06)',
          marginBottom: '48px'
        }}>
          <div style={{marginBottom: '24px'}}>
            <div style={{fontSize: '18px', color: '#64748b', marginBottom: '16px'}}>Welcome back,</div>
            <div style={{fontSize: '36px', fontWeight: '800', color: '#0f172a', marginBottom: '12px'}}>{user.name}</div>
            <div style={{color: '#64748b', fontSize: '14px'}}>{user.email}</div>
            {user.department && (
              <div style={{fontSize: '13px', color: '#94a3b8', marginTop: '8px'}}>{user.department}</div>
            )}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'self-review' && (
          <div style={{textAlign: 'center'}}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              borderRadius: '24px',
              padding: '48px',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.08)',
              border: '1px solid rgba(30, 58, 95, 0.06)'
            }}>
              <div style={{fontSize: '32px', fontWeight: '800', color: '#0f172a', marginBottom: '16px'}}>Employee Self Review</div>
              <p style={{color: '#64748b', marginBottom: '32px'}}>Complete your honest evaluation of your performance this period</p>
              <Link href="/dashboard/self-review" style={{
                display: 'inline-block',
                padding: '13px 32px',
                background: 'linear-gradient(135deg, #1e3a5f, #162d4a)',
                color: 'white',
                borderRadius: '12px',
                textDecoration: 'none',
                fontWeight: '700',
                fontSize: '14px',
                boxShadow: '0 8px 24px rgba(30, 58, 95, 0.3)',
                transition: 'all 0.3s'
              }}>
                Open Form →
              </Link>
            </div>
          </div>
        )}

        {activeTab === 'leader-review' && (
          <div style={{textAlign: 'center'}}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              borderRadius: '24px',
              padding: '48px',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.08)',
              border: '1px solid rgba(30, 58, 95, 0.06)'
            }}>
              <div style={{fontSize: '32px', fontWeight: '800', color: '#0f172a', marginBottom: '16px'}}>Leader Performance Review</div>
              <p style={{color: '#64748b', marginBottom: '32px'}}>Evaluate your team members' performance this period</p>
              <Link href="/dashboard/leader-review" style={{
                display: 'inline-block',
                padding: '13px 32px',
                background: 'linear-gradient(135deg, #7eb8d4, #6ba3c5)',
                color: 'white',
                borderRadius: '12px',
                textDecoration: 'none',
                fontWeight: '700',
                fontSize: '14px',
                boxShadow: '0 8px 24px rgba(126, 184, 212, 0.3)',
                transition: 'all 0.3s'
              }}>
                Open Form →
              </Link>
            </div>
          </div>
        )}

        {activeTab === 'admin-dashboard' && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            borderRadius: '24px',
            padding: '48px',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.08)',
            border: '1px solid rgba(30, 58, 95, 0.06)'
          }}>
            <div style={{fontSize: '32px', fontWeight: '800', color: '#0f172a', marginBottom: '8px'}}>Admin Dashboard</div>
            <p style={{color: '#64748b', marginBottom: '32px'}}>Monitor all submissions and system activity</p>
            <Link href="/dashboard/admin-dashboard" style={{
              display: 'inline-block',
              padding: '13px 32px',
              background: 'linear-gradient(135deg, #1e3a5f, #162d4a)',
              color: 'white',
              borderRadius: '12px',
              textDecoration: 'none',
              fontWeight: '700',
              fontSize: '14px',
              boxShadow: '0 8px 24px rgba(30, 58, 95, 0.3)',
              transition: 'all 0.3s'
            }}>
              Go to Dashboard →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
