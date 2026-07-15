import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Image as ImageIcon } from 'lucide-react';

interface GalleryItem {
  id: string;
  title: string;
  image_urls: string[];
  created_at: string;
}

export default function GalleryView() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const { data, error } = await supabase
          .from('gallery')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setItems(data || []);
      } catch (err) {
        console.error('갤러리 로드 실패:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="church-container" style={{ padding: '60px 20px' }}>
      <h2 className="font-serif" style={{ fontSize: '2.2rem', color: 'var(--church-navy)', marginBottom: '30px', borderBottom: '2px solid var(--church-gold)', paddingBottom: '10px' }}>
        교회 행사 사진첩
      </h2>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px 0', color: 'var(--church-text-muted)' }}>사진첩 로딩 중...</div>
      ) : items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '50px 0', color: 'var(--church-text-muted)', border: '1px dashed var(--church-beige-dark)', borderRadius: '12px' }}>
          <ImageIcon size={48} style={{ color: 'var(--church-beige-dark)', marginBottom: '15px' }} />
          <p>등록된 사진이 아직 없습니다.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '30px' }} className="gallery-grid">
          {items.map((item) => (
            <div key={item.id} className="church-card" style={{ display: 'flex', flexDirection: 'column' }}>
              <div
                style={{
                  position: 'relative',
                  paddingBottom: '66.6%',
                  backgroundColor: 'var(--church-beige)',
                  backgroundImage: item.image_urls && item.image_urls.length > 0 ? `url(${item.image_urls[0]})` : 'none',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              />
              <div style={{ padding: '20px' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--church-gold)', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>
                  📅 {item.created_at ? item.created_at.split('T')[0] : ''}
                </span>
                <h4 className="font-serif" style={{ fontSize: '1.1rem', color: 'var(--church-navy)', margin: 0 }}>
                  {item.title}
                </h4>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
