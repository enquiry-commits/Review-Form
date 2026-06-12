'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@/lib/auth';

export default function SuggestionBoxPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [shaking, setShaking] = useState(false);
  const [dropped, setDropped] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) { router.push('/'); return; }
    setUser(JSON.parse(userData));

    const submitted = sessionStorage.getItem('suggestion_submitted');
    if (submitted === '1') {
      sessionStorage.removeItem('suggestion_submitted');
      setDropped(true);
    }
  }, [router]);

  const handleBoxClick = () => {
    if (dropped) return;
    setShaking(true);
    setTimeout(() => {
      setShaking(false);
      router.push('/dashboard/suggestion-box/submit');
    }, 600);
  };

  if (!user) return null;

  const imgClass = shaking ? 'box-shaking' : dropped ? 'box-dropped' : 'box-idle';

  return (
    <>
      <style>{`
        @keyframes shake {
          0%   { transform: translateX(0) rotate(0deg) scale(1); }
          15%  { transform: translateX(-8px) rotate(-4deg) scale(1.05); }
          30%  { transform: translateX(8px) rotate(4deg) scale(1.05); }
          45%  { transform: translateX(-6px) rotate(-3deg) scale(1.03); }
          60%  { transform: translateX(6px) rotate(3deg) scale(1.03); }
          75%  { transform: translateX(-3px) rotate(-1.5deg) scale(1.01); }
          90%  { transform: translateX(3px) rotate(1.5deg) scale(1.01); }
          100% { transform: translateX(0) rotate(0deg) scale(1); }
        }
        @keyframes pulse {
          0%   { transform: scale(1); filter: drop-shadow(0 4px 12px rgba(30,58,95,0.15)); }
          50%  { transform: scale(1.06); filter: drop-shadow(0 12px 28px rgba(30,58,95,0.28)); }
          100% { transform: scale(1); filter: drop-shadow(0 4px 12px rgba(30,58,95,0.15)); }
        }
        @keyframes dropDown {
          0%   { transform: translateY(0) scale(1); }
          30%  { transform: translateY(-18px) scale(1.04); }
          100% { transform: translateY(70px) scale(0.95); opacity: 0.6; }
        }
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateX(-50%) translateY(-10px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        .box-img {
          cursor: pointer;
          user-select: none;
          display: block;
          margin: 0 auto;
          max-width: 280px;
          width: 100%;
        }
        .box-idle {
          animation: pulse 2s ease-in-out infinite;
        }
        .box-shaking {
          animation: shake 0.55s ease-in-out forwards;
        }
        .box-dropped {
          animation: dropDown 0.7s ease-in forwards;
          pointer-events: none;
        }
      `}</style>

      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f0f4f8 0%, #d9e2ec 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        padding: '48px 20px 40px'
      }}>
        {/* Image at top */}
        <div style={{position: 'relative', marginBottom: '32px'}}>
          <img
            src="/BOX.png"
            alt="Suggestion Box"
            className={`box-img ${imgClass}`}
            onClick={handleBoxClick}
            draggable={false}
          />
          {dropped && (
            <div style={{
              position: 'absolute',
              top: '-44px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: '#1e3a5f',
              color: 'white',
              padding: '9px 22px',
              borderRadius: '30px',
              fontSize: '13px',
              fontWeight: '700',
              whiteSpace: 'nowrap',
              boxShadow: '0 4px 16px rgba(30,58,95,0.25)',
              animation: 'fadeInDown 0.4s ease forwards'
            }}>
              ✓ Suggestion received! / 意见已收到！
            </div>
          )}
        </div>

        {/* Text below image */}
        <div style={{textAlign: 'center', marginBottom: '24px'}}>
          <h1 style={{fontSize: '26px', fontWeight: '900', color: '#1e3a5f', marginBottom: '8px', letterSpacing: '-0.3px'}}>
            Suggestion Box
          </h1>
          <p style={{fontSize: '14px', color: '#64748b'}}>意见箱 · Click the box to drop a suggestion</p>
        </div>

        {!dropped && (
          <p style={{fontSize: '13px', color: '#94a3b8', fontWeight: '600'}}>
            Click the box to submit your suggestion
          </p>
        )}
        {dropped && (
          <button
            onClick={() => setDropped(false)}
            style={{
              marginTop: '90px',
              padding: '10px 28px',
              background: '#1e3a5f',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            Submit Another / 再次提交
          </button>
        )}
      </div>
    </>
  );
}
