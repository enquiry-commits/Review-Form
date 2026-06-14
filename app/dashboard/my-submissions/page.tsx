'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@/lib/auth';
import { getCurrentReviewPeriod, formatPeriodDisplay } from '@/lib/reviewHelpers';
import { supabase } from '@/lib/supabase';

type Status = 'pending' | 'draft' | 'submitted';

interface FormConfig {
  key: string;
  table: string;
  label: string;
  route: string;
}

interface PeriodRow {
  period: string;
  statuses: Record<string, Status>;
}

function getFormsForUser(user: User): FormConfig[] {
  const forms: FormConfig[] = [];
  if (user.email !== 'chelsea@tassure.com') {
    forms.push({ key: 'self', table: 'self_review_submissions', label: 'Self Review', route: '/dashboard/self-review' });
  }
  if (user.role === 'leader') {
    forms.push({ key: 'leader', table: 'leader_review_submissions', label: 'Leader Review', route: '/dashboard/leader-review' });
  }
  if (user.email === 'chelsea@tassure.com') {
    forms.push({ key: 'finance', table: 'finance_review_submissions', label: 'Finance & Admin Review', route: '/dashboard/finance-review' });
  }
  return forms;
}

function StatusBadge({ status }: { status: Status }) {
  const cfg: Record<Status, { bg: string; color: string; border: string; label: string }> = {
    submitted: { bg: '#dcfce7', color: '#15803d', border: '#86efac', label: '✓ Submitted' },
    draft:     { bg: '#fef3c7', color: '#92400e', border: '#fcd34d', label: '◐ Draft Saved' },
    pending:   { bg: '#f1f5f9', color: '#94a3b8', border: '#cbd5e1', label: '— Pending' },
  };
  const s = cfg[status];
  return (
    <span style={{
      display: 'inline-block',
      padding: '4px 12px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: '700',
      background: s.bg,
      color: s.color,
      border: `1px solid ${s.border}`,
      letterSpacing: '0.3px',
    }}>
      {s.label}
    </span>
  );
}

export default function MySubmissions() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isEmbedded, setIsEmbedded] = useState(false);
  const [rows, setRows] = useState<PeriodRow[]>([]);
  const [forms, setForms] = useState<FormConfig[]>([]);
  const [loaded, setLoaded] = useState(false);
  const currentPeriod = getCurrentReviewPeriod();

  useEffect(() => {
    const raw = localStorage.getItem('user');
    if (!raw) { router.push('/'); return; }
    const u: User = JSON.parse(raw);
    if (u.role === 'admin') { router.push('/dashboard'); return; }
    setUser(u);
    setIsEmbedded(window.self !== window.top);

    const userForms = getFormsForUser(u);
    setForms(userForms);

    const fetchAll = async () => {
      const results = await Promise.all(
        userForms.map(f =>
          supabase
            .from(f.table)
            .select('review_period, submitted_at')
            .eq('employee_email', u.email)
            .order('review_period', { ascending: false })
        )
      );

      // Build maps: formKey → Map<period, Status>
      const maps: Record<string, Map<string, Status>> = {};
      userForms.forEach((f, i) => {
        const data = results[i].data || [];
        maps[f.key] = new Map(
          data.map((r: { review_period: string; submitted_at: string | null }) => [
            r.review_period,
            r.submitted_at ? 'submitted' : 'draft',
          ])
        );
      });

      // Collect all unique periods
      const allPeriods = new Set<string>([currentPeriod]);
      Object.values(maps).forEach(m => m.forEach((_, p) => allPeriods.add(p)));

      const sortedPeriods = [...allPeriods].sort().reverse();

      const result: PeriodRow[] = sortedPeriods.map(period => {
        const statuses: Record<string, Status> = {};
        userForms.forEach(f => {
          statuses[f.key] = maps[f.key].get(period) || 'pending';
        });
        return { period, statuses };
      });

      setRows(result);
      setLoaded(true);
    };

    fetchAll();
  }, [router, currentPeriod]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    router.push('/');
  };

  if (!user) return null;

  const currentRow = rows.find(r => r.period === currentPeriod);
  const historyRows = rows.filter(r => r.period !== currentPeriod);

  const allCurrentSubmitted = forms.length > 0 && forms.every(f => currentRow?.statuses[f.key] === 'submitted');

  return (
    <div style={{
      background: 'linear-gradient(135deg, #f0f4f8 0%, #d9e2ec 100%)',
      minHeight: '100vh',
    }}>
      {/* Header (only when not inside iframe) */}
      {!isEmbedded && (
        <div style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          borderBottom: '1px solid rgba(30, 58, 95, 0.08)',
          boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            maxWidth: '960px',
            margin: '0 auto',
            padding: '0 32px',
            height: '70px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <img src="/tassure-logo.png" alt="Tassure" style={{ height: '45px', width: 'auto' }} />
              <div style={{ fontSize: '18px', fontWeight: '800', color: '#1e3a5f' }}>Tassure Review System</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
              <div style={{ fontSize: '14px', color: '#64748b' }}>
                Welcome, <span style={{ fontWeight: '700', color: '#1e3a5f' }}>{user.name}</span>
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
                }}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 32px 60px' }}>

        {/* Page Title */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{
            fontSize: '28px',
            fontWeight: '800',
            color: '#1e3a5f',
            margin: 0,
            letterSpacing: '-0.5px',
          }}>
            My Submissions
          </h1>
          <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: '14px' }}>
            Your personal review submission history and current status
          </p>
        </div>

        {/* Current Period Card */}
        <div style={{
          background: '#ffffff',
          borderRadius: '16px',
          border: '1px solid rgba(30, 58, 95, 0.08)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
          marginBottom: '28px',
          overflow: 'hidden',
        }}>
          {/* Card Header */}
          <div style={{
            padding: '20px 28px',
            borderBottom: '1px solid #f1f5f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div>
              <div style={{ fontSize: '12px', fontWeight: '700', color: '#94a3b8', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '4px' }}>
                Current Review Period
              </div>
              <div style={{ fontSize: '20px', fontWeight: '800', color: '#1e3a5f' }}>
                {formatPeriodDisplay(currentPeriod)}
              </div>
            </div>
            {loaded && allCurrentSubmitted && (
              <div style={{
                padding: '8px 18px',
                background: '#dcfce7',
                color: '#15803d',
                borderRadius: '20px',
                fontSize: '13px',
                fontWeight: '700',
                border: '1px solid #86efac',
              }}>
                All Forms Submitted ✓
              </div>
            )}
          </div>

          {/* Status Grid */}
          <div style={{
            padding: '24px 28px',
            display: 'grid',
            gridTemplateColumns: `repeat(${Math.min(forms.length, 3)}, 1fr)`,
            gap: '16px',
          }}>
            {!loaded ? (
              <div style={{ color: '#94a3b8', fontSize: '14px' }}>Loading...</div>
            ) : forms.map(form => {
              const status = currentRow?.statuses[form.key] || 'pending';
              const isSubmitted = status === 'submitted';
              return (
                <div
                  key={form.key}
                  style={{
                    padding: '20px',
                    background: isSubmitted ? '#f0fdf4' : '#f8fafc',
                    borderRadius: '12px',
                    border: `1px solid ${isSubmitted ? '#bbf7d0' : '#e2e8f0'}`,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                  }}
                >
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#1e3a5f' }}>{form.label}</div>
                  <StatusBadge status={status} />
                  {!isSubmitted && (
                    <a
                      href={form.route}
                      style={{
                        display: 'inline-block',
                        marginTop: '4px',
                        padding: '7px 14px',
                        background: '#1e3a5f',
                        color: '#ffffff',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: '600',
                        textDecoration: 'none',
                        textAlign: 'center',
                      }}
                    >
                      {status === 'draft' ? 'Continue Form →' : 'Start Form →'}
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Submission History */}
        {loaded && historyRows.length > 0 && (
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            border: '1px solid rgba(30, 58, 95, 0.08)',
            boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
            overflow: 'hidden',
          }}>
            <div style={{ padding: '20px 28px', borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ fontSize: '12px', fontWeight: '700', color: '#94a3b8', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '4px' }}>
                Submission History
              </div>
              <div style={{ fontSize: '16px', fontWeight: '700', color: '#1e3a5f' }}>
                Past Review Periods
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    <th style={{
                      padding: '12px 28px',
                      textAlign: 'left',
                      fontSize: '11px',
                      fontWeight: '700',
                      color: '#94a3b8',
                      letterSpacing: '0.8px',
                      textTransform: 'uppercase',
                      borderBottom: '1px solid #e2e8f0',
                    }}>Period</th>
                    {forms.map(f => (
                      <th key={f.key} style={{
                        padding: '12px 20px',
                        textAlign: 'left',
                        fontSize: '11px',
                        fontWeight: '700',
                        color: '#94a3b8',
                        letterSpacing: '0.8px',
                        textTransform: 'uppercase',
                        borderBottom: '1px solid #e2e8f0',
                      }}>{f.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {historyRows.map((row, idx) => (
                    <tr
                      key={row.period}
                      style={{ background: idx % 2 === 0 ? '#ffffff' : '#fafbfc' }}
                    >
                      <td style={{
                        padding: '14px 28px',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#1e3a5f',
                        borderBottom: '1px solid #f1f5f9',
                        whiteSpace: 'nowrap',
                      }}>
                        {formatPeriodDisplay(row.period)}
                      </td>
                      {forms.map(f => (
                        <td key={f.key} style={{
                          padding: '14px 20px',
                          borderBottom: '1px solid #f1f5f9',
                        }}>
                          <StatusBadge status={row.statuses[f.key] || 'pending'} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Empty state for history */}
        {loaded && historyRows.length === 0 && (
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            border: '1px solid rgba(30, 58, 95, 0.08)',
            boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
            padding: '40px 28px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>📋</div>
            <div style={{ fontSize: '15px', fontWeight: '600', color: '#1e3a5f', marginBottom: '6px' }}>No previous submissions yet</div>
            <div style={{ fontSize: '13px', color: '#94a3b8' }}>Your past submissions will appear here after you complete your first review.</div>
          </div>
        )}
      </div>
    </div>
  );
}
