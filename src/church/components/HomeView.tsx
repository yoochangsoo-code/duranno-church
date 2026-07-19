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
      
      {/* 표어 배너 (고화질 일러스트 적용) */}
      <div style={{
        backgroundImage: 'linear-gradient(rgba(15, 23, 42, 0.55), rgba(15, 23, 42, 0.75)), url("/church-building.jpg")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        color: 'var(--church-white)',
        borderRadius: '16px',
        padding: '70px 30px',
        textAlign: 'center',
        marginBottom: '50px',
        boxShadow: 'var(--church-shadow-md)'
      }}>
        <span style={{ color: 'var(--church-gold)', fontWeight: 'bold', fontSize: '1.1rem', letterSpacing: '1px' }}>2026년 교회 표어</span>
        <h3 className="font-serif" style={{ fontSize: '2.2rem', marginTop: '10px', marginBottom: '15px', color: '#fff' }}>
          소통하고 변화하며 세상을 이롭게 하는 교회
        </h3>
        <p style={{ opacity: 0.9 }}>에베소서 4장 15-16절</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginTop: '40px' }} className="home-grid">
        <div className="church-card" style={{ padding: '30px' }}>
          <h4 className="font-serif" style={{ fontSize: '1.4rem', color: 'var(--church-navy)', marginBottom: '15px' }}>주일 예배 안내</h4>
          <p style={{ margin: '8px 0' }}><strong>1부 예배</strong>: 오전 7:30 (대예배실)</p>
          <p style={{ margin: '8px 0' }}><strong>2부 예배</strong>: 오전 9:30 (대예배실)</p>
          <p style={{ margin: '8px 0' }}><strong>3부 예배 (대예배)</strong>: 오전 11:30 (대예배실)</p>
          <p style={{ margin: '8px 0' }}><strong>4부 (청년) 예배</strong>: 오후 2:00 (대예배실)</p>
          <p style={{ margin: '8px 0' }}><strong>오후 찬양 예배</strong>: 오후 3:30 (대예배실)</p>
        </div>
        
        <div className="church-card" style={{ padding: '30px' }}>
          <h4 className="font-serif" style={{ fontSize: '1.4rem', color: 'var(--church-navy)', marginBottom: '15px' }}>이번 주 핵심 소식</h4>
          <ul style={{ paddingLeft: '20px', lineHeight: '1.8', color: 'var(--church-text-dark)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <li style={{ listStyleType: 'disc' }}>
              <strong>[여름 사역] 성경학교 및 수련회</strong>
              <div style={{ fontSize: '0.85rem', color: 'var(--church-text-muted)', marginLeft: '5px' }}>
                • 영유아/유치부: 7/18~19 (교육관)<br/>
                • 유초등부: 7/25~26 (외부)<br/>
                • 청소년부: 8/1~3 (양평)
              </div>
            </li>
            <li style={{ listStyleType: 'disc' }}><strong>일대일 제자양육 동반자 모집</strong> (행정실 문의)</li>
            <li style={{ listStyleType: 'disc' }}><strong>주일 주차공간 협소로 대중교통 이용 권장</strong></li>
          </ul>
        </div>
      </div>
    </div>
  );
}
