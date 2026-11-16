import { useState, useEffect } from 'react';
import { ShieldCheck, Clock, Lock, Radio } from 'lucide-react';

export default function Header() {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const kstString = currentTime.toLocaleTimeString('ko-KR', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const utcString = currentTime.toISOString().substring(11, 19);

  return (
    <header className="header-container">
      <div className="header-brand">
        <div className="brand-logo-wrapper">
          <ShieldCheck className="brand-icon" size={32} />
        </div>
        <div>
          <div className="brand-title-row">
            <h1 className="brand-title">OTP LAB</h1>
            <span className="version-badge">v1.0 • RFC 6238</span>
          </div>
          <p className="brand-desc">
            스마트폰 Google Authenticator와 100% 동기화되는 모바일 OTP 체험 스튜디오
          </p>
        </div>
      </div>

      <div className="header-status-group">
        <div className="status-badge transmission-badge" title="외부 서버로 키를 전송하지 않고 브라우저 내에서만 연산합니다.">
          <Lock size={15} className="status-icon" />
          <span>Zero-Transmission</span>
          <span className="live-dot"></span>
        </div>

        <div className="status-badge time-badge" title="TOTP의 핵심인 시스템 표준 시각입니다.">
          <Clock size={15} className="status-icon" />
          <span className="time-text">KST {kstString} <span className="utc-sub">(UTC {utcString})</span></span>
        </div>
      </div>
    </header>
  );
}
