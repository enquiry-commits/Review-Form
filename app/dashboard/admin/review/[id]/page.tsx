'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { User } from '@/lib/auth';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

interface ReviewDetail {
  id: string;
  user_id: string;
  department: string;
  review_period: string;
  status: 'draft' | 'submitted';
  created_at: string;
  submitted_at: string | null;
  file_links: Record<string, Array<{name: string; url: string}>>;

  // KPI Data
  client_complaints_count: number;
  client_complaints_comment: string;
  client_attrition_count: number;
  client_attrition_comment: string;
  minor_delays_count: number;
  minor_delays_comment: string;
  serious_delays_count: number;
  serious_delays_comment: string;
  minor_errors_count: number;
  minor_errors_comment: string;
  serious_errors_count: number;
  serious_errors_comment: string;
  communication_issues_count: number;
  communication_issues_comment: string;
  team_impact_count: number;
  team_impact_comment: string;
  learning_application_count: number;
  learning_application_comment: string;

  employee_name?: string;
  employee_email?: string;
}

const KPIItem = ({ label, count, comment, files }: { label: string; count: number; comment: string; files: Array<{name: string; url: string}> }) => (
  <div style={{border: '1.5px solid #e2e8f0', borderRadius: '12px', padding: '16px', marginBottom: '12px'}}>
    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px'}}>
      <h4 style={{fontSize: '14px', fontWeight: '700', color: '#0f172a', margin: 0}}>{label}</h4>
      <span style={{fontSize: '16px', fontWeight: '800', color: '#1e3a5f', background: '#eaf0f7', padding: '4px 12px', borderRadius: '8px'}}>
        {count}
      </span>
    </div>
    {comment && (
      <div style={{background: '#f8fafc', padding: '12px', borderRadius: '8px', marginBottom: '12px'}}>
        <p style={{fontSize: '13px', color: '#64748b', margin: 0}}>{comment}</p>
      </div>
    )}
    {files && files.length > 0 && (
      <div style={{marginTop: '12px'}}>
        <p style={{fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '8px'}}>Files:</p>
        {files.map((file, idx) => (
          <a
            key={idx}
            href={file.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'block',
              fontSize: '12px',
              color: '#7eb8d4',
              textDecoration: 'none',
              marginBottom: '4px'
            }}
          >
            📄 {file.name}
          </a>
        ))}
      </div>
    )}
  </div>
);

export default function ReviewDetail() {
  const router = useRouter();
  const params = useParams();
  const [user, setUser] = useState<User | null>(null);
  const [review, setReview] = useState<ReviewDetail | null>(null);
  const [loading, setLoading] = useState(true);

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
    fetchReview();
  }, [router, params]);

  const fetchReview = async () => {
    try {
      const { data, error } = await supabase
        .from('self_review_submissions')
        .select('*')
        .eq('id', params.id)
        .single();

      if (error) throw error;

      const { data: userData } = await supabase
        .from('users')
        .select('name, email')
        .eq('id', data.user_id)
        .single();

      setReview({
        ...data,
        employee_name: userData?.name || 'Unknown',
        employee_email: userData?.email || '-'
      });
    } catch (error) {
      console.error('Error fetching review:', error);
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

  if (!review) {
    return <div style={{minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #f0f4f8 0%, #d9e2ec 100%)'}}>
      <div style={{color: '#64748b'}}>Review not found</div>
    </div>;
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
          <Link href="/dashboard/admin" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            textDecoration: 'none'
          }}>
            <img src="/tassure-logo.png" alt="Tassure" style={{height: '32px', width: 'auto'}} />
            <div style={{fontSize: '14px', fontWeight: '800', color: '#1e3a5f'}}>Review Details</div>
          </Link>
          <div style={{display: 'flex', alignItems: 'center', gap: '16px'}}>
            <span style={{fontSize: '14px', color: '#64748b'}}>{user?.name}</span>
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
      <div style={{padding: '48px 32px', maxWidth: '1200px', margin: '0 auto'}}>
        <Link href="/dashboard/admin" style={{
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
          {/* Header */}
          <div style={{marginBottom: '40px', paddingBottom: '32px', borderBottom: '1px solid #e2e8f0'}}>
            <h1 style={{fontSize: '32px', fontWeight: '800', color: '#0f172a', marginBottom: '16px'}}>
              {review.employee_name} - Self Review
            </h1>
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', fontSize: '14px'}}>
              <div>
                <span style={{color: '#94a3b8', fontWeight: '700'}}>Department</span>
                <p style={{color: '#0f172a', margin: '4px 0 0 0'}}>{review.department}</p>
              </div>
              <div>
                <span style={{color: '#94a3b8', fontWeight: '700'}}>Review Period</span>
                <p style={{color: '#0f172a', margin: '4px 0 0 0'}}>{review.review_period}</p>
              </div>
              <div>
                <span style={{color: '#94a3b8', fontWeight: '700'}}>Status</span>
                <p style={{margin: '4px 0 0 0'}}>
                  <span style={{
                    display: 'inline-block',
                    padding: '4px 12px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: '700',
                    background: review.status === 'submitted' ? '#d1fae5' : '#fef3c7',
                    color: review.status === 'submitted' ? '#065f46' : '#92400e'
                  }}>
                    {review.status === 'submitted' ? '✓ Completed' : '⌛ Draft'}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* KPI Sections */}
          <div style={{marginBottom: '40px'}}>
            <h2 style={{fontSize: '20px', fontWeight: '800', color: '#0f172a', marginBottom: '24px'}}>KPI Assessment</h2>

            <h3 style={{fontSize: '14px', fontWeight: '700', color: '#334155', marginTop: '32px', marginBottom: '16px'}}>Client Stability</h3>
            <KPIItem
              label="Client Complaints / Issues"
              count={review.client_complaints_count}
              comment={review.client_complaints_comment}
              files={review.file_links['client_complaints'] || []}
            />
            <KPIItem
              label="Client Attrition"
              count={review.client_attrition_count}
              comment={review.client_attrition_comment}
              files={review.file_links['client_attrition'] || []}
            />

            <h3 style={{fontSize: '14px', fontWeight: '700', color: '#334155', marginTop: '32px', marginBottom: '16px'}}>Task Efficiency</h3>
            <KPIItem
              label="Minor Delays"
              count={review.minor_delays_count}
              comment={review.minor_delays_comment}
              files={review.file_links['minor_delays'] || []}
            />
            <KPIItem
              label="Serious Delays"
              count={review.serious_delays_count}
              comment={review.serious_delays_comment}
              files={review.file_links['serious_delays'] || []}
            />

            <h3 style={{fontSize: '14px', fontWeight: '700', color: '#334155', marginTop: '32px', marginBottom: '16px'}}>Work Quality</h3>
            <KPIItem
              label="Minor Errors"
              count={review.minor_errors_count}
              comment={review.minor_errors_comment}
              files={review.file_links['minor_errors'] || []}
            />
            <KPIItem
              label="Serious Errors"
              count={review.serious_errors_count}
              comment={review.serious_errors_comment}
              files={review.file_links['serious_errors'] || []}
            />

            <h3 style={{fontSize: '14px', fontWeight: '700', color: '#334155', marginTop: '32px', marginBottom: '16px'}}>Coordination</h3>
            <KPIItem
              label="Communication Issues"
              count={review.communication_issues_count}
              comment={review.communication_issues_comment}
              files={review.file_links['communication_issues'] || []}
            />
            <KPIItem
              label="Team Impact"
              count={review.team_impact_count}
              comment={review.team_impact_comment}
              files={review.file_links['team_impact'] || []}
            />

            <h3 style={{fontSize: '14px', fontWeight: '700', color: '#334155', marginTop: '32px', marginBottom: '16px'}}>Development</h3>
            <KPIItem
              label="Learning & Application"
              count={review.learning_application_count}
              comment={review.learning_application_comment}
              files={review.file_links['learning_application'] || []}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
