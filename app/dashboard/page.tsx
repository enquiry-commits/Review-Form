'use client';

import { useEffect, useRef, useState, ReactElement } from 'react';
import { useRouter } from 'next/navigation';
import { User, hasAccess } from '@/lib/auth';

const ICONS: Record<string, ReactElement> = {
  'self-review': (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="1.5" width="10" height="13" rx="1.5"/>
      <line x1="5.5" y1="5.5" x2="10.5" y2="5.5"/>
      <line x1="5.5" y1="8" x2="10.5" y2="8"/>
      <line x1="5.5" y1="10.5" x2="9" y2="10.5"/>
    </svg>
  ),
  'leader-review': (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="5" r="2.5"/>
      <path d="M3 14c0-2.76 2.24-5 5-5s5 2.24 5 5"/>
      <polyline points="10,8.5 11.5,10.5 14,7.5"/>
    </svg>
  ),
  'hr-review': (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6" cy="5" r="2"/>
      <path d="M1 14c0-2.76 2.24-5 5-5s5 2.24 5 5"/>
      <circle cx="12" cy="5.5" r="1.5"/>
      <path d="M15 13.5c0-1.93-1.34-3-3-3"/>
    </svg>
  ),
  'finance-review': (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1.5" y="6" width="13" height="8.5" rx="1.5"/>
      <path d="M5.5 6V4.5A1.5 1.5 0 0 1 7 3h2A1.5 1.5 0 0 1 10.5 4.5V6"/>
      <line x1="1.5" y1="9.5" x2="14.5" y2="9.5"/>
    </svg>
  ),
  'marketing-review': (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3.5 6.5H5l7.5-3.5v10L5 9.5H3.5a1 1 0 0 1-1-1v-1a1 1 0 0 1 1-1z"/>
      <path d="M5 9.5v3"/>
      <path d="M14 5.5a3 3 0 0 1 0 5"/>
    </svg>
  ),
  'suggestion-box': (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H2a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h4l2 2 2-2h4a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1z"/>
    </svg>
  ),
  'admin-dashboard': (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="5" height="5" rx="1"/>
      <rect x="9" y="2" width="5" height="5" rx="1"/>
      <rect x="2" y="9" width="5" height="5" rx="1"/>
      <rect x="9" y="9" width="5" height="5" rx="1"/>
    </svg>
  ),
  'my-submissions': (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 2H3a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1z"/>
      <polyline points="5,8 7,10 11,6"/>
    </svg>
  ),
};

function IframePanel({ src, defaultHeight = 1200 }: { src: string; defaultHeight?: number }) {
  return (
    <iframe
      src={src}
      scrolling="no"
      onLoad={(e) => {
        const iframe = e.currentTarget;
        const update = () => {
          try { iframe.style.height = iframe.contentDocument!.documentElement.scrollHeight + 'px'; } catch {}
        };
        update();
        const observer = new ResizeObserver(update);
        observer.observe(iframe.contentDocument!.body);
      }}
      style={{ width: '100%', height: `${defaultHeight}px`, border: 'none', borderRadius: '12px', overflow: 'hidden' }}
    />
  );
}

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('self-review');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [adminMenu, setAdminMenu] = useState('status-overview');
  const [adminStatusOpen, setAdminStatusOpen] = useState(false);
  const [adminDataOpen, setAdminDataOpen] = useState(false);
  const [adminTableOpen, setAdminTableOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const adminIframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) { router.push('/'); return; }
    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);
    if (parsedUser.email === 'esther@tassure.com') setActiveTab('hr-review');
    else if (parsedUser.email === 'chelsea@tassure.com') setActiveTab('finance-review');
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

  const handleLogout = () => { localStorage.removeItem('user'); router.push('/'); };

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
    if (tabId === 'admin-dashboard') {
      setSidebarCollapsed(false);
      setAdminMenu('status-overview');
      adminIframeRef.current?.contentWindow?.postMessage({ type: 'setAdminMenu', menu: 'status-overview' }, '*');
    }
    contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAdminMenuClick = (menu: string) => {
    setAdminMenu(menu);
    adminIframeRef.current?.contentWindow?.postMessage({ type: 'setAdminMenu', menu }, '*');
    contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #f0f4f8 0%, #d9e2ec 100%)' }}>
        <div style={{ color: '#64748b' }}>Loading...</div>
      </div>
    );
  }

  if (!user) return null;

  const email = user.email;
  const navItems = [
    { id: 'self-review',      label: 'Self Review',      allowed: email !== 'chelsea@tassure.com' && email !== 'esther@tassure.com' },
    { id: 'leader-review',    label: 'Leader Review',    allowed: hasAccess(user.role, 'leader-review') && email !== 'esther@tassure.com' },
    { id: 'hr-review',        label: 'HR Review',        allowed: email === 'esther@tassure.com' || email === 'vincent@tassure.com' },
    { id: 'finance-review',   label: 'Finance Review',   allowed: email === 'chelsea@tassure.com' || email === 'vincent@tassure.com' },
    { id: 'marketing-review', label: 'Marketing Review', allowed: email === 'vincent@tassure.com' },
    { id: 'suggestion-box',   label: 'Suggestion Box',   allowed: true },
    { id: 'admin-dashboard',  label: 'Admin Dashboard',  allowed: hasAccess(user.role, 'admin-dashboard') },
    { id: 'my-submissions',   label: 'My Submissions',   allowed: user.role !== 'admin' },
  ].filter(t => t.allowed);

  const navItem = (id: string, label: string) => (
    <div
      key={id}
      onClick={() => handleTabClick(id)}
      title={sidebarCollapsed ? label : undefined}
      style={{
        padding: sidebarCollapsed ? '10px' : '11px 14px',
        borderRadius: '10px',
        cursor: 'pointer',
        fontSize: '13px',
        fontWeight: '600',
        color: activeTab === id ? '#1e3a5f' : '#64748b',
        background: activeTab === id ? 'rgba(126, 184, 212, 0.15)' : 'transparent',
        boxShadow: !sidebarCollapsed && activeTab === id ? 'inset 3px 0 0 #7eb8d4' : 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
        gap: '10px',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        transition: 'all 0.2s',
      }}
      onMouseEnter={(e) => { if (activeTab !== id) { e.currentTarget.style.background = 'rgba(30,58,95,0.06)'; e.currentTarget.style.color = '#1e3a5f'; } }}
      onMouseLeave={(e) => { if (activeTab !== id) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#64748b'; } }}
    >
      <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>{ICONS[id]}</span>
      {!sidebarCollapsed && label}
    </div>
  );

  return (
    <div style={{ height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

      {/* Navbar */}
      <div style={{
        flexShrink: 0,
        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
        borderBottom: '1px solid rgba(30, 58, 95, 0.08)',
        zIndex: 1000,
        boxShadow: '0 2px 12px rgba(0, 0, 0, 0.04)',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          maxWidth: '1600px', margin: '0 auto', padding: '0 32px', height: '70px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img src="/tassure-logo.png" alt="Tassure" style={{ height: '45px', width: 'auto' }} />
            <div style={{ fontSize: '18px', fontWeight: '800', color: '#1e3a5f' }}>Tassure Review System</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <div style={{ fontSize: '14px', color: '#64748b' }}>
              Welcome back, <span style={{ fontWeight: '700', color: '#1e3a5f' }}>{user.name}</span>
            </div>
            <button
              onClick={handleLogout}
              style={{ padding: '8px 16px', fontSize: '14px', fontWeight: '600', color: '#1e3a5f', background: 'transparent', border: 'none', cursor: 'pointer', borderRadius: '8px', transition: 'all 0.2s' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(30, 58, 95, 0.04)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{
        flex: 1, overflow: 'hidden',
        display: 'grid',
        gridTemplateColumns: sidebarCollapsed ? '56px 1fr' : '220px 1fr',
        transition: 'grid-template-columns 0.25s ease',
      }}>

        {/* Sidebar */}
        <div style={{
          background: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(10px)',
          borderRight: '1px solid rgba(30, 58, 95, 0.08)',
          padding: sidebarCollapsed ? '24px 8px' : '24px 16px',
          overflowY: 'auto',
          overflowX: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          transition: 'padding 0.25s ease',
        }}>
          {/* Collapse toggle */}
          <button
            onClick={() => setSidebarCollapsed(v => !v)}
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            style={{
              alignSelf: sidebarCollapsed ? 'center' : 'flex-end',
              marginBottom: '16px',
              width: '28px', height: '28px',
              borderRadius: '8px',
              border: '1.5px solid #e2e8f0',
              background: '#f8fafc',
              color: '#64748b',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '700',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(30,58,95,0.08)'; e.currentTarget.style.color = '#1e3a5f'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#64748b'; }}
          >
            {sidebarCollapsed ? '›' : '‹'}
          </button>

          {navItems.map(t => navItem(t.id, t.label))}

          {/* Admin sub-menu — shown below Admin Dashboard when active */}
          {activeTab === 'admin-dashboard' && !sidebarCollapsed && (() => {
            const subItem = (id: string, label: string, indent = false) => (
              <div key={id} onClick={() => handleAdminMenuClick(id)}
                style={{ padding: `9px 14px 9px ${indent ? '42px' : '28px'}`, borderRadius: '10px', cursor: 'pointer', fontSize: '12px', fontWeight: '600',
                  color: adminMenu === id ? '#1e3a5f' : '#64748b',
                  background: adminMenu === id ? 'rgba(126,184,212,0.15)' : 'transparent',
                  boxShadow: adminMenu === id ? 'inset 3px 0 0 #7eb8d4' : 'none',
                  whiteSpace: 'nowrap', overflow: 'hidden', transition: 'all 0.2s' }}
                onMouseEnter={e => { if (adminMenu !== id) { e.currentTarget.style.background = 'rgba(30,58,95,0.06)'; e.currentTarget.style.color = '#1e3a5f'; }}}
                onMouseLeave={e => { if (adminMenu !== id) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#64748b'; }}}>
                {label}
              </div>
            );
            const groupHeader = (title: string, isOpen: boolean, onToggle: () => void, showDivider = true) => (
              <div key={`hdr-${title}`}>
                {showDivider && <div style={{ borderTop: '1px dashed #e2e8f0', margin: '8px 0 4px' }} />}
                <div onClick={onToggle} style={{ fontSize: '11px', fontWeight: '800', color: '#1e3a5f', letterSpacing: '0.6px', textTransform: 'uppercase', padding: '5px 14px 5px 28px', display: 'flex', alignItems: 'center', gap: '6px', opacity: 0.7, cursor: 'pointer', borderRadius: '8px', transition: 'all 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.background = 'rgba(30,58,95,0.04)'; }}
                  onMouseLeave={e => { e.currentTarget.style.opacity = '0.7'; e.currentTarget.style.background = 'transparent'; }}>
                  <span style={{ fontSize: '10px', display: 'inline-block', transition: 'transform 0.2s', transform: isOpen ? 'rotate(90deg)' : 'none', flexShrink: 0 }}>›</span>
                  {title}
                </div>
              </div>
            );
            return (
              <div style={{ marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '1px' }}>
                {groupHeader('Status', adminStatusOpen, () => setAdminStatusOpen(v => !v), false)}
                {adminStatusOpen && subItem('status-overview', 'Status Overview')}

                {groupHeader('Data', adminDataOpen, () => setAdminDataOpen(v => !v))}
                {adminDataOpen && (
                  <>
                    {subItem('self-reviews', 'Self Reviews')}
                    {subItem('leader-reviews', 'Leader Reviews')}
                    {subItem('suggestions', 'Suggestion Box')}
                  </>
                )}

                {groupHeader('Table View', adminTableOpen, () => setAdminTableOpen(v => !v))}
                {adminTableOpen && (
                  <>
                    {subItem('table-by-year', 'By Year')}
                    {subItem('table-by-person', 'By Person')}
                  </>
                )}
              </div>
            );
          })()}
        </div>

        {/* Content */}
        <div
          ref={contentRef}
          style={{ overflowY: 'auto', padding: '32px', background: 'linear-gradient(135deg, #f0f4f8 0%, #d9e2ec 100%)' }}
        >
          {activeTab === 'self-review'      && <IframePanel src="/dashboard/self-review" />}
          {activeTab === 'leader-review'    && <IframePanel src="/dashboard/leader-review" />}
          {activeTab === 'hr-review'        && <IframePanel src="/dashboard/hr-review" />}
          {activeTab === 'finance-review'   && <IframePanel src="/dashboard/finance-review" />}
          {activeTab === 'marketing-review' && <IframePanel src="/dashboard/marketing-review" />}
          {activeTab === 'suggestion-box'   && <IframePanel src="/dashboard/suggestion-box" defaultHeight={700} />}
          {activeTab === 'admin-dashboard'  && (
            <iframe
              ref={adminIframeRef}
              src="/dashboard/admin-dashboard"
              scrolling="no"
              onLoad={(e) => {
                const iframe = e.currentTarget;
                const update = () => {
                  try { iframe.style.height = iframe.contentDocument!.documentElement.scrollHeight + 'px'; } catch {}
                };
                update();
                const observer = new ResizeObserver(update);
                observer.observe(iframe.contentDocument!.body);
              }}
              style={{ width: '100%', height: '1200px', border: 'none', borderRadius: '12px', overflow: 'hidden' }}
            />
          )}
          {activeTab === 'my-submissions'   && <IframePanel src="/dashboard/my-submissions" defaultHeight={800} />}
        </div>
      </div>
    </div>
  );
}
