import { useState } from 'react';
import { ShieldCheck, Network, Cpu, Lock, CheckCircle2 } from 'lucide-react';

export default function SecurityAuditor() {
  const [activeTab, setActiveTab] = useState('principles'); // 'principles' | 'checklist'

  return (
    <div className="card security-auditor-card">
      <div className="card-header">
        <div className="card-title-group">
          <ShieldCheck className="card-header-icon text-cyan" size={20} />
          <h2>사이버보안 원칙 & 안전성 진단 (Security Audit)</h2>
        </div>
        <div className="tabs-pill">
          <button
            type="button"
            className={`tab-pill-btn ${activeTab === 'principles' ? 'active' : ''}`}
            onClick={() => setActiveTab('principles')}
          >
            핵심 원리
          </button>
          <button
            type="button"
            className={`tab-pill-btn ${activeTab === 'checklist' ? 'active' : ''}`}
            onClick={() => setActiveTab('checklist')}
          >
            보안 체크포인트
          </button>
        </div>
      </div>

      {activeTab === 'principles' ? (
        <div className="auditor-content">
          <div className="principle-grid">
            <div className="principle-item">
              <div className="principle-icon-wrapper">
                <Lock size={20} className="text-cyan" />
              </div>
              <div className="principle-info">
                <h4>1. 암호학적 엔트로피 (CSPRNG)</h4>
                <p>
                  <code>Math.random()</code>은 다음 난수가 수학적으로 예측 가능하여 보안 키로 사용할 수 없습니다.
                  OTP LAB은 <code>window.crypto.getRandomValues()</code>를 통해 OS 하드웨어 엔트로피를 수집한 160비트 난수를 발급합니다.
                </p>
              </div>
            </div>

            <div className="principle-item">
              <div className="principle-icon-wrapper">
                <Network size={20} className="text-emerald" />
              </div>
              <div className="principle-info">
                <h4>2. Zero-Transmission (무전송 원칙)</h4>
                <p>
                  비밀 키 생성과 HMAC-SHA1 연산은 외부 백엔드 API 없이 브라우저 내장 <code>crypto.subtle</code>에서만 독점 실행됩니다.
                  네트워크 전송이 전혀 없으므로 패킷 스니핑이나 중간자 공격(MITM)의 위협으로부터 안전합니다.
                </p>
              </div>
            </div>

            <div className="principle-item">
              <div className="principle-icon-wrapper">
                <Cpu size={20} className="text-purple" />
              </div>
              <div className="principle-info">
                <h4>3. RFC 6238 표준 시간 동기화</h4>
                <p>
                  네트워크 연결 없이도 <code>UnixTime / 30초</code> 카운터와 동일한 비밀 키를 이용해
                  스마트폰과 PC가 독립적으로 정확히 동일한 6자리 인증 번호를 연산해 냅니다.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="auditor-content">
          <div className="checklist-box">
            <div className="check-row">
              <CheckCircle2 size={18} className="text-emerald check-icon" />
              <div className="check-desc">
                <strong>Network 탭 0건 검증:</strong>
                <span> F12 개발자 도구의 Network 탭을 열고 새 키를 발급하거나 OTP를 검증해도 외부 API 요청이 발생하지 않습니다.</span>
              </div>
            </div>

            <div className="check-row">
              <CheckCircle2 size={18} className="text-emerald check-icon" />
              <div className="check-desc">
                <strong>RFC 4648 Base32 준수:</strong>
                <span> 160비트(20바이트) 비밀 키를 표준 알파벳(A-Z, 2-7) 32글자로 완벽히 인코딩하여 Authenticator 앱 호환성을 확보했습니다.</span>
              </div>
            </div>

            <div className="check-row">
              <CheckCircle2 size={18} className="text-emerald check-icon" />
              <div className="check-desc">
                <strong>Big-Endian 64-bit 카운터:</strong>
                <span> 시간 카운터를 8바이트 Big-Endian 버퍼로 정밀 변환하여 구글 OTP와 1초의 오차 없이 연동됩니다.</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
