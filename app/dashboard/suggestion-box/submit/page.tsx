'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export default function SuggestionSubmitPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [suggestion, setSuggestion] = useState('');
  const [files, setFiles] = useState<Array<{name: string; url: string}>>([]);
  const [submitting, setSubmitting] = useState(false);
  const [isEmbedded, setIsEmbedded] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) { router.push('/'); return; }
    setUser(JSON.parse(userData));
    setIsEmbedded(window.self !== window.top);
  }, [router]);

  const handleFileUpload = async (fileList: FileList) => {
    const newFiles = [...files];
    for (const file of Array.from(fileList)) {
      const ext = file.name.split('.').pop();
      const fileName = `suggestions/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      const { data, error } = await supabase.storage.from('review-files').upload(fileName, file);
      if (!error && data) {
        const { data: urlData } = supabase.storage.from('review-files').getPublicUrl(data.path);
        newFiles.push({ name: file.name, url: urlData.publicUrl });
      } else {
        newFiles.push({ name: file.name, url: URL.createObjectURL(file) });
      }
    }
    setFiles(newFiles);
  };

  const handleSubmit = async () => {
    if (!user || !suggestion.trim()) {
      alert('Please write your suggestion first. / 请先填写意见。');
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.from('suggestion_submissions').insert([{
        user_id: user.id,
        user_name: user.name,
        user_email: user.email,
        department: user.department || '',
        suggestion: suggestion.trim(),
        files,
        submitted_at: new Date().toISOString()
      }]);
      if (error) throw error;

      sessionStorage.setItem('suggestion_submitted', '1');
      if (window.top && window.top !== window.self) {
        window.top.postMessage({ type: 'scrollToTop' }, '*');
      }
      router.push('/dashboard/suggestion-box');
    } catch (err: any) {
      alert('Submission failed: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <div style={{
      background: 'linear-gradient(135deg, #f0f4f8 0%, #d9e2ec 100%)',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-start',
      padding: '40px 20px'
    }}>
      {/* Image at top */}
      <div style={{marginBottom: '24px', textAlign: 'center'}}>
        <img
          src="/BOX.png"
          alt="Suggestion Box"
          draggable={false}
          style={{maxWidth: '180px', width: '100%', display: 'block', margin: '0 auto', userSelect: 'none'}}
        />
      </div>

      <div style={{maxWidth: '620px', width: '100%'}}>
        <div style={{
          background: 'rgba(255,255,255,0.98)',
          borderRadius: '20px',
          padding: '40px 48px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.1)'
        }}>
          {/* Header */}
          <div style={{textAlign: 'center', marginBottom: '28px'}}>
            <h1 style={{fontSize: '22px', fontWeight: '900', color: '#0f172a', marginBottom: '4px'}}>
              Suggestion Box
            </h1>
            <p style={{fontSize: '13px', color: '#64748b'}}>意见箱 · Your voice matters</p>
          </div>

          {/* User info */}
          <div style={{
            background: '#f8fafc', border: '1.5px solid #e2e8f0',
            borderRadius: '12px', padding: '14px 18px',
            marginBottom: '28px',
            display: 'flex', alignItems: 'center', gap: '12px'
          }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '50%',
              background: '#1e3a5f', color: 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '14px', fontWeight: '800', flexShrink: 0
            }}>
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{fontSize: '13px', fontWeight: '700', color: '#0f172a'}}>{user.name}</div>
              <div style={{fontSize: '12px', color: '#94a3b8'}}>{user.department} · {user.email}</div>
            </div>
          </div>

          {/* Suggestion textarea */}
          <div style={{marginBottom: '24px'}}>
            <label style={{fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '10px', display: 'block'}}>
              Your Suggestion / 你的意见 *
            </label>
            <textarea
              value={suggestion}
              onChange={(e) => setSuggestion(e.target.value)}
              placeholder="Share your thoughts, ideas, or feedback... / 分享你的想法、建议或反馈..."
              style={{
                width: '100%',
                minHeight: '160px',
                padding: '16px',
                border: '1.5px solid #e2e8f0',
                borderRadius: '12px',
                fontSize: '14px',
                fontFamily: 'inherit',
                resize: 'vertical',
                background: '#fff',
                lineHeight: '1.7',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = '#7eb8d4'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; }}
            />
          </div>

          {/* File upload */}
          <div style={{marginBottom: '32px'}}>
            <label style={{fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '10px', display: 'block'}}>
              Attach Photos / 附带图片 (optional)
            </label>
            <div
              style={{
                border: '1.5px dashed #e2e8f0', borderRadius: '12px',
                padding: '20px', textAlign: 'center',
                background: 'rgba(126,184,212,0.04)', cursor: 'pointer', transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(126,184,212,0.1)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(126,184,212,0.04)'; }}
              onClick={() => document.getElementById('suggestion_files')?.click()}
            >
              <input
                type="file" id="suggestion_files" multiple
                style={{display: 'none'}}
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
              />
              <div style={{fontSize: '13px', color: '#7eb8d4', fontWeight: '700'}}>📁 Click or drag files to upload / 点击或拖拽文件上传</div>
              <div style={{fontSize: '11px', color: '#94a3b8', marginTop: '6px'}}>Supports images, PDF, Word, Excel / 支持图片、PDF、Word、Excel</div>
            </div>
            {files.length > 0 && (
              <div style={{marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px'}}>
                {files.map((f, i) => (
                  <div key={i} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    background: 'rgba(126,184,212,0.08)', padding: '8px 12px',
                    borderRadius: '8px', fontSize: '12px', color: '#0f172a'
                  }}>
                    <span>📄 {f.name}</span>
                    <button
                      onClick={() => setFiles(files.filter((_, idx) => idx !== i))}
                      style={{background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '14px'}}
                    >✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Buttons */}
          <div style={{display: 'flex', gap: '12px'}}>
            <button
              onClick={() => router.push('/dashboard/suggestion-box')}
              style={{
                flex: 1, padding: '13px', border: '1.5px solid #e2e8f0',
                borderRadius: '12px', background: 'white', color: '#64748b',
                fontWeight: '600', fontSize: '14px', cursor: 'pointer'
              }}
            >
              Cancel / 取消
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting || !suggestion.trim()}
              style={{
                flex: 2, padding: '13px',
                background: submitting || !suggestion.trim() ? '#94a3b8' : 'linear-gradient(135deg, #1e3a5f, #162d4a)',
                color: 'white', border: 'none', borderRadius: '12px',
                fontWeight: '700', fontSize: '14px',
                cursor: submitting || !suggestion.trim() ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {submitting ? 'Submitting...' : '📬 Submit Suggestion / 提交意见'}
            </button>
          </div>

          <div style={{marginTop: '24px', textAlign: 'center', fontSize: '12px', color: '#cbd5e1', fontWeight: '700', letterSpacing: '0.5px'}}>
            TASSURE
          </div>
        </div>
      </div>
    </div>
  );
}
