import { useState } from 'react';
import { ShieldCheck, CheckCircle, XCircle, ArrowRight, History, Zap } from 'lucide-react';
import { verifyTotp, generateTotp } from '../utils/totp.js';

export default function OtpVerifier({ secret }) {
  const [inputCode, setInputCode] = useState('');
  const [verificationResult, setVerificationResult] = useState(null); // { isValid: boolean, message: string, delta: number | null } | null
  const [allowWindow, setAllowWindow] = useState(true); // Window ±1 step (앞뒤 30초 허용)
  const [history, setHistory] = useState([]);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleVerify = async (e) => {
    if (e) e.preventDefault();
    const cleanInput = inputCode.trim().replace(/\s+/g, '');

    if (!cleanInput || cleanInput.length !== 6) {
      setVerificationResult({
        isValid: false,
        message: '6자리 숫자를 정확히 입력해 주세요.',
        delta: null,
      });
      return;
    }

    setIsVerifying(true);

    try {
      const windowSteps = allowWindow ? 1 : 0;
      const { isValid, delta } = await verifyTotp(cleanInput, secret, {
        timestamp: Date.now(),
        step: 30,
        digits: 6,
        window: windowSteps,
      });

      let message = '';
      if (isValid) {
        if (delta === 0) {
          message = '인증 성공! 현재 시간 스텝의 번호와 정확히 일치합니다. 🎯';
        } else if (delta === -1) {
          message = '인증 성공! 직전 30초 구간 번호가 허용 시간 오차(±1) 내에서 인정되었습니다.';
        } else if (delta === 1) {
          message = '인증 성공! 직후 30초 구간 번호가 허용 시간 오차(±1) 내에서 인정되었습니다.';
        }
      } else {
        message = '인증 실패: 입력하신 번호가 유효하지 않거나 이미 만료되었습니다.';
      }

      const resultObj = { isValid, message, delta };
      setVerificationResult(resultObj);

      // 검증 히스토리에 추가
      const newEntry = {
        id: Date.now(),
        time: new Date().toLocaleTimeString('ko-KR', { hour12: false }),
        code: cleanInput,
        isValid,
        delta,
      };
      setHistory((prev) => [newEntry, ...prev.slice(0, 4)]);
    } catch (err) {
      console.error('검증 오류:', err);
      setVerificationResult({
        isValid: false,
        message: '검증 처리 중 오류가 발생했습니다.',
        delta: null,
      });
    } finally {
      setIsVerifying(false);
    }
  };

  // 체험 테스트 편의 기능: 현재 웹 OTP 자동 채우기
  const handleAutoFillCurrent = async () => {
    try {
      const currentOtp = await generateTotp(secret, { timestamp: Date.now(), step: 30, digits: 6 });
      setInputCode(currentOtp);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="card verifier-card">
      <div className="card-header">
        <div className="card-title-group">
          <ShieldCheck className="card-header-icon" size={20} />
          <h2>OTP 인증번호 검증기</h2>
        </div>
        <div className="verifier-options">
          <label className="toggle-label" title="스마트폰과 PC 시계의 미세한 오차를 보정하기 위해 앞뒤 30초 번호를 인정합니다.">
            <input
              type="checkbox"
              checked={allowWindow}
              onChange={(e) => setAllowWindow(e.target.checked)}
            />
            <span className="toggle-text">시간 오차 ±30초 허용</span>
          </label>
        </div>
      </div>

      <form onSubmit={handleVerify} className="verifier-form">
        <div className="input-with-button">
          <div className="otp-input-field-wrapper">
            <input
              type="text"
              maxLength={6}
              value={inputCode}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9]/g, '');
                setInputCode(val);
                if (verificationResult) setVerificationResult(null);
              }}
              placeholder="스마트폰의 6자리 번호 입력"
              className="otp-input-box"
              autoComplete="one-time-code"
            />
          </div>

          <button
            type="submit"
            className="btn btn-verify"
            disabled={inputCode.length !== 6 || isVerifying}
          >
            <span>{isVerifying ? '검증 중...' : '인증 확인'}</span>
            <ArrowRight size={16} />
          </button>
        </div>

        <div className="autofill-action-row">
          <button
            type="button"
            className="text-action-btn"
            onClick={handleAutoFillCurrent}
          >
            <Zap size={14} />
            <span>현재 웹 모니터 번호 자동 채우기 (체험용)</span>
          </button>
        </div>
      </form>

      {/* 검증 결과 피드백 카드 */}
      {verificationResult && (
        <div className={`verification-result-box ${verificationResult.isValid ? 'success' : 'failed'}`}>
          <div className="result-icon-col">
            {verificationResult.isValid ? (
              <CheckCircle size={28} className="text-emerald" />
            ) : (
              <XCircle size={28} className="text-rose" />
            )}
          </div>
          <div className="result-text-col">
            <h4 className="result-title">
              {verificationResult.isValid ? '인증 성공 (AUTHORIZED)' : '인증 실패 (UNAUTHORIZED)'}
            </h4>
            <p className="result-detail">{verificationResult.message}</p>
          </div>
        </div>
      )}

      {/* 최근 검증 이력 내역 */}
      {history.length > 0 && (
        <div className="history-section">
          <div className="history-header">
            <History size={14} />
            <span>최근 검증 기록</span>
          </div>
          <div className="history-list">
            {history.map((item) => (
              <div key={item.id} className="history-item">
                <span className="history-time">{item.time}</span>
                <span className="history-code">{item.code}</span>
                <span className={`history-status ${item.isValid ? 'status-ok' : 'status-fail'}`}>
                  {item.isValid ? '일치' : '불일치'}
                  {item.delta !== null && item.delta !== 0 && ` (${item.delta > 0 ? '+30s' : '-30s'})`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
