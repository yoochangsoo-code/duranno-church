import React, { useState, useEffect } from 'react';
import { getSermons, Sermon } from '../services/dbService';
import { Play, Youtube } from 'lucide-react';

export default function SermonView() {
  const [sermons, setSermons] = useState<Sermon[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeVideo, setActiveVideo] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getSermons();
        setSermons(data);
      } catch (err) {
        console.error('설교 로드 실패:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="church-container" style={{ padding: '60px 20px' }}>
      <h2 className="font-serif" style={{ fontSize: '2.2rem', color: 'var(--church-navy)', marginBottom: '30px', borderBottom: '2px solid var(--church-gold)', paddingBottom: '10px' }}>
        예배 및 설교 영상
      </h2>

      {activeVideo && (
        <div className="church-card" style={{ marginBottom: '40px', padding: '15px', background: '#000' }}>
          <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}>
            <iframe
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
              src={`https://www.youtube.com/embed/${activeVideo}?autoplay=1`}
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
          <div style={{ padding: '15px 10px 0 10px', color: '#fff', display: 'flex', justify: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: '600' }}>현재 재생 중인 설교</span>
            <button
              onClick={() => setActiveVideo(null)}
              style={{ background: 'var(--church-gold)', border: 'none', color: '#fff', padding: '6px 14px', borderRadius: '4px', cursor: 'pointer' }}
            >
              닫기
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px 0', color: 'var(--church-text-muted)' }}>설교 영상 목록을 로딩 중입니다...</div>
      ) : sermons.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '50px 0', color: 'var(--church-text-muted)', border: '1px dashed var(--church-beige-dark)', borderRadius: '12px' }}>
          <Youtube size={48} style={{ color: 'var(--church-beige-dark)', marginBottom: '15px' }} />
          <p>등록된 설교 동영상이 아직 없습니다.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '30px' }} className="sermons-grid">
          {sermons.map((sermon) => (
            <div key={sermon.id} className="church-card" style={{ display: 'flex', flexDirection: 'column' }}>
              <div
                style={{
                  position: 'relative',
                  paddingBottom: '56.25%',
                  backgroundColor: '#000',
                  backgroundImage: `url(https://img.youtube.com/vi/${sermon.youtube_video_id}/0.jpg)`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  cursor: 'pointer'
                }}
                onClick={() => setActiveVideo(sermon.youtube_video_id)}
              >
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(0,0,0,0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.15)'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.35)'}
                >
                  <div style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--church-gold)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
                  }}>
                    <Play size={20} fill="#fff" style={{ marginLeft: '4px' }} />
                  </div>
                </div>
              </div>
              <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--church-gold)', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>
                    📅 {sermon.preached_at} | 🎙️ {sermon.preacher}
                  </span>
                  <h4 className="font-serif" style={{ fontSize: '1.15rem', color: 'var(--church-navy)', margin: '0 0 10px 0', lineHeight: '1.4' }}>
                    {sermon.title}
                  </h4>
                </div>
                {sermon.passage && (
                  <p style={{ margin: '10px 0 0 0', fontSize: '0.88rem', color: 'var(--church-text-muted)', background: 'var(--church-beige)', padding: '6px 12px', borderRadius: '4px' }}>
                    📖 본문: {sermon.passage}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
