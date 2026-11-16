import { useState, useCallback } from 'react';
import Header from './components/Header.jsx';
import SecretKeyManager from './components/SecretKeyManager.jsx';
import QRCodeDisplay from './components/QRCodeDisplay.jsx';
import LiveOtpMonitor from './components/LiveOtpMonitor.jsx';
import OtpVerifier from './components/OtpVerifier.jsx';
import SecurityAuditor from './components/SecurityAuditor.jsx';
import { generateBase32Secret } from './utils/base32.js';
import './App.css';

export default function App() {
  // 초기 20바이트(160비트) Base32 비밀 키 생성
  const [secret, setSecret] = useState(() => {
    try {
      return generateBase32Secret(20);
    } catch {
      // 초기 fallback (브라우저 로드 시점 방어)
      return 'JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP';
    }
  });

  const [account, setAccount] = useState('user@otplab.local');
  const [issuer, setIssuer] = useState('OTP LAB');

  // 새로운 키 발급 핸들러
  const handleGenerateNewSecret = useCallback(() => {
    const newSecret = generateBase32Secret(20);
    setSecret(newSecret);
  }, []);

  return (
    <div className="app-container">
      {/* 배경 장식 글로우 효과 */}
      <div className="bg-glow bg-glow-1" />
      <div className="bg-glow bg-glow-2" />

      <div className="app-content-wrapper">
        <Header />

        <main className="dashboard-grid">
          {/* 좌측 컬럼: 시크릿 키 관리 & QR 코드 연동 */}
          <div className="dashboard-col left-col">
            <SecretKeyManager
              secret={secret}
              onGenerateNewSecret={handleGenerateNewSecret}
              account={account}
              setAccount={setAccount}
              issuer={issuer}
              setIssuer={setIssuer}
            />
            <QRCodeDisplay
              secret={secret}
              account={account}
              issuer={issuer}
            />
          </div>

          {/* 우측 컬럼: 실시간 모바일 OTP 모니터 & 6자리 인증 검증기 */}
          <div className="dashboard-col right-col">
            <LiveOtpMonitor secret={secret} />
            <OtpVerifier secret={secret} />
          </div>
        </main>

        {/* 하단 섹션: 사이버보안 원칙 & 안전성 진단 */}
        <section className="dashboard-bottom">
          <SecurityAuditor />
        </section>

        <footer className="footer-container">
          <p className="footer-text">
            <strong>OTP LAB</strong> — RFC 6238 기반 모바일 OTP 웹앱 • 100% Client-Side Web Crypto API 연산
          </p>
          <p className="footer-subtext">
            외부 서버 데이터 전송 없음 (Zero-Transmission) • 안전한 난수(CSPRNG) 적용
          </p>
        </footer>
      </div>
    </div>
  );
}
