import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';
import { LoginService, SendOtp } from '../services/AuthService';
import { saveToken } from '../Helpers';

const OTP_LENGTH = 6;
const OTP_EXPIRY = 165; // 2 min 45 sec

/* ─────────── SVG icons ─────────── */

const IconCalendar = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <rect x="3" y="4" width="18" height="17" rx="3" stroke="#fff" strokeWidth="2"/>
    <path d="M3 9h18" stroke="#fff" strokeWidth="2"/>
    <path d="M8 2v4M16 2v4" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
    <rect x="7" y="13" width="3" height="3" rx="1" fill="#fff"/>
    <rect x="10.5" y="13" width="3" height="3" rx="1" fill="#fff"/>
  </svg>
);

const IconMail = ({ color = '#9ca3af' }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <rect x="2" y="4" width="20" height="16" rx="3" stroke={color} strokeWidth="1.8"/>
    <path d="M2 8l10 7 10-7" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const IconMailOtp = () => (
  <svg width="34" height="34" viewBox="0 0 40 38" fill="none">
    <rect x="1" y="3" width="28" height="20" rx="3" fill="#5457d4" fillOpacity="0.1" stroke="#5457d4" strokeWidth="1.8"/>
    <path d="M1 7l14 10 14-10" stroke="#5457d4" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="31" cy="28" r="8" fill="#ecedf8" stroke="#5457d4" strokeWidth="1.5"/>
    <path d="M31 24.5V28l2.5 2.5" stroke="#5457d4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const IconShieldLock = ({ size = 32, color = '#5457d4' }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <path d="M16 3L5 7.5v7.5c0 6.075 4.7 11.75 11 13 6.3-1.25 11-6.925 11-13V7.5L16 3z"
      fill={color} fillOpacity="0.15" stroke={color} strokeWidth="1.8"/>
    <rect x="11" y="14" width="10" height="8" rx="2" stroke={color} strokeWidth="1.8"/>
    <circle cx="16" cy="17.5" r="1.5" fill={color}/>
    <path d="M16 19v1.5" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M13 14v-2a3 3 0 016 0v2" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
  </svg>
);

const IconShieldCheck = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <path d="M12 2L3 6v6c0 5.25 3.9 10.15 9 11.35C17.1 22.15 21 17.25 21 12V6l-9-4z"
      fill="#5457d4" fillOpacity="0.1" stroke="#5457d4" strokeWidth="1.8"/>
    <path d="M9 12l2 2 4-4" stroke="#5457d4" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const IconLock = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <rect x="5" y="11" width="14" height="10" rx="2" stroke="#9ca3af" strokeWidth="1.8"/>
    <path d="M8 11V7a4 4 0 018 0v4" stroke="#9ca3af" strokeWidth="1.8" strokeLinecap="round"/>
  </svg>
);

const IconCircleAlert = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" stroke="#ef4444" strokeWidth="1.8"/>
    <path d="M12 8v4M12 16h.01" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const IconClock = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" stroke="#9ca3af" strokeWidth="1.8"/>
    <path d="M12 7v5l3 3" stroke="#9ca3af" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const IconArrowLeft = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
    <path d="M19 12H5M5 12l7-7M5 12l7 7" stroke="#6b7280" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

/* ─────────── Decorative components (static) ─────────── */

const MAY_2024 = [
  [28, 29, 30,  1,  2,  3,  4],
  [ 5,  6,  7,  8,  9, 10, 11],
  [12, 13, 14, 15, 16, 17, 18],
  [19, 20, 21, 22, 23, 24, 25],
  [26, 27, 28, 29, 30, 31,  1],
];
const MUTED_START = new Set([28, 29, 30]);

const PlantIllustration = () => (
  <svg viewBox="0 0 90 130" fill="none">
    <path d="M28 105h34l-5 20H33l-5-20z" fill="#d6d8f0"/>
    <path d="M24 98h42v9H24z" rx="4" fill="#c4c6e8"/>
    <path d="M45 98V58" stroke="#8b8fd4" strokeWidth="3" strokeLinecap="round"/>
    <path d="M45 85 C35 75 20 72 22 60 C30 62 42 70 45 85Z" fill="#9094d9"/>
    <path d="M45 75 C55 65 70 62 68 50 C60 52 48 60 45 75Z" fill="#7a7ec8"/>
    <path d="M45 65 C35 55 22 50 24 38 C32 40 43 52 45 65Z" fill="#9094d9"/>
    <path d="M45 55 C55 45 68 40 66 28 C58 30 46 42 45 55Z" fill="#7a7ec8"/>
    <path d="M45 72 C38 60 35 45 40 35 C46 42 50 58 45 72Z" fill="#8b8fd4"/>
  </svg>
);

const BlobDecoration = () => (
  <svg viewBox="0 0 420 380" fill="none" className="login-blob">
    <path d="M320 30 C390 60 430 150 400 240 C370 330 280 390 180 370 C80 350 20 270 10 170 C0 70 80 0 180 10 C230 15 270 10 320 30Z" fill="#c8caf0"/>
  </svg>
);

const CalendarMock = () => (
  <div className="login-calendar-wrap">
    <div className="login-calendar-card">
      <div className="cal-header">
        <button className="cal-nav-btn">&#8249;</button>
        <span>May 2024</span>
        <button className="cal-nav-btn">&#8250;</button>
      </div>
      <table className="cal-grid">
        <thead>
          <tr>{['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => <th key={d}>{d}</th>)}</tr>
        </thead>
        <tbody>
          {MAY_2024.map((week, wi) => (
            <tr key={wi}>
              {week.map((day, di) => {
                const isMuted = (wi === 0 && MUTED_START.has(day)) || (wi === MAY_2024.length - 1 && di === 6);
                const isToday = day === 15 && !isMuted;
                return (
                  <td key={di} className={isMuted ? 'muted' : isToday ? 'today' : ''}>{day}</td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    <div className="login-task-card">
      <div className="task-card-left">
        <span className="task-dot" />
        <div>
          <div className="task-card-title">Team Meeting</div>
          <div className="task-card-sub">May 15, 2024 &bull; 10:00 AM</div>
        </div>
      </div>
      <div className="task-card-check">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
          <path d="M5 13l4 4L19 7" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
    </div>
  </div>
);

/* ══════════════════════════════════════
   Login component
══════════════════════════════════════ */
export const Login = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState('email'); // 'email' | 'otp'
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(''));
  const [otpError, setOtpError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [timeLeft, setTimeLeft] = useState(OTP_EXPIRY);

  const otpRefs = useRef([]);
  const timerRef = useRef(null);

  const startTimer = useCallback(() => {
    clearInterval(timerRef.current);
    setTimeLeft(OTP_EXPIRY);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(timerRef.current); return 0; }
        return prev - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => () => clearInterval(timerRef.current), []);

  const fmt = (s) =>
    `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

  /* ── handlers ── */

  const handleSendOtpClick = async () => {
    setApiError('');
    if (!email.trim()) { setEmailError('Email address is required.'); return; }
    if (!isValidEmail(email)) { setEmailError('Please enter a valid email address.'); return; }
    setEmailError('');
    setIsLoading(true);
    try {
      await SendOtp({ email: email.trim() });
      setOtp(Array(OTP_LENGTH).fill(''));
      setOtpError('');
      setStep('otp');
      startTimer();
      setTimeout(() => otpRefs.current[0]?.focus(), 80);
    } catch (err) {
      setApiError(err?.response?.data?.message ?? 'Failed to send OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyClick = async () => {
    setApiError('');
    const code = otp.join('');
    if (code.length < OTP_LENGTH) { setOtpError('Please enter the complete 6-digit code.'); return; }
    setOtpError('');
    setIsLoading(true);
    try {
      const result = await LoginService({ email: email.trim(), otp: code });
      saveToken(result.data.token);
      navigate('/tasks');
    } catch (err) {
      setApiError(err?.response?.data?.message ?? 'Invalid code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtpClick = async () => {
    setApiError('');
    setOtp(Array(OTP_LENGTH).fill(''));
    setOtpError('');
    setIsLoading(true);
    try {
      await SendOtp({ email: email.trim() });
      startTimer();
      setTimeout(() => otpRefs.current[0]?.focus(), 80);
    } catch (err) {
      setApiError(err?.response?.data?.message ?? 'Failed to resend OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToEmail = () => {
    clearInterval(timerRef.current);
    setStep('email');
    setOtp(Array(OTP_LENGTH).fill(''));
    setOtpError('');
    setApiError('');
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    if (emailError) setEmailError('');
    if (apiError) setApiError('');
  };

  const handleOtpChange = (index, value) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);
    if (otpError) setOtpError('');
    if (apiError) setApiError('');
    if (digit && index < OTP_LENGTH - 1) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    const next = Array(OTP_LENGTH).fill('');
    text.split('').forEach((ch, i) => { next[i] = ch; });
    setOtp(next);
    otpRefs.current[Math.min(text.length, OTP_LENGTH - 1)]?.focus();
  };

  /* ── render ── */

  return (
    <div className="login-page">

      {/* Left decorative panel */}
      <div className="login-left">
        <div className="login-logo">
          <div className="login-logo-icon"><IconCalendar /></div>
          Task Calendar
        </div>
        <div className="login-headline">
          <h1>Plan your day,<span>stay on track.</span></h1>
          <p>Add tasks on specific dates, stay organized and get things done.</p>
        </div>
        <BlobDecoration />
        <div className="login-plant"><PlantIllustration /></div>
        <CalendarMock />
      </div>

      {/* Right panel */}
      <div className="login-right">
        <div className="login-panel">

          {/* Card */}
          <div className="login-card">

            {step === 'email' ? (
              <>
                <div className="login-shield-icon">
                  <IconShieldLock size={32} color="#5457d4" />
                </div>

                <h2>Welcome back!</h2>
                <p className="login-subtitle">
                  Login with your email and we&apos;ll send you a one-time password.
                </p>

                <form className="login-form" onSubmit={e => { e.preventDefault(); handleSendOtpClick(); }}>
                  <label className="form-label" htmlFor="email">Email address</label>
                  <div className={`input-wrapper${emailError ? ' has-error' : ''}`}>
                    <IconMail color={emailError ? '#ef4444' : '#9ca3af'} />
                    <input
                      id="email"
                      type="text"
                      inputMode="email"
                      autoComplete="email"
                      value={email}
                      onChange={handleEmailChange}
                      placeholder="Enter your email"
                      disabled={isLoading}
                    />
                  </div>

                  {emailError && (
                    <div className="field-error">
                      <IconCircleAlert />
                      {emailError}
                    </div>
                  )}

                  {apiError && (
                    <div className="field-error api-error">{apiError}</div>
                  )}

                  <button type="submit" className="send-otp-btn" disabled={isLoading}>
                    {isLoading ? <span className="btn-spinner" /> : 'Send OTP'}
                  </button>
                </form>

                <div className="login-hint">We&apos;ll send a 6-digit code to your email</div>

                <div className="login-info-box">
                  <span className="login-info-box-icon"><IconShieldCheck /></span>
                  <div>
                    <div className="login-info-box-title">No account needed</div>
                    <div className="login-info-box-text">
                      Just login with your email to access your tasks.
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="login-shield-icon">
                  <IconMailOtp />
                </div>

                <h2>Verify your email</h2>
                <p className="login-subtitle">
                  We&apos;ve sent a 6-digit OTP to<br />
                  <span className="otp-email-highlight">{email}</span>
                </p>

                <div className="login-form">
                  <label className="form-label">Enter the 6-digit code</label>
                  <div className="otp-boxes">
                    {otp.map((digit, i) => (
                      <input
                        key={i}
                        ref={el => { otpRefs.current[i] = el; }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={e => handleOtpChange(i, e.target.value)}
                        onKeyDown={e => handleOtpKeyDown(i, e)}
                        onPaste={handleOtpPaste}
                        className={`otp-box${otpError ? ' has-error' : ''}`}
                        disabled={isLoading}
                        autoComplete="one-time-code"
                      />
                    ))}
                  </div>

                  {otpError && (
                    <div className="field-error">
                      <IconCircleAlert />
                      {otpError}
                    </div>
                  )}

                  <div className="expire-row">
                    <IconClock />
                    {timeLeft > 0
                      ? <>Code expires in <span className="expire-time">{fmt(timeLeft)}</span></>
                      : <span className="expire-time expired">Code expired — please resend</span>
                    }
                  </div>

                  {apiError && (
                    <div className="field-error api-error">{apiError}</div>
                  )}

                  <button
                    type="button"
                    className="send-otp-btn"
                    onClick={handleVerifyClick}
                    disabled={isLoading || timeLeft === 0}
                  >
                    {isLoading ? <span className="btn-spinner" /> : 'Verify & Login'}
                  </button>
                </div>

                <div className="login-hint">Didn&apos;t receive the code?</div>

                <button
                  type="button"
                  className="resend-link"
                  onClick={handleResendOtpClick}
                  disabled={isLoading}
                >
                  Resend OTP
                </button>
              </>
            )}

          </div>
          {/* end .login-card */}

          {/* Below-card area */}
          {step === 'otp' && (
            <button type="button" className="back-link" onClick={handleBackToEmail}>
              <IconArrowLeft /> Back to email
            </button>
          )}

          <div className="login-footer">
            <IconLock />
            Your data is safe and secure with us.
          </div>

        </div>
      </div>

    </div>
  );
};
