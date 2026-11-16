import { useState, useEffect, useRef } from 'react';
import { Radio, Copy, Check, Sparkles, Smartphone, CheckCircle2 } from 'lucide-react';
import { generateTotp, getRemainingSeconds, getRemainingProgressPercent } from '../utils/totp.js';

export default function LiveOtpMonitor({ secret }) {
  const [currentOtp, setCurrentOtp] = useState('------');
  const [remainingSec, setRemainingSec] = useState(30);
  const [progressPercent, setProgressPercent] = useState(100);
  const [copied, setCopied] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const lastStepRef = useRef(null);

  // 실시간 OTP 생성 및 정밀 타이머 동기화 루프
  useEffect(() => {
    let animId;

    const updateOtpAndTimer = async () => {
      const now = Date.now();
      const currentStep = Math.floor(now / 1000 / 30);
      const remSec = getRemainingSeconds(now, 30);
      const prog = getRemainingProgressPercent(now, 30);

      setRemainingSec(remSec);
      setProgressPercent(prog);

      // 30초 스텝이 전환되었거나 초기 상태일 때 OTP 재계산
      if (lastStepRef.current !== currentStep) {
        lastStepRef.current = currentStep;
        setIsUpdating(true);
        try {
          const otp = await generateTotp(secret, { timestamp: now, step: 30, digits: 6 });
          setCurrentOtp(otp);
        } catch (err) {
          console.error('OTP 생성 오류:', err);
        } finally {
          setTimeout(() => setIsUpdating(false), 400);
        }
      }
    };

    // 최초 1회 즉시 실행
    updateOtpAndTimer();

    // 100ms 간격으로 정확한 시간과 프로그레스 링 갱신
    const interval = setInterval(updateOtpAndTimer, 100);

    return () => {
      clearInterval(interval);
      if (animId) cancelAnimationFrame(animId);
    };
  }, [secret]);

  const handleCopyOtp = async () => {
    if (currentOtp === '------') return;
    try {
      await navigator.clipboard.writeText(currentOtp);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const textArea = document.createElement('textarea');
      textArea.value = currentOtp;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // 6자리 코드를 3자리씩 분리 ("123 456")
  const formattedOtp = currentOtp.length === 6
    ? `${currentOtp.slice(0, 3)} ${currentOtp.slice(3, 6)}`
    : currentOtp;

  // 원형 게이지 둘레 계산 (반지름 r=42, 둘레 2*pi*r ≈ 263.89)
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  // 5초 미만 남았을 때 긴급 경고 색상
  const isExpiringSoon = remainingSec <= 5;

  return (
    <div className="card live-otp-card">
      <div className="card-header">
        <div className="card-title-group">
          <Radio className="card-header-icon live-pulse" size={20} />
          <h2>실시간 모바일 OTP 모니터</h2>
        </div>
        <div className="badge-live">
          <span className="live-indicator"></span>
          <span>LIVE SYNC</span>
        </div>
      </div>

      <div className="otp-monitor-content">
        {/* 원형 30초 카운트다운 타이머 게이지 */}
        <div className="timer-gauge-wrapper">
          <svg className="timer-svg" width="110" height="110" viewBox="0 0 100 100">
            {/* 배경 원 */}
            <circle
              className="timer-circle-bg"
              cx="50"
              cy="50"
              r={radius}
            />
            {/* 프로그레스 원 */}
            <circle
              className={`timer-circle-progress ${isExpiringSoon ? 'expiring' : ''}`}
              cx="50"
              cy="50"
              r={radius}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
            />
          </svg>
          <div className="timer-text-overlay">
            <span className={`timer-seconds ${isExpiringSoon ? 'text-urgent' : ''}`}>
              {remainingSec}
            </span>
            <span className="timer-unit">초</span>
          </div>
        </div>

        {/* 6자리 OTP 대형 디스플레이 */}
        <div className="otp-display-area">
          <span className="otp-caption">30초마다 갱신되는 6자리 인증번호</span>
          <div className={`otp-code-container ${isUpdating ? 'refreshing' : ''}`}>
            <span className="otp-digits" title="현재 활성 OTP 번호">
              {formattedOtp}
            </span>
            <button
              type="button"
              className={`copy-otp-btn ${copied ? 'copied' : ''}`}
              onClick={handleCopyOtp}
              title="인증번호 복사"
            >
              {copied ? <Check size={18} className="text-emerald" /> : <Copy size={18} />}
            </button>
          </div>
          <p className="otp-subtext">
            스마트폰 Authenticator 앱에 표시된 6자리 번호와 실시간으로 완벽히 일치합니다.
          </p>
        </div>
      </div>

      {/* 스마트폰 앱과의 동기화 상태 띠 */}
      <div className="sync-status-bar">
        <div className="sync-indicator">
          <CheckCircle2 size={16} className="text-emerald" />
          <span>RFC 6238 시간 동기화 활성: 스마트폰 앱의 번호와 지금 대조해 보세요!</span>
        </div>
        <div className="sync-device-tag">
          <Smartphone size={14} />
          <span>Google Authenticator 호환</span>
        </div>
      </div>
    </div>
  );
}
