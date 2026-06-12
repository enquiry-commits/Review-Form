'use client';

import { useEffect } from 'react';

export default function LeaderReviewSuccess() {

  useEffect(() => {
    if (window.top && window.top !== window.self) {
      window.top.postMessage({ type: 'scrollToTop' }, '*');
    } else {
      window.scrollTo(0, 0);
    }
  }, []);

  return (
    <div style={{background: 'linear-gradient(135deg, #f0f4f8 0%, #d9e2ec 100%)', minHeight: '100vh', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '60px 20px 20px'}}>
      <div style={{maxWidth: '500px', width: '100%'}}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.98)',
          borderRadius: '20px',
          padding: '60px 48px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.1)',
          textAlign: 'center'
        }}>
          {/* Success Icon */}
          <div style={{
            width: '90px',
            height: '90px',
            margin: '0 auto 32px',
            background: '#b3d9f2',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '48px',
            color: '#1e3a5f'
          }}>
            ✓
          </div>

          {/* Title */}
          <h1 style={{fontSize: '28px', fontWeight: '900', color: '#0f172a', marginBottom: '12px', letterSpacing: '-0.3px'}}>
            Review Submitted!
          </h1>

          {/* Subtitle */}
          <p style={{fontSize: '15px', color: '#64748b', marginBottom: '6px', lineHeight: '1.5'}}>
            Your team evaluation has been submitted.
          </p>
          <p style={{fontSize: '15px', color: '#64748b', marginBottom: '28px', lineHeight: '1.5'}}>
            主管评价已成功功提交。
          </p>

          {/* Divider */}
          <div style={{height: '3px', width: '60px', background: '#7eb8d4', margin: '0 auto 28px', borderRadius: '2px'}} />

          {/* Description */}
          <p style={{fontSize: '14px', color: '#64748b', lineHeight: '1.7', marginBottom: '12px'}}>
            Thank you for completing the leader review. Your evaluation has been recorded in the system for HR reference.
          </p>
          <p style={{fontSize: '14px', color: '#64748b', lineHeight: '1.7', marginBottom: '40px'}}>
            感谢您完成本部主管评价，您的评价已成功记录，供人力资源参考。
          </p>

          {/* Back Button */}
          <button
            onClick={() => {
              if (window.top && window.top !== window.self) {
                window.top.location.href = '/dashboard';
              } else {
                window.location.href = '/dashboard';
              }
            }}
            style={{
              display: 'inline-block',
              padding: '13px 40px',
              background: '#1e3a5f',
              color: 'white',
              borderRadius: '12px',
              border: 'none',
              fontWeight: '700',
              fontSize: '14px',
              letterSpacing: '0.3px',
              transition: 'all 0.3s',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(30, 58, 95, 0.3)'}}
            onMouseLeave={(e) => {e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'}}
          >
            ← Back to Dashboard / 返回主页
          </button>

          {/* Footer */}
          <div style={{marginTop: '48px', fontSize: '12px', color: '#cbd5e1', letterSpacing: '0.5px', fontWeight: '700'}}>
            TASSURE
          </div>
        </div>
      </div>
    </div>
  );
}
