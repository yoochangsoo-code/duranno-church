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
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 'var(--church-shadow-sm)'
        }}>
          <img
            src="/pastor.jpg"
            alt="담임목사 프로필"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              const parent = e.currentTarget.parentElement;
              if (parent) {
                parent.innerHTML = `
                  <div style="text-align: center; color: var(--church-navy); padding: 20px;">
                    <div style="font-size: 3rem; margin-bottom: 10px;">📖</div>
                    <div style="font-weight: bold; font-family: var(--font-serif)">이상문 목사</div>
                  </div>
                `;
              }
            }}
          />
        </div>
        <div>
          <h3 className="font-serif" style={{ fontSize: '1.6rem', color: 'var(--church-navy)', marginBottom: '15px' }}>
            환영합니다! 담임목사 이상문입니다.
          </h3>
          <p style={{ lineHeight: 1.8, color: 'var(--church-text-dark)' }}>
            우리 두란노교회 홈페이지를 방문해 주신 여러분을 진심으로 환영하고 축복합니다. 
            우리 교회는 하나님의 말씀을 온전히 선포하며, 성령의 충만함 속에서 세상을 향해 사랑과 평강을 흘려보내는 거룩한 소명을 품고 있습니다. 
            매주 선포되는 생명의 말씀과 풍성한 영적 교제를 통해 주님 주시는 평안을 가득 누리시기를 소망합니다.
          </p>
          <p style={{ marginTop: '15px', fontSize: '0.9rem', color: 'var(--church-gold)', fontWeight: 'bold' }}>
            교역자 소개: 담임목사 이상문 | 부목사 남기호
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

      <div style={{ marginBottom: '60px' }}>
        <h3 className="font-serif" style={{ fontSize: '1.6rem', color: 'var(--church-navy)', marginBottom: '20px' }}>
          예배 안내 및 시간표
        </h3>
        <div className="church-card" style={{ padding: '25px', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '500px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--church-gold)', color: 'var(--church-navy)', fontWeight: 'bold' }}>
                <th style={{ padding: '12px' }}>예배/모임명</th>
                <th style={{ padding: '12px' }}>시간</th>
                <th style={{ padding: '12px' }}>장소</th>
              </tr>
            </thead>
            <tbody style={{ color: 'var(--church-text-dark)', lineHeight: '1.6' }}>
              <tr style={{ borderBottom: '1px solid var(--church-beige-dark)' }}>
                <td style={{ padding: '12px', fontWeight: 'bold' }}>주일 1부 예배</td>
                <td style={{ padding: '12px' }}>오전 7시 30분</td>
                <td style={{ padding: '12px' }}>대예배실</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--church-beige-dark)' }}>
                <td style={{ padding: '12px', fontWeight: 'bold' }}>주일 2부 예배</td>
                <td style={{ padding: '12px' }}>오전 9시 30분</td>
                <td style={{ padding: '12px' }}>대예배실</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--church-beige-dark)' }}>
                <td style={{ padding: '12px', fontWeight: 'bold' }}>주일 3부 예배 (대예배)</td>
                <td style={{ padding: '12px' }}>오전 11시 30분</td>
                <td style={{ padding: '12px' }}>대예배실</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--church-beige-dark)' }}>
                <td style={{ padding: '12px', fontWeight: 'bold' }}>주일 4부 (청년) 예배</td>
                <td style={{ padding: '12px' }}>오후 2시 00분</td>
                <td style={{ padding: '12px' }}>대예배실</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--church-beige-dark)' }}>
                <td style={{ padding: '12px', fontWeight: 'bold' }}>오후 찬양 예배</td>
                <td style={{ padding: '12px' }}>오후 3시 30분</td>
                <td style={{ padding: '12px' }}>대예배실</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--church-beige-dark)' }}>
                <td style={{ padding: '12px', fontWeight: 'bold' }}>수요 기도회</td>
                <td style={{ padding: '12px' }}>매주 수요일 오후 7시 30분</td>
                <td style={{ padding: '12px' }}>대예배실</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--church-beige-dark)' }}>
                <td style={{ padding: '12px', fontWeight: 'bold' }}>금요 성령 집회</td>
                <td style={{ padding: '12px' }}>매주 금요일 오후 8시 30분</td>
                <td style={{ padding: '12px' }}>대예배실</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--church-beige-dark)' }}>
                <td style={{ padding: '12px', fontWeight: 'bold' }}>새벽 기도회</td>
                <td style={{ padding: '12px' }}>월~금 오전 5시 00분 / 토 오전 6시 00분</td>
                <td style={{ padding: '12px' }}>소예배실</td>
              </tr>
              <tr style={{ borderBottom: '2px solid var(--church-gold)' }}>
                <td style={{ padding: '12px', fontWeight: 'bold' }}>교회학교 (부서별)</td>
                <td style={{ padding: '12px' }}>
                  • 영유아유치부: 주일 오전 11:30<br/>
                  • 유초등부: 주일 오전 11:30<br/>
                  • 청소년부: 주일 오전 9:30
                </td>
                <td style={{ padding: '12px' }}>
                  • 교육관 1층<br/>
                  • 교육관 2층<br/>
                  • 교육관 3층
                </td>
              </tr>
            </tbody>
          </table>
        </div>
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
        <p><strong>주소</strong>: 경기도 김포시 김포한강4로 123 (두란노교회) | <strong>대표전화</strong>: 031-987-6543</p>
      </div>
    </div>
  );
}
