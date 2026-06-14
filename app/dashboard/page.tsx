'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, hasAccess } from '@/lib/auth';
import Link from 'next/link';

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('self-review');
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/');
      return;
    }
    setUser(JSON.parse(userData));
    setLoading(false);
  }, [router]);

  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data?.type === 'scrollToTop' && contentRef.current) {
        contentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    router.push('/');
  };

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
    contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center" style={{background: 'linear-gradient(135deg, #f0f4f8 0%, #d9e2ec 100%)'}}>
      <div style={{color: '#64748b'}}>Loading...</div>
    </div>;
  }

  if (!user) {
    return null;
  }

  const email = user.email;
  const tabs = [
    { id: 'self-review',      label: 'Employee Self Review', allowed: email !== 'chelsea@tassure.com' && email !== 'esther@tassure.com' },
    { id: 'leader-review',    label: 'Leader Review',        allowed: hasAccess(user.role, 'leader-review') && email !== 'esther@tassure.com' },
    { id: 'hr-review',        label: 'HR Review',            allowed: email === 'esther@tassure.com' || email === 'vincent@tassure.com' },
    { id: 'finance-review',   label: 'Finance Review',       allowed: email === 'chelsea@tassure.com' || email === 'vincent@tassure.com' },
    { id: 'marketing-review', label: 'Marketing Review',     allowed: email === 'vincent@tassure.com' },
    { id: 'suggestion-box',   label: '💬 Suggestion Box',   allowed: true },
    { id: 'admin-dashboard',  label: 'Admin Dashboard',      allowed: hasAccess(user.role, 'admin-dashboard') },
    { id: 'my-submissions',   label: 'My Submissions',       allowed: user.role !== 'admin' },
  ];

  const visibleTabs = tabs.filter(t => t.allowed);

  return (
    <div style={{height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column'}}>
      {/* Navbar */}
      <div style={{
        flexShrink: 0,
        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
        borderBottom: '1px solid rgba(30, 58, 95, 0.08)',
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
              <div style={{fontSize: '18px', fontWeight: '800', color: '#1e3a5f'}}>Tassure Review System</div>
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

      {/* Content */}
      <div ref={contentRef} style={{flex: 1, overflowY: 'auto', padding: '32px', background: 'linear-gradient(135deg, #f0f4f8 0%, #d9e2ec 100%)'}}>
        {activeTab === 'self-review' && (
          <iframe
            src="/dashboard/self-review"
            scrolling="no"
            onLoad={(e) => {
              const iframe = e.currentTarget;
              const update = () => {
                try {
                  iframe.style.height = iframe.contentDocument!.documentElement.scrollHeight + 'px';
                } catch {}
              };
              update();
              const observer = new ResizeObserver(update);
              observer.observe(iframe.contentDocument!.body);
            }}
            style={{width: '100%', height: '1200px', border: 'none', borderRadius: '12px', overflow: 'hidden'}}
          />
        )}
        {activeTab === 'leader-review' && (
          <iframe
            src="/dashboard/leader-review"
            scrolling="no"
            onLoad={(e) => {
              const iframe = e.currentTarget;
              const update = () => {
                try {
                  iframe.style.height = iframe.contentDocument!.documentElement.scrollHeight + 'px';
                } catch {}
              };
              update();
              const observer = new ResizeObserver(update);
              observer.observe(iframe.contentDocument!.body);
            }}
            style={{width: '100%', height: '1200px', border: 'none', borderRadius: '12px', overflow: 'hidden'}}
          />
        )}
        {activeTab === 'admin-dashboard' && (
          <iframe
            src="/dashboard/admin-dashboard"
            scrolling="no"
            onLoad={(e) => {
              const iframe = e.currentTarget;
              const update = () => {
                try {
                  iframe.style.height = iframe.contentDocument!.documentElement.scrollHeight + 'px';
                } catch {}
              };
              update();
              const observer = new ResizeObserver(update);
              observer.observe(iframe.contentDocument!.body);
            }}
            style={{width: '100%', height: '1200px', border: 'none', borderRadius: '12px', overflow: 'hidden'}}
          />
        )}
        {activeTab === 'hr-review' && (
          <iframe
            src="/dashboard/hr-review"
            scrolling="no"
            onLoad={(e) => {
              const iframe = e.currentTarget;
              const update = () => {
                try {
                  iframe.style.height = iframe.contentDocument!.documentElement.scrollHeight + 'px';
                } catch {}
              };
              update();
              const observer = new ResizeObserver(update);
              observer.observe(iframe.contentDocument!.body);
            }}
            style={{width: '100%', height: '1200px', border: 'none', borderRadius: '12px', overflow: 'hidden'}}
          />
        )}
        {activeTab === 'finance-review' && (
          <iframe
            src="/dashboard/finance-review"
            scrolling="no"
            onLoad={(e) => {
              const iframe = e.currentTarget;
              const update = () => {
                try {
                  iframe.style.height = iframe.contentDocument!.documentElement.scrollHeight + 'px';
                } catch {}
              };
              update();
              const observer = new ResizeObserver(update);
              observer.observe(iframe.contentDocument!.body);
            }}
            style={{width: '100%', height: '1200px', border: 'none', borderRadius: '12px', overflow: 'hidden'}}
          />
        )}
        {activeTab === 'marketing-review' && (
          <iframe
            src="/dashboard/marketing-review"
            scrolling="no"
            onLoad={(e) => {
              const iframe = e.currentTarget;
              const update = () => {
                try {
                  iframe.style.height = iframe.contentDocument!.documentElement.scrollHeight + 'px';
                } catch {}
              };
              update();
              const observer = new ResizeObserver(update);
              observer.observe(iframe.contentDocument!.body);
            }}
            style={{width: '100%', height: '1200px', border: 'none', borderRadius: '12px', overflow: 'hidden'}}
          />
        )}
        {activeTab === 'suggestion-box' && (
          <iframe
            src="/dashboard/suggestion-box"
            scrolling="no"
            onLoad={(e) => {
              const iframe = e.currentTarget;
              const update = () => {
                try {
                  iframe.style.height = iframe.contentDocument!.documentElement.scrollHeight + 'px';
                } catch {}
              };
              update();
              const observer = new ResizeObserver(update);
              observer.observe(iframe.contentDocument!.body);
            }}
            style={{width: '100%', height: '700px', border: 'none', borderRadius: '12px', overflow: 'hidden'}}
          />
        )}
        {activeTab === 'my-submissions' && (
          <iframe
            src="/dashboard/my-submissions"
            scrolling="no"
            onLoad={(e) => {
              const iframe = e.currentTarget;
              const update = () => {
                try {
                  iframe.style.height = iframe.contentDocument!.documentElement.scrollHeight + 'px';
                } catch {}
              };
              update();
              const observer = new ResizeObserver(update);
              observer.observe(iframe.contentDocument!.body);
            }}
            style={{width: '100%', height: '800px', border: 'none', borderRadius: '12px', overflow: 'hidden'}}
          />
        )}
      </div>
    </div>
  );
}

