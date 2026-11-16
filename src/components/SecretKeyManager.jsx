import { useState } from 'react';
import { KeyRound, RefreshCw, Copy, Check, Eye, EyeOff, ShieldAlert, Sliders } from 'lucide-react';
import { formatSecretKey } from '../utils/base32.js';

export default function SecretKeyManager({
  secret,
  onGenerateNewSecret,
  account,
  setAccount,
  issuer,
  setIssuer,
}) {
  const [showSecret, setShowSecret] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(secret.replace(/\s+/g, ''));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const textArea = document.createElement('textarea');
      textArea.value = secret.replace(/\s+/g, '');
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="card secret-key-card">
      <div className="card-header">
        <div className="card-title-group">
          <KeyRound className="card-header-icon" size={20} />
          <h2>비밀 키 (Base32 Secret)</h2>
        </div>
        <div className="card-header-actions">
          <button
            type="button"
            className="icon-btn"
            onClick={() => setShowSettings(!showSettings)}
            title="계정 및 발급자 정보 설정"
          >
            <Sliders size={16} />
            <span>설정</span>
          </button>
          <button
            type="button"
            className="btn btn-primary-gradient"
            onClick={onGenerateNewSecret}
            title="crypto.getRandomValues 기반 새로운 160비트 암호키 발급"
          >
            <RefreshCw size={15} />
            <span>새 키 생성</span>
          </button>
        </div>
      </div>

      <div className="secret-display-box">
        <div className="secret-text-wrapper">
          <span className="secret-label">Base32 Secret Key (160-bit CSPRNG)</span>
          <p className="secret-code">
            {showSecret ? formatSecretKey(secret) : '•••• •••• •••• •••• •••• •••• •••• ••••'}
          </p>
        </div>
        <div className="secret-actions">
          <button
            type="button"
            className="action-icon-btn"
            onClick={() => setShowSecret(!showSecret)}
            title={showSecret ? '비밀 키 숨기기' : '비밀 키 보기'}
          >
            {showSecret ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
          <button
            type="button"
            className={`action-icon-btn ${copied ? 'copied' : ''}`}
            onClick={handleCopy}
            title="클립보드에 비밀 키 복사"
          >
            {copied ? <Check size={18} className="text-emerald" /> : <Copy size={18} />}
          </button>
        </div>
      </div>

      {showSettings && (
        <div className="settings-panel">
          <div className="input-group">
            <label htmlFor="issuer-input">발급자 명 (Issuer)</label>
            <input
              id="issuer-input"
              type="text"
              value={issuer}
              onChange={(e) => setIssuer(e.target.value)}
              placeholder="예: OTP LAB"
              className="styled-input"
            />
          </div>
          <div className="input-group">
            <label htmlFor="account-input">사용자 계정 (Account ID)</label>
            <input
              id="account-input"
              type="text"
              value={account}
              onChange={(e) => setAccount(e.target.value)}
              placeholder="예: student@kopo.ac.kr"
              className="styled-input"
            />
          </div>
        </div>
      )}

      <div className="security-notice">
        <ShieldAlert size={16} className="notice-icon" />
        <p>
          <strong>CSPRNG 보증:</strong> 일반 <code>Math.random()</code>은 예측 가능하므로 배제하고,
          브라우저 내장 <code>window.crypto.getRandomValues(20바이트)</code>로 안전하게 발급되었습니다.
        </p>
      </div>
    </div>
  );
}
