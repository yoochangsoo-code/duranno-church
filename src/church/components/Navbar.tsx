import React, { useState } from 'react';
import { Menu, X, LogIn, LogOut, User } from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  userRole: string; // 'guest' | 'member' | 'manager' | 'admin' | null
  userEmail: string | null;
  onLogout: () => void;
}

export default function Navbar({
  currentTab,
  setCurrentTab,
  userRole,
  userEmail,
  onLogout,
}: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const menuItems = [
    { id: 'home', label: '홈' },
    { id: 'about', label: '교회소개' },
    { id: 'sermons', label: '예배/설교' },
    { id: 'bulletins', label: '교회주보' },
    { id: 'notices', label: '공지사항' },
    { id: 'gallery', label: '행사갤러리' },
    { id: 'offering', label: '온라인헌금' },
  ];

  // 관리자/부교역자인 경우에만 보이는 관리실 탭 추가
  if (userRole === 'manager' || userRole === 'admin') {
    menuItems.push({ id: 'admin', label: '교회관리실' });
  }

  const handleMenuClick = (tabId: string) => {
    setCurrentTab(tabId);
    setIsMenuOpen(false);
  };

  return (
    <nav className="church-navbar">
      <div className="church-container nav-wrapper">
        <a href="#home" className="logo" onClick={() => handleMenuClick('home')}>
          ⛪ 은혜와평강<span>교회</span>
        </a>

        {/* 데스크톱 메뉴 */}
        <ul className="nav-menu">
          {menuItems.map((item) => (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                className={currentTab === item.id ? 'active' : ''}
                onClick={() => handleMenuClick(item.id)}
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>

        {/* 로그인/계정 요약 영역 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }} className="nav-auth-section">
          {userEmail ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.85rem' }}>
              <span style={{ color: 'hsl(220, 20%, 80%)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <User size={14} style={{ color: 'var(--church-gold)' }} />
                {userEmail.split('@')[0]}님 ({userRole === 'admin' ? '관리자' : userRole === 'manager' ? '교역자' : userRole === 'member' ? '성도' : '대기'})
              </span>
              <button
                onClick={onLogout}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--church-white)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  transition: 'background 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'none'}
              >
                <LogOut size={15} />
                로그아웃
              </button>
            </div>
          ) : (
            <button
              onClick={() => handleMenuClick('auth')}
              style={{
                background: 'var(--church-gold)',
                border: 'none',
                color: 'var(--church-white)',
                padding: '6px 14px',
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontWeight: '500',
                fontSize: '0.88rem',
                transition: 'background 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = 'var(--church-gold-dark)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'var(--church-gold)'}
            >
              <LogIn size={15} />
              교인 로그인
            </button>
          )}
        </div>

        {/* 모바일 햄버거 버튼 */}
        <button
          className="mobile-menu-btn"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="메뉴 토글"
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* 모바일 메뉴 드롭다운 */}
      {isMenuOpen && (
        <div
          style={{
            background: 'var(--church-navy-light)',
            padding: '10px 0',
            borderTop: '1px solid rgba(255,255,255,0.08)'
          }}
        >
          <ul
            style={{
              listStyle: 'none',
              padding: '0',
              margin: '0',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {menuItems.map((item) => (
              <li key={item.id} style={{ width: '100%' }}>
                <a
                  href={`#${item.id}`}
                  style={{
                    display: 'block',
                    padding: '12px 24px',
                    color: currentTab === item.id ? 'var(--church-gold)' : 'hsl(220, 20%, 90%)',
                    textDecoration: 'none',
                    fontWeight: '500'
                  }}
                  onClick={() => handleMenuClick(item.id)}
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </nav>
  );
}
