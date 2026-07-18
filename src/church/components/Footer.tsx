import React from 'react';

export default function Footer() {
  return (
    <footer className="church-footer">
      <div className="church-container">
        <div className="footer-grid">
          <div>
            <h4 className="font-serif" style={{ fontSize: '1.25rem', letterSpacing: '-0.5px' }}>
              ⛪ 두란노교회
            </h4>
            <p>우리는 오직 성경, 오직 은혜, 오직 믿음으로 하나님께 영광을 돌리는 신앙 공동체입니다.</p>
            <div style={{ marginTop: '15px', fontSize: '0.88rem', lineHeight: '1.6' }}>
              <strong>방화예배당 (서울)</strong>: 서울 강서구 금낭화로 52 | 📞 02-2662-5591<br />
              <strong>운양예배당 (김포)</strong>: 경기 김포시 김포한강4로 123 | 📞 031-987-6543<br />
              담임목사: 이상문 | 이메일: info@duranno.org
            </div>
          </div>
          <div>
            <h4>예배 안내</h4>
            <p><strong>주일 3부 대예배</strong>: 오전 11:30 (대예배실)</p>
            <p><strong>주일 4부 청년예배</strong>: 오후 2:00 (대예배실)</p>
            <p><strong>수요 기도회</strong>: 수요일 오후 7:30 (대예배실)</p>
            <p><strong>금요 성령 집회</strong>: 금요일 오후 8:30 (대예배실)</p>
          </div>
          <div>
            <h4>주요 링크</h4>
            <ul style={{ listStyle: 'none', padding: '0', margin: '0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li><a href="#about">교회 소개</a></li>
              <li><a href="#sermons">설교 영상</a></li>
              <li><a href="#bulletins">이번 주 주보</a></li>
              <li><a href="#offering">온라인 헌금</a></li>
            </ul>
          </div>
        </div>

        <div className="copyright">
          <p>© 2026 두란노교회. All Rights Reserved. Powered by Antigravity AI.</p>
        </div>
      </div>
    </footer>
  );
}
