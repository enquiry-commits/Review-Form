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

  const handleTabClick = (tabId: string) => {
    if (tabId === 'self-review') {
      router.push('/dashboard/self-review');
    } else if (tabId === 'leader-review') {
      router.push('/dashboard/leader-review');
    } else if (tabId === 'admin-dashboard') {
      router.push('/dashboard/admin-dashboard');
    }
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
            </div>
          </div>
          <div style={{display: 'flex', alignItems: 'center', gap: '24px'}}>
            <div style={{fontSize: '14px', color: '#64748b'}}>
              Welcome back, <span style={{fontWeight: '700', color: '#1e3a5f'}}>{user?.name}</span>
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
              onClick={() => handleTabClick(tab.id)}
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

      {/* Content - Redirect on first load */}
    </div>
  );
}
