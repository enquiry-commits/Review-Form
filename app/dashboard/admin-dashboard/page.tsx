'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

interface SubmissionRow {
  id: string;
  user_id: string;
  submitted_at: string | null;
  status: 'draft' | 'submitted';
  department: string;
  employee_name: string;
  employee_email: string;
  review_period: string;
  form_data?: any;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeMenu, setActiveMenu] = useState('self-reviews');
  const [selfReviews, setSelfReviews] = useState<SubmissionRow[]>([]);
  const [leaderReviews, setLeaderReviews] = useState<SubmissionRow[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isEmbedded, setIsEmbedded] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState<SubmissionRow | null>(null);
  const [filterDept, setFilterDept] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

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
    setIsEmbedded(window.self !== window.top);
    fetchAllReviews();
  }, [router]);

  const fetchAllReviews = async () => {
    try {
      const [selfRes, leaderRes] = await Promise.all([
        supabase.from('self_review_submissions').select('*'),
        supabase.from('leader_review_submissions').select('*')
      ]);

      if (selfRes.data) {
        setSelfReviews(selfRes.data.map((r: any) => ({
          id: r.id,
          user_id: r.user_id,
          submitted_at: r.submitted_at,
          status: r.submitted_at ? 'submitted' : 'draft',
          department: r.department,
          employee_name: r.employee_name,
          employee_email: r.employee_email,
          review_period: r.review_period,
          form_data: r.form_data
        })));
      }

      if (leaderRes.data) {
        setLeaderReviews(leaderRes.data.map((r: any) => ({
          id: r.id,
          user_id: r.user_id,
          submitted_at: r.submitted_at,
          status: r.submitted_at ? 'submitted' : 'draft',
          department: r.department,
          employee_name: r.employee_name,
          employee_email: r.employee_email,
          review_period: r.review_period,
          form_data: r.form_data
        })));
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const displayData = activeMenu === 'self-reviews' ? selfReviews : leaderReviews;
  const filteredData = displayData.filter(row => {
    const matchesSearch =
      row.employee_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.employee_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.department.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = !filterDept || row.department === filterDept;
    const matchesStatus = !filterStatus || row.status === filterStatus;
    return matchesSearch && matchesDept && matchesStatus;
  });


  const getStatusColor = (status: string) => {
    if (status === 'Completed') return { bg: '#d1fae5', color: '#065f46' };
    if (status === 'Draft') return { bg: '#fef3c7', color: '#92400e' };
    return { bg: '#fee2e2', color: '#991b1b' };
  };

  return (
    <div style={{display: 'grid', gridTemplateColumns: '260px 1fr', minHeight: 'calc(100vh - 70px)', background: 'linear-gradient(135deg, #f0f4f8 0%, #d9e2ec 100%)'}}>
      {/* Navbar (above everything) */}
      {!isEmbedded && (
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
      )}

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
          gap: '12px',
          marginBottom: '24px',
          flexWrap: 'wrap',
          alignItems: 'center'
        }}>
          <div style={{flex: 1, minWidth: '280px', position: 'relative'}}>
            <input
              type="text"
              placeholder="Search name, email, department..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
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

          <select
            value={filterDept}
            onChange={(e) => setFilterDept(e.target.value)}
            style={{
              padding: '10px 14px',
              border: '1.5px solid #e2e8f0',
              borderRadius: '10px',
              fontSize: '13px',
              background: 'white',
              fontFamily: 'inherit',
              cursor: 'pointer'
            }}
          >
            <option value="">All Departments</option>
            <option value="Corporate Secretarial">Corporate Secretarial</option>
            <option value="Accounting">Accounting</option>
            <option value="Tax">Tax</option>
            <option value="Internal">Internal</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{
              padding: '10px 14px',
              border: '1.5px solid #e2e8f0',
              borderRadius: '10px',
              fontSize: '13px',
              background: 'white',
              fontFamily: 'inherit',
              cursor: 'pointer'
            }}
          >
            <option value="">All Status</option>
            <option value="submitted">Submitted</option>
            <option value="draft">Draft</option>
          </select>

          <button onClick={fetchAllReviews} style={{
            padding: '10px 16px',
            border: 'none',
            borderRadius: '10px',
            fontSize: '13px',
            fontWeight: '700',
            cursor: 'pointer',
            background: 'linear-gradient(135deg, #1e3a5f, #162d4a)',
            color: 'white',
            whiteSpace: 'nowrap'
          }}>
            🔄 Refresh
          </button>

          <button onClick={exportToCSV} style={{
            padding: '10px 16px',
            border: 'none',
            borderRadius: '10px',
            fontSize: '13px',
            fontWeight: '700',
            cursor: 'pointer',
            background: 'linear-gradient(135deg, #7eb8d4, #6ba3c5)',
            color: 'white',
            whiteSpace: 'nowrap'
          }}>
            📊 Export CSV
          </button>
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
              {filteredData.length > 0 ? filteredData.map((row, idx) => {
                const statusColor = getStatusColor(row.status === 'submitted' ? 'Completed' : 'Draft');
                const submittedDate = row.submitted_at ? new Date(row.submitted_at).toLocaleString() : '-';
                return (
                  <tr
                    key={row.id}
                    style={{borderBottom: idx < filteredData.length - 1 ? '1px solid #e2e8f0' : 'none', transition: 'all 0.3s'}}
                    onMouseEnter={(e) => {e.currentTarget.style.background = 'rgba(126, 184, 212, 0.06)'}}
                    onMouseLeave={(e) => {e.currentTarget.style.background = 'transparent'}}
                  >
                    <td style={{padding: '16px 18px', fontSize: '13px', color: '#475569'}}>{submittedDate}</td>
                    <td style={{padding: '16px 18px', fontSize: '13px', color: '#475569'}}>{row.department}</td>
                    <td style={{padding: '16px 18px', fontSize: '13px', color: '#475569'}}>{row.employee_name}</td>
                    <td style={{padding: '16px 18px', fontSize: '13px', color: '#475569'}}>{row.employee_email}</td>
                    <td style={{padding: '16px 18px', fontSize: '13px', color: '#475569'}}>{row.review_period}</td>
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
                        {row.status === 'submitted' ? '✓ Submitted' : '⏱ Draft'}
                      </span>
                    </td>
                    <td style={{padding: '16px 18px'}}>
                      <button onClick={() => setSelectedDetail(row)} style={{
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
                        View Details
                      </button>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={7} style={{padding: '40px 18px', textAlign: 'center', color: '#64748b', fontSize: '14px'}}>
                    No submissions yet
                  </td>
                </tr>
              )}
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

{/* Detail Modal */}
      {selectedDetail && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '40px',
            maxWidth: '700px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
          }}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px'}}>
              <h2 style={{fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: 0}}>
                {selectedDetail.employee_name}
              </h2>
              <button onClick={() => setSelectedDetail(null)} style={{
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: '#64748b'
              }}>
                ✕
              </button>
            </div>

            <div style={{display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '24px'}}>
              <div>
                <label style={{fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase'}}>Email</label>
                <p style={{fontSize: '14px', color: '#0f172a', margin: '8px 0 0 0'}}>{selectedDetail.employee_email}</p>
              </div>
              <div>
                <label style={{fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase'}}>Department</label>
                <p style={{fontSize: '14px', color: '#0f172a', margin: '8px 0 0 0'}}>{selectedDetail.department}</p>
              </div>
              <div>
                <label style={{fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase'}}>Period</label>
                <p style={{fontSize: '14px', color: '#0f172a', margin: '8px 0 0 0'}}>{selectedDetail.review_period}</p>
              </div>
              <div>
                <label style={{fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase'}}>Status</label>
                <p style={{fontSize: '14px', color: '#0f172a', margin: '8px 0 0 0'}}>
                  {selectedDetail.status === 'submitted' ? '✓ Submitted' : '⏱ Draft'}
                </p>
              </div>
            </div>

            <div style={{borderTop: '1px solid #e2e8f0', paddingTop: '20px', marginTop: '20px'}}>
              <h3 style={{fontSize: '16px', fontWeight: '700', color: '#0f172a', marginBottom: '16px'}}>Form Data</h3>
              {selectedDetail.form_data ? (
                <pre style={{
                  background: '#f8fafc',
                  padding: '16px',
                  borderRadius: '10px',
                  fontSize: '12px',
                  color: '#475569',
                  overflow: 'auto',
                  maxHeight: '300px'
                }}>
                  {JSON.stringify(selectedDetail.form_data, null, 2)}
                </pre>
              ) : (
                <p style={{fontSize: '14px', color: '#64748b'}}>No data available</p>
              )}
            </div>

            <div style={{display: 'flex', gap: '12px', marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #e2e8f0'}}>
              <button onClick={() => setSelectedDetail(null)} style={{
                flex: 1,
                padding: '12px 20px',
                border: '1.5px solid #e2e8f0',
                borderRadius: '10px',
                background: 'white',
                color: '#64748b',
                fontWeight: '600',
                cursor: 'pointer'
              }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
