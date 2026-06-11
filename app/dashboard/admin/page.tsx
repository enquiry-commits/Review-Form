'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@/lib/auth';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

interface Review {
  id: string;
  user_id: string;
  department: string;
  review_period: string;
  status: 'draft' | 'submitted';
  created_at: string;
  submitted_at: string | null;
  file_links: Record<string, Array<{name: string; url: string}>>;
  employee_name?: string;
  employee_email?: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

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
    fetchReviews();
  }, [router]);

  const fetchReviews = async () => {
    try {
      const { data, error } = await supabase
        .from('self_review_submissions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const enrichedReviews = await Promise.all(
        (data || []).map(async (review) => {
          const { data: userData } = await supabase
            .from('users')
            .select('name, email')
            .eq('id', review.user_id)
            .single();

          return {
            ...review,
            employee_name: userData?.name || 'Unknown',
            employee_email: userData?.email || '-'
          };
        })
      );

      setReviews(enrichedReviews);
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

  const filteredReviews = reviews.filter(review =>
    review.employee_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    review.employee_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    review.department?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getAllFiles = (review: Review) => {
    const files: Array<{name: string; url: string; fieldId: string}> = [];
    Object.entries(review.file_links || {}).forEach(([fieldId, fileList]) => {
      (fileList || []).forEach(file => {
        files.push({ ...file, fieldId });
      });
    });
    return files;
  };

  const exportCSV = () => {
    const headers = ['提交时间', '部门', '员工名称', '邮箱', '评审周期', '状态', '文件数量'];
    const rows = filteredReviews.map(review => [
      new Date(review.created_at).toLocaleString(),
      review.department,
      review.employee_name,
      review.employee_email,
      review.review_period,
      review.status,
      getAllFiles(review).length
    ]);

    const csv = [headers, ...rows].map(row =>
      row.map(cell => `"${cell}"`).join(',')
    ).join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `reviews_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  if (loading) {
    return <div style={{minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #f0f4f8 0%, #d9e2ec 100%)'}}>
      <div style={{color: '#64748b'}}>Loading...</div>
    </div>;
  }

  if (!user || user.role !== 'admin') {
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
          maxWidth: '1400px',
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
            <div style={{fontSize: '14px', fontWeight: '800', color: '#1e3a5f'}}>Admin Dashboard</div>
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

      {/* Content */}
      <div style={{padding: '48px 32px', maxWidth: '1400px', margin: '0 auto'}}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          borderRadius: '24px',
          padding: '48px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.08)',
          border: '1px solid rgba(30, 58, 95, 0.06)'
        }}>
          {/* Title */}
          <div style={{marginBottom: '32px'}}>
            <h1 style={{fontSize: '32px', fontWeight: '800', color: '#0f172a', marginBottom: '8px'}}>Self Review Submissions</h1>
            <p style={{color: '#64748b', fontSize: '15px'}}>Monitor employee self-review submissions and completion status</p>
          </div>

          {/* Controls */}
          <div style={{display: 'flex', gap: '16px', marginBottom: '32px', alignItems: 'center'}}>
            <input
              type="text"
              placeholder="Search name, email, department..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                flex: 1,
                padding: '12px 16px',
                border: '1.5px solid #e2e8f0',
                borderRadius: '12px',
                fontSize: '14px',
                color: '#1a1a2e'
              }}
            />
            <button
              onClick={exportCSV}
              style={{
                padding: '12px 24px',
                background: '#1e3a5f',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.3s'
              }}
              onMouseEnter={(e) => {e.currentTarget.style.background = '#162d4a'}}
              onMouseLeave={(e) => {e.currentTarget.style.background = '#1e3a5f'}}
            >
              Export CSV
            </button>
            <button
              onClick={fetchReviews}
              style={{
                padding: '12px 24px',
                background: '#7eb8d4',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.3s'
              }}
              onMouseEnter={(e) => {e.currentTarget.style.background = '#6ba8c4'}}
              onMouseLeave={(e) => {e.currentTarget.style.background = '#7eb8d4'}}
            >
              Refresh
            </button>
          </div>

          {/* Table */}
          <div style={{overflowX: 'auto'}}>
            <table style={{width: '100%', borderCollapse: 'collapse'}}>
              <thead>
                <tr style={{borderBottom: '2px solid #e2e8f0'}}>
                  <th style={{padding: '16px', textAlign: 'left', fontWeight: '700', color: '#334155', fontSize: '12px'}}>SUBMITTED</th>
                  <th style={{padding: '16px', textAlign: 'left', fontWeight: '700', color: '#334155', fontSize: '12px'}}>DEPARTMENT</th>
                  <th style={{padding: '16px', textAlign: 'left', fontWeight: '700', color: '#334155', fontSize: '12px'}}>NAME</th>
                  <th style={{padding: '16px', textAlign: 'left', fontWeight: '700', color: '#334155', fontSize: '12px'}}>EMAIL</th>
                  <th style={{padding: '16px', textAlign: 'left', fontWeight: '700', color: '#334155', fontSize: '12px'}}>PERIOD</th>
                  <th style={{padding: '16px', textAlign: 'left', fontWeight: '700', color: '#334155', fontSize: '12px'}}>STATUS</th>
                  <th style={{padding: '16px', textAlign: 'left', fontWeight: '700', color: '#334155', fontSize: '12px'}}>FILES</th>
                  <th style={{padding: '16px', textAlign: 'left', fontWeight: '700', color: '#334155', fontSize: '12px'}}>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {filteredReviews.map((review) => {
                  const files = getAllFiles(review);
                  return (
                    <tr key={review.id} style={{borderBottom: '1px solid #e2e8f0'}}>
                      <td style={{padding: '16px', color: '#1a1a2e', fontSize: '14px'}}>
                        {new Date(review.created_at).toLocaleString()}
                      </td>
                      <td style={{padding: '16px', color: '#1a1a2e', fontSize: '14px'}}>{review.department}</td>
                      <td style={{padding: '16px', color: '#1a1a2e', fontSize: '14px'}}>{review.employee_name}</td>
                      <td style={{padding: '16px', color: '#1a1a2e', fontSize: '14px'}}>{review.employee_email}</td>
                      <td style={{padding: '16px', color: '#1a1a2e', fontSize: '14px'}}>{review.review_period}</td>
                      <td style={{padding: '16px'}}>
                        <span style={{
                          display: 'inline-block',
                          padding: '6px 12px',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: '700',
                          background: review.status === 'submitted' ? '#d1fae5' : '#fef3c7',
                          color: review.status === 'submitted' ? '#065f46' : '#92400e'
                        }}>
                          {review.status === 'submitted' ? '✓ Completed' : '⌛ Draft'}
                        </span>
                      </td>
                      <td style={{padding: '16px'}}>
                        <div style={{display: 'flex', flexDirection: 'column', gap: '6px', maxWidth: '200px'}}>
                          {files.length > 0 ? (
                            files.slice(0, 2).map((file, idx) => (
                              <a
                                key={idx}
                                href={file.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  fontSize: '12px',
                                  color: '#7eb8d4',
                                  textDecoration: 'none',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap'
                                }}
                                title={file.name}
                              >
                                📄 {file.name}
                              </a>
                            ))
                          ) : null}
                          {files.length > 2 && (
                            <span style={{fontSize: '12px', color: '#94a3b8'}}>
                              +{files.length - 2} more
                            </span>
                          )}
                          {files.length === 0 && (
                            <span style={{fontSize: '12px', color: '#94a3b8'}}>-</span>
                          )}
                        </div>
                      </td>
                      <td style={{padding: '16px'}}>
                        <Link href={`/dashboard/admin/review/${review.id}`} style={{
                          fontSize: '14px',
                          color: '#7eb8d4',
                          textDecoration: 'none',
                          fontWeight: '600'
                        }}>
                          View Details
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredReviews.length === 0 && (
            <div style={{textAlign: 'center', padding: '48px', color: '#64748b'}}>
              <p>No records found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
