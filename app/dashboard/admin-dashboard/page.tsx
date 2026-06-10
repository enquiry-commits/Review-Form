'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@/lib/auth';
import Link from 'next/link';

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeMenu, setActiveMenu] = useState('self-reviews');

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/');
      return;
    }
    const parsedUser = JSON.parse(userData);
    if (parsedUser.role !== 'admin') {
      router.push('/dashboard');
      return;
    }
    setUser(parsedUser);
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

  const mockData = [
    { date: '2026-06-10 14:32', dept: 'Corporate Secretarial', name: 'Jenny Lai', email: 'jennylai@tassure.com', period: 'June 2026', status: 'Completed', action: 'View Details' },
    { date: '2026-06-10 11:45', dept: 'Accounting', name: 'Tee Yu Heng', email: 'yuheng@tassure.com', period: 'June 2026', status: 'Draft', action: 'View Details' },
    { date: '2026-06-08 09:20', dept: 'Tax', name: 'Quinnie Tan', email: 'quinnietan@tassure.com', period: 'June 2026', status: 'Completed', action: 'View Details' },
    { date: '-', dept: 'Corporate Secretarial', name: 'Chin Kah Ye', email: 'kahye@tassure.com', period: 'June 2026', status: 'Pending', action: 'Send Reminder' },
    { date: '-', dept: 'Accounting', name: 'Vernice Chai', email: 'vernice@tassure.com', period: 'June 2026', status: 'Pending', action: 'Send Reminder' },
  ];

  const getStatusColor = (status: string) => {
    if (status === 'Completed') return { bg: '#d1fae5', color: '#065f46' };
    if (status === 'Draft') return { bg: '#fef3c7', color: '#92400e' };
    return { bg: '#fee2e2', color: '#991b1b' };
  };

  return (
    <div style={{display: 'grid', gridTemplateColumns: '260px 1fr', minHeight: 'calc(100vh - 70px)', background: 'linear-gradient(135deg, #f0f4f8 0%, #d9e2ec 100%)'}}>
      {/* Navbar (above everything) */}
      <div style={{gridColumn: '1 / -1', background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)', borderBottom: '1px solid rgba(30, 58, 95, 0.08)', boxShadow: '0 2px 12px rgba(0, 0, 0, 0.04)'}}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          maxWidth: '1600px',
          margin: '0 auto',
          padding: '0 32px',
          height: '70px'
        }}>
          <Link href="/dashboard" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            textDecoration: 'none'
          }}>
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
                borderRadius: '10px',
                transition: 'all 0.3s'
              }}
              onMouseEnter={(e) => {e.currentTarget.style.background = 'rgba(30, 58, 95, 0.04)'}}
              onMouseLeave={(e) => {e.currentTarget.style.background = 'transparent'}}
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        borderRight: '1px solid rgba(30, 58, 95, 0.08)',
        padding: '32px 24px',
        position: 'sticky',
        top: 70,
        height: 'calc(100vh - 70px)',
        overflowY: 'auto'
      }}>
        <div style={{marginBottom: '28px'}}>
          <div style={{fontSize: '12px', fontWeight: '800', color: '#1e3a5f', letterSpacing: '0.4px', marginBottom: '14px', textTransform: 'uppercase'}}>📊 Data</div>
          <div style={{display: 'flex', flexDirection: 'column', gap: '6px'}}>
            {['self-reviews', 'leader-reviews'].map(item => (
              <div
                key={item}
                onClick={() => setActiveMenu(item)}
                style={{
                  padding: '11px 14px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: activeMenu === item ? '#1e3a5f' : '#64748b',
                  transition: 'all 0.3s',
                  borderLeft: '3px solid',
                  borderLeftColor: activeMenu === item ? '#7eb8d4' : 'transparent',
                  background: activeMenu === item ? 'rgba(126, 184, 212, 0.15)' : 'transparent'
                }}
                onMouseEnter={(e) => {
                  if (activeMenu !== item) {
                    e.currentTarget.style.background = 'rgba(30, 58, 95, 0.06)';
                    e.currentTarget.style.color = '#1e3a5f';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeMenu !== item) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#64748b';
                  }
                }}
              >
                {item === 'self-reviews' ? 'Self Reviews' : 'Leader Reviews'}
              </div>
            ))}
          </div>
        </div>

        <hr style={{border: 'none', borderTop: '1px solid #e2e8f0', margin: '20px 0'}} />

        <div style={{marginBottom: '28px'}}>
          <div style={{fontSize: '12px', fontWeight: '800', color: '#1e3a5f', letterSpacing: '0.4px', marginBottom: '14px', textTransform: 'uppercase'}}>🔧 Tools</div>
          <div style={{display: 'flex', flexDirection: 'column', gap: '6px'}}>
            {['settings', 'export'].map(item => (
              <div
                key={item}
                style={{
                  padding: '11px 14px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: '#64748b',
                  transition: 'all 0.3s',
                  borderLeft: '3px solid transparent'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(30, 58, 95, 0.06)';
                  e.currentTarget.style.color = '#1e3a5f';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#64748b';
                }}
              >
                {item === 'settings' ? 'Settings' : 'Export All'}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{padding: '40px', overflowY: 'auto'}}>
        <div style={{marginBottom: '32px'}}>
          <h1 style={{fontSize: '32px', fontWeight: '800', color: '#0f172a', marginBottom: '8px', letterSpacing: '-0.5px'}}>
            {activeMenu === 'self-reviews' ? 'Self Review Submissions' : 'Leader Review Submissions'}
          </h1>
          <p style={{color: '#64748b', fontSize: '14px'}}>
            {activeMenu === 'self-reviews'
              ? 'Monitor employee self-review submissions and completion status'
              : 'Monitor leader review submissions and completion status'}
          </p>
        </div>

        {/* Toolbar */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          padding: '20px',
          borderRadius: '14px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.04)',
          border: '1px solid rgba(255, 255, 255, 0.8)',
          gap: '16px'
        }}>
          <div style={{flex: 1, maxWidth: '320px', position: 'relative'}}>
            <input
              type="text"
              placeholder="Search name, email, department..."
              style={{
                width: '100%',
                padding: '10px 14px 10px 36px',
                border: '1.5px solid #e2e8f0',
                borderRadius: '10px',
                fontSize: '13px',
                background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)',
                fontFamily: 'inherit'
              }}
            />
            <div style={{position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '13px'}}>🔍</div>
          </div>
          <div style={{display: 'flex', gap: '10px'}}>
            <button style={{
              padding: '10px 16px',
              border: 'none',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: '700',
              cursor: 'pointer',
              background: 'linear-gradient(135deg, #1e3a5f, #162d4a)',
              color: 'white',
              boxShadow: '0 4px 12px rgba(30, 58, 95, 0.25)',
              transition: 'all 0.3s'
            }}>
              📥 Export CSV
            </button>
            <button style={{
              padding: '10px 16px',
              border: '1.5px solid rgba(126, 184, 212, 0.3)',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: '700',
              cursor: 'pointer',
              background: 'rgba(126, 184, 212, 0.12)',
              color: '#1e3a5f',
              transition: 'all 0.3s'
            }}>
              🔄 Refresh
            </button>
          </div>
        </div>

        {/* Data Table */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.08)',
          border: '1px solid rgba(255, 255, 255, 0.8)'
        }}>
          <table style={{width: '100%', borderCollapse: 'collapse'}}>
            <thead style={{background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)', borderBottom: '2px solid #e2e8f0'}}>
              <tr>
                <th style={{padding: '16px 18px', textAlign: 'left', fontWeight: '700', fontSize: '12px', color: '#334155', letterSpacing: '0.4px', textTransform: 'uppercase'}}>Submitted</th>
                <th style={{padding: '16px 18px', textAlign: 'left', fontWeight: '700', fontSize: '12px', color: '#334155', letterSpacing: '0.4px', textTransform: 'uppercase'}}>Department</th>
                <th style={{padding: '16px 18px', textAlign: 'left', fontWeight: '700', fontSize: '12px', color: '#334155', letterSpacing: '0.4px', textTransform: 'uppercase'}}>Name</th>
                <th style={{padding: '16px 18px', textAlign: 'left', fontWeight: '700', fontSize: '12px', color: '#334155', letterSpacing: '0.4px', textTransform: 'uppercase'}}>Email</th>
                <th style={{padding: '16px 18px', textAlign: 'left', fontWeight: '700', fontSize: '12px', color: '#334155', letterSpacing: '0.4px', textTransform: 'uppercase'}}>Period</th>
                <th style={{padding: '16px 18px', textAlign: 'left', fontWeight: '700', fontSize: '12px', color: '#334155', letterSpacing: '0.4px', textTransform: 'uppercase'}}>Status</th>
                <th style={{padding: '16px 18px', textAlign: 'left', fontWeight: '700', fontSize: '12px', color: '#334155', letterSpacing: '0.4px', textTransform: 'uppercase'}}>Action</th>
              </tr>
            </thead>
            <tbody>
              {mockData.map((row, idx) => {
                const statusColor = getStatusColor(row.status);
                return (
                  <tr
                    key={idx}
                    style={{borderBottom: idx < mockData.length - 1 ? '1px solid #e2e8f0' : 'none', transition: 'all 0.3s'}}
                    onMouseEnter={(e) => {e.currentTarget.style.background = 'rgba(126, 184, 212, 0.06)'}}
                    onMouseLeave={(e) => {e.currentTarget.style.background = 'transparent'}}
                  >
                    <td style={{padding: '16px 18px', fontSize: '13px', color: '#475569'}}>{row.date}</td>
                    <td style={{padding: '16px 18px', fontSize: '13px', color: '#475569'}}>{row.dept}</td>
                    <td style={{padding: '16px 18px', fontSize: '13px', color: '#475569'}}>{row.name}</td>
                    <td style={{padding: '16px 18px', fontSize: '13px', color: '#475569'}}>{row.email}</td>
                    <td style={{padding: '16px 18px', fontSize: '13px', color: '#475569'}}>{row.period}</td>
                    <td style={{padding: '16px 18px', fontSize: '13px'}}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        fontSize: '11px',
                        fontWeight: '700',
                        background: statusColor.bg,
                        color: statusColor.color
                      }}>
                        {row.status === 'Completed' ? '✓ Completed' : row.status === 'Draft' ? '⏱ Draft' : '⚠ Pending'}
                      </span>
                    </td>
                    <td style={{padding: '16px 18px'}}>
                      <button style={{
                        padding: '6px 12px',
                        border: 'none',
                        borderRadius: '8px',
                        background: 'rgba(126, 184, 212, 0.15)',
                        color: '#1e3a5f',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: '600',
                        transition: 'all 0.3s'
                      }}
                      onMouseEnter={(e) => {e.currentTarget.style.background = 'rgba(126, 184, 212, 0.3)'}}
                      onMouseLeave={(e) => {e.currentTarget.style.background = 'rgba(126, 184, 212, 0.15)'}}
                      >
                        {row.action}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div style={{display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #e2e8f0'}}>
          {['← Previous', '1', '2', 'Next →'].map((btn) => (
            <button
              key={btn}
              style={{
                padding: '8px 12px',
                border: '1.5px solid #e2e8f0',
                borderRadius: '8px',
                background: btn === '1' ? 'linear-gradient(135deg, #1e3a5f, #162d4a)' : 'white',
                color: btn === '1' ? 'white' : '#64748b',
                fontWeight: '600',
                fontSize: '12px',
                cursor: 'pointer',
                transition: 'all 0.3s'
              }}
              onMouseEnter={(e) => {
                if (btn !== '1') {
                  e.currentTarget.style.borderColor = '#7eb8d4';
                  e.currentTarget.style.color = '#1e3a5f';
                }
              }}
              onMouseLeave={(e) => {
                if (btn !== '1') {
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.color = '#64748b';
                }
              }}
            >
              {btn}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
