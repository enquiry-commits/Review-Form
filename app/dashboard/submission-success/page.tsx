'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function SubmissionSuccess() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const formType = searchParams.get('type') || 'self-review';
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setRedirecting(true);
      router.push('/dashboard');
    }, 3000);

    return () => clearTimeout(timer);
  }, [router]);

  const typeLabel = formType === 'leader-review' ? 'Leader Review' : 'Employee Self Review';

  return (
    <div style={{background: 'linear-gradient(135deg, #f0f4f8 0%, #d9e2ec 100%)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'}}>
      <div style={{textAlign: 'center', maxWidth: '600px'}}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '24px',
          padding: '64px 48px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.08)',
          border: '1px solid rgba(30, 58, 95, 0.06)'
        }}>
          {/* Success Icon */}
          <div style={{
            width: '80px',
            height: '80px',
            margin: '0 auto 24px',
            background: 'rgba(126, 184, 212, 0.15)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '48px'
          }}>
            ✓
          </div>

          {/* Success Message */}
          <h1 style={{fontSize: '32px', fontWeight: '800', color: '#0f172a', marginBottom: '12px', letterSpacing: '-0.5px'}}>
            提交成功！
          </h1>
          <p style={{fontSize: '28px', fontWeight: '700', color: '#1e3a5f', marginBottom: '24px'}}>
            Submission Successful!
          </p>

          {/* Details */}
          <div style={{
            background: 'rgba(126, 184, 212, 0.08)',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '32px',
            textAlign: 'left'
          }}>
            <p style={{fontSize: '14px', color: '#64748b', marginBottom: '8px'}}>
              <span style={{fontWeight: '600', color: '#1e3a5f'}}>表单类型 / Form Type:</span> {typeLabel}
            </p>
            <p style={{fontSize: '14px', color: '#64748b'}}>
              <span style={{fontWeight: '600', color: '#1e3a5f'}}>时间 / Time:</span> {new Date().toLocaleString('zh-CN')}
            </p>
          </div>

          {/* Info Message */}
          <div style={{
            background: 'rgba(30, 58, 95, 0.04)',
            borderLeft: '3px solid #7eb8d4',
            borderRadius: '6px',
            padding: '16px',
            marginBottom: '32px',
            textAlign: 'left'
          }}>
            <p style={{fontSize: '13px', color: '#64748b', lineHeight: '1.6'}}>
              你的表单已经成功提交，管理员将在收到后进行处理。
              <br />
              Your form has been successfully submitted. The admin will review it shortly.
            </p>
          </div>

          {/* Auto Redirect Message */}
          <p style={{fontSize: '13px', color: '#94a3b8', marginBottom: '24px'}}>
            {redirecting ? '正在跳转到仪表板...' : '将在 3 秒内自动跳转到仪表板'}
          </p>

          {/* Manual Navigation */}
          <Link href="/dashboard" style={{
            display: 'inline-block',
            padding: '13px 32px',
            background: 'linear-gradient(135deg, #1e3a5f, #162d4a)',
            color: 'white',
            borderRadius: '12px',
            textDecoration: 'none',
            fontWeight: '700',
            fontSize: '14px',
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
          }}>
            返回仪表板 / Back to Dashboard →
          </Link>
        </div>
      </div>
    </div>
  );
}
