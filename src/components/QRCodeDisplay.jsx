import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { QrCode, Smartphone, Copy, Check, Info } from 'lucide-react';
import { buildOtpAuthUri } from '../utils/totp.js';

export default function QRCodeDisplay({ secret, account, issuer }) {
  const [copiedUri, setCopiedUri] = useState(false);

  const otpAuthUri = buildOtpAuthUri({
    secret,
    account: account || 'user@otplab.local',
    issuer: issuer || 'OTP LAB',
    digits: 6,
    period: 30,
  });

  const handleCopyUri = async () => {
    try {
      await navigator.clipboard.writeText(otpAuthUri);
      setCopiedUri(true);
      setTimeout(() => setCopiedUri(false), 2000);
    } catch {
      // fallback
      const textArea = document.createElement('textarea');
      textArea.value = otpAuthUri;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopiedUri(true);
      setTimeout(() => setCopiedUri(false), 2000);
    }
  };

  return (
    <div className="card qr-card">
      <div className="card-header">
        <div className="card-title-group">
          <QrCode className="card-header-icon" size={20} />
          <h2>스마트폰 연동 QR 코드</h2>
        </div>
        <button
          type="button"
          className={`btn btn-secondary ${copiedUri ? 'copied' : ''}`}
          onClick={handleCopyUri}
          title="스마트폰 수동 입력용 otpauth URI 클립보드 복사"
        >
          {copiedUri ? <Check size={14} className="text-emerald" /> : <Copy size={14} />}
          <span>{copiedUri ? 'URI 복사됨' : 'otpauth URI 복사'}</span>
        </button>
      </div>

      <div className="qr-container">
        <div className="qr-box-wrapper">
          <div className="qr-box">
            <QRCodeSVG
              value={otpAuthUri}
              size={190}
              level="M"
              includeMargin={true}
              bgColor="#ffffff"
              fgColor="#090d16"
            />
          </div>
          <div className="qr-scan-guide">
            <Smartphone size={18} className="guide-icon text-cyan" />
            <span>스마트폰 카메라 또는 Authenticator 앱으로 스캔</span>
          </div>
        </div>

        <div className="qr-instructions">
          <h3>📱 스마트폰 등록 가이드</h3>
          <ol className="step-list">
            <li>
              스마트폰에서 <strong>Google Authenticator</strong> (또는 Microsoft Authenticator / 2FAS) 앱을 엽니다.
            </li>
            <li>
              우측 하단 <strong>[ + ]</strong> 버튼을 누르고 <strong>[QR 코드 스캔]</strong>을 선택합니다.
            </li>
            <li>
              위 QR 코드를 카메라로 비추면 즉시 <strong>&ldquo;{issuer || 'OTP LAB'} ({account || 'user@otplab.local'})&rdquo;</strong> 계정이 추가됩니다.
            </li>
          </ol>

          <div className="info-banner">
            <Info size={16} className="info-icon" />
            <p>
              인터넷 연결이 끊겨도 작동합니다! 비밀 키와 현재 시간만으로 인증 번호를 동기화합니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
