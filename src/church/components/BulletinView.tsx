import React, { useState, useEffect } from 'react';
import { getBulletins, Bulletin } from '../services/dbService';
import { FileText, Download } from 'lucide-react';

interface BulletinViewProps {
  userRole: string; // guest, member, manager, admin
}

export default function BulletinView({ userRole }: BulletinViewProps) {
  const [bulletins, setBulletins] = useState<Bulletin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 성도(member) 이상만 주보 열람 가능
  const hasAccess = userRole === 'member' || userRole === 'manager' || userRole === 'admin';

  useEffect(() => {
    if (!hasAccess) {
      setLoading(false);
      return;
    }

    async function loadData() {
      try {
        const data = await getBulletins();
        setBulletins(data);
      } catch (err) {
        console.error('주보 로드 실패:', err);
        setError('주보 목록을 가져오는 도중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [hasAccess]);

  if (!hasAccess) {
    return (
      <div className="church-container" style={{ padding: '80px 20px', textAlign: 'center' }}>
        <div className="church-card" style={{ maxWidth: '500px', margin: '0 auto', padding: '40px 30px' }}>
          <span style={{ fontSize: '3rem', display: 'block', marginBottom: '15px' }}>🔒</span>
          <h3 className="font-serif" style={{ fontSize: '1.4rem', color: 'var(--church-navy)', marginBottom: '15px' }}>
            성도 전용 메뉴입니다
          </h3>
          <p style={{ color: 'var(--church-text-muted)', lineHeight: '1.6', marginBottom: '25px' }}>
            주보는 등록 성도 이상의 회원등급을 지닌 분들만 열람하실 수 있습니다. 로그인 후 가입 승인 상태를 확인해 주세요.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="church-container" style={{ padding: '60px 20px' }}>
      <h2 className="font-serif" style={{ fontSize: '2.2rem', color: 'var(--church-navy)', marginBottom: '30px', borderBottom: '2px solid var(--church-gold)', paddingBottom: '10px' }}>
        교회 주보
      </h2>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px 0', color: 'var(--church-text-muted)' }}>주보 목록을 불러오는 중입니다...</div>
      ) : error ? (
        <div style={{ textAlign: 'center', padding: '50px 0', color: 'red' }}>{error}</div>
      ) : bulletins.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '50px 0', color: 'var(--church-text-muted)', border: '1px dashed var(--church-beige-dark)', borderRadius: '12px' }}>
          <FileText size={48} style={{ color: 'var(--church-beige-dark)', marginBottom: '15px' }} />
          <p>등록된 주보가 없습니다.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '25px' }} className="bulletins-grid">
          {bulletins.map((bulletin) => (
            <div key={bulletin.id} className="church-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '45px',
                  height: '45px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--church-beige)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--church-navy)'
                }}>
                  <FileText size={22} />
                </div>
                <div>
                  <h4 className="font-serif" style={{ fontSize: '1.1rem', color: 'var(--church-navy)', margin: '0 0 4px 0' }}>
                    {bulletin.title}
                  </h4>
                  <span style={{ fontSize: '0.8rem', color: 'var(--church-text-muted)' }}>
                    발행일: {bulletin.published_at}
                  </span>
                </div>
              </div>
              
              <a
                href={bulletin.file_url}
                target="_blank"
                rel="noreferrer"
                className="church-btn church-btn-primary"
                style={{ width: '100%', gap: '8px', fontSize: '0.88rem' }}
              >
                <Download size={14} />주보 다운로드 / 보기
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
