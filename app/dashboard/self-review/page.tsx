'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@/lib/auth';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function SelfReviewForm() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [fileLinks, setFileLinks] = useState<{[key: string]: Array<{name: string; url: string}>}>({});
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');

  const departmentEmployees: {[key: string]: string[]} = {
    'CORPORATE SECRETARIAL': ['Alice Johnson', 'Bob Smith', 'Carol White'],
    'ACCOUNTING': ['David Lee', 'Eve Martinez', 'Frank Chen'],
    'TAX': ['Grace Park', 'Henry Wong', 'Iris Zhang'],
    'PAYROLL': ['Jack Ryan', 'Kathy Brown']
  };

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/');
      return;
    }
    setUser(JSON.parse(userData));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    router.push('/');
  };

  const handleFileUpload = (fieldId: string, files: FileList) => {
    const newLinks = [...(fileLinks[fieldId] || [])];
    Array.from(files).forEach(file => {
      newLinks.push({ name: file.name, url: URL.createObjectURL(file) });
    });
    setFileLinks(prev => ({...prev, [fieldId]: newLinks}));
  };

  const removeFile = (fieldId: string, index: number) => {
    setFileLinks(prev => ({
      ...prev,
      [fieldId]: prev[fieldId]?.filter((_, i) => i !== index) || []
    }));
  };

  const handleSubmit = async () => {
    if (!user) return;
    try {
      const formData: any = {};
      document.querySelectorAll('[id^="count_"]').forEach((el: any) => {
        const id = el.id.replace('count_', '');
        formData[id] = {
          count: parseInt(el.value) || 0,
          comment: (document.getElementById(`comment_${id}`) as HTMLTextAreaElement)?.value || '',
          files: fileLinks[id] || []
        };
      });

      const month = new Date().toISOString().slice(0, 7);
      const { error } = await supabase.from('self_review_submissions').insert([{
        user_id: user.id,
        employee_name: user.name,
        employee_email: user.email,
        department: user.department,
        review_period: month,
        form_data: formData,
        submitted_at: new Date().toISOString(),
        is_locked: true
      }]);

      if (error) throw error;
      alert('表单已成功提交！');
      router.push('/dashboard');
    } catch (error) {
      console.error('提交失败:', error);
      alert('提交失败，请重试');
    }
  };

  if (!user) {
    return null;
  }

  const KPIItem = ({ id, name, question }: { id: string; name: string; question: string }) => (
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
            <label style={{fontSize: '11px', color: '#94a3b8', fontWeight: '700', marginBottom: '6px', display: 'block'}}>Count / 次数</label>
            <input type="number" min="0" defaultValue="0" id={`count_${id}`} style={{
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
      <div style={{marginTop: '12px', marginBottom: '14px'}}>
        <label style={{fontSize: '12px', color: '#64748b', fontWeight: '700', marginBottom: '8px', display: 'block'}}>Self Comment / 自评备注</label>
        <textarea id={`comment_${id}`} placeholder="Enter your comments or remarks... / 请填写说明或备注" style={{
          width: '100%',
          minHeight: '70px',
          padding: '12px 16px',
          border: '1.5px solid #e2e8f0',
          borderRadius: '12px',
          fontSize: '13px',
          fontFamily: 'inherit',
          resize: 'vertical'
        }} />
      </div>
      <div style={{marginTop: '14px'}}>
        <label style={{fontSize: '12px', color: '#64748b', fontWeight: '700', marginBottom: '8px', display: 'block'}}>Upload Evidence / 上传证据</label>
        <div style={{
          border: '2px dashed #cbd5e1',
          borderRadius: '12px',
          padding: '20px',
          textAlign: 'center',
          background: '#f8fafc',
          cursor: 'pointer',
          transition: 'all 0.3s'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = '#1e3a5f';
          e.currentTarget.style.background = '#eaf0f7';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = '#cbd5e1';
          e.currentTarget.style.background = '#f8fafc';
        }}
        onClick={() => document.getElementById(`file_${id}`)?.click()}
        >
          <input
            type="file"
            id={`file_${id}`}
            multiple
            style={{display: 'none'}}
            onChange={(e) => e.target.files && handleFileUpload(id, e.target.files)}
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
          />
          <div style={{fontSize: '13px', color: '#1e3a5f', fontWeight: '700'}}>
            📁 Click to upload or drag files
          </div>
          <div style={{fontSize: '11px', color: '#94a3b8', marginTop: '6px'}}>
            Supports images, PDF, Word, Excel
          </div>
        </div>
        {fileLinks[id] && fileLinks[id].length > 0 && (
          <div style={{marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px'}}>
            {fileLinks[id].map((file, idx) => (
              <div key={idx} style={{fontSize: '12px', color: '#1e3a5f', background: '#eaf0f7', padding: '8px 12px', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                <span>📄 {file.name}</span>
                <button
                  onClick={() => removeFile(id, idx)}
                  style={{background: 'none', border: 'none', color: '#1e3a5f', cursor: 'pointer', fontSize: '14px', padding: '0 8px'}}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

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
            <h1 style={{fontSize: '36px', fontWeight: '800', color: '#0f172a', marginBottom: '8px', letterSpacing: '-0.5px'}}>Employee Self Review</h1>
            <p style={{color: '#64748b', fontSize: '15px', lineHeight: '1.6'}}>Please complete your honest evaluation of your performance this period</p>
          </div>

          {/* Basic Info Section */}
          <div style={{marginBottom: '40px'}}>
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px'}}>
              <div>
                <label style={{fontSize: '12px', color: '#334155', fontWeight: '700', marginBottom: '10px', letterSpacing: '0.4px', textTransform: 'uppercase', display: 'block'}}>Department</label>
                <select value={selectedDepartment} onChange={(e) => {
                  setSelectedDepartment(e.target.value);
                  setSelectedEmployee('');
                }} style={{
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
                  <option value="">-- Select Department --</option>
                  {Object.keys(departmentEmployees).map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{fontSize: '12px', color: '#334155', fontWeight: '700', marginBottom: '10px', letterSpacing: '0.4px', textTransform: 'uppercase', display: 'block'}}>Your Name</label>
                <select value={selectedEmployee} onChange={(e) => setSelectedEmployee(e.target.value)} style={{
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
                  <option value="">-- Select Employee --</option>
                  {selectedDepartment && departmentEmployees[selectedDepartment]?.map(emp => (
                    <option key={emp} value={emp}>{emp}</option>
                  ))}
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
                  fontFamily: 'inherit',
                  transition: 'all 0.3s'
                }} />
              </div>
            </div>
          </div>

          {/* Client Section */}
          <div style={{marginBottom: '40px'}}>
            <div style={{display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px'}}>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                background: '#7eb8d4',
                color: 'white',
                borderRadius: '8px',
                fontSize: '11px',
                fontWeight: '800',
                letterSpacing: '0.4px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
              }}>Client</span>
              <span style={{fontSize: '18px', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.3px'}}>Client Stability / 客户稳定性</span>
            </div>
            <div style={{display: 'flex', flexDirection: 'column', gap: '14px'}}>
              <KPIItem
                id="client_complaints"
                name="Client Complaints / Issues 客户抱怨／异常"
                question="Were there any client complaints, issues or controllable churn? / 有没有客户抱怨、异常和可控流失？"
              />
              <KPIItem
                id="client_attrition"
                name="Client Attrition / 客户流失"
                question="Was there client loss due to lack of follow-up or unresolved issues? / 因为没有及时跟进和解决问题，导致客户流失？"
              />
            </div>
          </div>

          {/* Efficiency Section */}
          <div style={{marginBottom: '40px'}}>
            <div style={{display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px'}}>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                background: '#7eb8d4',
                color: 'white',
                borderRadius: '8px',
                fontSize: '11px',
                fontWeight: '800',
                letterSpacing: '0.4px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
              }}>Efficiency</span>
              <span style={{fontSize: '18px', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.3px'}}>Task Efficiency & Execution / 任务执行力</span>
            </div>
            <div style={{display: 'flex', flexDirection: 'column', gap: '14px'}}>
              <KPIItem
                id="minor_delays"
                name="Chased / Minor Delays / 被催、一般延误"
                question="Was the employee chased by clients or management? / 有没有被催、被客户或被管理？"
              />
              <KPIItem
                id="serious_delays"
                name="Serious Delays / 严重延误"
                question="Were there delays that affected client arrangements or led to cancellations? / 有没有延误影响客户安排，甚至导致客户取消服务？"
              />
            </div>
          </div>

          {/* Quality Section */}
          <div style={{marginBottom: '40px'}}>
            <div style={{display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px'}}>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                background: '#7eb8d4',
                color: 'white',
                borderRadius: '8px',
                fontSize: '11px',
                fontWeight: '800',
                letterSpacing: '0.4px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
              }}>Quality</span>
              <span style={{fontSize: '18px', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.3px'}}>Work Quality & Risk Control / 工作质量与风险管理</span>
            </div>
            <div style={{display: 'flex', flexDirection: 'column', gap: '14px'}}>
              <KPIItem
                id="minor_errors"
                name="Minor Errors / 轻微错误"
                question="Were there any mistakes made? / 有没有出错？"
              />
              <KPIItem
                id="serious_errors"
                name="Serious Errors / Penalty Risk / 严重错误／罚款风险"
                question="Were there any filing issues, penalty risks or client impact? / 是否有申报、罚款和客户影响风险？"
              />
            </div>
          </div>

          {/* Coordination Section */}
          <div style={{marginBottom: '40px'}}>
            <div style={{display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px'}}>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                background: '#7eb8d4',
                color: 'white',
                borderRadius: '8px',
                fontSize: '11px',
                fontWeight: '800',
                letterSpacing: '0.4px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
              }}>Coordination</span>
              <span style={{fontSize: '18px', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.3px'}}>Internal Coordination & Communication / 内部协作与沟通</span>
            </div>
            <div style={{display: 'flex', flexDirection: 'column', gap: '14px'}}>
              <KPIItem
                id="communication_issues"
                name="Communication / Handover Issues / 沟通／交接问题"
                question="Was collaboration with colleagues smooth? / 和员工和同事协作顺不顺？"
              />
              <KPIItem
                id="team_impact"
                name="Team Impact / 影响团队"
                question="Were there any communication or handover problems? / 有没有沟通和交接问题？"
              />
            </div>
          </div>

          {/* Development Section */}
          <div style={{marginBottom: '40px'}}>
            <div style={{display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px'}}>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                background: '#7eb8d4',
                color: 'white',
                borderRadius: '8px',
                fontSize: '11px',
                fontWeight: '800',
                letterSpacing: '0.4px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
              }}>Development</span>
              <span style={{fontSize: '18px', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.3px'}}>Capability & Growth / 能力与能力提升</span>
            </div>
            <div style={{display: 'flex', flexDirection: 'column', gap: '14px'}}>
              <KPIItem
                id="learning_application"
                name="Learning & Application / 学习并应用"
                question="Has new knowledge been applied to work? / 学到的东西有没有在工作里正用？"
              />
            </div>
          </div>

          {/* Positive Items Section */}
          <div style={{marginBottom: '40px'}}>
            <div style={{display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px'}}>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                background: '#10b981',
                color: 'white',
                borderRadius: '8px',
                fontSize: '11px',
                fontWeight: '800',
                letterSpacing: '0.4px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
              }}>★ Positive</span>
              <span style={{fontSize: '18px', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.3px'}}>Positive Items / 正面项目记录</span>
            </div>
            <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
              <div style={{border: '1.5px solid #e2e8f0', borderRadius: '16px', padding: '1.5rem', background: '#f8fafc'}}>
                <p style={{fontSize: '15px', fontWeight: '800', color: '#0f172a', marginBottom: '6px'}}>Written Client Compliment / 客户书面表扬</p>
                <p style={{fontSize: '13px', color: '#64748b', marginBottom: '12px'}}>Client proactively sent email/message with explicit praise (not routine thanks) / 客户主动发email/message有明确表扬，非常规感谢</p>
                <textarea id="pos_compliment_desc" placeholder="Evidence / Event description... / 证据／事件描述" style={{width: '100%', minHeight: '70px', padding: '12px 16px', border: '1.5px solid #e2e8f0', borderRadius: '12px', fontSize: '13px', fontFamily: 'inherit', marginBottom: '12px'}} />
                <label style={{fontSize: '12px', color: '#64748b', fontWeight: '700', marginBottom: '8px', display: 'block'}}>Upload Evidence / 上传证据</label>
                <div style={{
                  border: '2px dashed #cbd5e1',
                  borderRadius: '12px',
                  padding: '16px',
                  textAlign: 'center',
                  background: '#f8fafc',
                  cursor: 'pointer',
                  transition: 'all 0.3s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#1e3a5f';
                  e.currentTarget.style.background = '#eaf0f7';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#cbd5e1';
                  e.currentTarget.style.background = '#f8fafc';
                }}
                onClick={() => document.getElementById('file_pos_compliment')?.click()}
                >
                  <input
                    type="file"
                    id="file_pos_compliment"
                    multiple
                    style={{display: 'none'}}
                    onChange={(e) => e.target.files && handleFileUpload('pos_compliment', e.target.files)}
                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                  />
                  <div style={{fontSize: '12px', color: '#1e3a5f', fontWeight: '700'}}>
                    📁 Click to upload
                  </div>
                </div>
                {fileLinks['pos_compliment'] && fileLinks['pos_compliment'].length > 0 && (
                  <div style={{marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px'}}>
                    {fileLinks['pos_compliment'].map((file, idx) => (
                      <div key={idx} style={{fontSize: '11px', color: '#1e3a5f', background: '#eaf0f7', padding: '6px 10px', borderRadius: '4px', display: 'flex', justifyContent: 'space-between'}}>
                        <span>📄 {file.name}</span>
                        <button onClick={() => removeFile('pos_compliment', idx)} style={{background: 'none', border: 'none', color: '#1e3a5f', cursor: 'pointer'}}>✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div style={{border: '1.5px solid #e2e8f0', borderRadius: '16px', padding: '1.5rem', background: '#f8fafc'}}>
                <p style={{fontSize: '15px', fontWeight: '800', color: '#0f172a', marginBottom: '6px'}}>Client Requested Same Staff / 客户点名继续服务</p>
                <p style={{fontSize: '13px', color: '#64748b', marginBottom: '12px'}}>Client explicitly requested the same employee or gave special recognition / 客户明确要求继续由该员工负责，有特别认可</p>
                <textarea id="pos_requested_desc" placeholder="Evidence / Event description... / 证据／事件描述" style={{width: '100%', minHeight: '70px', padding: '12px 16px', border: '1.5px solid #e2e8f0', borderRadius: '12px', fontSize: '13px', fontFamily: 'inherit', marginBottom: '12px'}} />
                <label style={{fontSize: '12px', color: '#64748b', fontWeight: '700', marginBottom: '8px', display: 'block'}}>Upload Evidence / 上传证据</label>
                <div style={{border: '2px dashed #cbd5e1', borderRadius: '12px', padding: '16px', textAlign: 'center', background: '#f8fafc', cursor: 'pointer'}} onClick={() => document.getElementById('file_pos_requested')?.click()}>
                  <input type="file" id="file_pos_requested" multiple style={{display: 'none'}} onChange={(e) => e.target.files && handleFileUpload('pos_requested', e.target.files)} accept="image/*,.pdf,.doc,.docx,.xls,.xlsx" />
                  <div style={{fontSize: '12px', color: '#1e3a5f', fontWeight: '700'}}>📁 Click to upload</div>
                </div>
                {fileLinks['pos_requested'] && fileLinks['pos_requested'].length > 0 && (
                  <div style={{marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px'}}>
                    {fileLinks['pos_requested'].map((file, idx) => (
                      <div key={idx} style={{fontSize: '11px', color: '#1e3a5f', background: '#eaf0f7', padding: '6px 10px', borderRadius: '4px', display: 'flex', justifyContent: 'space-between'}}>
                        <span>📄 {file.name}</span>
                        <button onClick={() => removeFile('pos_requested', idx)} style={{background: 'none', border: 'none', color: '#1e3a5f', cursor: 'pointer'}}>✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div style={{border: '1.5px solid #e2e8f0', borderRadius: '16px', padding: '1.5rem', background: '#f8fafc'}}>
                <p style={{fontSize: '15px', fontWeight: '800', color: '#0f172a', marginBottom: '6px'}}>Prevented Major Risk / Penalty / 避免重大风险／罚款</p>
                <p style={{fontSize: '13px', color: '#64748b', marginBottom: '12px'}}>Identified issues outside scope and prevented significant losses / 超职责范围发现问题并避免重大损失</p>
                <textarea id="pos_prevented_desc" placeholder="Evidence / Event description... / 证据／事件描述" style={{width: '100%', minHeight: '70px', padding: '12px 16px', border: '1.5px solid #e2e8f0', borderRadius: '12px', fontSize: '13px', fontFamily: 'inherit', marginBottom: '12px'}} />
                <label style={{fontSize: '12px', color: '#64748b', fontWeight: '700', marginBottom: '8px', display: 'block'}}>Upload Evidence / 上传证据</label>
                <div style={{border: '2px dashed #cbd5e1', borderRadius: '12px', padding: '16px', textAlign: 'center', background: '#f8fafc', cursor: 'pointer'}} onClick={() => document.getElementById('file_pos_prevented')?.click()}>
                  <input type="file" id="file_pos_prevented" multiple style={{display: 'none'}} onChange={(e) => e.target.files && handleFileUpload('pos_prevented', e.target.files)} accept="image/*,.pdf,.doc,.docx,.xls,.xlsx" />
                  <div style={{fontSize: '12px', color: '#1e3a5f', fontWeight: '700'}}>📁 Click to upload</div>
                </div>
                {fileLinks['pos_prevented'] && fileLinks['pos_prevented'].length > 0 && (
                  <div style={{marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px'}}>
                    {fileLinks['pos_prevented'].map((file, idx) => (
                      <div key={idx} style={{fontSize: '11px', color: '#1e3a5f', background: '#eaf0f7', padding: '6px 10px', borderRadius: '4px', display: 'flex', justifyContent: 'space-between'}}>
                        <span>📄 {file.name}</span>
                        <button onClick={() => removeFile('pos_prevented', idx)} style={{background: 'none', border: 'none', color: '#1e3a5f', cursor: 'pointer'}}>✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div style={{border: '1.5px solid #e2e8f0', borderRadius: '16px', padding: '1.5rem', background: '#f8fafc'}}>
                <p style={{fontSize: '15px', fontWeight: '800', color: '#0f172a', marginBottom: '6px'}}>Recovered Client / 挽回客户</p>
                <p style={{fontSize: '13px', color: '#64748b', marginBottom: '12px'}}>Successfully retained a client at risk of leaving / 已有流失风险客户被成功挽回</p>
                <textarea id="pos_recovered_desc" placeholder="Evidence / Event description... / 证据／事件描述" style={{width: '100%', minHeight: '70px', padding: '12px 16px', border: '1.5px solid #e2e8f0', borderRadius: '12px', fontSize: '13px', fontFamily: 'inherit', marginBottom: '12px'}} />
                <label style={{fontSize: '12px', color: '#64748b', fontWeight: '700', marginBottom: '8px', display: 'block'}}>Upload Evidence / 上传证据</label>
                <div style={{border: '2px dashed #cbd5e1', borderRadius: '12px', padding: '16px', textAlign: 'center', background: '#f8fafc', cursor: 'pointer'}} onClick={() => document.getElementById('file_pos_recovered')?.click()}>
                  <input type="file" id="file_pos_recovered" multiple style={{display: 'none'}} onChange={(e) => e.target.files && handleFileUpload('pos_recovered', e.target.files)} accept="image/*,.pdf,.doc,.docx,.xls,.xlsx" />
                  <div style={{fontSize: '12px', color: '#1e3a5f', fontWeight: '700'}}>📁 Click to upload</div>
                </div>
                {fileLinks['pos_recovered'] && fileLinks['pos_recovered'].length > 0 && (
                  <div style={{marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px'}}>
                    {fileLinks['pos_recovered'].map((file, idx) => (
                      <div key={idx} style={{fontSize: '11px', color: '#1e3a5f', background: '#eaf0f7', padding: '6px 10px', borderRadius: '4px', display: 'flex', justifyContent: 'space-between'}}>
                        <span>📄 {file.name}</span>
                        <button onClick={() => removeFile('pos_recovered', idx)} style={{background: 'none', border: 'none', color: '#1e3a5f', cursor: 'pointer'}}>✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div style={{border: '1.5px solid #e2e8f0', borderRadius: '16px', padding: '1.5rem', background: '#f8fafc'}}>
                <p style={{fontSize: '15px', fontWeight: '800', color: '#0f172a', marginBottom: '6px'}}>Resolved Legacy / Complex Issues / 解决遗留／复杂问题</p>
                <p style={{fontSize: '13px', color: '#64748b', marginBottom: '12px'}}>Took over and resolved problems not caused by themselves / 接手非本人造成的问题并成功处理</p>
                <textarea id="pos_resolved_desc" placeholder="Evidence / Event description... / 证据／事件描述" style={{width: '100%', minHeight: '70px', padding: '12px 16px', border: '1.5px solid #e2e8f0', borderRadius: '12px', fontSize: '13px', fontFamily: 'inherit', marginBottom: '12px'}} />
                <label style={{fontSize: '12px', color: '#64748b', fontWeight: '700', marginBottom: '8px', display: 'block'}}>Upload Evidence / 上传证据</label>
                <div style={{border: '2px dashed #cbd5e1', borderRadius: '12px', padding: '16px', textAlign: 'center', background: '#f8fafc', cursor: 'pointer'}} onClick={() => document.getElementById('file_pos_resolved')?.click()}>
                  <input type="file" id="file_pos_resolved" multiple style={{display: 'none'}} onChange={(e) => e.target.files && handleFileUpload('pos_resolved', e.target.files)} accept="image/*,.pdf,.doc,.docx,.xls,.xlsx" />
                  <div style={{fontSize: '12px', color: '#1e3a5f', fontWeight: '700'}}>📁 Click to upload</div>
                </div>
                {fileLinks['pos_resolved'] && fileLinks['pos_resolved'].length > 0 && (
                  <div style={{marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px'}}>
                    {fileLinks['pos_resolved'].map((file, idx) => (
                      <div key={idx} style={{fontSize: '11px', color: '#1e3a5f', background: '#eaf0f7', padding: '6px 10px', borderRadius: '4px', display: 'flex', justifyContent: 'space-between'}}>
                        <span>📄 {file.name}</span>
                        <button onClick={() => removeFile('pos_resolved', idx)} style={{background: 'none', border: 'none', color: '#1e3a5f', cursor: 'pointer'}}>✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div style={{border: '1.5px solid #e2e8f0', borderRadius: '16px', padding: '1.5rem', background: '#f8fafc'}}>
                <p style={{fontSize: '15px', fontWeight: '800', color: '#0f172a', marginBottom: '6px'}}>Additional Business Opportunity / 额外业务机会</p>
                <p style={{fontSize: '13px', color: '#64748b', marginBottom: '12px'}}>Referral / upsell / cross-sell (outside sales role) / 转介业务</p>
                <textarea id="pos_business_desc" placeholder="Evidence / Event description... / 证据／事件描述" style={{width: '100%', minHeight: '70px', padding: '12px 16px', border: '1.5px solid #e2e8f0', borderRadius: '12px', fontSize: '13px', fontFamily: 'inherit', marginBottom: '12px'}} />
                <label style={{fontSize: '12px', color: '#64748b', fontWeight: '700', marginBottom: '8px', display: 'block'}}>Upload Evidence / 上传证据</label>
                <div style={{border: '2px dashed #cbd5e1', borderRadius: '12px', padding: '16px', textAlign: 'center', background: '#f8fafc', cursor: 'pointer'}} onClick={() => document.getElementById('file_pos_business')?.click()}>
                  <input type="file" id="file_pos_business" multiple style={{display: 'none'}} onChange={(e) => e.target.files && handleFileUpload('pos_business', e.target.files)} accept="image/*,.pdf,.doc,.docx,.xls,.xlsx" />
                  <div style={{fontSize: '12px', color: '#1e3a5f', fontWeight: '700'}}>📁 Click to upload</div>
                </div>
                {fileLinks['pos_business'] && fileLinks['pos_business'].length > 0 && (
                  <div style={{marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px'}}>
                    {fileLinks['pos_business'].map((file, idx) => (
                      <div key={idx} style={{fontSize: '11px', color: '#1e3a5f', background: '#eaf0f7', padding: '6px 10px', borderRadius: '4px', display: 'flex', justifyContent: 'space-between'}}>
                        <span>📄 {file.name}</span>
                        <button onClick={() => removeFile('pos_business', idx)} style={{background: 'none', border: 'none', color: '#1e3a5f', cursor: 'pointer'}}>✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div style={{border: '1.5px solid #e2e8f0', borderRadius: '16px', padding: '1.5rem', background: '#f8fafc'}}>
                <p style={{fontSize: '15px', fontWeight: '800', color: '#0f172a', marginBottom: '6px'}}>Special Contribution / 特别贡献</p>
                <p style={{fontSize: '13px', color: '#64748b', marginBottom: '12px'}}>Contribution clearly beyond job scope, requires manager explanation / 有明显超出岗位职责的贡献，需主管说明</p>
                <textarea id="pos_special_desc" placeholder="Evidence / Event description... / 证据／事件描述" style={{width: '100%', minHeight: '70px', padding: '12px 16px', border: '1.5px solid #e2e8f0', borderRadius: '12px', fontSize: '13px', fontFamily: 'inherit', marginBottom: '12px'}} />
                <label style={{fontSize: '12px', color: '#64748b', fontWeight: '700', marginBottom: '8px', display: 'block'}}>Upload Evidence / 上传证据</label>
                <div style={{border: '2px dashed #cbd5e1', borderRadius: '12px', padding: '16px', textAlign: 'center', background: '#f8fafc', cursor: 'pointer'}} onClick={() => document.getElementById('file_pos_special')?.click()}>
                  <input type="file" id="file_pos_special" multiple style={{display: 'none'}} onChange={(e) => e.target.files && handleFileUpload('pos_special', e.target.files)} accept="image/*,.pdf,.doc,.docx,.xls,.xlsx" />
                  <div style={{fontSize: '12px', color: '#1e3a5f', fontWeight: '700'}}>📁 Click to upload</div>
                </div>
                {fileLinks['pos_special'] && fileLinks['pos_special'].length > 0 && (
                  <div style={{marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px'}}>
                    {fileLinks['pos_special'].map((file, idx) => (
                      <div key={idx} style={{fontSize: '11px', color: '#1e3a5f', background: '#eaf0f7', padding: '6px 10px', borderRadius: '4px', display: 'flex', justifyContent: 'space-between'}}>
                        <span>📄 {file.name}</span>
                        <button onClick={() => removeFile('pos_special', idx)} style={{background: 'none', border: 'none', color: '#1e3a5f', cursor: 'pointer'}}>✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
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
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, #e2e8f0, #cbd5e1)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, #f1f5f9, #e2e8f0)';
              e.currentTarget.style.transform = 'none';
            }}
            >
              Clear Form
            </button>
            <button onClick={handleSubmit} style={{
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
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 12px 32px rgba(30, 58, 95, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(30, 58, 95, 0.3)';
            }}
            >
              Submit Self Review
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
