import React, { useState, useEffect } from 'react';
import { getNotices, Notice } from '../services/dbService';
import { Megaphone, Pin } from 'lucide-react';

export default function NoticeView() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getNotices();
        setNotices(data);
      } catch (err) {
        console.error('공지사항 로드 실패:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="church-container" style={{ padding: '60px 20px' }}>
      <h2 className="font-serif" style={{ fontSize: '2.2rem', color: 'var(--church-navy)', marginBottom: '30px', borderBottom: '2px solid var(--church-gold)', paddingBottom: '10px' }}>
        공지사항
      </h2>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px 0', color: 'var(--church-text-muted)' }}>공지사항을 불러오는 중입니다...</div>
      ) : notices.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '50px 0', color: 'var(--church-text-muted)', border: '1px dashed var(--church-beige-dark)', borderRadius: '12px' }}>
          <Megaphone size={48} style={{ color: 'var(--church-beige-dark)', marginBottom: '15px' }} />
          <p>등록된 공지사항이 아직 없습니다.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {notices.map((notice) => (
            <div
              key={notice.id}
              className="church-card"
              style={{
                padding: '25px',
                borderLeft: notice.is_pinned ? '4px solid var(--church-gold)' : '1px solid rgba(0, 0, 0, 0.05)',
                background: notice.is_pinned ? 'hsl(35, 30%, 98%)' : 'var(--church-white)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {notice.is_pinned && (
                    <span style={{
                      backgroundColor: 'var(--church-gold)',
                      color: '#fff',
                      fontSize: '0.75rem',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontWeight: 'bold',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '3px'
                    }}>
                      <Pin size={10} /> 고정
                    </span>
                  )}
                  <h3 className="font-serif" style={{ fontSize: '1.25rem', color: 'var(--church-navy)', margin: 0 }}>
                    {notice.title}
                  </h3>
                </div>
                <span style={{ fontSize: '0.8rem', color: 'var(--church-text-muted)' }}>
                  {notice.created_at ? notice.created_at.split('T')[0] : ''}
                </span>
              </div>
              <p style={{
                margin: 0,
                lineHeight: '1.6',
                color: 'var(--church-text-dark)',
                whiteSpace: 'pre-wrap',
                fontSize: '0.95rem'
              }}>
                {notice.content}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
