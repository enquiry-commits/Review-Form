'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@/lib/auth';
import { getCurrentReviewMonth } from '@/lib/reviewHelpers';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function LeaderReviewForm() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [fileLinks, setFileLinks] = useState<{[key: string]: Array<{name: string; url: string}>}>({});
  const [employeeRows, setEmployeeRows] = useState<{[key: string]: number}>({});
  const [positiveItemRows, setPositiveItemRows] = useState<{[key: string]: number}>({});
  const [isEmbedded, setIsEmbedded] = useState(false);

  const departmentEmployees: {[key: string]: string[]} = {
    'CORPORATE SECRETARIAL': ['Jenny Lai', 'Chin Kah Ye', 'Ang Shi Ming', 'Tey Shemin', 'Tan Min Quan'],
    'ACCOUNTING': ['Tee Yu Heng', 'Vernice Chai', 'Chee Wei En'],
    'TAX': ['Quinnie Tan', 'Victoria Yap'],
    'Internal': ['Chelsea Ang']
  };

  const getRowCount = (kpiId: string) => employeeRows[kpiId] || 1;

  const addEmployeeRow = (kpiId: string) => {
    setEmployeeRows(prev => ({
      ...prev,
      [kpiId]: (prev[kpiId] || 1) + 1
    }));
  };

  const removeEmployeeRow = (kpiId: string, rowIdx: number) => {
    const currentCount = getRowCount(kpiId);
    if (currentCount > 1) {
      setEmployeeRows(prev => ({
        ...prev,
        [kpiId]: currentCount - 1
      }));
    }
  };

  const getPosRowCount = (posId: string) => positiveItemRows[posId] || 1;

  const addPositiveItemRow = (posId: string) => {
    setPositiveItemRows(prev => ({
      ...prev,
      [posId]: (prev[posId] || 1) + 1
    }));
  };

  const removePositiveItemRow = (posId: string) => {
    const currentCount = getPosRowCount(posId);
    if (currentCount > 1) {
      setPositiveItemRows(prev => ({
        ...prev,
        [posId]: currentCount - 1
      }));
    }
  };

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/');
      return;
    }
    setUser(JSON.parse(userData));
    setIsEmbedded(window.self !== window.top);
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

  if (!user) {
    return null;
  }

  const kpiCategories = [
    {
      category: 'Client',
      label: 'Client Stability / 客户稳定性',
      badge: '#7eb8d4',
      items: [
        { kpi: 'Client Complaints / Issues / 客户抱怨／异常', question: 'Were there any client complaints, issues or controllable churn? / 有没有客户抱怨、异常和可控流失？' },
        { kpi: 'Client Attrition / 客户流失', question: 'Was there client loss due to lack of follow-up or unresolved issues? / 因为没有及时跟进和解决问题，导致客户流失？' }
      ]
    },
    {
      category: 'Efficiency',
      label: 'Task Efficiency & Execution / 任务执行力',
      badge: '#7eb8d4',
      items: [
        { kpi: 'Chased / Minor Delays / 被催、一般延误', question: 'Was the employee chased by clients or management? / 有没有被催、被客户或被管理？' },
        { kpi: 'Serious Delays / 严重延误', question: 'Were there delays that affected client arrangements or led to cancellations? / 有没有延误影响客户安排，甚至导致客户取消服务？' }
      ]
    },
    {
      category: 'Quality',
      label: 'Work Quality & Risk Control / 工作质量与风险管理',
      badge: '#7eb8d4',
      items: [
        { kpi: 'Minor Errors / 轻微错误', question: 'Were there any mistakes made? / 有没有出错？' },
        { kpi: 'Serious Errors / Penalty Risk / 严重错误／罚款风险', question: 'Were there any filing issues, penalty risks or client impact? / 是否有申报、罚款和客户影响风险？' }
      ]
    },
    {
      category: 'Coordination',
      label: 'Internal Coordination & Communication / 内部协作与沟通',
      badge: '#7eb8d4',
      items: [
        { kpi: 'Communication / Handover Issues / 沟通／交接问题', question: 'Was collaboration with colleagues smooth? / 和员工和同事协作顺不顺？' },
        { kpi: 'Team Impact / 影响团队', question: 'Were there any communication or handover problems? / 有没有沟通和交接问题？' }
      ]
    },
    {
      category: 'Development',
      label: 'Capability & Growth / 能力与能力提升',
      badge: '#7eb8d4',
      items: [
        { kpi: 'Learning & Application / 学习并应用', question: 'Has the employee applied new knowledge to their work? / 学到的东西有没有在工作里正用？' }
      ]
    }
  ];

  const positiveItems = [
    { label: 'Written Client Compliment / 客户书面表扬', desc: 'Client proactively sent email/message with explicit praise (not routine thanks) / 客户主动发email/message有明确表扬，非常规感谢' },
    { label: 'Client Requested Same Staff / 客户点名继续服务', desc: 'Client explicitly requested the same employee or gave special recognition / 客户明确要求继续由该员工负责，有特别认可' },
    { label: 'Prevented Major Risk / Penalty / 避免重大风险／罚款', desc: 'Identified issues outside scope and prevented significant losses / 超职责范围发现问题并避免重大损失' },
    { label: 'Recovered Client / 挽回客户', desc: 'Successfully retained a client at risk of leaving / 已有流失风险客户被成功挽回' },
    { label: 'Resolved Legacy / Complex Issues / 解决遗留／复杂问题', desc: 'Took over and resolved problems not caused by themselves / 接手非本人造成的问题并成功处理' },
    { label: 'Additional Business Opportunity / 额外业务机会', desc: 'Referral / upsell / cross-sell (outside sales role) / 转介业务' },
    { label: 'Special Contribution / 特别贡献', desc: 'Contribution clearly beyond job scope, requires manager explanation / 有明显超出岗位职责的贡献，需主管说明' }
  ];

  return (
    <div style={{background: 'linear-gradient(135deg, #f0f4f8 0%, #d9e2ec 100%)', minHeight: '100vh'}}>
      {/* Header */}
      {!isEmbedded && (
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
            <Link href="/dashboard" style={{display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none'}}>
              <img src="/tassure-logo.png" alt="Tassure" style={{height: '32px', width: 'auto'}} />
              <div style={{fontSize: '14px', fontWeight: '800', color: '#1e3a5f'}}>Review System</div>
            </Link>
            <div style={{display: 'flex', alignItems: 'center', gap: '16px'}}>
              <span style={{fontSize: '14px', color: '#64748b'}}>{user.name}</span>
              <button onClick={handleLogout} style={{padding: '8px 16px', fontSize: '14px', fontWeight: '600', color: '#1e3a5f', background: 'transparent', border: 'none', cursor: 'pointer', borderRadius: '10px', transition: 'all 0.3s'}} onMouseEnter={(e) => {e.currentTarget.style.background = 'rgba(30, 58, 95, 0.04)'}} onMouseLeave={(e) => {e.currentTarget.style.background = 'transparent'}}>Logout</button>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div style={{padding: '48px 32px', maxWidth: '1100px', margin: '0 auto'}}>
        {!isEmbedded && (
          <Link href="/dashboard" style={{display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#7eb8d4', textDecoration: 'none', fontWeight: '600', marginBottom: '32px', fontSize: '14px'}}>
            ← Back to Dashboard
          </Link>
        )}

        <div>
          {/* Form Header */}
          <div style={{textAlign: 'center', marginBottom: '48px', paddingBottom: '32px', borderBottom: '1px solid rgba(30, 58, 95, 0.08)'}}>
            <h1 style={{fontSize: '36px', fontWeight: '800', color: '#0f172a', marginBottom: '8px', letterSpacing: '-0.5px'}}>Leader Review Form / 主管评价表</h1>
            <p style={{color: '#64748b', fontSize: '15px', lineHeight: '1.6'}}>Tassure – For department leaders to evaluate their team members / 依部门主管填写与评价</p>
          </div>

          {/* Basic Info Section */}
          <div style={{
            marginBottom: '40px',
            background: 'rgba(255, 255, 255, 0.95)',
            border: '1.5px solid #e2e8f0',
            borderRadius: '14px',
            padding: '24px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.04)',
            transition: 'all 0.3s'
          }}>
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px'}}>
              <div>
                <label style={{fontSize: '13px', color: '#334155', fontWeight: '700', marginBottom: '10px', letterSpacing: '0.4px', display: 'block'}}>Department / 部门 *</label>
                <input type="text" value={user.department || ''} disabled style={{width: '100%', padding: '12px 16px', border: '1.5px solid #e2e8f0', borderRadius: '12px', fontSize: '14px', color: '#1a1a2e', background: '#f0f4f8', fontFamily: 'inherit', cursor: 'not-allowed', opacity: 0.6}} />
              </div>
              <div>
                <label style={{fontSize: '13px', color: '#334155', fontWeight: '700', marginBottom: '10px', letterSpacing: '0.4px', display: 'block'}}>Your Name / 你的名字 *</label>
                <input type="text" value={user.name || ''} disabled style={{width: '100%', padding: '12px 16px', border: '1.5px solid #e2e8f0', borderRadius: '12px', fontSize: '14px', color: '#1a1a2e', background: '#f0f4f8', fontFamily: 'inherit', cursor: 'not-allowed', opacity: 0.6}} />
              </div>
              <div>
                <label style={{fontSize: '13px', color: '#334155', fontWeight: '700', marginBottom: '10px', letterSpacing: '0.4px', display: 'block'}}>Review Period / 评审周期 *</label>
                <input type="text" value={getCurrentReviewMonth()} disabled style={{width: '100%', padding: '12px 16px', border: '1.5px solid #e2e8f0', borderRadius: '12px', fontSize: '14px', color: '#1a1a2e', background: '#f8fafc'}} />
              </div>
            </div>
          </div>

          {/* KPI Sections */}
          {kpiCategories.map((cat, idx) => (
            <div key={idx} style={{
              marginBottom: '40px',
              background: 'rgba(255, 255, 255, 0.95)',
              border: '1.5px solid #e2e8f0',
              borderRadius: '14px',
              padding: '24px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.04)',
              transition: 'all 0.3s'
            }}>
              <div style={{display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px'}}>
                <span style={{display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px', background: cat.badge, color: 'white', borderRadius: '8px', fontSize: '11px', fontWeight: '800', letterSpacing: '0.4px', boxShadow: '0 2px 8px rgba(0,0,0,0.15)'}}>{cat.category}</span>
                <span style={{fontSize: '18px', fontWeight: '800', color: '#0f172a'}}>{cat.label}</span>
              </div>
              <div style={{display: 'flex', flexDirection: 'column', gap: '14px'}}>
                {cat.items.map((item, itemIdx) => {
                  const kpiId = `kpi_${idx}_${itemIdx}`;
                  const rowCount = getRowCount(kpiId);
                  return (
                    <div key={itemIdx} style={{border: '1.5px solid #e2e8f0', borderRadius: '16px', padding: '1.5rem', background: '#f8fafc'}}>
                      {Array.from({length: rowCount}).map((_, rowIdx) => {
                        const fieldId = `${kpiId}_${rowIdx}`;
                        return (
                          <div key={rowIdx} style={{marginBottom: rowIdx < rowCount - 1 ? '24px' : '0', paddingBottom: rowIdx < rowCount - 1 ? '24px' : '0', borderBottom: rowIdx < rowCount - 1 ? '1.5px solid #e2e8f0' : 'none'}}>
                            <div style={{marginBottom: '14px'}}>
                              <p style={{fontSize: '15px', fontWeight: '800', color: '#0f172a', marginBottom: '6px'}}>{item.kpi}</p>
                              <p style={{fontSize: '13px', color: '#64748b', lineHeight: '1.7'}}>{item.question}</p>
                            </div>
                            <div style={{marginBottom: '14px', display: 'flex', gap: '12px', alignItems: 'flex-end'}}>
                              <div style={{flex: 1}}>
                                <label style={{fontSize: '12px', color: '#64748b', fontWeight: '700', marginBottom: '8px', display: 'block'}}>Employee / 员工</label>
                                <select style={{width: '100%', padding: '10px 12px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '13px', color: '#1a1a2e', background: '#fff', fontFamily: 'inherit', cursor: 'pointer'}}>
                                  <option>-- Select Employee / 选择员工 --</option>
                                  {user.department && departmentEmployees[user.department]?.map(emp => (
                                    <option key={emp} value={emp}>{emp}</option>
                                  ))}
                                </select>
                              </div>
                              {rowCount > 1 && (
                                <button onClick={() => removeEmployeeRow(kpiId, rowIdx)} style={{padding: '10px 16px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.3s', whiteSpace: 'nowrap'}} onMouseEnter={(e) => {e.currentTarget.style.background = '#fecaca'}} onMouseLeave={(e) => {e.currentTarget.style.background = '#fee2e2'}}>
                                  Remove
                                </button>
                              )}
                            </div>
                            <div style={{marginBottom: '12px'}}>
                              <label style={{fontSize: '12px', color: '#64748b', fontWeight: '700', marginBottom: '8px', display: 'block'}}>Leader Comment / 主管评语</label>
                              <textarea id={`comment_${fieldId}`} placeholder="Enter your assessment... / 请填写评价" style={{width: '100%', minHeight: '70px', padding: '12px 16px', border: '1.5px solid #e2e8f0', borderRadius: '12px', fontSize: '13px', fontFamily: 'inherit', background: '#fff'}} />
                            </div>
                            <div style={{background: 'rgba(126, 184, 212, 0.04)', border: '1.5px solid #e2e8f0', borderRadius: '12px', padding: '14px', marginTop: '4px'}}>
                              <label style={{fontSize: '12px', color: '#64748b', fontWeight: '700', marginBottom: '10px', display: 'block'}}>Upload Evidence / 上传证据</label>
                              <div style={{border: '1.5px dashed #7eb8d4', borderRadius: '10px', padding: '20px', textAlign: 'center', background: 'rgba(126, 184, 212, 0.06)', cursor: 'pointer', transition: 'all 0.3s'}} onMouseEnter={(e) => {e.currentTarget.style.borderColor = '#5a9bc4'; e.currentTarget.style.background = 'rgba(126, 184, 212, 0.12)'}} onMouseLeave={(e) => {e.currentTarget.style.borderColor = '#7eb8d4'; e.currentTarget.style.background = 'rgba(126, 184, 212, 0.06)'}} onClick={() => document.getElementById(`file_${fieldId}`)?.click()}>
                                <input type="file" id={`file_${fieldId}`} multiple style={{display: 'none'}} onChange={(e) => e.target.files && handleFileUpload(fieldId, e.target.files)} accept="image/*,.pdf,.doc,.docx,.xls,.xlsx" />
                                <div style={{fontSize: '13px', color: '#7eb8d4', fontWeight: '700'}}>📁 Click or drag files to upload / 点击或拖拽文件上传</div>
                                <div style={{fontSize: '11px', color: '#94a3b8', marginTop: '6px'}}>Supports images, PDF, Word, Excel / 支持图片、PDF、Word、Excel</div>
                              </div>
                              {fileLinks[fieldId] && fileLinks[fieldId].length > 0 && (
                                <div style={{marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px'}}>
                                  {fileLinks[fieldId].map((file, fIdx) => (
                                    <div key={fIdx} style={{fontSize: '12px', color: '#0f172a', background: 'rgba(126, 184, 212, 0.08)', padding: '8px 12px', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                                      <span>📄 {file.name}</span>
                                      <button onClick={() => removeFile(fieldId, fIdx)} style={{background: 'none', border: 'none', color: '#7eb8d4', cursor: 'pointer', fontSize: '14px', padding: '0 4px', transition: 'all 0.3s'}} onMouseEnter={(e) => {e.currentTarget.style.color = '#5a9bc4'}} onMouseLeave={(e) => {e.currentTarget.style.color = '#7eb8d4'}}>✕</button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                      <div style={{marginTop: '16px', paddingTop: '16px', borderTop: '1.5px solid #e2e8f0'}}>
                        <button onClick={() => addEmployeeRow(kpiId)} style={{width: '100%', padding: '12px 24px', background: '#1e3a5f', color: 'white', border: 'none', borderRadius: '12px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.3s'}} onMouseEnter={(e) => {e.currentTarget.style.background = '#152840'}} onMouseLeave={(e) => {e.currentTarget.style.background = '#1e3a5f'}}>
                          + Add another employee / 增加另一个员工
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Section Divider */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            margin: '60px 0 40px 0'
          }}>
            <div style={{flex: 1, height: '1px', background: '#cbd5e1'}}></div>
            <div style={{
              color: '#334155',
              fontSize: '12px',
              fontWeight: '700',
              letterSpacing: '2px',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
              background: 'rgba(217, 226, 236, 0.8)',
              padding: '0 20px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'
            }}>
              — SECTION 2 — POSITIVE ITEMS —
            </div>
            <div style={{flex: 1, height: '1px', background: '#cbd5e1'}}></div>
          </div>

          {/* Positive Items Section */}
          <div style={{
            marginBottom: '40px',
            background: 'rgba(255, 255, 255, 0.95)',
            border: '1.5px solid #e2e8f0',
            borderRadius: '14px',
            padding: '24px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.04)',
            transition: 'all 0.3s'
          }}>
            <div style={{display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px'}}>
              <span style={{display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px', background: '#10b981', color: 'white', borderRadius: '8px', fontSize: '11px', fontWeight: '800', letterSpacing: '0.4px', boxShadow: '0 2px 8px rgba(0,0,0,0.15)'}}>★ Positive</span>
              <span style={{fontSize: '18px', fontWeight: '800', color: '#0f172a'}}>Positive Items / 正面项目记录</span>
            </div>
            <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
              {positiveItems.map((item, idx) => {
                const posId = `pos_${idx}`;
                const rowCount = getPosRowCount(posId);
                return (
                  <div key={idx} style={{border: '1.5px solid #e2e8f0', borderRadius: '16px', padding: '1.5rem', background: '#f8fafc'}}>
                    <p style={{fontSize: '15px', fontWeight: '800', color: '#0f172a', marginBottom: '6px'}}>{item.label}</p>
                    <p style={{fontSize: '13px', color: '#64748b', marginBottom: '12px', lineHeight: '1.7'}}>{item.desc}</p>
                    {Array.from({length: rowCount}).map((_, rowIdx) => {
                      const fieldId = `${posId}_${rowIdx}`;
                      return (
                        <div key={rowIdx} style={{marginBottom: rowIdx < rowCount - 1 ? '24px' : '0', paddingBottom: rowIdx < rowCount - 1 ? '24px' : '0', borderBottom: rowIdx < rowCount - 1 ? '1.5px solid #e2e8f0' : 'none'}}>
                          <label style={{fontSize: '12px', color: '#64748b', fontWeight: '700', marginBottom: '8px', display: 'block'}}>Leader Comment / 主管评语</label>
                          <textarea id={`comment_${fieldId}`} placeholder="Evidence / Event description... / 证据／事件描述" style={{width: '100%', minHeight: '70px', padding: '12px 16px', border: '1.5px solid #e2e8f0', borderRadius: '12px', fontSize: '13px', fontFamily: 'inherit', marginBottom: '12px', background: '#fff'}} />
                          <div style={{background: 'rgba(126, 184, 212, 0.04)', border: '1.5px solid #e2e8f0', borderRadius: '12px', padding: '14px', marginTop: '4px'}}>
                            <label style={{fontSize: '12px', color: '#64748b', fontWeight: '700', marginBottom: '10px', display: 'block'}}>Upload Evidence / 上传证据</label>
                            <div style={{border: '1.5px dashed #7eb8d4', borderRadius: '10px', padding: '20px', textAlign: 'center', background: 'rgba(126, 184, 212, 0.06)', cursor: 'pointer', transition: 'all 0.3s'}} onMouseEnter={(e) => {e.currentTarget.style.borderColor = '#5a9bc4'; e.currentTarget.style.background = 'rgba(126, 184, 212, 0.12)'}} onMouseLeave={(e) => {e.currentTarget.style.borderColor = '#7eb8d4'; e.currentTarget.style.background = 'rgba(126, 184, 212, 0.06)'}} onClick={() => document.getElementById(`file_${fieldId}`)?.click()}>
                              <input type="file" id={`file_${fieldId}`} multiple style={{display: 'none'}} onChange={(e) => e.target.files && handleFileUpload(fieldId, e.target.files)} accept="image/*,.pdf,.doc,.docx,.xls,.xlsx" />
                              <div style={{fontSize: '13px', color: '#7eb8d4', fontWeight: '700'}}>📁 Click or drag files to upload / 点击或拖拽文件上传</div>
                              <div style={{fontSize: '11px', color: '#94a3b8', marginTop: '6px'}}>Supports images, PDF, Word, Excel / 支持图片、PDF、Word、Excel</div>
                            </div>
                            {fileLinks[fieldId] && fileLinks[fieldId].length > 0 && (
                              <div style={{marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px'}}>
                                {fileLinks[fieldId].map((file, fIdx) => (
                                  <div key={fIdx} style={{fontSize: '12px', color: '#0f172a', background: 'rgba(126, 184, 212, 0.08)', padding: '8px 12px', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                                    <span>📄 {file.name}</span>
                                    <button onClick={() => removeFile(fieldId, fIdx)} style={{background: 'none', border: 'none', color: '#7eb8d4', cursor: 'pointer', fontSize: '14px', padding: '0 4px', transition: 'all 0.3s'}} onMouseEnter={(e) => {e.currentTarget.style.color = '#5a9bc4'}} onMouseLeave={(e) => {e.currentTarget.style.color = '#7eb8d4'}}>✕</button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    <div style={{marginTop: '16px', paddingTop: '16px', borderTop: '1.5px solid #e2e8f0'}}>
                      <button onClick={() => addPositiveItemRow(posId)} style={{width: '100%', padding: '12px 24px', background: '#1e3a5f', color: 'white', border: 'none', borderRadius: '12px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.3s'}} onMouseEnter={(e) => {e.currentTarget.style.background = '#152840'}} onMouseLeave={(e) => {e.currentTarget.style.background = '#1e3a5f'}}>
                        + Add another item / 增加另一个项目
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Overall Remarks Section */}
          <div style={{background: '#1e3a5f', borderRadius: '16px', padding: '32px', marginBottom: '40px', boxShadow: '0 8px 32px rgba(0,0,0,0.12)'}}>
            <div style={{display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px'}}>
              <span style={{display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px', background: '#7eb8d4', color: 'white', borderRadius: '8px', fontSize: '13px', fontWeight: '800', boxShadow: '0 2px 8px rgba(0,0,0,0.15)'}}>🎯 Overall</span>
              <span style={{fontSize: '18px', fontWeight: '800', color: 'white'}}>Overall Remarks / 整体补充说明</span>
            </div>
            <p style={{fontSize: '13px', color: '#cbd5e1', marginBottom: '16px'}}>Any additional comments or observations for the team this review period. / 本评审周期内对部门的整体补充说明。</p>
            <textarea id="overall_remarks" placeholder="Enter your overall remarks for the department this period... / 请填写本次对部门的整体评价和补充" style={{width: '100%', minHeight: '120px', padding: '14px 16px', border: 'none', borderRadius: '12px', fontSize: '14px', fontFamily: 'inherit', marginBottom: '16px', background: '#fff'}} />
            <div style={{background: 'rgba(255, 255, 255, 0.95)', border: '1.5px solid #e2e8f0', borderRadius: '12px', padding: '16px'}}>
              <label style={{fontSize: '12px', color: '#64748b', fontWeight: '700', marginBottom: '10px', display: 'block'}}>Upload Evidence / 上传证据</label>
              <div style={{border: '1.5px dashed #7eb8d4', borderRadius: '10px', padding: '20px', textAlign: 'center', background: 'rgba(126, 184, 212, 0.04)', cursor: 'pointer', transition: 'all 0.3s'}} onMouseEnter={(e) => {e.currentTarget.style.borderColor = '#5a9bc4'; e.currentTarget.style.background = 'rgba(126, 184, 212, 0.1)'}} onMouseLeave={(e) => {e.currentTarget.style.borderColor = '#7eb8d4'; e.currentTarget.style.background = 'rgba(126, 184, 212, 0.04)'}} onClick={() => document.getElementById('file_overall_remarks')?.click()}>
                <input type="file" id="file_overall_remarks" multiple style={{display: 'none'}} onChange={(e) => e.target.files && handleFileUpload('overall_remarks', e.target.files)} accept="image/*,.pdf,.doc,.docx,.xls,.xlsx" />
                <div style={{fontSize: '13px', color: '#7eb8d4', fontWeight: '700'}}>📁 Click or drag files to upload / 点击或拖拽文件上传</div>
                <div style={{fontSize: '11px', color: '#94a3b8', marginTop: '6px'}}>Supports images, PDF, Word, Excel / 支持图片、PDF、Word、Excel</div>
              </div>
              {fileLinks['overall_remarks'] && fileLinks['overall_remarks'].length > 0 && (
                <div style={{marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px'}}>
                  {fileLinks['overall_remarks'].map((file, fIdx) => (
                    <div key={fIdx} style={{fontSize: '12px', color: '#0f172a', background: 'rgba(126, 184, 212, 0.08)', padding: '8px 12px', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                      <span>📄 {file.name}</span>
                      <button onClick={() => removeFile('overall_remarks', fIdx)} style={{background: 'none', border: 'none', color: '#7eb8d4', cursor: 'pointer', fontSize: '14px', padding: '0 4px', transition: 'all 0.3s'}} onMouseEnter={(e) => {e.currentTarget.style.color = '#5a9bc4'}} onMouseLeave={(e) => {e.currentTarget.style.color = '#7eb8d4'}}>✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div style={{display: 'flex', justifyContent: 'flex-end', gap: '14px', marginTop: '48px', paddingTop: '32px', borderTop: '1px solid rgba(30, 58, 95, 0.08)'}}>
            <button style={{padding: '13px 32px', background: 'linear-gradient(135deg, #f1f5f9, #e2e8f0)', color: '#334155', border: '1.5px solid #cbd5e1', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', fontSize: '14px', letterSpacing: '0.3px', transition: 'all 0.3s'}} onMouseEnter={(e) => {e.currentTarget.style.transform = 'translateY(-1px)'}} onMouseLeave={(e) => {e.currentTarget.style.transform = 'none'}}>
              Clear / 清除
            </button>
            <button style={{padding: '13px 32px', background: 'linear-gradient(135deg, #1e3a5f, #162d4a)', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', fontSize: '14px', letterSpacing: '0.3px', boxShadow: '0 8px 20px rgba(30,58,95,0.3)', transition: 'all 0.3s'}} onMouseEnter={(e) => {e.currentTarget.style.transform = 'translateY(-2px)'}} onMouseLeave={(e) => {e.currentTarget.style.transform = 'none'}}>
              Submit Review / 提交评价
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
