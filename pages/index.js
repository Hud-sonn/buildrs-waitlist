import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Loader2, CheckCircle } from 'lucide-react';
import { getRecentJoiners, joinWaitlist, waitlistFetch } from '../lib/api';

const MAIN_SITE_URL = (process.env.NEXT_PUBLIC_MAIN_SITE_URL || 'https://www.buildrshq.dev').replace(/\/$/, '');

const TARGET_LAUNCH_DATE = new Date('2027-01-01T00:00:00');
// Shown until the live counter responds, then replaced by the real number.
const FALLBACK_COUNT = 2427;

const AVATARS = [
  'https://i.pravatar.cc/40?img=11',
  'https://i.pravatar.cc/40?img=5',
  'https://i.pravatar.cc/40?img=47',
];

export default function Waitlist() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [errMsg, setErrMsg] = useState('');
  const [already, setAlready] = useState(false);
  const [count, setCount] = useState(null);
  const [members, setMembers] = useState([]);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    let cancelled = false;
    // One call returns both the live counter and the newest public joiner
    // profiles (masked emails + avatars — no raw addresses are exposed).
    getRecentJoiners(5)
      .then((data) => {
        if (cancelled) return;
        if (typeof data?.count === 'number') setCount(data.count);
        if (Array.isArray(data?.members)) setMembers(data.members);
      })
      .catch(() =>
        waitlistFetch('/api/waitlist/count')
          .then((data) => {
            if (!cancelled && typeof data?.count === 'number') setCount(data.count);
          })
          .catch(() => { /* keep the fallback number */ })
      );
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const tick = () => {
      const diff = TARGET_LAUNCH_DATE.getTime() - Date.now();
      if (diff > 0) {
        setTimeLeft({
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((diff / 1000 / 60) % 60),
          seconds: Math.floor((diff / 1000) % 60),
        });
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    setErrMsg('');
    setAlready(false);
    try {
      const data = await joinWaitlist(email);
      if (typeof data?.count === 'number') setCount(data.count);
      if (data?.member && !data?.alreadySubscribed) {
        setMembers((prev) => [data.member, ...prev].slice(0, 5));
      }
      setAlready(!!data?.alreadySubscribed);
      setStatus('success');
    } catch (err) {
      setStatus('error');
      setErrMsg(err?.message || 'Something went wrong. Please try again.');
    }
  };

  const pad = (n) => String(n).padStart(2, '0');

  return (
    <div className="mkt" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Head>
        <title>Join the Waitlist — Buildrs HQ</title>
        <meta name="description" content="Get immediate access to Buildrs on launch day. Join thousands of developers waiting for the unified dev command center." />
        <link rel="icon" href="/buildrs.png" />
      </Head>

      <style jsx>{`
        .wl-pill {
          display: inline-flex; align-items: center; gap: 10px;
          padding: 8px 20px; border-radius: 999px;
          border: 1px solid rgba(255,255,255,0.12);
          background: rgba(255,255,255,0.04);
          white-space: nowrap;
        }
        .wl-form {
          display: flex; align-items: center; gap: 8px;
          max-width: 480px; margin: 0 auto; width: 100%;
          justify-content: center;
        }
        .wl-input {
          flex: 1 1 auto; min-width: 0; width: 100%; height: 50px;
          padding: 13px 20px; border-radius: 999px;
          border: 1px solid rgba(255,255,255,0.12);
          background: rgba(255,255,255,0.05);
          color: #eceef1; font-size: 15px; outline: none;
          font-family: inherit; transition: border-color 0.15s ease;
        }
        .wl-input:focus { border-color: rgba(47,214,230,0.5); }
        .wl-input::placeholder { color: #4a4f5c; }
        .wl-btn {
          flex: 0 0 auto; border-radius: 999px !important;
          padding: 13px 28px !important; font-size: 15px !important;
          font-weight: 600 !important; white-space: nowrap; cursor: pointer;
          height: 50px;
        }
        .wl-btn:disabled { opacity: 0.7; cursor: not-allowed; }
        @media (max-width: 520px) {
          .wl-form { flex-direction: column; align-items: stretch; }
          .wl-input { text-align: center; border-radius: 12px !important; }
          .wl-btn { width: 100%; justify-content: center; border-radius: 12px !important; }
          .wl-pill { padding: 6px 12px; gap: 6px; }
        }
      `}</style>

      {/* Subtle background */}
      <div className="mkt-hero-bg" style={{ position: 'fixed', inset: 0, pointerEvents: 'none' }} />
      <div className="mkt-dots" style={{ position: 'fixed', inset: 0, pointerEvents: 'none', opacity: 0.3 }} />

      {/* ── Header ── */}
      <header style={{
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        padding: '20px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        zIndex: 1,
      }}>
        <Link href={MAIN_SITE_URL} style={{ display: 'flex', alignItems: 'center', gap: '9px', textDecoration: 'none' }}>
          <img src="/buildrs.png" alt="Buildrs" style={{ width: '28px', height: '28px', borderRadius: '7px' }} />
          <span style={{ fontSize: '17px', fontWeight: 650, color: '#eceef1', letterSpacing: '-0.02em' }}>Buildrs</span>
          <span className="mkt-mono" style={{ fontSize: '10px', letterSpacing: '0.16em', textTransform: 'uppercase', color: '#686e7c' }}>· hq</span>
        </Link>
      </header>

      {/* ── Main ── */}
      <main style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '64px 24px 40px',
        position: 'relative',
        zIndex: 1,
        textAlign: 'center',
      }}>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
          style={{ width: '100%', maxWidth: '640px' }}
        >
          {status === 'success' ? (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
            >
              {/* Countdown pill — kept visible on success */}
              <div style={{ marginBottom: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: '10px',
                  padding: '8px 20px', borderRadius: '999px',
                  border: '1px solid rgba(255,255,255,0.12)',
                  background: 'rgba(255,255,255,0.04)',
                }} className="wl-pill">
                  <span className="mkt-mono wl-pill-label" style={{ fontSize: '11px', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#a8adba' }}>
                    Launching Jan 1st, 2027
                  </span>
                  <span className="wl-pill-sep" style={{ width: '1px', height: '12px', background: 'rgba(255,255,255,0.15)' }} />
                  <span className="mkt-num" style={{ fontSize: '11px', color: '#2fd6e6', letterSpacing: '0.04em', fontWeight: 600 }}>
                    {timeLeft.days}d {pad(timeLeft.hours)}h {pad(timeLeft.minutes)}m {pad(timeLeft.seconds)}s
                  </span>
                </div>
              </div>

              <div style={{
                width: '64px', height: '64px', borderRadius: '50%',
                background: 'rgba(47,214,230,0.1)', border: '1px solid rgba(47,214,230,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px',
              }}>
                <CheckCircle size={30} color="#2fd6e6" />
              </div>
              <h1 style={{ fontSize: 'clamp(32px,6vw,52px)', fontWeight: 700, letterSpacing: '-0.03em', color: '#eceef1', margin: '0 0 14px', lineHeight: 1.1 }}>
                {already ? "You're already on the list!" : "You're on the list!"}
              </h1>
              <p style={{ fontSize: '17px', color: '#a8adba', lineHeight: 1.65, margin: '0 0 32px', maxWidth: '400px' }}>
                {already
                  ? <>{email} is already signed up — nothing else to do. We'll be in touch on launch day.</>
                  : <>We'll notify <span style={{ color: '#2fd6e6' }}>{email}</span> the moment Buildrs goes live. Day one, full access, no queues.</>}
              </p>
              <Link href={MAIN_SITE_URL} className="mkt-btn mkt-btn-primary" style={{ padding: '12px 32px', fontSize: '15px' }}>
                Back to home →
              </Link>
            </motion.div>
          ) : (
            <>
              {/* Launch date pill with live countdown */}
              <div style={{ marginBottom: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: '10px',
                  padding: '8px 20px', borderRadius: '999px',
                  border: '1px solid rgba(255,255,255,0.12)',
                  background: 'rgba(255,255,255,0.04)',
                }} className="wl-pill">
                  <span className="mkt-mono wl-pill-label" style={{ fontSize: '11px', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#a8adba' }}>
                    Launching Jan 1st, 2027
                  </span>
                  <span className="wl-pill-sep" style={{ width: '1px', height: '12px', background: 'rgba(255,255,255,0.15)' }} />
                  <span className="mkt-num" style={{ fontSize: '11px', color: '#2fd6e6', letterSpacing: '0.04em', fontWeight: 600 }}>
                    {timeLeft.days}d {pad(timeLeft.hours)}h {pad(timeLeft.minutes)}m {pad(timeLeft.seconds)}s
                  </span>
                </div>
              </div>

              {/* Headline */}
              <h1 style={{
                fontSize: 'clamp(32px, 5vw, 52px)',
                fontWeight: 700,
                letterSpacing: '-0.03em',
                lineHeight: 1.1,
                color: '#eceef1',
                margin: '0 0 16px',
              }}>
                Stop switching tabs.<br />
                <span style={{ color: '#2fd6e6' }}>Start shipping.</span>
              </h1>

              {/* Sub */}
              <p style={{ fontSize: '16px', color: '#a8adba', lineHeight: 1.7, margin: '0 0 36px', maxWidth: '420px', marginLeft: 'auto', marginRight: 'auto', textAlign: 'center' }}>
                Your editor, AI pair programmer, terminal, team chat, and CI/CD all in one space. Join the waitlist and be first in when we launch.
              </p>

              {/* Inline form */}
              <form onSubmit={handleSubmit} className="wl-form">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@domain.com"
                  disabled={status === 'loading'}
                  className="wl-input"
                />
                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="mkt-btn mkt-btn-primary wl-btn"
                >
                  {status === 'loading'
                    ? <Loader2 size={16} style={{ animation: 'mkt-spin 1s linear infinite' }} />
                    : 'Join now'
                  }
                </button>
              </form>

              {status === 'error' && (
                <p style={{ fontSize: '13px', color: '#f87171', marginTop: '10px' }}>{errMsg}</p>
              )}
            </>
          )}
        </motion.div>
      </main>

      {/* ── Footer strip ── */}
      <footer style={{
        padding: '32px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px',
        position: 'relative',
        zIndex: 1,
      }}>
        {/* Avatar stack — live joiners when loaded, placeholders until then */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {(members.length > 0
            ? members.map((m) => ({ src: m.avatar, label: m.name || m.maskedEmail }))
            : AVATARS.map((src) => ({ src, label: 'member' }))
          ).map((a, i) => (
            <img
              key={`${a.src}-${i}`}
              src={a.src}
              alt={a.label}
              title={a.label}
              style={{
                width: '44px', height: '44px', borderRadius: '50%',
                border: '3px solid #0d0d12',
                marginLeft: i === 0 ? 0 : '-14px',
                objectFit: 'cover',
                position: 'relative',
                zIndex: AVATARS.length - i,
              }}
            />
          ))}
        </div>
        <p style={{ fontSize: '16px', color: '#a8adba', margin: 0, letterSpacing: '-0.01em' }}>
          <span style={{ color: '#eceef1', fontWeight: 600 }}>{(count ?? FALLBACK_COUNT).toLocaleString()}</span> have already joined
        </p>
      </footer>
    </div>
  );
}
