import React, { useState } from 'react';

export default function AboutView() {
  const [activeTab, setActiveTab] = useState<'vision' | 'worship' | 'staff'>('vision');
  const [worshipBranch, setWorshipBranch] = useState<'unyang' | 'banghwa'>('unyang'); // 기본 운양예배당(김포)
  const [pastorModal, setPastorModal] = useState<'word' | 'details' | null>(null);

  // 방화예배당 교역자 명단
  const banghwaStaff = [
    { name: '임동훈 목사', role: '방화예배당 총괄 / 장년 교구 담당', emoji: '⛪' },
    { name: '김재용 목사', role: '청년교회 담당', emoji: '🔥' },
    { name: '이옥자 전도사', role: '심방 및 장년 교구', emoji: '🙏' },
  ];

  // 운양예배당 교역자 명단
  const unyangStaff = [
    { name: '남기호 목사', role: '운양예배당 총괄 / 장년 및 청소년 담당', emoji: '⛪' },
    { name: '안기표 전도사', role: '교회학교 (유년/초등/소년부) 담당', emoji: '🎒' },
    { name: '김혜정 전도사', role: '교회학교 (영아/유치부) 담당', emoji: '👶' },
  ];

  return (
    <div className="church-container" style={{ padding: '60px 20px', maxWidth: '1000px' }}>
      <h2 className="font-serif" style={{ fontSize: '2.2rem', color: 'var(--church-navy)', marginBottom: '30px', borderBottom: '2px solid var(--church-gold)', paddingBottom: '10px' }}>
        두란노교회 안내
      </h2>

      {/* 대분류 탭 메뉴 */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '40px', borderBottom: '1px solid var(--church-beige-dark)', paddingBottom: '10px' }}>
        {(['vision', 'worship', 'staff'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '12px 24px',
              fontSize: '1rem',
              fontWeight: 'bold',
              fontFamily: 'var(--font-serif)',
              borderRadius: '8px 8px 0 0',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s',
              backgroundColor: activeTab === tab ? 'var(--church-navy)' : 'transparent',
              color: activeTab === tab ? 'var(--church-white)' : 'var(--church-text-muted)'
            }}
          >
            {tab === 'vision' ? '교회소개 & 인사말' : tab === 'worship' ? '예배안내 & 오시는길' : '섬기는 사람들'}
          </button>
        ))}
      </div>

      {/* 탭 1: 교회소개 및 인사말 */}
      {activeTab === 'vision' && (
        <div>
          <div style={{ display: 'flex', gap: '40px', alignItems: 'flex-start', marginBottom: '60px' }} className="about-intro">
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
                        <div style="font-size: 0.85rem; color: var(--church-text-muted); margin-top: 5px;">두란노교회 담임목사</div>
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
              <p style={{ lineHeight: 1.8, color: 'var(--church-text-dark)', marginBottom: '20px' }}>
                우리 두란노교회 홈페이지를 방문해 주신 여러분을 진심으로 환영하고 축복합니다.
                우리 교회는 오직 예수 그리스도의 십자가 복음과 사랑 위에 세워진 건강하고 은혜가 풍성한 신앙 공동체입니다. 
                매주 선포되는 생명의 말씀과 아름다운 사랑의 교제를 통해 하나님이 주시는 참된 평강과 회복을 누리시길 소망합니다.
              </p>
              <div style={{ padding: '15px', background: 'var(--church-beige)', borderRadius: '8px', borderLeft: '4px solid var(--church-gold)' }}>
                <span style={{ fontWeight: 'bold', color: 'var(--church-navy)' }}>📖 담임목사 소개 자료 상세 보기</span><br />
                <span style={{ fontSize: '0.9rem', color: 'var(--church-text-muted)', display: 'block', marginTop: '5px' }}>
                  교역자가 직접 올린 공식 인사말 및 세부 약력 이미지를 아래 버튼으로 즉시 확인하실 수 있습니다.<br />
                  <button onClick={() => setPastorModal('word')} style={{ background: 'none', border: 'none', color: 'var(--church-gold)', textDecoration: 'underline', cursor: 'pointer', padding: 0, fontWeight: 'bold' }}>[담임목사 인사말 보기]</button> | 
                  <button onClick={() => setPastorModal('details')} style={{ background: 'none', border: 'none', color: 'var(--church-gold)', textDecoration: 'underline', cursor: 'pointer', padding: 0, marginLeft: '8px', fontWeight: 'bold' }}>[담임목사 약력 보기]</button>
                </span>
              </div>
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
        </div>
      )}

      {/* 탭 2: 예배안내 및 오시는길 (이원화 성전) */}
      {activeTab === 'worship' && (
        <div>
          {/* 성전 선택 서브 탭 */}
          <div style={{ display: 'flex', gap: '15px', marginBottom: '30px', justifyContent: 'center' }}>
            <button
              onClick={() => setWorshipBranch('banghwa')}
              style={{
                padding: '10px 20px',
                borderRadius: '20px',
                border: '1px solid var(--church-gold)',
                cursor: 'pointer',
                fontWeight: 'bold',
                backgroundColor: worshipBranch === 'banghwa' ? 'var(--church-gold)' : 'transparent',
                color: worshipBranch === 'banghwa' ? 'var(--church-white)' : 'var(--church-navy)'
              }}
            >
              서울 방화예배당
            </button>
            <button
              onClick={() => setWorshipBranch('unyang')}
              style={{
                padding: '10px 20px',
                borderRadius: '20px',
                border: '1px solid var(--church-gold)',
                cursor: 'pointer',
                fontWeight: 'bold',
                backgroundColor: worshipBranch === 'unyang' ? 'var(--church-gold)' : 'transparent',
                color: worshipBranch === 'unyang' ? 'var(--church-white)' : 'var(--church-navy)'
              }}
            >
              김포 운양예배당
            </button>
          </div>

          <div style={{ marginBottom: '40px' }}>
            <h3 className="font-serif" style={{ fontSize: '1.4rem', color: 'var(--church-navy)', marginBottom: '15px' }}>
              {worshipBranch === 'banghwa' ? '방화예배당 예배 시간표' : '운양예배당 예배 시간표'}
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
                  {worshipBranch === 'banghwa' ? (
                    <>
                      <tr style={{ borderBottom: '1px solid var(--church-beige-dark)' }}>
                        <td style={{ padding: '12px', fontWeight: 'bold' }}>주일 1부 예배</td>
                        <td style={{ padding: '12px' }}>오전 6시 30분</td>
                        <td style={{ padding: '12px' }}>대예배실</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid var(--church-beige-dark)' }}>
                        <td style={{ padding: '12px', fontWeight: 'bold' }}>주일 2부 예배</td>
                        <td style={{ padding: '12px' }}>오전 8시 30분</td>
                        <td style={{ padding: '12px' }}>대예배실</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid var(--church-beige-dark)' }}>
                        <td style={{ padding: '12px', fontWeight: 'bold' }}>주일 3부 예배</td>
                        <td style={{ padding: '12px' }}>오전 10시 30분</td>
                        <td style={{ padding: '12px' }}>대예배실</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid var(--church-beige-dark)' }}>
                        <td style={{ padding: '12px', fontWeight: 'bold' }}>주일 4부 (젊은세대) 예배</td>
                        <td style={{ padding: '12px' }}>오후 1시 30분</td>
                        <td style={{ padding: '12px' }}>대예배실</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid var(--church-beige-dark)' }}>
                        <td style={{ padding: '12px', fontWeight: 'bold' }}>주일 저녁 예배</td>
                        <td style={{ padding: '12px' }}>오후 8시 00분</td>
                        <td style={{ padding: '12px' }}>대예배실</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid var(--church-beige-dark)' }}>
                        <td style={{ padding: '12px', fontWeight: 'bold' }}>수요 어머니기도회 (1부)</td>
                        <td style={{ padding: '12px' }}>수요일 오전 11시 00분</td>
                        <td style={{ padding: '12px' }}>대예배실</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid var(--church-beige-dark)' }}>
                        <td style={{ padding: '12px', fontWeight: 'bold' }}>수요 저녁 예배 (2부)</td>
                        <td style={{ padding: '12px' }}>수요일 오후 8시 00분</td>
                        <td style={{ padding: '12px' }}>대예배실</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid var(--church-beige-dark)' }}>
                        <td style={{ padding: '12px', fontWeight: 'bold' }}>목요 초교파 기도회</td>
                        <td style={{ padding: '12px' }}>목요일 오후 8시 00분</td>
                        <td style={{ padding: '12px' }}>대예배실</td>
                      </tr>
                      <tr style={{ borderBottom: '2px solid var(--church-gold)' }}>
                        <td style={{ padding: '12px', fontWeight: 'bold' }}>새벽 기도회 (1~2부)</td>
                        <td style={{ padding: '12px' }}>월~토 1부 오전 5:00 / 2부 오전 6:30</td>
                        <td style={{ padding: '12px' }}>소예배실</td>
                      </tr>
                    </>
                  ) : (
                    <>
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
                        <td style={{ padding: '12px', fontWeight: 'bold' }}>주일 4부 (젊은세대) 예배</td>
                        <td style={{ padding: '12px' }}>오후 2시 30분</td>
                        <td style={{ padding: '12px' }}>대예배실</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid var(--church-beige-dark)' }}>
                        <td style={{ padding: '12px', fontWeight: 'bold' }}>주일 저녁 예배</td>
                        <td style={{ padding: '12px' }}>오후 8시 00분</td>
                        <td style={{ padding: '12px' }}>대예배실</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid var(--church-beige-dark)' }}>
                        <td style={{ padding: '12px', fontWeight: 'bold' }}>수요 어머니기도회 (1부)</td>
                        <td style={{ padding: '12px' }}>수요일 오전 11시 00분</td>
                        <td style={{ padding: '12px' }}>대예배실</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid var(--church-beige-dark)' }}>
                        <td style={{ padding: '12px', fontWeight: 'bold' }}>수요 저녁 예배 (2부)</td>
                        <td style={{ padding: '12px' }}>수요일 오후 8시 00분</td>
                        <td style={{ padding: '12px' }}>대예배실</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid var(--church-beige-dark)' }}>
                        <td style={{ padding: '12px', fontWeight: 'bold' }}>목요 초교파 기도회</td>
                        <td style={{ padding: '12px' }}>목요일 오후 8시 00분</td>
                        <td style={{ padding: '12px' }}>대예배실</td>
                      </tr>
                      <tr style={{ borderBottom: '2px solid var(--church-gold)' }}>
                        <td style={{ padding: '12px', fontWeight: 'bold' }}>새벽 기도회 (1~2부)</td>
                        <td style={{ padding: '12px' }}>월~토 1부 오전 5:00 / 2부 오전 6:00</td>
                        <td style={{ padding: '12px' }}>소예배실</td>
                      </tr>
                    </>
                  )}
                  {/* 교육부서 (공통) */}
                  <tr style={{ backgroundColor: 'var(--church-beige-light)' }}>
                    <td colSpan={3} style={{ padding: '12px', fontWeight: 'bold', color: 'var(--church-gold)', fontSize: '0.95rem' }}>
                      🎓 다음세대 교육부서 예배 안내 (공통)
                    </td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--church-beige-dark)' }}>
                    <td style={{ padding: '12px', paddingLeft: '20px' }}>영아부 / 유치부</td>
                    <td style={{ padding: '12px' }}>주일 오전 11시 30분</td>
                    <td style={{ padding: '12px' }}>교육관 3층</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--church-beige-dark)' }}>
                    <td style={{ padding: '12px', paddingLeft: '20px' }}>유년부 / 초등부 / 소년부</td>
                    <td style={{ padding: '12px' }}>주일 오전 11시 30분</td>
                    <td style={{ padding: '12px' }}>교육관 지하 1층</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--church-beige-dark)' }}>
                    <td style={{ padding: '12px', paddingLeft: '20px' }}>청소년부</td>
                    <td style={{ padding: '12px' }}>주일 오후 1시 30분</td>
                    <td style={{ padding: '12px' }}>교육관 1층</td>
                  </tr>
                  <tr style={{ borderBottom: '2px solid var(--church-gold)' }}>
                    <td style={{ padding: '12px', paddingLeft: '20px' }}>청년부</td>
                    <td style={{ padding: '12px' }}>주일 오후 2시 30분</td>
                    <td style={{ padding: '12px' }}>교육관 2층</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h3 className="font-serif" style={{ fontSize: '1.4rem', color: 'var(--church-navy)', marginBottom: '15px' }}>
              찾아오시는 길 ({worshipBranch === 'banghwa' ? '서울 방화예배당' : '김포 운양예배당'})
            </h3>
            <div className="church-card" style={{
              height: '350px',
              backgroundColor: 'var(--church-beige-light)',
              backgroundImage: 'radial-gradient(circle at 50% 50%, var(--church-beige) 10%, transparent 60%)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--church-text-muted)',
              marginBottom: '20px',
              border: '1px dashed var(--church-gold)',
              position: 'relative'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '10px' }}>📍</div>
              <div style={{ fontWeight: 'bold', color: 'var(--church-navy)', fontSize: '1.1rem' }}>
                {worshipBranch === 'banghwa' ? '두란노교회 방화예배당' : '두란노교회 운양예배당'}
              </div>
              <div style={{ fontSize: '0.88rem', marginTop: '5px', color: 'var(--church-text-muted)' }}>
                {worshipBranch === 'banghwa' ? '서울 강서구 금낭화로 52' : '경기도 김포시 김포한강4로 123'}
              </div>
              
              {/* 실시간 지도 길찾기 단추 그룹 */}
              <div style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
                <a 
                  href={worshipBranch === 'banghwa' 
                    ? 'https://map.naver.com/v5/search/%EC%85%94%EC%9A%B8%20%EA%B0%95%EC%84%9C%EA%B5%AC%20%EA%B8%88%EB%82%AD%ED%99%94%EB%A1%9C%2052' 
                    : 'https://map.naver.com/v5/search/%EA%B2%BD%EA%B8%B0%EB%8F%84%20%EA%B9%80%ED%8F%AC%EC%8B%9C%20%EA%B9%80%ED%8F%AC%ED%95%9C%EA%B0%954%EB%A1%9C%20123'}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="church-btn church-btn-primary"
                  style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '0.88rem', padding: '8px 16px' }}
                >
                  🧭 네이버 지도 길찾기
                </a>
                <a 
                  href={worshipBranch === 'banghwa' 
                    ? 'https://map.kakao.com/?q=%EC%85%94%EC%9A%B8%20%EA%B0%95%EC%84%9C%EA%B5%AC%20%EA%B8%88%EB%82%AD%ED%99%94%EB%A1%9C%2052' 
                    : 'https://map.kakao.com/?q=%EA%B2%BD%EA%B8%B0%EB%8F%84%20%EA%B9%80%ED%8F%AC%EC%8B%9C%20%EA%B9%80%ED%8F%AC%ED%95%9C%EA%B0%954%EB%A1%9C%20123'}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="church-btn"
                  style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '5px', border: '1px solid var(--church-gold)', color: 'var(--church-navy)', fontSize: '0.88rem', padding: '8px 16px' }}
                >
                  🗺️ 카카오맵 길찾기
                </a>
              </div>
            </div>
            {worshipBranch === 'banghwa' ? (
              <p style={{ lineHeight: '1.6' }}>
                📍 <strong>도로명 주소</strong>: 서울특별시 강서구 금낭화로 52 1~4층 두란노교회<br />
                📞 <strong>행정실 연락처</strong>: 02-2662-5591 | 요양센터: 02-2663-7004
              </p>
            ) : (
              <p style={{ lineHeight: '1.6' }}>
                📍 <strong>도로명 주소</strong>: 경기도 김포시 김포한강4로 123 (두란노교회)<br />
                📞 <strong>행정실 연락처</strong>: 031-987-6543
              </p>
            )}
          </div>
        </div>
      )}

      {/* 탭 3: 섬기는 사람들 */}
      {activeTab === 'staff' && (
        <div>
          <h3 className="font-serif" style={{ fontSize: '1.6rem', color: 'var(--church-navy)', marginBottom: '25px' }}>
            두란노교회를 섬기는 분들
          </h3>
          
          <div style={{ marginBottom: '40px' }}>
            <h4 className="font-serif" style={{ fontSize: '1.3rem', color: 'var(--church-gold)', borderBottom: '1px solid var(--church-gold)', paddingBottom: '6px', marginBottom: '15px' }}>
              서울 방화예배당 교역자
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
              {banghwaStaff.map((staff, idx) => (
                <div key={idx} className="church-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <div style={{ fontSize: '2rem' }}>{staff.emoji}</div>
                  <div>
                    <h5 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--church-navy)' }}>{staff.name}</h5>
                    <p style={{ margin: '4px 0 0 0', fontSize: '0.88rem', color: 'var(--church-text-muted)' }}>{staff.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-serif" style={{ fontSize: '1.3rem', color: 'var(--church-gold)', borderBottom: '1px solid var(--church-gold)', paddingBottom: '6px', marginBottom: '15px' }}>
              김포 운양예배당 교역자
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
              {unyangStaff.map((staff, idx) => (
                <div key={idx} className="church-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <div style={{ fontSize: '2rem' }}>{staff.emoji}</div>
                  <div>
                    <h5 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--church-navy)' }}>{staff.name}</h5>
                    <p style={{ margin: '4px 0 0 0', fontSize: '0.88rem', color: 'var(--church-text-muted)' }}>{staff.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 담임목사 소개 이미지 팝업 모달 */}
      {pastorModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }} onClick={() => setPastorModal(null)}>
          <div style={{
            backgroundColor: 'var(--church-white)',
            borderRadius: '12px',
            padding: '20px',
            maxWidth: '650px',
            maxHeight: '90vh',
            overflowY: 'auto',
            position: 'relative',
            boxShadow: 'var(--church-shadow-lg)'
          }} onClick={(e) => e.stopPropagation()}>
            <button 
              onClick={() => setPastorModal(null)}
              style={{
                position: 'absolute',
                top: '15px',
                right: '15px',
                border: 'none',
                background: 'var(--church-navy)',
                color: '#fff',
                borderRadius: '50%',
                width: '30px',
                height: '30px',
                cursor: 'pointer',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10
              }}
            >
              ✕
            </button>
            <h4 className="font-serif" style={{ fontSize: '1.2rem', color: 'var(--church-navy)', marginBottom: '15px', borderBottom: '1px solid var(--church-beige-dark)', paddingBottom: '10px' }}>
              {pastorModal === 'word' ? '이상문 담임목사 인사말' : '이상문 담임목사 약력 소개'}
            </h4>
            <img 
              src={pastorModal === 'word' ? '/ministerWord.jpg' : '/pastor-details.jpg'}
              alt="담임목사 소개 상세"
              style={{ width: '100%', height: 'auto', borderRadius: '8px' }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
