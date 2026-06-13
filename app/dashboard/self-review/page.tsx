'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@/lib/auth';
import { getCurrentReviewPeriod, formatPeriodDisplay } from '@/lib/reviewHelpers';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

type FileLink = { name: string; url: string };
type KPIData = { count: number; comment: string; files: FileLink[] };
type PosData  = { description: string; files: FileLink[] };

const KPI_IDS = ['client_complaints','client_attrition','minor_delays','serious_delays','minor_errors','serious_errors','communication_issues','team_impact','learning_application'];
const POS_IDS = ['pos_compliment','pos_requested','pos_prevented','pos_recovered','pos_resolved','pos_business','pos_special'];

const emptyKPIs = (): Record<string, KPIData> =>
  Object.fromEntries(KPI_IDS.map(id => [id, { count: 0, comment: '', files: [] }]));
const emptyPos = (): Record<string, PosData> =>
  Object.fromEntries(POS_IDS.map(id => [id, { description: '', files: [] }]));

// ─── KPIItem (controlled) ───────────────────────────────────────────────────
interface KPIItemProps {
  id: string; name: string; question: string;
  data: KPIData;
  onChange: (d: KPIData) => void;
  onFileUpload: (files: FileList) => void;
}
function KPIItem({ id, name, question, data, onChange, onFileUpload }: KPIItemProps) {
  return (
    <div style={{background:'linear-gradient(135deg,#ffffff,#f8fafc)',border:'1.5px solid #e2e8f0',borderRadius:'14px',padding:'20px',transition:'all 0.3s'}}
      onMouseEnter={e=>{e.currentTarget.style.borderColor='#cbd5e1';e.currentTarget.style.boxShadow='0 8px 24px rgba(30,58,95,0.08)';e.currentTarget.style.transform='translateY(-2px)';}}
      onMouseLeave={e=>{e.currentTarget.style.borderColor='#e2e8f0';e.currentTarget.style.boxShadow='none';e.currentTarget.style.transform='none';}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'14px',gap:'20px'}}>
        <div style={{flex:1}}>
          <div style={{fontSize:'14px',fontWeight:'800',color:'#0f172a',marginBottom:'6px'}}>{name}</div>
          <div style={{fontSize:'13px',color:'#64748b',lineHeight:'1.6'}}>{question}</div>
        </div>
        <div>
          <label style={{fontSize:'11px',color:'#94a3b8',fontWeight:'700',marginBottom:'6px',display:'block'}}>Count / 次数</label>
          <input type="number" min="0" value={data.count}
            onChange={e=>onChange({...data,count:parseInt(e.target.value)||0})}
            style={{width:'100px',padding:'10px 12px',border:'1.5px solid #e2e8f0',borderRadius:'10px',fontSize:'14px',textAlign:'center',fontWeight:'700',color:'#1e3a5f',background:'#f8fafc'}} />
        </div>
      </div>
      <div style={{marginBottom:'14px'}}>
        <label style={{fontSize:'12px',color:'#64748b',fontWeight:'700',marginBottom:'8px',display:'block'}}>Self Comment / 自评备注</label>
        <textarea value={data.comment} onChange={e=>onChange({...data,comment:e.target.value})}
          placeholder="Enter your comments or remarks... / 请填写说明或备注"
          style={{width:'100%',minHeight:'70px',padding:'12px 16px',border:'1.5px solid #e2e8f0',borderRadius:'12px',fontSize:'13px',fontFamily:'inherit',resize:'vertical',background:'#fff'}} />
      </div>
      <div style={{background:'rgba(126,184,212,0.04)',border:'1.5px solid #e2e8f0',borderRadius:'12px',padding:'14px'}}>
        <label style={{fontSize:'12px',color:'#64748b',fontWeight:'700',marginBottom:'10px',display:'block'}}>Upload Evidence / 上传证据</label>
        <div style={{border:'1.5px dashed #7eb8d4',borderRadius:'10px',padding:'20px',textAlign:'center',background:'rgba(126,184,212,0.06)',cursor:'pointer',transition:'all 0.3s'}}
          onMouseEnter={e=>{e.currentTarget.style.borderColor='#5a9bc4';e.currentTarget.style.background='rgba(126,184,212,0.12)';}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor='#7eb8d4';e.currentTarget.style.background='rgba(126,184,212,0.06)';}}
          onClick={()=>document.getElementById(`file_kpi_${id}`)?.click()}>
          <input type="file" id={`file_kpi_${id}`} multiple style={{display:'none'}} accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
            onChange={e=>e.target.files&&onFileUpload(e.target.files)} />
          <div style={{fontSize:'13px',color:'#7eb8d4',fontWeight:'700'}}>📁 Click or drag files to upload / 点击或拖拽文件上传</div>
          <div style={{fontSize:'11px',color:'#94a3b8',marginTop:'6px'}}>Supports images, PDF, Word, Excel / 支持图片、PDF、Word、Excel</div>
        </div>
        {data.files.length>0&&(
          <div style={{marginTop:'10px',display:'flex',flexDirection:'column',gap:'6px'}}>
            {data.files.map((f,i)=>(
              <div key={i} style={{fontSize:'12px',color:'#0f172a',background:'rgba(126,184,212,0.08)',padding:'8px 12px',borderRadius:'6px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <span>📄 {f.name}</span>
                <button onClick={()=>onChange({...data,files:data.files.filter((_,j)=>j!==i)})}
                  style={{background:'none',border:'none',color:'#7eb8d4',cursor:'pointer',fontSize:'14px',padding:'0 4px'}}
                  onMouseEnter={e=>{e.currentTarget.style.color='#5a9bc4';}} onMouseLeave={e=>{e.currentTarget.style.color='#7eb8d4';}}>✕</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── PositiveItem (controlled) ───────────────────────────────────────────────
interface PosItemProps {
  id: string; name: string; question: string;
  data: PosData;
  onChange: (d: PosData) => void;
  onFileUpload: (files: FileList) => void;
}
function PositiveItem({ id, name, question, data, onChange, onFileUpload }: PosItemProps) {
  return (
    <div style={{border:'1.5px solid #e2e8f0',borderRadius:'16px',padding:'1.5rem',background:'#f8fafc'}}>
      <p style={{fontSize:'15px',fontWeight:'800',color:'#0f172a',marginBottom:'6px'}}>{name}</p>
      <p style={{fontSize:'13px',color:'#64748b',marginBottom:'12px'}}>{question}</p>
      <textarea value={data.description} onChange={e=>onChange({...data,description:e.target.value})}
        placeholder="Evidence / Event description... / 证据／事件描述"
        style={{width:'100%',minHeight:'70px',padding:'12px 16px',border:'1.5px solid #e2e8f0',borderRadius:'12px',fontSize:'13px',fontFamily:'inherit',marginBottom:'12px',background:'#fff',resize:'vertical'}} />
      <div style={{background:'rgba(126,184,212,0.04)',border:'1.5px solid #e2e8f0',borderRadius:'12px',padding:'14px'}}>
        <label style={{fontSize:'12px',color:'#64748b',fontWeight:'700',marginBottom:'10px',display:'block'}}>Upload Evidence / 上传证据</label>
        <div style={{border:'1.5px dashed #7eb8d4',borderRadius:'10px',padding:'20px',textAlign:'center',background:'rgba(126,184,212,0.06)',cursor:'pointer',transition:'all 0.3s'}}
          onMouseEnter={e=>{e.currentTarget.style.borderColor='#5a9bc4';e.currentTarget.style.background='rgba(126,184,212,0.12)';}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor='#7eb8d4';e.currentTarget.style.background='rgba(126,184,212,0.06)';}}
          onClick={()=>document.getElementById(`file_pos_${id}`)?.click()}>
          <input type="file" id={`file_pos_${id}`} multiple style={{display:'none'}} accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
            onChange={e=>e.target.files&&onFileUpload(e.target.files)} />
          <div style={{fontSize:'13px',color:'#7eb8d4',fontWeight:'700'}}>📁 Click or drag files to upload / 点击或拖拽文件上传</div>
          <div style={{fontSize:'11px',color:'#94a3b8',marginTop:'6px'}}>Supports images, PDF, Word, Excel / 支持图片、PDF、Word、Excel</div>
        </div>
        {data.files.length>0&&(
          <div style={{marginTop:'10px',display:'flex',flexDirection:'column',gap:'6px'}}>
            {data.files.map((f,i)=>(
              <div key={i} style={{fontSize:'12px',color:'#0f172a',background:'rgba(126,184,212,0.08)',padding:'8px 12px',borderRadius:'6px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <span>📄 {f.name}</span>
                <button onClick={()=>onChange({...data,files:data.files.filter((_,j)=>j!==i)})}
                  style={{background:'none',border:'none',color:'#7eb8d4',cursor:'pointer',fontSize:'14px',padding:'0 4px'}}
                  onMouseEnter={e=>{e.currentTarget.style.color='#5a9bc4';}} onMouseLeave={e=>{e.currentTarget.style.color='#7eb8d4';}}>✕</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function SelfReviewForm() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [kpiData, setKpiData] = useState<Record<string, KPIData>>(emptyKPIs());
  const [posData, setPosData]  = useState<Record<string, PosData>>(emptyPos());
  const [isEmbedded, setIsEmbedded] = useState(false);
  const [status, setStatus]   = useState<'pending'|'draft'|'submitted'>('pending');
  const [saving, setSaving]   = useState(false);
  const [loaded, setLoaded]   = useState(false);
  const currentPeriod = getCurrentReviewPeriod();

  // Refs to avoid stale closures in timers
  const userRef       = useRef<User | null>(null);
  const existingIdRef = useRef<string | null>(null);
  const statusRef     = useRef<'pending'|'draft'|'submitted'>('pending');
  const kpiRef        = useRef(kpiData);
  const posRef        = useRef(posData);
  const saveTimer     = useRef<ReturnType<typeof setTimeout>|null>(null);
  const dirtyRef      = useRef(false); // only true after user actually edits

  useEffect(() => { kpiRef.current = kpiData; }, [kpiData]);
  useEffect(() => { posRef.current = posData;  }, [posData]);

  // Load user + existing record
  useEffect(() => {
    const raw = localStorage.getItem('user');
    if (!raw) { router.push('/'); return; }
    const u: User = JSON.parse(raw);
    setUser(u);
    userRef.current = u;
    setIsEmbedded(window.self !== window.top);

    supabase.from('self_review_submissions')
      .select('*')
      .eq('employee_email', u.email)
      .eq('review_period', currentPeriod)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          existingIdRef.current = data.id;
          const s: 'draft'|'submitted' = data.submitted_at ? 'submitted' : 'draft';
          setStatus(s); statusRef.current = s;

          if (data.form_data?.kpis) {
            const next = emptyKPIs();
            for (const id of KPI_IDS) {
              const v = data.form_data.kpis[id];
              if (v) next[id] = { count: v.count ?? 0, comment: v.comment ?? '', files: v.files ?? [] };
            }
            setKpiData(next);
          }
          if (data.form_data?.positive_items) {
            const next = emptyPos();
            for (const id of POS_IDS) {
              const v = data.form_data.positive_items[id];
              if (v) next[id] = { description: v.description ?? '', files: v.files ?? [] };
            }
            setPosData(next);
          }
        }
        setLoaded(true);
      });
  }, [router, currentPeriod]);

  // Auto-save: 2 s after user actually edits (not on initial load)
  useEffect(() => {
    if (!loaded || !dirtyRef.current || statusRef.current === 'submitted') return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      const u = userRef.current;
      if (!u) return;
      setSaving(true);
      const payload = { kpis: kpiRef.current, positive_items: posRef.current };
      try {
        if (existingIdRef.current) {
          await supabase.from('self_review_submissions').update({ form_data: payload }).eq('id', existingIdRef.current);
        } else {
          const { data } = await supabase.from('self_review_submissions').insert([{
            user_id: u.id, employee_name: u.name, employee_email: u.email,
            department: u.department, review_period: currentPeriod, form_data: payload,
          }]).select().single();
          if (data) existingIdRef.current = data.id;
        }
        setStatus('draft'); statusRef.current = 'draft';
      } finally { setSaving(false); }
    }, 2000);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [kpiData, posData, currentPeriod]);

  const handleFileUpload = async (section: 'kpi'|'pos', id: string, files: FileList) => {
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
    if (section === 'kpi') setKpiData(p => ({ ...p, [id]: { ...p[id], files: [...p[id].files, ...links] } }));
    else                   setPosData(p => ({ ...p, [id]: { ...p[id], files: [...p[id].files, ...links] } }));
  };

  const handleSubmit = async () => {
    if (!user || statusRef.current === 'submitted') return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    try {
      const payload = { kpis: kpiRef.current, positive_items: posRef.current };
      if (existingIdRef.current) {
        const { error } = await supabase.from('self_review_submissions')
          .update({ form_data: payload, submitted_at: new Date().toISOString(), is_locked: true })
          .eq('id', existingIdRef.current);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('self_review_submissions').insert([{
          user_id: user.id, employee_name: user.name, employee_email: user.email,
          department: user.department, review_period: currentPeriod, form_data: payload,
          submitted_at: new Date().toISOString(), is_locked: true,
        }]);
        if (error) throw error;
      }
      router.push('/dashboard/self-review-success');
    } catch (err) {
      console.error(err);
      alert('Submit failed / 提交失败，请重试');
    }
  };

  const handleLogout = () => { localStorage.removeItem('user'); router.push('/'); };

  if (!user) return null;

  const isSubmitted = status === 'submitted';

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
          <h1 style={{fontSize:'36px',fontWeight:'800',color:'#0f172a',marginBottom:'8px',letterSpacing:'-0.5px'}}>Employee Self Review</h1>
          <p style={{color:'#64748b',fontSize:'15px',lineHeight:'1.6'}}>Please complete your honest evaluation of your performance this period</p>
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
            ✓ You have already submitted your review for {formatPeriodDisplay(currentPeriod)}. The form is read-only.
          </div>
        )}

        {/* Basic Info */}
        <div style={{marginBottom:'40px',background:'rgba(255,255,255,0.95)',border:'1.5px solid #e2e8f0',borderRadius:'14px',padding:'24px',boxShadow:'0 4px 12px rgba(0,0,0,0.04)'}}>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'20px'}}>
            {[['Department / 部门', user.department||''],['Your Name / 你的名字',user.name],['Review Period / 评审周期',formatPeriodDisplay(currentPeriod)]].map(([label,val])=>(
              <div key={label}>
                <label style={{fontSize:'13px',color:'#334155',fontWeight:'700',marginBottom:'10px',letterSpacing:'0.4px',display:'block'}}>{label} *</label>
                <input type="text" value={val} disabled style={{width:'100%',padding:'12px 16px',border:'1.5px solid #e2e8f0',borderRadius:'12px',fontSize:'14px',color:'#1a1a2e',background:'#f0f4f8',fontFamily:'inherit',cursor:'not-allowed',opacity:0.7}} />
              </div>
            ))}
          </div>
        </div>

        {/* ── SECTION 1: KPIs ── */}
        {[
          { tag:'Client', title:'Client Stability / 客户稳定性', items:['client_complaints','client_attrition'] },
          { tag:'Efficiency', title:'Task Efficiency & Execution / 任务执行力', items:['minor_delays','serious_delays'] },
          { tag:'Quality', title:'Work Quality & Risk Control / 工作质量与风险管理', items:['minor_errors','serious_errors'] },
          { tag:'Coordination', title:'Internal Coordination & Communication / 内部协作与沟通', items:['communication_issues','team_impact'] },
          { tag:'Development', title:'Capability & Growth / 能力与能力提升', items:['learning_application'] },
        ].map(section => (
          <div key={section.tag} style={{marginBottom:'40px',background:'rgba(255,255,255,0.95)',border:'1.5px solid #e2e8f0',borderRadius:'14px',padding:'24px',boxShadow:'0 4px 12px rgba(0,0,0,0.04)'}}>
            <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'24px'}}>
              <span style={{display:'inline-flex',padding:'6px 14px',background:'#7eb8d4',color:'white',borderRadius:'8px',fontSize:'11px',fontWeight:'800',letterSpacing:'0.4px',boxShadow:'0 2px 8px rgba(0,0,0,0.15)'}}>{section.tag}</span>
              <span style={{fontSize:'18px',fontWeight:'800',color:'#0f172a',letterSpacing:'-0.3px'}}>{section.title}</span>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:'14px'}}>
              {section.items.map(kpiId => {
                const META: Record<string,{name:string;question:string}> = {
                  client_complaints:{name:'Client Complaints / Issues 客户抱怨／异常',question:'Were there any client complaints, issues or controllable churn? / 有没有客户抱怨、异常和可控流失？'},
                  client_attrition:{name:'Client Attrition / 客户流失',question:'Was there client loss due to lack of follow-up or unresolved issues? / 因为没有及时跟进和解决问题，导致客户流失？'},
                  minor_delays:{name:'Chased / Minor Delays / 被催、一般延误',question:'Was the employee chased by clients or management? / 有没有被催、被客户或被管理？'},
                  serious_delays:{name:'Serious Delays / 严重延误',question:'Were there delays that affected client arrangements or led to cancellations? / 有没有延误影响客户安排，甚至导致客户取消服务？'},
                  minor_errors:{name:'Minor Errors / 轻微错误',question:'Were there any mistakes made? / 有没有出错？'},
                  serious_errors:{name:'Serious Errors / Penalty Risk / 严重错误／罚款风险',question:'Were there any filing issues, penalty risks or client impact? / 是否有申报、罚款和客户影响风险？'},
                  communication_issues:{name:'Communication / Handover Issues / 沟通／交接问题',question:'Was collaboration with colleagues smooth? / 和员工和同事协作顺不顺？'},
                  team_impact:{name:'Team Impact / 影响团队',question:'Were there any communication or handover problems? / 有没有沟通和交接问题？'},
                  learning_application:{name:'Learning & Application / 学习并应用',question:'Has new knowledge been applied to work? / 学到的东西有没有在工作里正用？'},
                };
                return (
                  <KPIItem key={kpiId} id={kpiId} name={META[kpiId].name} question={META[kpiId].question}
                    data={kpiData[kpiId]} onChange={d=>{if(!isSubmitted){dirtyRef.current=true;setKpiData(p=>({...p,[kpiId]:d}));}}}
                    onFileUpload={f=>{if(!isSubmitted){dirtyRef.current=true;handleFileUpload('kpi',kpiId,f);}}} />
                );
              })}
            </div>
          </div>
        ))}

        {/* Section divider */}
        <div style={{display:'flex',alignItems:'center',gap:'20px',margin:'60px 0 40px'}}>
          <div style={{flex:1,height:'1px',background:'#cbd5e1'}}/>
          <div style={{color:'#334155',fontSize:'12px',fontWeight:'700',letterSpacing:'2px',textTransform:'uppercase',whiteSpace:'nowrap',background:'rgba(217,226,236,0.8)',padding:'0 20px',boxShadow:'0 2px 8px rgba(0,0,0,0.08)'}}>— SECTION 2 — POSITIVE ITEMS —</div>
          <div style={{flex:1,height:'1px',background:'#cbd5e1'}}/>
        </div>

        {/* ── SECTION 2: Positive Items ── */}
        <div style={{marginBottom:'40px',background:'rgba(255,255,255,0.95)',border:'1.5px solid #e2e8f0',borderRadius:'14px',padding:'24px',boxShadow:'0 4px 12px rgba(0,0,0,0.04)'}}>
          <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'24px'}}>
            <span style={{display:'inline-flex',padding:'6px 14px',background:'#10b981',color:'white',borderRadius:'8px',fontSize:'11px',fontWeight:'800',letterSpacing:'0.4px',boxShadow:'0 2px 8px rgba(0,0,0,0.15)'}}>★ Positive</span>
            <span style={{fontSize:'18px',fontWeight:'800',color:'#0f172a',letterSpacing:'-0.3px'}}>Positive Items / 正面项目记录</span>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
            {[
              {id:'pos_compliment',name:'Written Client Compliment / 客户书面表扬',question:'Client proactively sent email/message with explicit praise (not routine thanks) / 客户主动发email/message有明确表扬，非常规感谢'},
              {id:'pos_requested',name:'Client Requested Same Staff / 客户点名继续服务',question:'Client explicitly requested the same employee or gave special recognition / 客户明确要求继续由该员工负责，有特别认可'},
              {id:'pos_prevented',name:'Prevented Major Risk / Penalty / 避免重大风险／罚款',question:'Identified issues outside scope and prevented significant losses / 超职责范围发现问题并避免重大损失'},
              {id:'pos_recovered',name:'Recovered Client / 挽回客户',question:'Successfully retained a client at risk of leaving / 已有流失风险客户被成功挽回'},
              {id:'pos_resolved',name:'Resolved Legacy / Complex Issues / 解决遗留／复杂问题',question:'Took over and resolved problems not caused by themselves / 接手非本人造成的问题并成功处理'},
              {id:'pos_business',name:'Additional Business Opportunity / 额外业务机会',question:'Referral / upsell / cross-sell (outside sales role) / 转介业务'},
              {id:'pos_special',name:'Special Contribution / 特别贡献',question:'Contribution clearly beyond job scope, requires manager explanation / 有明显超出岗位职责的贡献，需主管说明'},
            ].map(p=>(
              <PositiveItem key={p.id} id={p.id} name={p.name} question={p.question}
                data={posData[p.id]} onChange={d=>{if(!isSubmitted){dirtyRef.current=true;setPosData(prev=>({...prev,[p.id]:d}));}}}
                onFileUpload={f=>{if(!isSubmitted){dirtyRef.current=true;handleFileUpload('pos',p.id,f);}}} />
            ))}
          </div>
        </div>

        {/* Form Actions */}
        <div style={{display:'flex',justifyContent:'flex-end',gap:'12px',marginTop:'48px',paddingTop:'32px',borderTop:'1px solid rgba(30,58,95,0.08)'}}>
          {!isSubmitted && (
            <button onClick={()=>{setKpiData(emptyKPIs());setPosData(emptyPos());}}
              style={{padding:'13px 32px',background:'linear-gradient(135deg,#f1f5f9,#e2e8f0)',color:'#334155',border:'1.5px solid #cbd5e1',borderRadius:'12px',fontWeight:'700',cursor:'pointer',fontSize:'14px',letterSpacing:'0.3px',transition:'all 0.3s'}}
              onMouseEnter={e=>{e.currentTarget.style.background='linear-gradient(135deg,#e2e8f0,#cbd5e1)';e.currentTarget.style.transform='translateY(-1px)';}}
              onMouseLeave={e=>{e.currentTarget.style.background='linear-gradient(135deg,#f1f5f9,#e2e8f0)';e.currentTarget.style.transform='none';}}>
              Clear Form
            </button>
          )}
          <button onClick={handleSubmit} disabled={isSubmitted}
            style={{padding:'13px 32px',background: isSubmitted ? '#94a3b8' : 'linear-gradient(135deg,#1e3a5f,#162d4a)',color:'white',border:'none',borderRadius:'12px',fontWeight:'700',cursor: isSubmitted ? 'not-allowed' : 'pointer',fontSize:'14px',letterSpacing:'0.3px',boxShadow: isSubmitted ? 'none' : '0 8px 24px rgba(30,58,95,0.3)',transition:'all 0.3s'}}
            onMouseEnter={e=>{if(!isSubmitted){e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow='0 12px 32px rgba(30,58,95,0.4)';}}}
            onMouseLeave={e=>{e.currentTarget.style.transform='none';e.currentTarget.style.boxShadow=isSubmitted?'none':'0 8px 24px rgba(30,58,95,0.3)';}}>
            {isSubmitted ? '✓ Already Submitted' : 'Submit Self Review'}
          </button>
        </div>
      </div>
    </div>
  );
}
