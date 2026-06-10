'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@/lib/auth';
import Link from 'next/link';

export default function LeaderReviewForm() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState<{id: number; name: string}[]>([{id: 1, name: ''}]);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/');
      return;
    }
    setUser(JSON.parse(userData));
    setLoading(false);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    router.push('/');
  };

  const addEmployee = () => {
    setEmployees([...employees, {id: Date.now(), name: ''}]);
  };

  const removeEmployee = (id: number) => {
    setEmployees(employees.filter(e => e.id !== id));
  };

  const KPIItem = ({ name, question }: { name: string; question: string }) => (
    <div style={{
      background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
      border: '1.5px solid #e2e8f0',
      borderRadius: '14px',
      padding: '20px',
      transition: 'all 0.3s'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.borderColor = '#cbd5e1';
      e.currentTarget.style.boxShadow = '0 8px 24px rgba(30, 58, 95, 0.08)';
      e.currentTarget.style.transform = 'translateY(-2px)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.borderColor = '#e2e8f0';
      e.currentTarget.style.boxShadow = 'none';
      e.currentTarget.style.transform = 'none';
    }}
    >
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px', gap: '20px'}}>
        <div style={{flex: 1}}>
          <div style={{fontSize: '14px', fontWeight: '800', color: '#0f172a', marginBottom: '6px'}}>{name}</div>
          <div style={{fontSize: '13px', color: '#64748b', lineHeight: '1.6'}}>{question}</div>
        </div>
        <div style={{display: 'flex', gap: '12px', alignItems: 'flex-end'}}>
          <div>
            <label style={{fontSize: '11px', color: '#94a3b8', fontWeight: '700', marginBottom: '6px', display: 'block'}}>Count</label>
            <input type="number" min="0" defaultValue="0" style={{
              width: '100px',
              padding: '10px 12px',
              border: '1.5px solid #e2e8f0',
              borderRadius: '10px',
              fontSize: '14px',
              textAlign: 'center',
              fontWeight: '700',
              color: '#1e3a5f',
              background: '#f8fafc'
            }} />
          </div>
        </div>
      </div>
      <div style={{marginTop: '12px'}}>
        <label style={{fontSize: '11px', color: '#94a3b8', fontWeight: '700', marginBottom: '8px', display: 'block'}}>Your Assessment</label>
        <textarea placeholder="Provide your feedback..." style={{
          width: '100%',
          minHeight: '70px',
          padding: '11px 14px',
          border: '1.5px solid #e2e8f0',
          borderRadius: '10px',
          fontSize: '13px',
          fontFamily: 'inherit',
          resize: 'vertical'
        }} />
      </div>
    </div>
  );

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
          maxWidth: '1100px',
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

      {/* Content */}
      <div style={{padding: '48px 32px', maxWidth: '1100px', margin: '0 auto'}}>
        <Link href="/dashboard" style={{
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
          {/* Form Header */}
          <div style={{
            textAlign: 'center',
            marginBottom: '48px',
            paddingBottom: '32px',
            borderBottom: '1px solid rgba(30, 58, 95, 0.08)'
          }}>
            <h1 style={{fontSize: '36px', fontWeight: '800', color: '#0f172a', marginBottom: '8px', letterSpacing: '-0.5px'}}>Leader Performance Review</h1>
            <p style={{color: '#64748b', fontSize: '15px', lineHeight: '1.6'}}>Evaluate your team members' performance this period</p>
          </div>

          {/* Basic Info Section */}
          <div style={{marginBottom: '40px'}}>
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px'}}>
              <div>
                <label style={{fontSize: '12px', color: '#334155', fontWeight: '700', marginBottom: '10px', letterSpacing: '0.4px', textTransform: 'uppercase', display: 'block'}}>Department</label>
                <select style={{
                  width: '100%',
                  padding: '13px 16px',
                  border: '1.5px solid #e2e8f0',
                  borderRadius: '12px',
                  fontSize: '14px',
                  color: '#1a1a2e',
                  background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                  fontFamily: 'inherit',
                  cursor: 'pointer',
                  transition: 'all 0.3s'
                }}>
                  <option>-- Select Department --</option>
                  <option>{user.department}</option>
                </select>
              </div>
              <div>
                <label style={{fontSize: '12px', color: '#334155', fontWeight: '700', marginBottom: '10px', letterSpacing: '0.4px', textTransform: 'uppercase', display: 'block'}}>Review Period</label>
                <input type="text" placeholder="e.g. June 2026" style={{
                  width: '100%',
                  padding: '13px 16px',
                  border: '1.5px solid #e2e8f0',
                  borderRadius: '12px',
                  fontSize: '14px',
                  color: '#1a1a2e',
                  background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                  fontFamily: 'inherit'
                }} />
              </div>
            </div>
          </div>

          {/* Team Evaluation Section */}
          <div style={{marginBottom: '40px'}}>
            <div style={{display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px'}}>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                background: 'linear-gradient(135deg, #7eb8d4, #6ba3c5)',
                color: 'white',
                borderRadius: '8px',
                fontSize: '11px',
                fontWeight: '800',
                letterSpacing: '0.4px',
                boxShadow: '0 4px 12px rgba(126, 184, 212, 0.25)'
              }}>TEAM EVALUATION</span>
              <span style={{fontSize: '17px', fontWeight: '800', color: '#1e3a5f', letterSpacing: '-0.3px'}}>Rate Your Team Members</span>
            </div>

            <div style={{display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '12px'}}>
              {employees.map((emp) => (
                <div key={emp.id} style={{
                  background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                  border: '1.5px solid #e2e8f0',
                  borderRadius: '14px',
                  padding: '18px',
                }}>
                  <div style={{display: 'flex', gap: '12px', marginBottom: '12px', alignItems: 'center'}}>
                    <select style={{
                      flex: 1,
                      padding: '10px 12px',
                      border: '1.5px solid #e2e8f0',
                      borderRadius: '10px',
                      fontSize: '13px',
                      fontFamily: 'inherit',
                      cursor: 'pointer'
                    }}>
                      <option>-- Select Employee --</option>
                      <option>Jenny Lai</option>
                      <option>Chin Kah Ye</option>
                      <option>Ang Shi Ming</option>
                    </select>
                    <button
                      onClick={() => removeEmployee(emp.id)}
                      style={{
                        padding: '8px 14px',
                        background: '#fee2e2',
                        color: '#991b1b',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        fontSize: '12px',
                        transition: 'all 0.3s'
                      }}
                      onMouseEnter={(e) => {e.currentTarget.style.background = '#fecaca'}}
                      onMouseLeave={(e) => {e.currentTarget.style.background = '#fee2e2'}}
                    >
                      Remove
                    </button>
                  </div>
                  <div style={{display: 'flex', flexDirection: 'column', gap: '14px'}}>
                    <KPIItem
                      name="Client Complaints / Issues"
                      question="Were there any client complaints or issues reported?"
                    />
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={addEmployee}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                width: '100%',
                padding: '14px 16px',
                border: '2px dashed #cbd5e1',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #f0f4f8, #eaf0f7)',
                color: '#1e3a5f',
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.3s',
                marginTop: '12px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#1e3a5f';
                e.currentTarget.style.background = 'linear-gradient(135deg, #eaf0f7, #d9e2ec)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(30, 58, 95, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#cbd5e1';
                e.currentTarget.style.background = 'linear-gradient(135deg, #f0f4f8, #eaf0f7)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              + Add Another Team Member
            </button>
          </div>

          {/* Form Actions */}
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
            marginTop: '48px',
            paddingTop: '32px',
            borderTop: '1px solid rgba(30, 58, 95, 0.08)'
          }}>
            <button style={{
              padding: '13px 32px',
              background: 'linear-gradient(135deg, #f1f5f9, #e2e8f0)',
              color: '#334155',
              border: '1.5px solid #cbd5e1',
              borderRadius: '12px',
              fontWeight: '700',
              cursor: 'pointer',
              fontSize: '14px',
              letterSpacing: '0.3px',
              transition: 'all 0.3s'
            }}>
              Clear Form
            </button>
            <button style={{
              padding: '13px 32px',
              background: 'linear-gradient(135deg, #1e3a5f, #162d4a)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontWeight: '700',
              cursor: 'pointer',
              fontSize: '14px',
              letterSpacing: '0.3px',
              boxShadow: '0 8px 24px rgba(30, 58, 95, 0.3)',
              transition: 'all 0.3s'
            }}>
              Submit Reviews
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
