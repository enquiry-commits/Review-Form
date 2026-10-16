'use client';

import { useEffect, useRef, useState, ReactElement } from 'react';
import { useRouter } from 'next/navigation';
import { User, hasAccess, logout, ALL_USERS, VIEW_AS_EMAILS, VIEW_AS_DEPARTMENT_ORDER, DIRECTOR_EMAILS } from '@/lib/auth';

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

// Directors land on the Admin Dashboard (where they review and comment)
const defaultTabFor = (email: string) =>
  DIRECTOR_EMAILS.includes(email) ? 'admin-dashboard'
  : email === 'esther@tassure.com' ? 'hr-review'
  : email === 'chelsea@tassure.com' ? 'finance-review'
  : 'self-review';

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
  // The signed-in person, when 'user' currently holds someone else (View as)
  const [realUser, setRealUser] = useState<User | null>(null);
  const [viewKey, setViewKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('self-review');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [adminMenu, setAdminMenu] = useState('self-reviews');
  const [adminStatusOpen, setAdminStatusOpen] = useState(false);
  const [adminDataOpen, setAdminDataOpen] = useState(true);
  const [adminTableOpen, setAdminTableOpen] = useState(false);
  const [viewAsOpen, setViewAsOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const adminIframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) { router.push('/'); return; }
    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);
    const realRaw = localStorage.getItem('realUser');
    setRealUser(realRaw ? JSON.parse(realRaw) : parsedUser);
    setActiveTab(defaultTabFor(parsedUser.email));
    // Deep link from the feedback notification email: /dashboard?tab=my-submissions
    if (new URLSearchParams(window.location.search).get('tab') === 'my-submissions' && parsedUser.role !== 'admin') setActiveTab('my-submissions');
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

  const handleLogout = async () => { await logout(); router.push('/'); };

  // View as: the other pages read the person from localStorage 'user', so swap
  // it there and remount the panels; the real account is kept in 'realUser'.
  const handleViewAs = (email: string) => {
    if (!realUser || !VIEW_AS_EMAILS.includes(realUser.email)) return;
    const target = ALL_USERS.find(u => u.email === email) ?? realUser;
    if (target.email === realUser.email) localStorage.removeItem('realUser');
    else localStorage.setItem('realUser', JSON.stringify(realUser));
    localStorage.setItem('user', JSON.stringify(target));
    setUser(target);
    setActiveTab(defaultTabFor(target.email));
    setViewKey(k => k + 1);
    contentRef.current?.scrollTo({ top: 0 });
  };

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
    if (tabId === 'admin-dashboard') {
      setSidebarCollapsed(false);
      const defaultMenu = user?.email === 'vincent@tassure.com' ? 'status-overview' : 'self-reviews';
      setAdminMenu(defaultMenu);
      adminIframeRef.current?.contentWindow?.postMessage({ type: 'setAdminMenu', menu: defaultMenu }, '*');
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
    { id: 'finance-review',   label: 'Finance Review',   allowed: email === 'chelsea@tassure.com' || email === 'vincent@tassure.com' || email === 'esther@tassure.com' },
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
        userSelect: 'none',
        WebkitUserSelect: 'none',
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
          padding: '0 24px', height: '72px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img src="/tassure-logo.png" alt="Tassure" style={{ height: '52px', width: 'auto' }} />
            <div style={{ fontSize: '18px', fontWeight: '800', color: '#1e3a5f' }}>Tassure Review System</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ textAlign: 'right', lineHeight: 1.25 }}>
              <div style={{ fontSize: '14px', fontWeight: '700', color: '#1e3a5f' }}>{(realUser ?? user).name}</div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>{(realUser ?? user).email}</div>
            </div>
            {realUser && VIEW_AS_EMAILS.includes(realUser.email) && (
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setViewAsOpen(o => !o)}
                  title="View as / 切换用户"
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 12px', height: '40px', border: '1.5px solid #e2e8f0', borderRadius: '10px', background: 'white', color: '#1e3a5f', cursor: 'pointer', fontSize: '13px', fontWeight: '600', fontFamily: 'inherit' }}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 5.5h11M10.5 3l2.5 2.5-2.5 2.5"/>
                    <path d="M14 10.5H3M5.5 8L3 10.5 5.5 13"/>
                  </svg>
                  <span style={{ maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user.name}{user.email === realUser.email ? ' (me)' : ''}
                  </span>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'transform 0.2s', transform: viewAsOpen ? 'rotate(180deg)' : 'none' }}>
                    <path d="M2.5 4.5L6 8l3.5-3.5"/>
                  </svg>
                </button>
                {viewAsOpen && (
                  <>
                    <div onClick={() => setViewAsOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 1000 }} />
                    <div style={{ position: 'absolute', top: '46px', right: 0, width: '248px', maxHeight: 'min(520px, 75vh)', overflowY: 'auto', zIndex: 1001, background: 'white', border: '1px solid #e2e8f0', borderRadius: '14px', boxShadow: '0 12px 40px rgba(15,23,42,0.18)', padding: '6px 6px 8px' }}>
                      {VIEW_AS_DEPARTMENT_ORDER.map(dept => {
                        const people = ALL_USERS.filter(u => u.department === dept);
                        if (people.length === 0) return null;
                        return (
                          <div key={dept}>
                            <div style={{ margin: '8px 0 4px', padding: '8px 12px', borderRadius: '8px', background: '#d9eaf5', color: '#1e3a5f', fontSize: '14px', fontWeight: '800', letterSpacing: '0.4px', textTransform: 'uppercase' }}>{dept}</div>
                            {people.map(u => {
                              const selected = u.email === user.email;
                              return (
                                <button
                                  key={u.email}
                                  onClick={() => { setViewAsOpen(false); handleViewAs(u.email); }}
                                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '8px 12px', border: 'none', borderRadius: '8px', background: selected ? '#e5e7eb' : 'transparent', color: '#1e3a5f', fontSize: '13px', fontWeight: selected ? '700' : '500', fontFamily: 'inherit', textAlign: 'left', cursor: 'pointer' }}
                                  onMouseEnter={(e) => { if (!selected) e.currentTarget.style.background = '#f1f5f9'; }}
                                  onMouseLeave={(e) => { if (!selected) e.currentTarget.style.background = 'transparent'; }}
                                >
                                  <span>{u.name}{u.email === realUser.email && <span style={{ marginLeft: '6px', fontSize: '11px', fontWeight: '500', color: '#94a3b8' }}>(me)</span>}</span>
                                  {selected && <span style={{ color: '#1e3a5f', fontWeight: '800' }}>✓</span>}
                                </button>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            )}
            <button
              onClick={handleLogout}
              style={{ height: '40px', padding: '0 18px', fontSize: '14px', fontWeight: '600', color: '#1e3a5f', background: 'white', border: '1.5px solid #e2e8f0', cursor: 'pointer', borderRadius: '10px', transition: 'all 0.2s' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#f1f5f9'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'white'; }}
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {realUser && user.email !== realUser.email && (
        <div style={{ flexShrink: 0, background: '#fef3c7', borderBottom: '1px solid #fbbf24', color: '#92400e', fontSize: '13px', fontWeight: '600', padding: '8px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <span>Viewing as {user.name} ({user.email}) — 正在以此用户身份查看</span>
          <button onClick={() => handleViewAs(realUser.email)} style={{ padding: '4px 12px', background: '#92400e', color: 'white', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>Back to me</button>
        </div>
      )}

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
                  whiteSpace: 'nowrap', overflow: 'hidden', transition: 'all 0.2s', userSelect: 'none', WebkitUserSelect: 'none' }}
                onMouseEnter={e => { if (adminMenu !== id) { e.currentTarget.style.background = 'rgba(30,58,95,0.06)'; e.currentTarget.style.color = '#1e3a5f'; }}}
                onMouseLeave={e => { if (adminMenu !== id) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#64748b'; }}}>
                {label}
              </div>
            );
            const groupHeader = (title: string, isOpen: boolean, onToggle: () => void, showDivider = true) => (
              <div key={`hdr-${title}`}>
                {showDivider && <div style={{ borderTop: '1px dashed #e2e8f0', margin: '8px 0 4px' }} />}
                <div onClick={onToggle} style={{ fontSize: '11px', fontWeight: '800', color: '#1e3a5f', letterSpacing: '0.6px', textTransform: 'uppercase', padding: '5px 14px 5px 28px', display: 'flex', alignItems: 'center', gap: '6px', opacity: 0.7, cursor: 'pointer', borderRadius: '8px', transition: 'all 0.15s', userSelect: 'none', WebkitUserSelect: 'none' }}
                  onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.background = 'rgba(30,58,95,0.04)'; }}
                  onMouseLeave={e => { e.currentTarget.style.opacity = '0.7'; e.currentTarget.style.background = 'transparent'; }}>
                  <span style={{ fontSize: '10px', display: 'inline-block', transition: 'transform 0.2s', transform: isOpen ? 'rotate(90deg)' : 'none', flexShrink: 0 }}>›</span>
                  {title}
                </div>
              </div>
            );
            return (
              <div style={{ marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '1px' }}>
                {email === 'vincent@tassure.com' && groupHeader('Status', adminStatusOpen, () => setAdminStatusOpen(v => !v), false)}
                {email === 'vincent@tassure.com' && adminStatusOpen && subItem('status-overview', 'Status Overview')}

                {groupHeader('Reviews', adminDataOpen, () => setAdminDataOpen(v => !v), email === 'vincent@tassure.com')}
                {adminDataOpen && (
                  <>
                    {subItem('self-reviews', 'Review & Comment')}
                    {/* Leader Reviews hidden for now: {subItem('leader-reviews', 'Leader Reviews')} */}
                    {subItem('suggestions', 'Suggestion Box')}
                  </>
                )}

                {groupHeader('Overview', adminTableOpen, () => setAdminTableOpen(v => !v))}
                {adminTableOpen && (
                  <>
                    {subItem('table-by-year', 'By Year')}
                    {/* By Person hidden for now: {subItem('table-by-person', 'By Person')} */}
                  </>
                )}
              </div>
            );
          })()}
        </div>

        {/* Content */}
        <div
          ref={contentRef}
          key={viewKey}
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
