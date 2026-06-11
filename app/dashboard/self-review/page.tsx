'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@/lib/auth';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

const CATEGORIES = [
  {
    name: 'Customer Service',
    kpis: [
      { id: 'cs_responsiveness', label: 'Responsiveness', question: 'How promptly do you respond to customer inquiries?' },
      { id: 'cs_satisfaction', label: 'Customer Satisfaction', question: 'How would you rate overall customer satisfaction?' }
    ]
  },
  {
    name: 'Work Quality',
    kpis: [
      { id: 'wq_accuracy', label: 'Accuracy', question: 'How accurate is your work?' },
      { id: 'wq_completeness', label: 'Completeness', question: 'Do you complete tasks comprehensively?' }
    ]
  },
  {
    name: 'Teamwork',
    kpis: [
      { id: 'tw_collaboration', label: 'Collaboration', question: 'How well do you collaborate with colleagues?' },
      { id: 'tw_communication', label: 'Communication', question: 'How clear is your communication?' }
    ]
  },
  {
    name: 'Initiative',
    kpis: [
      { id: 'in_proactive', label: 'Proactive Approach', question: 'How proactive are you in identifying improvements?' }
    ]
  },
  {
    name: 'Professional Development',
    kpis: [
      { id: 'pd_learning', label: 'Continuous Learning', question: 'How committed are you to continuous learning?' }
    ]
  }
];

interface FormData {
  [key: string]: { count: number; comment: string };
}

export default function SelfReviewForm() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<FormData>({});
  const [lastSaved, setLastSaved] = useState<string>('');
  const [currentMonth, setCurrentMonth] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/');
      return;
    }

    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);

    const month = new Date().toISOString().slice(0, 7);
    setCurrentMonth(month);
    loadFormData(parsedUser.id, month);
  }, [router]);

  const loadFormData = async (userId: string, month: string) => {
    try {
      const { data } = await supabase
        .from('self_review_submissions')
        .select('*')
        .eq('user_id', userId)
        .eq('review_period', month)
        .single();

      if (data && data.form_data) {
        setFormData(data.form_data);
        setLastSaved(new Date(data.updated_at).toLocaleString());
      }
    } catch (error) {
      console.error('Error loading form:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (kpiId: string, field: 'count' | 'comment', value: any) => {
    setFormData(prev => ({
      ...prev,
      [kpiId]: {
        ...(prev[kpiId] || { count: 0, comment: '' }),
        [field]: value
      }
    }));
    autoSaveForm();
  };

  const autoSaveForm = async () => {
    if (!user || !currentMonth) return;

    try {
      const { data: existing } = await supabase
        .from('self_review_submissions')
        .select('id')
        .eq('user_id', user.id)
        .eq('review_period', currentMonth)
        .single();

      const payload = {
        user_id: user.id,
        employee_name: user.name,
        employee_email: user.email,
        department: user.department,
        review_period: currentMonth,
        form_data: formData,
        updated_at: new Date().toISOString()
      };

      if (existing) {
        await supabase
          .from('self_review_submissions')
          .update(payload)
          .eq('id', existing.id);
      } else {
        await supabase
          .from('self_review_submissions')
          .insert([payload]);
      }

      setLastSaved(new Date().toLocaleString());
    } catch (error) {
      console.error('Error saving form:', error);
    }
  };

  const submitForm = async () => {
    if (!user || !currentMonth) return;

    setSubmitting(true);
    try {
      const { data: existing } = await supabase
        .from('self_review_submissions')
        .select('id')
        .eq('user_id', user.id)
        .eq('review_period', currentMonth)
        .single();

      if (existing) {
        await supabase
          .from('self_review_submissions')
          .update({
            form_data: formData,
            submitted_at: new Date().toISOString(),
            is_locked: true
          })
          .eq('id', existing.id);
      }

      alert('Form submitted successfully!');
      router.push('/dashboard');
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Error submitting form');
    } finally {
      setSubmitting(false);
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

  return (
    <div style={{background: 'linear-gradient(135deg, #f0f4f8 0%, #d9e2ec 100%)', minHeight: '100vh'}}>
      {/* Navbar */}
      <div style={{background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)', borderBottom: '1px solid rgba(30, 58, 95, 0.08)', boxShadow: '0 2px 12px rgba(0, 0, 0, 0.04)', position: 'sticky', top: 0, zIndex: 100}}>
        <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: '1600px', margin: '0 auto', padding: '0 32px', height: '70px'}}>
          <Link href="/dashboard" style={{display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none'}}>
            <img src="/tassure-logo.png" alt="Tassure" style={{height: '45px', width: 'auto'}} />
            <div style={{fontSize: '18px', fontWeight: '800', color: '#1e3a5f'}}>Self Review</div>
          </Link>
          <button onClick={handleLogout} style={{padding: '8px 16px', fontSize: '14px', fontWeight: '600', color: '#1e3a5f', background: 'transparent', border: 'none', cursor: 'pointer', transition: 'all 0.3s'}} onMouseEnter={(e) => {e.currentTarget.style.background = 'rgba(30, 58, 95, 0.04)'}} onMouseLeave={(e) => {e.currentTarget.style.background = 'transparent'}}>
            Logout
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{padding: '48px 32px', maxWidth: '1200px', margin: '0 auto'}}>
        <div style={{marginBottom: '40px'}}>
          <h1 style={{fontSize: '36px', fontWeight: '800', color: '#0f172a', marginBottom: '8px'}}>Employee Self Review</h1>
          <p style={{color: '#64748b', fontSize: '16px'}}>Period: {currentMonth}</p>
          {lastSaved && <p style={{color: '#94a3b8', fontSize: '13px', marginTop: '8px'}}>Last saved: {lastSaved}</p>}
        </div>

        {/* Form */}
        {CATEGORIES.map((category, catIdx) => (
          <div key={catIdx} style={{marginBottom: '48px'}}>
            <h2 style={{fontSize: '20px', fontWeight: '700', color: '#1e3a5f', marginBottom: '20px', paddingBottom: '12px', borderBottom: '2px solid #e2e8f0'}}>{category.name}</h2>
            <div style={{display: 'grid', gap: '20px'}}>
              {category.kpis.map(kpi => {
                const data = formData[kpi.id] || { count: 0, comment: '' };
                return (
                  <div key={kpi.id} style={{background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)', borderRadius: '14px', padding: '24px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.04)', border: '1px solid rgba(30, 58, 95, 0.06)'}}>
                    <div style={{marginBottom: '16px'}}>
                      <label style={{display: 'block', fontSize: '14px', fontWeight: '700', color: '#1e3a5f', marginBottom: '8px'}}>{kpi.label}</label>
                      <p style={{fontSize: '13px', color: '#64748b', margin: '0'}}>{kpi.question}</p>
                    </div>

                    <div style={{display: 'grid', gridTemplateColumns: '150px 1fr', gap: '20px'}}>
                      <div>
                        <label style={{display: 'block', fontSize: '12px', fontWeight: '600', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.3px'}}>Score (0-10)</label>
                        <input
                          type="number"
                          min="0"
                          max="10"
                          value={data.count}
                          onChange={(e) => updateFormData(kpi.id, 'count', parseInt(e.target.value) || 0)}
                          style={{width: '100%', padding: '10px 12px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', fontFamily: 'inherit'}}
                        />
                      </div>

                      <div>
                        <label style={{display: 'block', fontSize: '12px', fontWeight: '600', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.3px'}}>Comment</label>
                        <textarea
                          value={data.comment}
                          onChange={(e) => updateFormData(kpi.id, 'comment', e.target.value)}
                          placeholder="Add your comments..."
                          style={{width: '100%', padding: '10px 12px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '13px', fontFamily: 'inherit', minHeight: '60px', resize: 'none'}}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Submit Button */}
        <div style={{display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '40px', paddingTop: '20px', borderTop: '1px solid #e2e8f0'}}>
          <button onClick={() => router.push('/dashboard')} style={{padding: '12px 24px', border: '1.5px solid #e2e8f0', borderRadius: '10px', background: 'white', color: '#1e3a5f', fontWeight: '600', fontSize: '14px', cursor: 'pointer', transition: 'all 0.3s'}}>
            Cancel
          </button>
          <button onClick={submitForm} disabled={submitting} style={{padding: '12px 32px', border: 'none', borderRadius: '10px', background: 'linear-gradient(135deg, #1e3a5f, #162d4a)', color: 'white', fontWeight: '600', fontSize: '14px', cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.6 : 1, transition: 'all 0.3s', boxShadow: '0 4px 12px rgba(30, 58, 95, 0.25)'}}>
            {submitting ? 'Submitting...' : 'Submit Review'}
          </button>
        </div>
      </div>
    </div>
  );
}
