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
            <p style={{ marginTop: '15px' }}>
              담임목사: 이상문 | 부목사: 남기호 | 주소: 서울시 은혜구 평강로 123
            </p>
            <p>이메일: contact@duranno.or.kr | 대표번호: 02-123-4567</p>
          </div>
          
          <div>
            <h4>예배 안내</h4>
            <p><strong>주일 대예배</strong>: 오전 11:00 (대예배실)</p>
            <p><strong>주일 오후예배</strong>: 오후 2:00 (소예배실)</p>
            <p><strong>수요 기도회</strong>: 수요일 오후 7:30 (대예배실)</p>
            <p><strong>금요 철야기도회</strong>: 금요일 오후 9:00 (대예배실)</p>
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
