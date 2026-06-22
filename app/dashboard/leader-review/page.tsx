'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@/lib/auth';
import { getCurrentReviewPeriod, formatPeriodDisplay } from '@/lib/reviewHelpers';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

type FileLink  = { name: string; url: string };
type KPIRow    = { employee: string; comment: string; files: FileLink[] };
type PosRow    = { employee: string; comment: string; files: FileLink[] };
type Overall   = { remarks: string; files: FileLink[] };

// KPI category/item structure (static metadata)
const KPI_CATS = [
  { category:'Client',      label:'Client Stability / 客户稳定性',                       items:[
    { id:'kpi_0_0', kpi:'Client Complaints / Issues / 客户抱怨／异常',          q:'Were there any client complaints, issues or controllable churn? / 有没有客户抱怨、异常和可控流失？'},
    { id:'kpi_0_1', kpi:'Client Attrition / 客户流失',                          q:'Was there client loss due to lack of follow-up or unresolved issues? / 因为没有及时跟进和解决问题，导致客户流失？'},
  ]},
  { category:'Efficiency',  label:'Task Efficiency & Execution / 任务执行力',             items:[
    { id:'kpi_1_0', kpi:'Chased / Minor Delays / 被催、一般延误',               q:'Was the employee chased by clients or management? / 有没有被催、被客户或被管理？'},
    { id:'kpi_1_1', kpi:'Serious Delays / 严重延误',                             q:'Were there delays that affected client arrangements or led to cancellations? / 有没有延误影响客户安排，甚至导致客户取消服务？'},
  ]},
  { category:'Quality',     label:'Work Quality & Risk Control / 工作质量与风险管理',    items:[
    { id:'kpi_2_0', kpi:'Minor Errors / 轻微错误',                               q:'Were there any mistakes made? / 有没有出错？'},
    { id:'kpi_2_1', kpi:'Serious Errors / Penalty Risk / 严重错误／罚款风险',   q:'Were there any filing issues, penalty risks or client impact? / 是否有申报、罚款和客户影响风险？'},
  ]},
  { category:'Coordination',label:'Internal Coordination & Communication / 内部协作与沟通',items:[
    { id:'kpi_3_0', kpi:'Communication / Handover Issues / 沟通／交接问题',     q:'Was collaboration with colleagues smooth? / 和员工和同事协作顺不顺？'},
    { id:'kpi_3_1', kpi:'Team Impact / 影响团队',                                q:'Were there any communication or handover problems? / 有没有沟通和交接问题？'},
  ]},
  { category:'Development', label:'Capability & Growth / 能力与能力提升',                items:[
    { id:'kpi_4_0', kpi:'Learning & Application / 学习并应用',                  q:'Has the employee applied new knowledge to their work? / 学到的东西有没有在工作里正用？'},
  ]},
];
const POS_ITEMS = [
  { id:'pos_0', label:'Written Client Compliment / 客户书面表扬',          desc:'Client proactively sent email/message with explicit praise (not routine thanks) / 客户主动发email/message有明确表扬，非常规感谢'},
  { id:'pos_1', label:'Client Requested Same Staff / 客户点名继续服务',    desc:'Client explicitly requested the same employee or gave special recognition / 客户明确要求继续由该员工负责，有特别认可'},
  { id:'pos_2', label:'Prevented Major Risk / Penalty / 避免重大风险／罚款',desc:'Identified issues outside scope and prevented significant losses / 超职责范围发现问题并避免重大损失'},
  { id:'pos_3', label:'Recovered Client / 挽回客户',                       desc:'Successfully retained a client at risk of leaving / 已有流失风险客户被成功挽回'},
  { id:'pos_4', label:'Resolved Legacy / Complex Issues / 解决遗留／复杂问题',desc:'Took over and resolved problems not caused by themselves / 接手非本人造成的问题并成功处理'},
  { id:'pos_5', label:'Additional Business Opportunity / 额外业务机会',    desc:'Referral / upsell / cross-sell (outside sales role) / 转介业务'},
  { id:'pos_6', label:'Special Contribution / 特别贡献',                   desc:'Contribution clearly beyond job scope, requires manager explanation / 有明显超出岗位职责的贡献，需主管说明'},
];
const ALL_KPI_IDS = KPI_CATS.flatMap(c => c.items.map(i => i.id));
const ALL_POS_IDS = POS_ITEMS.map(p => p.id);

const DEPT_EMPLOYEES: Record<string, string[]> = {
  'CORPORATE SECRETARIAL': ['Jenny Lai','Chin Kah Ye','Ang Shi Ming','Tey Shemin','Tan Min Quan'],
  'ACCOUNTING':            ['Tee Yu Heng','Vernice Chai','Chee Wei En'],
  'TAX':                   ['Quinnie Tan','Victoria Yap'],
  'INTERNAL':              ['Chelsea Ang'],
};

const emptyKpiRows = (): Record<string, KPIRow[]> =>
  Object.fromEntries(ALL_KPI_IDS.map(id => [id, [{ employee:'', comment:'', files:[] }]]));
const emptyPosRows = (): Record<string, PosRow[]> =>
  Object.fromEntries(ALL_POS_IDS.map(id => [id, [{ employee:'', comment:'', files:[] }]]));

export default function LeaderReviewForm() {
  const router = useRouter();
  const [user,       setUser]       = useState<User | null>(null);
  const [kpiRows,    setKpiRows]    = useState<Record<string, KPIRow[]>>(emptyKpiRows());
  const [posRows,    setPosRows]    = useState<Record<string, PosRow[]>>(emptyPosRows());
  const [overall,    setOverall]    = useState<Overall>({ remarks:'', files:[] });
  const [isEmbedded, setIsEmbedded] = useState(false);
  const [status,     setStatus]     = useState<'pending'|'draft'|'submitted'>('pending');
  const [saving,     setSaving]     = useState(false);
  const [loaded,     setLoaded]     = useState(false);
  const currentPeriod = getCurrentReviewPeriod();

  // Refs to avoid stale closures
  const userRef       = useRef<User | null>(null);
  const existingIdRef = useRef<string | null>(null);
  const statusRef     = useRef<'pending'|'draft'|'submitted'>('pending');
  const kpiRef        = useRef(kpiRows);
  const posRef        = useRef(posRows);
  const overallRef    = useRef(overall);
  const saveTimer     = useRef<ReturnType<typeof setTimeout>|null>(null);
  const dirtyRef      = useRef(false);

  useEffect(() => { kpiRef.current     = kpiRows;  }, [kpiRows]);
  useEffect(() => { posRef.current     = posRows;  }, [posRows]);
  useEffect(() => { overallRef.current = overall;  }, [overall]);

  // Load user + existing record
  useEffect(() => {
    const raw = localStorage.getItem('user');
    if (!raw) { router.push('/'); return; }
    const u: User = JSON.parse(raw);
    setUser(u); userRef.current = u;
    setIsEmbedded(window.self !== window.top);

    supabase.from('leader_review_submissions')
      .select('*')
      .eq('employee_email', u.email)
      .eq('review_period', currentPeriod)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          existingIdRef.current = data.id;
          const s: 'draft'|'submitted' = data.submitted_at ? 'submitted' : 'draft';
          setStatus(s); statusRef.current = s;
          const fd = data.form_data || {};
          if (fd.kpis) {
            const next = emptyKpiRows();
            for (const id of ALL_KPI_IDS) if (fd.kpis[id]) next[id] = fd.kpis[id];
            setKpiRows(next);
          }
          if (fd.positive_items) {
            const next = emptyPosRows();
            for (const id of ALL_POS_IDS) if (fd.positive_items[id]) next[id] = fd.positive_items[id];
            setPosRows(next);
          }
          if (fd.overall_remarks) setOverall(fd.overall_remarks);
        }
        setLoaded(true);
      });
  }, [router, currentPeriod]);

  // Auto-save: 2s after user actually edits (not on initial load)
  useEffect(() => {
    if (!loaded || !dirtyRef.current || statusRef.current === 'submitted') return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      const u = userRef.current;
      if (!u) return;
      setSaving(true);
      const payload = { kpis: kpiRef.current, positive_items: posRef.current, overall_remarks: overallRef.current };
      try {
        if (existingIdRef.current) {
          await supabase.from('leader_review_submissions').update({ form_data: payload }).eq('id', existingIdRef.current);
        } else {
          const { data } = await supabase.from('leader_review_submissions').insert([{
            user_id: u.id, employee_name: u.name, employee_email: u.email,
            department: u.department, review_period: currentPeriod, form_data: payload,
          }]).select().single();
          if (data) existingIdRef.current = data.id;
        }
        setStatus('draft'); statusRef.current = 'draft';
      } finally { setSaving(false); }
    }, 2000);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [kpiRows, posRows, overall, currentPeriod]);

  const uploadFiles = async (files: FileList): Promise<FileLink[]> => {
    const links: FileLink[] = [];
    for (const file of Array.from(files)) {
      const ext  = file.name.split('.').pop();
      const name = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      const { data, error } = await supabase.storage.from('review-files').upload(name, file);
      if (!error && data) {
        const { data: u } = supabase.storage.from('review-files').getPublicUrl(data.path);
        links.push({ name: file.name, url: u.publicUrl });
      } else {
        links.push({ name: file.name, url: URL.createObjectURL(file) });
      }
    }
    return links;
  };

  const handleKpiFileUpload = async (id: string, rowIdx: number, files: FileList) => {
    dirtyRef.current = true;
    const links = await uploadFiles(files);
    setKpiRows(p => {
      const rows = [...p[id]];
      rows[rowIdx] = { ...rows[rowIdx], files: [...rows[rowIdx].files, ...links] };
      return { ...p, [id]: rows };
    });
  };

  const handlePosFileUpload = async (id: string, rowIdx: number, files: FileList) => {
    dirtyRef.current = true;
    const links = await uploadFiles(files);
    setPosRows(p => {
      const rows = [...p[id]];
      rows[rowIdx] = { ...rows[rowIdx], files: [...rows[rowIdx].files, ...links] };
      return { ...p, [id]: rows };
    });
  };

  const handleOverallFileUpload = async (files: FileList) => {
    dirtyRef.current = true;
    const links = await uploadFiles(files);
    setOverall(p => ({ ...p, files: [...p.files, ...links] }));
  };

  const handleSubmit = async () => {
    if (!user || statusRef.current === 'submitted') return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    try {
      const payload = { kpis: kpiRef.current, positive_items: posRef.current, overall_remarks: overallRef.current };
      if (existingIdRef.current) {
        const { error } = await supabase.from('leader_review_submissions')
          .update({ form_data: payload, submitted_at: new Date().toISOString(), is_locked: true })
          .eq('id', existingIdRef.current);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('leader_review_submissions').insert([{
          user_id: user.id, employee_name: user.name, employee_email: user.email,
          department: user.department, review_period: currentPeriod, form_data: payload,
          submitted_at: new Date().toISOString(), is_locked: true,
        }]);
        if (error) throw error;
      }
      router.push('/dashboard/leader-review-success');
    } catch (err) {
      console.error(err);
      alert('Submit failed / 提交失败，请重试');
    }
  };

  const handleLogout = () => { localStorage.removeItem('user'); router.push('/'); };

  if (!user) return null;

  const isSubmitted = status === 'submitted';
  const employees   = user.department ? (DEPT_EMPLOYEES[user.department.toUpperCase()] || []) : [];

  return (
    <div style={{background:'linear-gradient(135deg,#f0f4f8 0%,#d9e2ec 100%)',minHeight:'100vh'}}>
      {/* Header */}
      {!isEmbedded && (
        <div style={{background:'linear-gradient(135deg,#ffffff,#f8fafc)',borderBottom:'1px solid rgba(30,58,95,0.08)',position:'sticky',top:0,zIndex:1000,boxShadow:'0 2px 12px rgba(0,0,0,0.04)'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',maxWidth:'1100px',margin:'0 auto',padding:'0 32px',height:'70px'}}>
            <Link href="/dashboard" style={{display:'flex',alignItems:'center',gap:'12px',textDecoration:'none'}}>
              <img src="/tassure-logo.png" alt="Tassure" style={{height:'32px',width:'auto'}} />
              <div style={{fontSize:'14px',fontWeight:'800',color:'#1e3a5f'}}>Tassure Review System</div>
            </Link>
            <div style={{display:'flex',alignItems:'center',gap:'16px'}}>
              <span style={{fontSize:'14px',color:'#64748b'}}>{user.name}</span>
              <button onClick={handleLogout} style={{padding:'8px 16px',fontSize:'14px',fontWeight:'600',color:'#1e3a5f',background:'transparent',border:'none',cursor:'pointer',borderRadius:'10px',transition:'all 0.3s'}}
                onMouseEnter={e=>{e.currentTarget.style.background='rgba(30,58,95,0.04)'}} onMouseLeave={e=>{e.currentTarget.style.background='transparent'}}>Logout</button>
            </div>
          </div>
        </div>
      )}

      <div style={{padding:'48px 32px',maxWidth:'1100px',margin:'0 auto'}}>
        {!isEmbedded && (
          <Link href="/dashboard" style={{display:'inline-flex',alignItems:'center',gap:'8px',color:'#7eb8d4',textDecoration:'none',fontWeight:'600',marginBottom:'32px',fontSize:'14px'}}>
            ← Back to Dashboard
          </Link>
        )}

        {/* Form Header */}
        <div style={{textAlign:'center',marginBottom:'32px',paddingBottom:'28px',borderBottom:'1px solid rgba(30,58,95,0.08)'}}>
          <h1 style={{fontSize:'36px',fontWeight:'800',color:'#0f172a',marginBottom:'8px',letterSpacing:'-0.5px'}}>Leader Review Form / 主管评价表</h1>
          <p style={{color:'#64748b',fontSize:'15px',lineHeight:'1.6'}}>Tassure – For department leaders to evaluate their team members / 依部门主管填写与评价</p>
        </div>

        {/* Status Banner */}
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'32px',padding:'14px 20px',background:'white',borderRadius:'12px',border:'1.5px solid #e2e8f0',boxShadow:'0 2px 8px rgba(0,0,0,0.04)'}}>
          <div>
            <div style={{fontSize:'11px',color:'#94a3b8',fontWeight:'700',textTransform:'uppercase',letterSpacing:'0.5px'}}>Review Period</div>
            <div style={{fontSize:'16px',fontWeight:'800',color:'#1e3a5f',marginTop:'2px'}}>{formatPeriodDisplay(currentPeriod)}</div>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
            {saving && <span style={{fontSize:'12px',color:'#94a3b8',fontStyle:'italic'}}>Saving…</span>}
            <span style={{padding:'5px 16px',borderRadius:'20px',fontSize:'12px',fontWeight:'700',
              background: isSubmitted ? '#dcfce7' : status==='draft' ? '#fef3c7' : '#f1f5f9',
              color:      isSubmitted ? '#15803d' : status==='draft' ? '#92400e' : '#64748b'}}>
              {isSubmitted ? '✓ Submitted' : status==='draft' ? '○ Draft — auto-saved' : '○ Pending'}
            </span>
          </div>
        </div>

        {isSubmitted && (
          <div style={{marginBottom:'24px',padding:'14px 20px',background:'#dcfce7',borderRadius:'12px',border:'1.5px solid #bbf7d0',color:'#15803d',fontWeight:'700',fontSize:'14px'}}>
            ✓ You have already submitted your leader review for {formatPeriodDisplay(currentPeriod)}. The form is read-only.
          </div>
        )}

        {/* Basic Info */}
        <div style={{marginBottom:'40px',background:'rgba(255,255,255,0.95)',border:'1.5px solid #e2e8f0',borderRadius:'14px',padding:'24px',boxShadow:'0 4px 12px rgba(0,0,0,0.04)'}}>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'20px'}}>
            {[['Department / 部门',user.department||''],['Your Name / 你的名字',user.name],['Review Period / 评审周期',formatPeriodDisplay(currentPeriod)]].map(([label,val])=>(
              <div key={label}>
                <label style={{fontSize:'13px',color:'#334155',fontWeight:'700',marginBottom:'10px',letterSpacing:'0.4px',display:'block'}}>{label} *</label>
                <input type="text" value={val} disabled style={{width:'100%',padding:'12px 16px',border:'1.5px solid #e2e8f0',borderRadius:'12px',fontSize:'14px',color:'#1a1a2e',background:'#f0f4f8',fontFamily:'inherit',cursor:'not-allowed',opacity:0.7}} />
              </div>
            ))}
          </div>
        </div>

        {/* KPI Sections */}
        {KPI_CATS.map(cat=>(
          <div key={cat.category} style={{marginBottom:'40px',background:'rgba(255,255,255,0.95)',border:'1.5px solid #e2e8f0',borderRadius:'14px',padding:'24px',boxShadow:'0 4px 12px rgba(0,0,0,0.04)'}}>
            <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'24px'}}>
              <span style={{display:'inline-flex',padding:'6px 14px',background:'#7eb8d4',color:'white',borderRadius:'8px',fontSize:'11px',fontWeight:'800',letterSpacing:'0.4px',boxShadow:'0 2px 8px rgba(0,0,0,0.15)'}}>{cat.category}</span>
              <span style={{fontSize:'18px',fontWeight:'800',color:'#0f172a',letterSpacing:'-0.3px'}}>{cat.label}</span>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:'14px'}}>
              {cat.items.map(item=>{
                const rows = kpiRows[item.id] || [];
                return (
                  <div key={item.id} style={{border:'1.5px solid #e2e8f0',borderRadius:'16px',padding:'1.5rem',background:'#f8fafc'}}>
                    <p style={{fontSize:'15px',fontWeight:'800',color:'#0f172a',marginBottom:'6px'}}>{item.kpi}</p>
                    <p style={{fontSize:'13px',color:'#64748b',lineHeight:'1.7',marginBottom:'16px'}}>{item.q}</p>
                    {rows.map((row,rowIdx)=>(
                      <div key={rowIdx} style={{marginBottom:rowIdx<rows.length-1?'24px':'0',paddingBottom:rowIdx<rows.length-1?'24px':'0',borderBottom:rowIdx<rows.length-1?'1.5px solid #e2e8f0':'none'}}>
                        <div style={{marginBottom:'12px',display:'flex',gap:'12px',alignItems:'flex-end'}}>
                          <div style={{flex:1}}>
                            <label style={{fontSize:'12px',color:'#64748b',fontWeight:'700',marginBottom:'8px',display:'block'}}>Employee / 员工</label>
                            <select value={row.employee} disabled={isSubmitted}
                              onChange={e=>{dirtyRef.current=true;const rows=[...kpiRows[item.id]];rows[rowIdx]={...rows[rowIdx],employee:e.target.value};setKpiRows(p=>({...p,[item.id]:rows}));}}
                              style={{width:'100%',padding:'10px 12px',border:'1.5px solid #e2e8f0',borderRadius:'10px',fontSize:'13px',color:'#1a1a2e',background:'#fff',fontFamily:'inherit',cursor:isSubmitted?'not-allowed':'pointer'}}>
                              <option value="">-- Select Employee / 选择员工 --</option>
                              {employees.map(emp=><option key={emp} value={emp}>{emp}</option>)}
                            </select>
                          </div>
                          {!isSubmitted && rows.length>1 && (
                            <button onClick={()=>setKpiRows(p=>{const r=[...p[item.id]];r.splice(rowIdx,1);return{...p,[item.id]:r};})}
                              style={{padding:'10px 16px',background:'#fee2e2',color:'#dc2626',border:'none',borderRadius:'8px',fontSize:'13px',fontWeight:'700',cursor:'pointer',whiteSpace:'nowrap'}}
                              onMouseEnter={e=>{e.currentTarget.style.background='#fecaca';}} onMouseLeave={e=>{e.currentTarget.style.background='#fee2e2';}}>Remove</button>
                          )}
                        </div>
                        <div style={{marginBottom:'12px'}}>
                          <label style={{fontSize:'12px',color:'#64748b',fontWeight:'700',marginBottom:'8px',display:'block'}}>Leader Comment / 主管评语</label>
                          <textarea value={row.comment} disabled={isSubmitted}
                            onChange={e=>{dirtyRef.current=true;const rows=[...kpiRows[item.id]];rows[rowIdx]={...rows[rowIdx],comment:e.target.value};setKpiRows(p=>({...p,[item.id]:rows}));}}
                            placeholder="Enter your assessment... / 请填写评价"
                            style={{width:'100%',minHeight:'70px',padding:'12px 16px',border:'1.5px solid #e2e8f0',borderRadius:'12px',fontSize:'13px',fontFamily:'inherit',background:'#fff',resize:'vertical'}} />
                        </div>
                        {/* File upload */}
                        <div style={{background:'rgba(126,184,212,0.04)',border:'1.5px solid #e2e8f0',borderRadius:'12px',padding:'14px'}}>
                          <label style={{fontSize:'12px',color:'#64748b',fontWeight:'700',marginBottom:'10px',display:'block'}}>Upload Evidence / 上传证据</label>
                          {!isSubmitted && (
                            <div style={{border:'1.5px dashed #7eb8d4',borderRadius:'10px',padding:'20px',textAlign:'center',background:'rgba(126,184,212,0.06)',cursor:'pointer',transition:'all 0.3s'}}
                              onMouseEnter={e=>{e.currentTarget.style.borderColor='#5a9bc4';e.currentTarget.style.background='rgba(126,184,212,0.12)';}}
                              onMouseLeave={e=>{e.currentTarget.style.borderColor='#7eb8d4';e.currentTarget.style.background='rgba(126,184,212,0.06)';}}
                              onDragOver={e=>{e.preventDefault();e.currentTarget.style.borderColor='#5a9bc4';e.currentTarget.style.background='rgba(126,184,212,0.18)';}}
                              onDragLeave={e=>{e.currentTarget.style.borderColor='#7eb8d4';e.currentTarget.style.background='rgba(126,184,212,0.06)';}}
                              onDrop={e=>{e.preventDefault();e.currentTarget.style.borderColor='#7eb8d4';e.currentTarget.style.background='rgba(126,184,212,0.06)';if(e.dataTransfer.files&&e.dataTransfer.files.length)handleKpiFileUpload(item.id,rowIdx,e.dataTransfer.files);}}
                              onClick={()=>document.getElementById(`file_kpi_${item.id}_${rowIdx}`)?.click()}>
                              <input type="file" id={`file_kpi_${item.id}_${rowIdx}`} multiple style={{display:'none'}} accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                                onChange={e=>e.target.files&&handleKpiFileUpload(item.id,rowIdx,e.target.files)} />
                              <div style={{fontSize:'13px',color:'#7eb8d4',fontWeight:'700'}}>📁 Click or drag files / 点击或拖拽文件</div>
                              <div style={{fontSize:'11px',color:'#94a3b8',marginTop:'6px'}}>Images, PDF, Word, Excel</div>
                            </div>
                          )}
                          {row.files.length>0&&(
                            <div style={{marginTop:'10px',display:'flex',flexDirection:'column',gap:'6px'}}>
                              {row.files.map((f,fIdx)=>(
                                <div key={fIdx} style={{fontSize:'12px',color:'#0f172a',background:'rgba(126,184,212,0.08)',padding:'8px 12px',borderRadius:'6px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                                  <span>📄 {f.name}</span>
                                  {!isSubmitted&&<button onClick={()=>setKpiRows(p=>{const r=[...p[item.id]];r[rowIdx]={...r[rowIdx],files:r[rowIdx].files.filter((_,j)=>j!==fIdx)};return{...p,[item.id]:r};})}
                                    style={{background:'none',border:'none',color:'#7eb8d4',cursor:'pointer',fontSize:'14px',padding:'0 4px'}}>✕</button>}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    {!isSubmitted&&(
                      <div style={{marginTop:'16px',paddingTop:'16px',borderTop:'1.5px solid #e2e8f0'}}>
                        <button onClick={()=>setKpiRows(p=>({...p,[item.id]:[...p[item.id],{employee:'',comment:'',files:[]}]}))}
                          style={{width:'100%',padding:'12px 24px',background:'#1e3a5f',color:'white',border:'none',borderRadius:'12px',fontSize:'13px',fontWeight:'700',cursor:'pointer',transition:'all 0.3s'}}
                          onMouseEnter={e=>{e.currentTarget.style.background='#152840';}} onMouseLeave={e=>{e.currentTarget.style.background='#1e3a5f';}}>
                          + Add another employee / 增加另一个员工
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Section Divider */}
        <div style={{display:'flex',alignItems:'center',gap:'20px',margin:'60px 0 40px'}}>
          <div style={{flex:1,height:'1px',background:'#cbd5e1'}}/>
          <div style={{color:'#334155',fontSize:'12px',fontWeight:'700',letterSpacing:'2px',textTransform:'uppercase',whiteSpace:'nowrap',background:'rgba(217,226,236,0.8)',padding:'0 20px',boxShadow:'0 2px 8px rgba(0,0,0,0.08)'}}>— SECTION 2 — POSITIVE ITEMS —</div>
          <div style={{flex:1,height:'1px',background:'#cbd5e1'}}/>
        </div>

        {/* Positive Items */}
        <div style={{marginBottom:'40px',background:'rgba(255,255,255,0.95)',border:'1.5px solid #e2e8f0',borderRadius:'14px',padding:'24px',boxShadow:'0 4px 12px rgba(0,0,0,0.04)'}}>
          <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'24px'}}>
            <span style={{display:'inline-flex',padding:'6px 14px',background:'#10b981',color:'white',borderRadius:'8px',fontSize:'11px',fontWeight:'800',letterSpacing:'0.4px',boxShadow:'0 2px 8px rgba(0,0,0,0.15)'}}>★ Positive</span>
            <span style={{fontSize:'18px',fontWeight:'800',color:'#0f172a',letterSpacing:'-0.3px'}}>Positive Items / 正面项目记录</span>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
            {POS_ITEMS.map(pi=>{
              const rows = posRows[pi.id] || [];
              return (
                <div key={pi.id} style={{border:'1.5px solid #e2e8f0',borderRadius:'16px',padding:'1.5rem',background:'#f8fafc'}}>
                  <p style={{fontSize:'15px',fontWeight:'800',color:'#0f172a',marginBottom:'6px'}}>{pi.label}</p>
                  <p style={{fontSize:'13px',color:'#64748b',marginBottom:'12px',lineHeight:'1.7'}}>{pi.desc}</p>
                  {rows.map((row,rowIdx)=>(
                    <div key={rowIdx} style={{marginBottom:rowIdx<rows.length-1?'24px':'0',paddingBottom:rowIdx<rows.length-1?'24px':'0',borderBottom:rowIdx<rows.length-1?'1.5px solid #e2e8f0':'none'}}>
                      <div style={{display:'flex',gap:'12px',alignItems:'flex-end',marginBottom:'12px'}}>
                        <div style={{flex:1}}>
                          <label style={{fontSize:'12px',color:'#64748b',fontWeight:'700',marginBottom:'8px',display:'block'}}>Employee / 员工</label>
                          <select value={row.employee||''} disabled={isSubmitted}
                            onChange={e=>{dirtyRef.current=true;const r=[...posRows[pi.id]];r[rowIdx]={...r[rowIdx],employee:e.target.value};setPosRows(p=>({...p,[pi.id]:r}));}}
                            style={{width:'100%',padding:'10px 12px',border:'1.5px solid #e2e8f0',borderRadius:'10px',fontSize:'13px',color:'#1a1a2e',background:'#fff',fontFamily:'inherit',cursor:isSubmitted?'not-allowed':'pointer'}}>
                            <option value="">-- Select Employee / 选择员工 --</option>
                            {employees.map(emp=><option key={emp} value={emp}>{emp}</option>)}
                          </select>
                        </div>
                        {!isSubmitted&&rows.length>1&&(
                          <button onClick={()=>setPosRows(p=>{const r=[...p[pi.id]];r.splice(rowIdx,1);return{...p,[pi.id]:r};})}
                            style={{padding:'10px 16px',background:'#fee2e2',color:'#dc2626',border:'none',borderRadius:'8px',fontSize:'13px',fontWeight:'700',cursor:'pointer',alignSelf:'flex-start',marginTop:'28px'}}
                            onMouseEnter={e=>{e.currentTarget.style.background='#fecaca';}} onMouseLeave={e=>{e.currentTarget.style.background='#fee2e2';}}>Remove</button>
                        )}
                      </div>
                      <div style={{marginBottom:'12px'}}>
                        <label style={{fontSize:'12px',color:'#64748b',fontWeight:'700',marginBottom:'8px',display:'block'}}>Leader Comment / 主管评语</label>
                        <textarea value={row.comment} disabled={isSubmitted}
                          onChange={e=>{dirtyRef.current=true;const r=[...posRows[pi.id]];r[rowIdx]={...r[rowIdx],comment:e.target.value};setPosRows(p=>({...p,[pi.id]:r}));}}
                          placeholder="Evidence / Event description... / 证据／事件描述"
                          style={{width:'100%',minHeight:'70px',padding:'12px 16px',border:'1.5px solid #e2e8f0',borderRadius:'12px',fontSize:'13px',fontFamily:'inherit',background:'#fff',resize:'vertical'}} />
                      </div>
                      <div style={{background:'rgba(126,184,212,0.04)',border:'1.5px solid #e2e8f0',borderRadius:'12px',padding:'14px'}}>
                        <label style={{fontSize:'12px',color:'#64748b',fontWeight:'700',marginBottom:'10px',display:'block'}}>Upload Evidence / 上传证据</label>
                        {!isSubmitted&&(
                          <div style={{border:'1.5px dashed #7eb8d4',borderRadius:'10px',padding:'20px',textAlign:'center',background:'rgba(126,184,212,0.06)',cursor:'pointer',transition:'all 0.3s'}}
                            onMouseEnter={e=>{e.currentTarget.style.borderColor='#5a9bc4';e.currentTarget.style.background='rgba(126,184,212,0.12)';}}
                            onMouseLeave={e=>{e.currentTarget.style.borderColor='#7eb8d4';e.currentTarget.style.background='rgba(126,184,212,0.06)';}}
                            onDragOver={e=>{e.preventDefault();e.currentTarget.style.borderColor='#5a9bc4';e.currentTarget.style.background='rgba(126,184,212,0.18)';}}
                            onDragLeave={e=>{e.currentTarget.style.borderColor='#7eb8d4';e.currentTarget.style.background='rgba(126,184,212,0.06)';}}
                            onDrop={e=>{e.preventDefault();e.currentTarget.style.borderColor='#7eb8d4';e.currentTarget.style.background='rgba(126,184,212,0.06)';if(e.dataTransfer.files&&e.dataTransfer.files.length)handlePosFileUpload(pi.id,rowIdx,e.dataTransfer.files);}}
                            onClick={()=>document.getElementById(`file_pos_${pi.id}_${rowIdx}`)?.click()}>
                            <input type="file" id={`file_pos_${pi.id}_${rowIdx}`} multiple style={{display:'none'}} accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                              onChange={e=>e.target.files&&handlePosFileUpload(pi.id,rowIdx,e.target.files)} />
                            <div style={{fontSize:'13px',color:'#7eb8d4',fontWeight:'700'}}>📁 Click or drag files / 点击或拖拽文件</div>
                            <div style={{fontSize:'11px',color:'#94a3b8',marginTop:'6px'}}>Images, PDF, Word, Excel</div>
                          </div>
                        )}
                        {row.files.length>0&&(
                          <div style={{marginTop:'10px',display:'flex',flexDirection:'column',gap:'6px'}}>
                            {row.files.map((f,fIdx)=>(
                              <div key={fIdx} style={{fontSize:'12px',color:'#0f172a',background:'rgba(126,184,212,0.08)',padding:'8px 12px',borderRadius:'6px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                                <span>📄 {f.name}</span>
                                {!isSubmitted&&<button onClick={()=>setPosRows(p=>{const r=[...p[pi.id]];r[rowIdx]={...r[rowIdx],files:r[rowIdx].files.filter((_,j)=>j!==fIdx)};return{...p,[pi.id]:r};})}
                                  style={{background:'none',border:'none',color:'#7eb8d4',cursor:'pointer',fontSize:'14px',padding:'0 4px'}}>✕</button>}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {!isSubmitted&&(
                    <div style={{marginTop:'16px',paddingTop:'16px',borderTop:'1.5px solid #e2e8f0'}}>
                      <button onClick={()=>setPosRows(p=>({...p,[pi.id]:[...p[pi.id],{employee:'',comment:'',files:[]}]}))}
                        style={{width:'100%',padding:'12px 24px',background:'#1e3a5f',color:'white',border:'none',borderRadius:'12px',fontSize:'13px',fontWeight:'700',cursor:'pointer',transition:'all 0.3s'}}
                        onMouseEnter={e=>{e.currentTarget.style.background='#152840';}} onMouseLeave={e=>{e.currentTarget.style.background='#1e3a5f';}}>
                        + Add another item / 增加另一个项目
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Overall Remarks */}
        <div style={{background:'#1e3a5f',borderRadius:'16px',padding:'32px',marginBottom:'40px',boxShadow:'0 8px 32px rgba(0,0,0,0.12)'}}>
          <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'24px'}}>
            <span style={{display:'inline-flex',padding:'6px 14px',background:'#7eb8d4',color:'white',borderRadius:'8px',fontSize:'13px',fontWeight:'800',boxShadow:'0 2px 8px rgba(0,0,0,0.15)'}}>🎯 Overall</span>
            <span style={{fontSize:'18px',fontWeight:'800',color:'white'}}>Overall Remarks / 整体补充说明</span>
          </div>
          <p style={{fontSize:'13px',color:'#cbd5e1',marginBottom:'16px'}}>Any additional comments or observations for the team this review period. / 本评审周期内对部门的整体补充说明。</p>
          <textarea value={overall.remarks} disabled={isSubmitted}
            onChange={e=>{dirtyRef.current=true;setOverall(p=>({...p,remarks:e.target.value}));}}
            placeholder="Enter your overall remarks for the department this period... / 请填写本次对部门的整体评价和补充"
            style={{width:'100%',minHeight:'120px',padding:'14px 16px',border:'none',borderRadius:'12px',fontSize:'14px',fontFamily:'inherit',marginBottom:'16px',background:'#fff',resize:'vertical'}} />
          <div style={{background:'rgba(255,255,255,0.95)',border:'1.5px solid #e2e8f0',borderRadius:'12px',padding:'16px'}}>
            <label style={{fontSize:'12px',color:'#64748b',fontWeight:'700',marginBottom:'10px',display:'block'}}>Upload Evidence / 上传证据</label>
            {!isSubmitted&&(
              <div style={{border:'1.5px dashed #7eb8d4',borderRadius:'10px',padding:'20px',textAlign:'center',background:'rgba(126,184,212,0.04)',cursor:'pointer',transition:'all 0.3s'}}
                onMouseEnter={e=>{e.currentTarget.style.borderColor='#5a9bc4';e.currentTarget.style.background='rgba(126,184,212,0.1)';}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor='#7eb8d4';e.currentTarget.style.background='rgba(126,184,212,0.04)';}}
                onDragOver={e=>{e.preventDefault();e.currentTarget.style.borderColor='#5a9bc4';e.currentTarget.style.background='rgba(126,184,212,0.1)';}}
                onDragLeave={e=>{e.currentTarget.style.borderColor='#7eb8d4';e.currentTarget.style.background='rgba(126,184,212,0.04)';}}
                onDrop={e=>{e.preventDefault();e.currentTarget.style.borderColor='#7eb8d4';e.currentTarget.style.background='rgba(126,184,212,0.04)';if(e.dataTransfer.files&&e.dataTransfer.files.length)handleOverallFileUpload(e.dataTransfer.files);}}
                onClick={()=>document.getElementById('file_overall')?.click()}>
                <input type="file" id="file_overall" multiple style={{display:'none'}} accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                  onChange={e=>e.target.files&&handleOverallFileUpload(e.target.files)} />
                <div style={{fontSize:'13px',color:'#7eb8d4',fontWeight:'700'}}>📁 Click or drag files / 点击或拖拽文件</div>
                <div style={{fontSize:'11px',color:'#94a3b8',marginTop:'6px'}}>Images, PDF, Word, Excel</div>
              </div>
            )}
            {overall.files.length>0&&(
              <div style={{marginTop:'10px',display:'flex',flexDirection:'column',gap:'6px'}}>
                {overall.files.map((f,fIdx)=>(
                  <div key={fIdx} style={{fontSize:'12px',color:'#0f172a',background:'rgba(126,184,212,0.08)',padding:'8px 12px',borderRadius:'6px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <span>📄 {f.name}</span>
                    {!isSubmitted&&<button onClick={()=>setOverall(p=>({...p,files:p.files.filter((_,j)=>j!==fIdx)}))}
                      style={{background:'none',border:'none',color:'#7eb8d4',cursor:'pointer',fontSize:'14px',padding:'0 4px'}}>✕</button>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Form Actions */}
        <div style={{display:'flex',justifyContent:'flex-end',gap:'12px',marginTop:'48px',paddingTop:'32px',borderTop:'1px solid rgba(30,58,95,0.08)'}}>
          {!isSubmitted&&(
            <button onClick={()=>{setKpiRows(emptyKpiRows());setPosRows(emptyPosRows());setOverall({remarks:'',files:[]});}}
              style={{padding:'13px 32px',background:'linear-gradient(135deg,#f1f5f9,#e2e8f0)',color:'#334155',border:'1.5px solid #cbd5e1',borderRadius:'12px',fontWeight:'700',cursor:'pointer',fontSize:'14px',letterSpacing:'0.3px',transition:'all 0.3s'}}
              onMouseEnter={e=>{e.currentTarget.style.background='linear-gradient(135deg,#e2e8f0,#cbd5e1)';e.currentTarget.style.transform='translateY(-1px)';}}
              onMouseLeave={e=>{e.currentTarget.style.background='linear-gradient(135deg,#f1f5f9,#e2e8f0)';e.currentTarget.style.transform='none';}}>
              Clear / 清除
            </button>
          )}
          <button onClick={handleSubmit} disabled={isSubmitted}
            style={{padding:'13px 32px',background:isSubmitted?'#94a3b8':'linear-gradient(135deg,#1e3a5f,#162d4a)',color:'white',border:'none',borderRadius:'12px',fontWeight:'700',cursor:isSubmitted?'not-allowed':'pointer',fontSize:'14px',letterSpacing:'0.3px',boxShadow:isSubmitted?'none':'0 8px 24px rgba(30,58,95,0.3)',transition:'all 0.3s'}}
            onMouseEnter={e=>{if(!isSubmitted){e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow='0 12px 32px rgba(30,58,95,0.4)';}}}
            onMouseLeave={e=>{e.currentTarget.style.transform='none';e.currentTarget.style.boxShadow=isSubmitted?'none':'0 8px 24px rgba(30,58,95,0.3)';}}>
            {isSubmitted ? '✓ Already Submitted' : 'Submit Review / 提交评价'}
          </button>
        </div>
      </div>
    </div>
  );
}
