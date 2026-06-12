'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@/lib/auth';

export default function SuggestionBoxPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [shaking, setShaking] = useState(false);
  const [dropped, setDropped] = useState(false);
  const [isEmbedded, setIsEmbedded] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) { router.push('/'); return; }
    setUser(JSON.parse(userData));
    setIsEmbedded(window.self !== window.top);

    // Check if returning from successful submission
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

  return (
    <>
      <style>{`
        @keyframes shake {
          0%   { transform: translateX(0) rotate(0deg); }
          15%  { transform: translateX(-8px) rotate(-4deg); }
          30%  { transform: translateX(8px) rotate(4deg); }
          45%  { transform: translateX(-6px) rotate(-3deg); }
          60%  { transform: translateX(6px) rotate(3deg); }
          75%  { transform: translateX(-3px) rotate(-1.5deg); }
          90%  { transform: translateX(3px) rotate(1.5deg); }
          100% { transform: translateX(0) rotate(0deg); }
        }
        @keyframes dropDown {
          0%   { transform: translateY(0); }
          40%  { transform: translateY(-20px); }
          100% { transform: translateY(60px); opacity: 0.7; }
        }
        .box-img {
          cursor: pointer;
          transition: filter 0.2s;
          user-select: none;
          display: block;
          margin: 0 auto;
          max-width: 340px;
          width: 100%;
        }
        .box-img:hover { filter: brightness(1.06) drop-shadow(0 8px 24px rgba(30,58,95,0.18)); }
        .box-shaking { animation: shake 0.55s ease-in-out; }
        .box-dropped { animation: dropDown 0.7s ease-in forwards; pointer-events: none; }
      `}</style>

      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f0f4f8 0%, #d9e2ec 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px'
      }}>
        <div style={{textAlign: 'center', marginBottom: '32px'}}>
          <h1 style={{fontSize: '28px', fontWeight: '900', color: '#1e3a5f', marginBottom: '8px', letterSpacing: '-0.3px'}}>
            Suggestion Box
          </h1>
          <p style={{fontSize: '15px', color: '#64748b'}}>意见箱 · Click the box to drop a suggestion</p>
        </div>

        <div style={{position: 'relative'}}>
          <img
            src="/BOX.png"
            alt="Suggestion Box"
            className={`box-img${shaking ? ' box-shaking' : ''}${dropped ? ' box-dropped' : ''}`}
            onClick={handleBoxClick}
            draggable={false}
          />
          {dropped && (
            <div style={{
              position: 'absolute',
              top: '-50px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: '#1e3a5f',
              color: 'white',
              padding: '10px 24px',
              borderRadius: '30px',
              fontSize: '14px',
              fontWeight: '700',
              whiteSpace: 'nowrap',
              boxShadow: '0 4px 16px rgba(30,58,95,0.25)',
              animation: 'fadeIn 0.4s ease'
            }}>
              ✓ Suggestion received! / 意见已收到！
            </div>
          )}
        </div>

        {!dropped && (
          <p style={{marginTop: '28px', fontSize: '13px', color: '#94a3b8', fontWeight: '600'}}>
            Click the box to submit your suggestion
          </p>
        )}
        {dropped && (
          <button
            onClick={() => setDropped(false)}
            style={{
              marginTop: '80px',
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
