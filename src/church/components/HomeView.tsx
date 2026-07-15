import React from 'react';

export default function HomeView() {
  return (
    <div className="church-container" style={{ padding: '60px 20px' }}>
      <h2 className="font-serif" style={{ fontSize: '2.5rem', textAlign: 'center', marginBottom: '20px', color: 'var(--church-navy)' }}>
        오직 예수, 사랑과 은혜가 넘치는 공동체
      </h2>
      <p style={{ textAlign: 'center', color: 'var(--church-text-muted)', fontSize: '1.1rem', marginBottom: '40px' }}>
        “너희는 마음에 근심하지 말라 하나님을 믿으니 또 나를 믿으라” (요한복음 14:1)
      </p>
      
      {/* 표어 배너 */}
      <div style={{
        background: 'linear-gradient(135deg, var(--church-navy), var(--church-navy-light))',
        color: 'var(--church-white)',
        borderRadius: '16px',
        padding: '50px 30px',
        textAlign: 'center',
        marginBottom: '50px',
        boxShadow: 'var(--church-shadow-md)'
      }}>
        <span style={{ color: 'var(--church-gold)', fontWeight: 'bold', fontSize: '1.1rem', letterSpacing: '1px' }}>2026년 교회 표어</span>
        <h3 className="font-serif" style={{ fontSize: '2.2rem', marginTop: '10px', marginBottom: '15px' }}>
          소통하고 변화하며 세상을 이롭게 하는 교회
        </h3>
        <p style={{ opacity: 0.85 }}>에베소서 4장 15-16절</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginTop: '40px' }} className="home-grid">
        <div className="church-card" style={{ padding: '30px' }}>
          <h4 className="font-serif" style={{ fontSize: '1.4rem', color: 'var(--church-navy)', marginBottom: '15px' }}>주일 예배 안내</h4>
          <p style={{ margin: '8px 0' }}><strong>1부 예배 (새벽)</strong>: 오전 6:00</p>
          <p style={{ margin: '8px 0' }}><strong>2부 예배 (오전)</strong>: 오전 9:00</p>
          <p style={{ margin: '8px 0' }}><strong>3부 예배 (대예배)</strong>: 오전 11:00</p>
        </div>
        
        <div className="church-card" style={{ padding: '30px' }}>
          <h4 className="font-serif" style={{ fontSize: '1.4rem', color: 'var(--church-navy)', marginBottom: '15px' }}>이번 주 핵심 소식</h4>
          <p style={{ color: 'var(--church-text-muted)' }}>등록된 새로운 공지사항이 아직 없습니다.</p>
        </div>
      </div>
    </div>
  );
}
