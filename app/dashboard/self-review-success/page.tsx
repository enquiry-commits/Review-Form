'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SelfReviewSuccess() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/dashboard');
    }, 3000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div style={{background: 'linear-gradient(135deg, #f0f4f8 0%, #d9e2ec 100%)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'}}>
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
            Submission Successful!
          </h1>

          {/* Subtitle */}
          <p style={{fontSize: '15px', color: '#64748b', marginBottom: '6px', lineHeight: '1.5'}}>
            Your review has been submitted.
          </p>
          <p style={{fontSize: '15px', color: '#64748b', marginBottom: '28px', lineHeight: '1.5'}}>
            提交成功，感谢你的填写。
          </p>

          {/* Divider */}
          <div style={{height: '3px', width: '60px', background: '#7eb8d4', margin: '0 auto 28px', borderRadius: '2px'}} />

          {/* Description */}
          <p style={{fontSize: '14px', color: '#64748b', lineHeight: '1.7', marginBottom: '12px'}}>
            Thank you for completing your review. Your response has been recorded and will be reviewed by your manager.
          </p>
          <p style={{fontSize: '14px', color: '#64748b', lineHeight: '1.7', marginBottom: '40px'}}>
            感谢您完成本部分内容，您的提交已成功记录，主管将会进行查阅。
          </p>

          {/* Back Button */}
          <Link href="/dashboard" style={{
            display: 'inline-block',
            padding: '13px 40px',
            background: '#1e3a5f',
            color: 'white',
            borderRadius: '12px',
            textDecoration: 'none',
            fontWeight: '700',
            fontSize: '14px',
            letterSpacing: '0.3px',
            transition: 'all 0.3s'
          }}
          onMouseEnter={(e) => {e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(30, 58, 95, 0.3)'}}
          onMouseLeave={(e) => {e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'}}
          >
            ← Back to Form / 返回表单
          </Link>

          {/* Footer */}
          <div style={{marginTop: '48px', fontSize: '12px', color: '#cbd5e1', letterSpacing: '0.5px', fontWeight: '700'}}>
            TASSURE
          </div>
        </div>
      </div>
    </div>
  );
}
