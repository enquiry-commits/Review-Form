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

interface FormRecord {
  id: string;
  submitted_at: string | null;
  form_data: any;
  director_comment?: string;
}

interface PeriodRow {
  period: string;
  statuses: Record<string, Status>;
  records: Record<string, FormRecord | null>;
}

interface DetailTarget {
  form: FormConfig;
  period: string;
  record: FormRecord;
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

function FormDataView({ form_data, formKey }: { form_data: any; formKey: string }) {
  if (!form_data) return <p style={{ color: '#94a3b8', fontSize: '14px' }}>No form data available.</p>;

  const sections: { title: string; content: string; type: 'kpi' | 'pos' | 'remark' }[] = [];

  // KPI sections
  const kpis = form_data.kpis || {};
  Object.entries(kpis).forEach(([, val]: any) => {
    const title = val?.kpi || val?.label || '';
    const texts: string[] = [];
    (val?.rows || []).forEach((row: any) => {
      if (row?.comment?.trim()) texts.push(row.comment.trim());
      if (row?.employee?.trim()) texts.push(`— ${row.employee.trim()}`);
    });
    if (title || texts.length > 0) {
      sections.push({ title, content: texts.join('\n') || '(No comment)', type: 'kpi' });
    }
  });

  // Positive items
  const positives = form_data.positive_items || {};
  Object.entries(positives).forEach(([, val]: any) => {
    const title = val?.label || '';
    const texts: string[] = [];
    (val?.rows || []).forEach((row: any) => {
      if (row?.comment?.trim()) texts.push(row.comment.trim());
    });
    if (title || texts.length > 0) {
      sections.push({ title, content: texts.join('\n') || '(No comment)', type: 'pos' });
    }
  });

  // Overall remarks
  const remarks = form_data.overall_remarks?.remarks?.trim();
  if (remarks) {
    sections.push({ title: 'Overall Remarks', content: remarks, type: 'remark' });
  }

  if (sections.length === 0) {
    return <p style={{ color: '#94a3b8', fontSize: '14px' }}>Form was saved with no content.</p>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {sections.map((s, i) => {
        const colors = {
          kpi:    { bg: '#f0f7ff', border: '#bfdbfe', accent: '#1d4ed8' },
          pos:    { bg: '#f0fdf4', border: '#bbf7d0', accent: '#15803d' },
          remark: { bg: '#fafafa', border: '#e2e8f0', accent: '#64748b' },
        };
        const c = colors[s.type];
        return (
          <div key={i} style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: '10px', padding: '12px 14px' }}>
            {s.title && (
              <div style={{ fontSize: '12px', fontWeight: '700', color: c.accent, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {s.title}
              </div>
            )}
            <div style={{ fontSize: '13px', color: '#475569', lineHeight: '1.6', whiteSpace: 'pre-line' }}>
              {s.content}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function MySubmissions() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isEmbedded, setIsEmbedded] = useState(false);
  const [rows, setRows] = useState<PeriodRow[]>([]);
  const [forms, setForms] = useState<FormConfig[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [detail, setDetail] = useState<DetailTarget | null>(null);
  const currentPeriod = getCurrentReviewPeriod();

  const generateDemoRows = (f: FormConfig[]): PeriodRow[] => {
    const periods: string[] = [];
    let year = parseInt(currentPeriod.split('-')[0]);
    let month = parseInt(currentPeriod.split('-')[1]);
    for (let i = 0; i < 12; i++) {
      periods.push(`${year}-${String(month).padStart(2, '0')}`);
      month--;
      if (month === 0) { month = 12; year--; }
    }
    const patterns: Record<string, Status[]> = {
      self:    ['draft','submitted','submitted','submitted','submitted','submitted','draft','submitted','submitted','submitted','submitted','submitted'],
      leader:  ['pending','submitted','submitted','submitted','draft','submitted','submitted','submitted','submitted','submitted','submitted','submitted'],
      finance: ['draft','submitted','submitted','submitted','submitted','submitted','submitted','submitted','draft','submitted','submitted','submitted'],
    };
    return periods.map((period, i) => {
      const statuses: Record<string, Status> = {};
      const records: Record<string, FormRecord | null> = {};
      f.forEach(fc => {
        const st = patterns[fc.key]?.[i] ?? 'submitted';
        statuses[fc.key] = st;
        records[fc.key] = st !== 'pending' ? {
          id: `demo-${fc.key}-${i}`,
          submitted_at: st === 'submitted' ? `${period}-15T09:00:00Z` : null,
          form_data: null,
        } : null;
      });
      return { period, statuses, records };
    });
  };

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
            .select('id, review_period, submitted_at, form_data, director_comment')
            .eq('employee_email', u.email)
            .order('review_period', { ascending: false })
        )
      );

      // Build maps: formKey → Map<period, {status, record}>
      const statusMaps: Record<string, Map<string, Status>> = {};
      const recordMaps: Record<string, Map<string, FormRecord>> = {};

      userForms.forEach((f, i) => {
        const data = results[i].data || [];
        statusMaps[f.key] = new Map(
          data.map((r: any) => [r.review_period, r.submitted_at ? 'submitted' : 'draft'] as [string, Status])
        );
        recordMaps[f.key] = new Map(
          data.map((r: any) => [r.review_period, { id: r.id, submitted_at: r.submitted_at, form_data: r.form_data, director_comment: r.director_comment || '' }])
        );
      });

      const allPeriods = new Set<string>([currentPeriod]);
      Object.values(statusMaps).forEach(m => m.forEach((_, p) => allPeriods.add(p)));

      const result: PeriodRow[] = [...allPeriods].map(period => {
        const statuses: Record<string, Status> = {};
        const records: Record<string, FormRecord | null> = {};
        userForms.forEach(f => {
          statuses[f.key] = statusMaps[f.key].get(period) || 'pending';
          records[f.key] = recordMaps[f.key].get(period) || null;
        });
        return { period, statuses, records };
      });

      // Sort by latest submitted_at timestamp, then by period (descending)
      const sortedResult = result.sort((a, b) => {
        const getLatestSubmitTime = (row: PeriodRow) => {
          let latest: string | null = null;
          Object.values(row.records).forEach(rec => {
            if (rec?.submitted_at && (!latest || rec.submitted_at > latest)) {
              latest = rec.submitted_at;
            }
          });
          return latest;
        };

        const timeA = getLatestSubmitTime(a);
        const timeB = getLatestSubmitTime(b);

        if (timeA && timeB) return new Date(timeB).getTime() - new Date(timeA).getTime();
        if (timeA) return -1;
        if (timeB) return 1;
        return (b.period || '').localeCompare(a.period || '');
      });

      setRows(sortedResult);
      setLoaded(true);
    };

    fetchAll();
  }, [router, currentPeriod]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    router.push('/');
  };

  if (!user) return null;

  const displayRows = isDemoMode ? generateDemoRows(forms) : rows;
  const currentRow = displayRows.find(r => r.period === currentPeriod);
  const historyRows = displayRows.filter(r => r.period !== currentPeriod);
  const allCurrentSubmitted = forms.length > 0 && forms.every(f => currentRow?.statuses[f.key] === 'submitted');

  return (
    <div style={{ background: 'linear-gradient(135deg, #f0f4f8 0%, #d9e2ec 100%)', minHeight: '100vh' }}>

      {/* Header */}
      {!isEmbedded && (
        <div style={{ background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)', borderBottom: '1px solid rgba(30, 58, 95, 0.08)', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: '960px', margin: '0 auto', padding: '0 32px', height: '70px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <img src="/tassure-logo.png" alt="Tassure" style={{ height: '45px', width: 'auto' }} />
              <div style={{ fontSize: '18px', fontWeight: '800', color: '#1e3a5f' }}>Tassure Review System</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
              <div style={{ fontSize: '14px', color: '#64748b' }}>
                Welcome, <span style={{ fontWeight: '700', color: '#1e3a5f' }}>{user.name}</span>
              </div>
              <button onClick={handleLogout} style={{ padding: '8px 16px', fontSize: '14px', fontWeight: '600', color: '#1e3a5f', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 32px 60px' }}>

        {/* Page Title */}
        <div style={{ marginBottom: '32px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#1e3a5f', margin: 0, letterSpacing: '-0.5px' }}>
              My Submissions
              {isDemoMode && <span style={{ marginLeft: '12px', fontSize: '13px', fontWeight: '700', background: '#fef3c7', color: '#92400e', padding: '3px 10px', borderRadius: '8px', border: '1px solid #fbbf24', verticalAlign: 'middle' }}>Demo</span>}
            </h1>
            <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: '14px' }}>Your personal review submission history and current status</p>
          </div>
          {isDemoMode
            ? <button onClick={() => setIsDemoMode(false)} style={{ padding: '8px 16px', background: 'rgba(239,68,68,0.1)', color: '#dc2626', border: 'none', borderRadius: '10px', fontWeight: '700', fontSize: '13px', cursor: 'pointer', flexShrink: 0 }}>✕ Exit Demo</button>
            : <button onClick={() => setIsDemoMode(true)} style={{ padding: '8px 16px', background: 'rgba(126,184,212,0.08)', color: '#1e3a5f', border: '1.5px dashed #7eb8d4', borderRadius: '10px', fontWeight: '700', fontSize: '13px', cursor: 'pointer', flexShrink: 0 }}>👁 Demo Preview</button>
          }
        </div>

        {/* Current Period Card */}
        <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid rgba(30, 58, 95, 0.08)', boxShadow: '0 4px 24px rgba(0,0,0,0.06)', marginBottom: '28px', overflow: 'hidden' }}>
          <div style={{ padding: '20px 28px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '12px', fontWeight: '700', color: '#94a3b8', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '4px' }}>Current Review Period</div>
              <div style={{ fontSize: '20px', fontWeight: '800', color: '#1e3a5f' }}>{formatPeriodDisplay(currentPeriod)}</div>
            </div>
            {(loaded || isDemoMode) && allCurrentSubmitted && (
              <div style={{ padding: '8px 18px', background: '#dcfce7', color: '#15803d', borderRadius: '20px', fontSize: '13px', fontWeight: '700', border: '1px solid #86efac' }}>
                All Forms Submitted ✓
              </div>
            )}
          </div>

          <div style={{ padding: '24px 28px', display: 'grid', gridTemplateColumns: `repeat(${Math.min(forms.length, 3)}, 1fr)`, gap: '16px' }}>
            {(!loaded && !isDemoMode) ? (
              <div style={{ color: '#94a3b8', fontSize: '14px' }}>Loading...</div>
            ) : forms.map(form => {
              const status = currentRow?.statuses[form.key] || 'pending';
              const isSubmitted = status === 'submitted';
              const record = currentRow?.records?.[form.key];
              const directorComment = form.key === 'self' ? (record?.director_comment || '') : '';
              return (
                <div key={form.key} style={{ padding: '20px', background: isSubmitted ? '#f0fdf4' : '#f8fafc', borderRadius: '12px', border: `1px solid ${isSubmitted ? '#bbf7d0' : '#e2e8f0'}`, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#1e3a5f' }}>{form.label}</div>
                  <StatusBadge status={status} />
                  {directorComment && (
                    <div>
                      <div style={{ fontSize: '10px', fontWeight: '700', color: '#7eb8d4', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Director Comment</div>
                      <div style={{ background: 'linear-gradient(135deg, #f0f7fb, #e8f4f8)', border: '1px solid #bfdbfe', borderLeft: '3px solid #7eb8d4', borderRadius: '6px', padding: '8px 12px', fontSize: '12px', color: '#1e3a5f', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                        {directorComment}
                      </div>
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {record && (
                      <button
                        onClick={() => setDetail({ form, period: currentPeriod, record })}
                        style={{ padding: '6px 12px', background: 'rgba(30,58,95,0.06)', color: '#1e3a5f', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
                      >
                        View Details
                      </button>
                    )}
                    {!isSubmitted && (
                      <a href={form.route} style={{ display: 'inline-block', padding: '6px 12px', background: '#1e3a5f', color: '#ffffff', borderRadius: '8px', fontSize: '12px', fontWeight: '600', textDecoration: 'none' }}>
                        {status === 'draft' ? 'Continue →' : 'Start Form →'}
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Submission History */}
        {(loaded || isDemoMode) && historyRows.length > 0 && (
          <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid rgba(30, 58, 95, 0.08)', boxShadow: '0 4px 24px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
            <div style={{ padding: '20px 28px', borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ fontSize: '12px', fontWeight: '700', color: '#94a3b8', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '4px' }}>Submission History</div>
              <div style={{ fontSize: '16px', fontWeight: '700', color: '#1e3a5f' }}>Past Review Periods</div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <colgroup>
                  <col style={{ width: '160px' }} />
                  {forms.map(f => <col key={f.key} style={{ width: '140px' }} />)}
                  <col style={{ minWidth: '200px' }} />
                  <col style={{ width: '90px' }} />
                </colgroup>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    <th style={{ padding: '12px 28px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#94a3b8', letterSpacing: '0.8px', textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0' }}>Period</th>
                    {forms.map(f => (
                      <th key={f.key} style={{ padding: '12px 20px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#94a3b8', letterSpacing: '0.8px', textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0' }}>{f.label}</th>
                    ))}
                    <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#7eb8d4', letterSpacing: '0.8px', textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0' }}>Director Comment</th>
                    <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#94a3b8', letterSpacing: '0.8px', textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {historyRows.map((row, idx) => {
                    // Collect all director comments across forms for this period
                    const comments = forms
                      .filter(f => f.key === 'self')
                      .map(f => ({ label: f.label, comment: row.records?.[f.key]?.director_comment || '' }))
                      .filter(x => x.comment.trim());
                    return (
                    <tr key={row.period} style={{ background: idx % 2 === 0 ? '#ffffff' : '#fafbfc' }}>
                      <td style={{ padding: '14px 28px', fontSize: '14px', fontWeight: '600', color: '#1e3a5f', borderBottom: '1px solid #f1f5f9', whiteSpace: 'nowrap' }}>
                        {formatPeriodDisplay(row.period)}
                      </td>
                      {forms.map(f => (
                        <td key={f.key} style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9' }}>
                          <StatusBadge status={row.statuses[f.key] || 'pending'} />
                        </td>
                      ))}
                      <td style={{ padding: '12px 20px', borderBottom: '1px solid #f1f5f9', verticalAlign: 'top' }}>
                        {comments.length === 0 ? (
                          <span style={{ color: '#cbd5e1', fontSize: '13px' }}>—</span>
                        ) : comments.map((c, ci) => (
                          <div key={ci} style={{ marginBottom: ci < comments.length - 1 ? '8px' : 0 }}>
                            {comments.length > 1 && (
                              <div style={{ fontSize: '10px', fontWeight: '700', color: '#7eb8d4', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '3px' }}>{c.label}</div>
                            )}
                            <div style={{
                              background: 'linear-gradient(135deg, #f0f7fb, #e8f4f8)',
                              border: '1px solid #bfdbfe',
                              borderLeft: '3px solid #7eb8d4',
                              borderRadius: '6px',
                              padding: '8px 12px',
                              fontSize: '13px',
                              color: '#1e3a5f',
                              lineHeight: '1.5',
                              whiteSpace: 'pre-wrap',
                            }}>
                              {c.comment}
                            </div>
                          </div>
                        ))}
                      </td>
                      <td style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9' }}>
                        {/* Show View button if any form has a record for this period */}
                        {forms.some(f => row.records?.[f.key]) && (
                          <button
                            onClick={() => {
                              const firstForm = forms.find(f => row.records?.[f.key]);
                              if (firstForm && row.records?.[firstForm.key]) {
                                setDetail({ form: firstForm, period: row.period, record: row.records[firstForm.key]! });
                              }
                            }}
                            style={{ padding: '6px 14px', background: 'transparent', color: '#1e3a5f', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(30,58,95,0.06)'; e.currentTarget.style.borderColor = '#7eb8d4'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
                          >
                            View
                          </button>
                        )}
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Empty state */}
        {(loaded && !isDemoMode) && historyRows.length === 0 && (
          <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid rgba(30, 58, 95, 0.08)', boxShadow: '0 4px 24px rgba(0,0,0,0.06)', padding: '40px 28px', textAlign: 'center' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>📋</div>
            <div style={{ fontSize: '15px', fontWeight: '600', color: '#1e3a5f', marginBottom: '6px' }}>No previous submissions yet</div>
            <div style={{ fontSize: '13px', color: '#94a3b8' }}>Your past submissions will appear here after you complete your first review.</div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {detail && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}
          onClick={() => setDetail(null)}
        >
          <div
            style={{ background: '#ffffff', borderRadius: '20px', width: '100%', maxWidth: '580px', maxHeight: '80vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 60px rgba(0,0,0,0.2)' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ padding: '24px 28px 20px', borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ fontSize: '12px', fontWeight: '700', color: '#94a3b8', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '6px' }}>
                {detail.form.label}
              </div>
              <div style={{ fontSize: '20px', fontWeight: '800', color: '#1e3a5f', marginBottom: '10px' }}>
                {formatPeriodDisplay(detail.period)}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <StatusBadge status={detail.record.submitted_at ? 'submitted' : 'draft'} />
                {detail.record.submitted_at && (
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                    Submitted {new Date(detail.record.submitted_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                )}
              </div>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px 28px', overflowY: 'auto', flex: 1 }}>
              {isDemoMode ? (
                <div style={{ textAlign: 'center', padding: '24px 0', color: '#94a3b8', fontSize: '14px' }}>
                  Form content not available in demo mode.
                </div>
              ) : (
                <FormDataView form_data={detail.record.form_data} formKey={detail.form.key} />
              )}
            </div>

            {/* Modal Footer */}
            <div style={{ padding: '16px 28px', borderTop: '1px solid #f1f5f9' }}>
              <button
                onClick={() => setDetail(null)}
                style={{ width: '100%', padding: '11px', border: '1.5px solid #e2e8f0', borderRadius: '10px', background: 'white', color: '#64748b', fontWeight: '600', fontSize: '14px', cursor: 'pointer' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
