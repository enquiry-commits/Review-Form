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

const KPI_IDS = ['mkt_event_feedback', 'mkt_social_weak', 'mkt_output_errors', 'mkt_miscommunication'];
const POS_IDS = ['mkt_event_results', 'mkt_social_growth', 'mkt_branding', 'mkt_automation'];

const KPI_META: Record<string, { name: string; question: string }> = {
  mkt_event_feedback: {
    name: 'Event Negative Feedback or Areas for Improvement / 活动负面反馈或需要改善的地方',
    question: 'Were there any complaints, negative feedback, or areas needing improvement from events or campaigns? / 活动或推广中是否有投诉、负面反馈或需要改善的地方？',
  },
  mkt_social_weak: {
    name: 'Weak Social Media Performance or Inconsistent Posting / 社交媒体表现不足或发布不稳定',
    question: 'Was there inconsistent posting, low engagement, or poor reach on social media channels? / 社交媒体发布是否不稳定、互动率低或触达率差？',
  },
  mkt_output_errors: {
    name: 'Marketing Output Errors, Delays, or Repeated Revisions / Marketing 产出错误、延误或多次修改',
    question: 'Were there marketing materials with errors, missed deadlines, or requiring multiple rounds of revision? / 是否有Marketing产出出现错误、错过截止日期或需要多次修改的情况？',
  },
  mkt_miscommunication: {
    name: 'Miscommunication or Unclear Requirement Handling / 沟通误解或需求理解不清楚',
    question: 'Were there instances of miscommunication or misunderstanding of requirements with internal or external stakeholders? / 是否有与内外部相关方沟通误解或需求不清晰的情况？',
  },
};

const POS_META: Record<string, { name: string; question: string }> = {
  mkt_event_results: {
    name: 'Event Results and Positive Feedback / 活动成果与正面反馈',
    question: 'Were there events or campaigns that delivered strong results or received positive feedback? / 是否有活动或推广取得出色成果或获得正面反馈？',
  },
  mkt_social_growth: {
    name: 'Social Media Growth, Engagement, or Enquiries / 社交媒体增长、互动率或询问量',
    question: 'Were there notable improvements in followers, engagement rate, or enquiries from social media? / 是否在粉丝数、互动率或社交媒体询问量上有明显改善？',
  },
  mkt_branding: {
    name: 'Branding, Content, Design, or Website Contribution / 品牌、内容、设计或网站方面的贡献',
    question: 'Did you make notable contributions to brand identity, content quality, design output, or website improvements? / 是否在品牌形象、内容质量、设计产出或网站改善方面有显著贡献？',
  },
  mkt_automation: {
    name: 'Automation, System, Workflow, or Cross-department Support / 自动化、系统、流程优化或跨部门支持',
    question: 'Did you contribute to automation, workflow improvements, or support other departments in meaningful ways? / 是否有贡献于自动化、流程改善，或以有意义的方式支持其他部门？',
  },
};

const ALLOWED_EMAILS = ['vincent@tassure.com'];
const TABLE = 'marketing_review_submissions';

const emptyKPIs = (): Record<string, KPIData> =>
  Object.fromEntries(KPI_IDS.map(id => [id, { count: 0, comment: '', files: [] }]));
const emptyPos = (): Record<string, PosData> =>
  Object.fromEntries(POS_IDS.map(id => [id, { description: '', files: [] }]));

// ─── KPIItem ────────────────────────────────────────────────────────────────
interface KPIItemProps {
  id: string; name: string; question: string;
  data: KPIData; onChange: (d: KPIData) => void; onFileUpload: (f: FileList) => void;
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

// ─── PositiveItem ────────────────────────────────────────────────────────────
interface PosItemProps {
  id: string; name: string; question: string;
  data: PosData; onChange: (d: PosData) => void; onFileUpload: (f: FileList) => void;
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
export default function MarketingReviewForm() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [kpiData, setKpiData] = useState<Record<string, KPIData>>(emptyKPIs());
  const [posData, setPosData]  = useState<Record<string, PosData>>(emptyPos());
  const [remarksData, setRemarksData] = useState<{remarks:string;files:FileLink[]}>({remarks:'',files:[]});
  const [isEmbedded, setIsEmbedded] = useState(false);
  const [status, setStatus]   = useState<'pending'|'draft'|'submitted'>('pending');
  const [saving, setSaving]   = useState(false);
  const [loaded, setLoaded]   = useState(false);
  const currentPeriod = getCurrentReviewPeriod();

  const userRef       = useRef<User | null>(null);
  const existingIdRef = useRef<string | null>(null);
  const statusRef     = useRef<'pending'|'draft'|'submitted'>('pending');
  const kpiRef        = useRef(kpiData);
  const posRef        = useRef(posData);
  const remarksRef    = useRef(remarksData);
  const saveTimer     = useRef<ReturnType<typeof setTimeout>|null>(null);
  const dirtyRef      = useRef(false);

  useEffect(() => { kpiRef.current = kpiData; }, [kpiData]);
  useEffect(() => { posRef.current = posData;  }, [posData]);
  useEffect(() => { remarksRef.current = remarksData; }, [remarksData]);

  useEffect(() => {
    const raw = localStorage.getItem('user');
    if (!raw) { router.push('/'); return; }
    const u: User = JSON.parse(raw);
    if (!ALLOWED_EMAILS.includes(u.email)) { router.push('/dashboard'); return; }
    setUser(u);
    userRef.current = u;
    setIsEmbedded(window.self !== window.top);

    supabase.from(TABLE)
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
          if (data.form_data?.overall_remarks) {
            const r = data.form_data.overall_remarks;
            setRemarksData({ remarks: r.remarks ?? '', files: r.files ?? [] });
          }
        }
        setLoaded(true);
      });
  }, [router, currentPeriod]);

  useEffect(() => {
    if (!loaded || !dirtyRef.current || statusRef.current === 'submitted') return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      const u = userRef.current;
      if (!u) return;
      setSaving(true);
      const payload = { kpis: kpiRef.current, positive_items: posRef.current, overall_remarks: remarksRef.current };
      try {
        if (existingIdRef.current) {
          await supabase.from(TABLE).update({ form_data: payload }).eq('id', existingIdRef.current);
        } else {
          const { data } = await supabase.from(TABLE).insert([{
            user_id: u.id, employee_name: u.name, employee_email: u.email,
            department: u.department, review_period: currentPeriod, form_data: payload,
          }]).select().single();
          if (data) existingIdRef.current = data.id;
        }
        setStatus('draft'); statusRef.current = 'draft';
      } finally { setSaving(false); }
    }, 2000);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [kpiData, posData, remarksData, currentPeriod]);

  const handleFileUpload = async (section: 'kpi'|'pos'|'remarks', id: string, files: FileList) => {
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
    dirtyRef.current = true;
    if (section === 'kpi') setKpiData(p => ({ ...p, [id]: { ...p[id], files: [...p[id].files, ...links] } }));
    else if (section === 'pos') setPosData(p => ({ ...p, [id]: { ...p[id], files: [...p[id].files, ...links] } }));
    else setRemarksData(p => ({ ...p, files: [...p.files, ...links] }));
  };

  const handleSubmit = async () => {
    if (!user || statusRef.current === 'submitted') return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    try {
      const payload = { kpis: kpiRef.current, positive_items: posRef.current, overall_remarks: remarksRef.current };
      if (existingIdRef.current) {
        const { error } = await supabase.from(TABLE)
          .update({ form_data: payload, submitted_at: new Date().toISOString(), is_locked: true })
          .eq('id', existingIdRef.current);
        if (error) throw error;
      } else {
        const { error } = await supabase.from(TABLE).insert([{
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
          <h1 style={{fontSize:'36px',fontWeight:'800',color:'#0f172a',marginBottom:'8px',letterSpacing:'-0.5px'}}>Marketing Monthly Review</h1>
          <p style={{color:'#64748b',fontSize:'15px',lineHeight:'1.6'}}>Marketing Department Monthly Performance Review / 市场营销部月度表现评估</p>
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
            ✓ You have already submitted your Marketing review for {formatPeriodDisplay(currentPeriod)}. The form is read-only.
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

        {/* ── SECTION 1: KPI Items ── */}
        <div style={{marginBottom:'40px',background:'rgba(255,255,255,0.95)',border:'1.5px solid #e2e8f0',borderRadius:'14px',padding:'24px',boxShadow:'0 4px 12px rgba(0,0,0,0.04)'}}>
          <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'24px'}}>
            <span style={{display:'inline-flex',padding:'6px 14px',background:'#7eb8d4',color:'white',borderRadius:'8px',fontSize:'11px',fontWeight:'800',letterSpacing:'0.4px',boxShadow:'0 2px 8px rgba(0,0,0,0.15)'}}>SECTION 1</span>
            <span style={{fontSize:'18px',fontWeight:'800',color:'#0f172a',letterSpacing:'-0.3px'}}>Marketing Issues & KPIs / 营销问题指标</span>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:'14px'}}>
            {KPI_IDS.map(kpiId => (
              <KPIItem key={kpiId} id={kpiId} name={KPI_META[kpiId].name} question={KPI_META[kpiId].question}
                data={kpiData[kpiId]}
                onChange={d=>{if(!isSubmitted){dirtyRef.current=true;setKpiData(p=>({...p,[kpiId]:d}));}}}
                onFileUpload={f=>{if(!isSubmitted){dirtyRef.current=true;handleFileUpload('kpi',kpiId,f);}}} />
            ))}
          </div>
        </div>

        {/* Section Divider */}
        <div style={{display:'flex',alignItems:'center',gap:'20px',margin:'60px 0 40px'}}>
          <div style={{flex:1,height:'1px',background:'#cbd5e1'}}/>
          <div style={{color:'#334155',fontSize:'12px',fontWeight:'700',letterSpacing:'2px',textTransform:'uppercase',whiteSpace:'nowrap',background:'rgba(217,226,236,0.8)',padding:'0 20px',boxShadow:'0 2px 8px rgba(0,0,0,0.08)'}}>— SECTION 2 — POSITIVE CONTRIBUTIONS —</div>
          <div style={{flex:1,height:'1px',background:'#cbd5e1'}}/>
        </div>

        {/* ── SECTION 2: Positive Items ── */}
        <div style={{marginBottom:'40px',background:'rgba(255,255,255,0.95)',border:'1.5px solid #e2e8f0',borderRadius:'14px',padding:'24px',boxShadow:'0 4px 12px rgba(0,0,0,0.04)'}}>
          <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'24px'}}>
            <span style={{display:'inline-flex',padding:'6px 14px',background:'#10b981',color:'white',borderRadius:'8px',fontSize:'11px',fontWeight:'800',letterSpacing:'0.4px',boxShadow:'0 2px 8px rgba(0,0,0,0.15)'}}>★ Positive</span>
            <span style={{fontSize:'18px',fontWeight:'800',color:'#0f172a',letterSpacing:'-0.3px'}}>Positive Contributions / 正面贡献记录</span>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
            {POS_IDS.map(posId => (
              <PositiveItem key={posId} id={posId} name={POS_META[posId].name} question={POS_META[posId].question}
                data={posData[posId]}
                onChange={d=>{if(!isSubmitted){dirtyRef.current=true;setPosData(p=>({...p,[posId]:d}));}}}
                onFileUpload={f=>{if(!isSubmitted){dirtyRef.current=true;handleFileUpload('pos',posId,f);}}} />
            ))}
          </div>
        </div>

        {/* Section Divider */}
        <div style={{display:'flex',alignItems:'center',gap:'20px',margin:'60px 0 40px'}}>
          <div style={{flex:1,height:'1px',background:'#cbd5e1'}}/>
          <div style={{color:'#334155',fontSize:'12px',fontWeight:'700',letterSpacing:'2px',textTransform:'uppercase',whiteSpace:'nowrap',background:'rgba(217,226,236,0.8)',padding:'0 20px',boxShadow:'0 2px 8px rgba(0,0,0,0.08)'}}>— SECTION 3 — OVERALL REMARKS —</div>
          <div style={{flex:1,height:'1px',background:'#cbd5e1'}}/>
        </div>

        {/* ── SECTION 3: Overall Remarks ── */}
        <div style={{marginBottom:'40px',background:'rgba(255,255,255,0.95)',border:'1.5px solid #e2e8f0',borderRadius:'14px',padding:'24px',boxShadow:'0 4px 12px rgba(0,0,0,0.04)'}}>
          <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'24px'}}>
            <span style={{display:'inline-flex',padding:'6px 14px',background:'#1e3a5f',color:'white',borderRadius:'8px',fontSize:'11px',fontWeight:'800',letterSpacing:'0.4px',boxShadow:'0 2px 8px rgba(0,0,0,0.15)'}}>★ Remarks</span>
            <span style={{fontSize:'18px',fontWeight:'800',color:'#0f172a',letterSpacing:'-0.3px'}}>Overall Remarks / 整体补充说明</span>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:'16px'}}>
            <textarea value={remarksData.remarks}
              onChange={e=>{if(!isSubmitted){dirtyRef.current=true;setRemarksData(p=>({...p,remarks:e.target.value}));}}}
              placeholder="Any additional comments, context, or overall summary for this review period... / 请填写本评审期的任何补充说明、背景信息或整体总结..."
              style={{width:'100%',minHeight:'120px',padding:'14px 16px',border:'1.5px solid #e2e8f0',borderRadius:'12px',fontSize:'13px',fontFamily:'inherit',resize:'vertical',background:'#fff',lineHeight:'1.7'}} />
            <div style={{background:'rgba(126,184,212,0.04)',border:'1.5px solid #e2e8f0',borderRadius:'12px',padding:'14px'}}>
              <label style={{fontSize:'12px',color:'#64748b',fontWeight:'700',marginBottom:'10px',display:'block'}}>Upload Supporting Files / 上传支持文件</label>
              <div style={{border:'1.5px dashed #7eb8d4',borderRadius:'10px',padding:'20px',textAlign:'center',background:'rgba(126,184,212,0.06)',cursor:'pointer',transition:'all 0.3s'}}
                onMouseEnter={e=>{e.currentTarget.style.borderColor='#5a9bc4';e.currentTarget.style.background='rgba(126,184,212,0.12)';}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor='#7eb8d4';e.currentTarget.style.background='rgba(126,184,212,0.06)';}}
                onClick={()=>document.getElementById('file_remarks_mkt')?.click()}>
                <input type="file" id="file_remarks_mkt" multiple style={{display:'none'}} accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                  onChange={e=>{if(e.target.files&&!isSubmitted)handleFileUpload('remarks','',e.target.files);}} />
                <div style={{fontSize:'13px',color:'#7eb8d4',fontWeight:'700'}}>📁 Click or drag files to upload / 点击或拖拽文件上传</div>
                <div style={{fontSize:'11px',color:'#94a3b8',marginTop:'6px'}}>Supports images, PDF, Word, Excel / 支持图片、PDF、Word、Excel</div>
              </div>
              {remarksData.files.length>0&&(
                <div style={{marginTop:'10px',display:'flex',flexDirection:'column',gap:'6px'}}>
                  {remarksData.files.map((f,i)=>(
                    <div key={i} style={{fontSize:'12px',color:'#0f172a',background:'rgba(126,184,212,0.08)',padding:'8px 12px',borderRadius:'6px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                      <span>📄 {f.name}</span>
                      <button onClick={()=>{if(!isSubmitted)setRemarksData(p=>({...p,files:p.files.filter((_,j)=>j!==i)}));}}
                        style={{background:'none',border:'none',color:'#7eb8d4',cursor:'pointer',fontSize:'14px',padding:'0 4px'}}
                        onMouseEnter={e=>{e.currentTarget.style.color='#5a9bc4';}} onMouseLeave={e=>{e.currentTarget.style.color='#7eb8d4';}}>✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div style={{display:'flex',justifyContent:'flex-end',gap:'12px',marginTop:'48px',paddingTop:'32px',borderTop:'1px solid rgba(30,58,95,0.08)'}}>
          {!isSubmitted && (
            <button onClick={()=>{setKpiData(emptyKPIs());setPosData(emptyPos());setRemarksData({remarks:'',files:[]});}}
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
            {isSubmitted ? '✓ Already Submitted' : 'Submit Marketing Review'}
          </button>
        </div>
      </div>
    </div>
  );
}
