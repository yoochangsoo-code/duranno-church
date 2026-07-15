import React from 'react';

export default function AboutView() {
  return (
    <div className="church-container" style={{ padding: '60px 20px' }}>
      <h2 className="font-serif" style={{ fontSize: '2.2rem', color: 'var(--church-navy)', marginBottom: '30px', borderBottom: '2px solid var(--church-gold)', paddingBottom: '10px' }}>
        교회 소개
      </h2>
      
      <div style={{ display: 'flex', gap: '40px', alignItems: 'center', marginBottom: '60px' }} className="about-intro">
        <div style={{
          width: '250px',
          height: '320px',
          backgroundColor: 'var(--church-beige-dark)',
          borderRadius: '12px',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justify: 'center',
          color: 'var(--church-text-muted)'
        }}>
          목사님 프로필 사진
        </div>
        <div>
          <h3 className="font-serif" style={{ fontSize: '1.6rem', color: 'var(--church-navy)', marginBottom: '15px' }}>
            환영합니다! 담임목사 홍길동입니다.
          </h3>
          <p style={{ lineHeight: 1.8, color: 'var(--church-text-dark)' }}>
            우리 은혜와평강교회 홈페이지를 방문해 주신 여러분을 진심으로 환영하고 축복합니다. 
            우리 교회는 하나님의 말씀을 온전히 선포하며, 성령의 충만함 속에서 세상을 향해 사랑과 평강을 흘려보내는 거룩한 소명을 품고 있습니다. 
            매주 선포되는 생명의 말씀과 풍성한 영적 교제를 통해 주님 주시는 평안을 가득 누리시기를 소망합니다.
          </p>
        </div>
      </div>

      <div style={{ marginBottom: '60px' }}>
        <h3 className="font-serif" style={{ fontSize: '1.6rem', color: 'var(--church-navy)', marginBottom: '20px' }}>
          교회 핵심 비전
        </h3>
        <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }} className="vision-grid">
          <li className="church-card" style={{ padding: '24px', textAlign: 'center' }}>
            <span style={{ fontSize: '2rem', display: 'block', marginBottom: '10px' }}>📖</span>
            <strong>말씀의 신앙</strong>
            <p style={{ fontSize: '0.9rem', color: 'var(--church-text-muted)', marginTop: '8px' }}>성경의 진리를 삶의 유일한 지표로 삼고 공부하고 순종합니다.</p>
          </li>
          <li className="church-card" style={{ padding: '24px', textAlign: 'center' }}>
            <span style={{ fontSize: '2rem', display: 'block', marginBottom: '10px' }}>🕊️</span>
            <strong>성령의 교제</strong>
            <p style={{ fontSize: '0.9rem', color: 'var(--church-text-muted)', marginTop: '8px' }}>따뜻한 소통과 은혜의 고백을 나누는 성도의 코이노니아를 이룹니다.</p>
          </li>
          <li className="church-card" style={{ padding: '24px', textAlign: 'center' }}>
            <span style={{ fontSize: '2rem', display: 'block', marginBottom: '10px' }}>🌍</span>
            <strong>세상의 빛</strong>
            <p style={{ fontSize: '0.9rem', color: 'var(--church-text-muted)', marginTop: '8px' }}>지역 사회를 섬기며 복음과 평화를 전파하는 사명을 다합니다.</p>
          </li>
        </ul>
      </div>

      <div>
        <h3 className="font-serif" style={{ fontSize: '1.6rem', color: 'var(--church-navy)', marginBottom: '20px' }}>
          찾아오시는 길
        </h3>
        <div className="church-card" style={{
          height: '350px',
          backgroundColor: 'var(--church-beige)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--church-text-muted)',
          marginBottom: '20px'
        }}>
          지도 영역 (네이버/구글 맵 임베드 예정)
        </div>
        <p><strong>주소</strong>: 서울시 은혜구 평강로 123 (지하철 2호선 은혜역 3번 출구 도보 5분)</p>
      </div>
    </div>
  );
}
