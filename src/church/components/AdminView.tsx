import React, { useState } from 'react';
import { syncYouTubeSermons } from '../services/youtubeService';
import { addBulletin } from '../services/dbService';
import { supabase } from '../lib/supabaseClient';
import { sendGroupMessage } from '../services/messageService';
import { Settings, RefreshCw, Upload, Send, Users } from 'lucide-react';

export default function AdminView() {
  const [syncLoading, setSyncLoading] = useState(false);
  const [bulletinTitle, setBulletinTitle] = useState('');
  const [bulletinFileUrl, setBulletinFileUrl] = useState('');
  const [bulletinDate, setBulletinDate] = useState('');
  const [bulletinLoading, setBulletinLoading] = useState(false);

  const [noticeMessage, setNoticeMessage] = useState('');
  const [sendLoading, setSendLoading] = useState(false);
  
  const [feedback, setFeedback] = useState<string | null>(null);

  // 유튜브 API 정보 (실 서버 구동 시 env 활용)
  const ytChannelId = 'UC_x55gR5_5J9N-t_mock_channel';
  const ytApiKey = 'AIzaSy_mock_youtube_api_key_123';
  const cryptoSecret = 'church-encryption-key-shared';

  // 1. 유튜브 설교 연동 트리거
  const handleSyncSermons = async () => {
    setSyncLoading(true);
    setFeedback(null);
    try {
      const res = await syncYouTubeSermons(ytChannelId, ytApiKey, '홍길동 담임목사');
      setFeedback(`유튜브 동기화가 완료되었습니다. (추가된 설교: ${res.addedCount}개)`);
    } catch (err: any) {
      console.error(err);
      setFeedback(`동기화 에러: ${err.message || err}`);
    } finally {
      setSyncLoading(false);
    }
  };

  // 2. 주보 업로드 등록
  const handleAddBulletin = async (e: React.FormEvent) => {
    e.preventDefault();
    setBulletinLoading(true);
    setFeedback(null);

    try {
      await addBulletin({
        title: bulletinTitle,
        file_url: bulletinFileUrl,
        published_at: bulletinDate || new Date().toISOString().split('T')[0],
      });
      setFeedback('새 주보가 정상적으로 등록되었습니다!');
      setBulletinTitle('');
      setBulletinFileUrl('');
      setBulletinDate('');
    } catch (err: any) {
      console.error(err);
      setFeedback(`주보 등록 실패: ${err.message || err}`);
    } finally {
      setBulletinLoading(false);
    }
  };

  // 3. 메시지(문자/알림톡) 전송 자동화 트리거
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendLoading(true);
    setFeedback(null);

    try {
      // 1. 등록 성도 리스트 조회 (연락처를 조회해 서버/메시지 API로 쏘기 위함)
      const { data: users, error } = await supabase
        .from('profiles')
        .select('phone_encrypted')
        .eq('role', 'member');

      if (error) throw error;
      if (!users || users.length === 0) {
        setFeedback('메시지를 보낼 등록 성도(member)가 없습니다.');
        setSendLoading(false);
        return;
      }

      // 2. 메시지 전송 로직 호출 (복호화 및 API 송출 자동화)
      const encryptedPhones = users.map(u => u.phone_encrypted);
      const res = await sendGroupMessage(
        encryptedPhones,
        cryptoSecret,
        '02-123-4567', // 교회 발신 대표 번호
        noticeMessage
      );

      if (res.success) {
        setFeedback(`총 ${res.sentCount}명의 성도님들에게 공지 문자(알림톡) 발송을 요청했습니다! (테스트 성공)`);
        setNoticeMessage('');
      } else {
        setFeedback(`발송 오류: ${res.error}`);
      }
    } catch (err: any) {
      console.error(err);
      setFeedback(`메시지 발송 실패: ${err.message || err}`);
    } finally {
      setSendLoading(false);
    }
  };

  return (
    <div className="church-container" style={{ padding: '60px 20px' }}>
      <h2 className="font-serif" style={{ fontSize: '2.2rem', color: 'var(--church-navy)', marginBottom: '35px', borderBottom: '2px solid var(--church-gold)', paddingBottom: '10px' }}>
        ⛪ 교회 관리자 모드
      </h2>

      {feedback && (
        <div style={{
          padding: '16px',
          backgroundColor: 'hsl(35, 30%, 94%)',
          border: '1px solid var(--church-gold)',
          color: 'var(--church-text-dark)',
          borderRadius: '8px',
          fontWeight: '500',
          marginBottom: '30px'
        }}>
          📢 안내: {feedback}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }} className="admin-grid">
        {/* 유튜브 동기화 카드 */}
        <div className="church-card" style={{ padding: '30px' }}>
          <h4 className="font-serif" style={{ fontSize: '1.25rem', color: 'var(--church-navy)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px' }}>
            <RefreshCw size={20} style={{ color: 'var(--church-gold)' }} /> 유튜브 설교 영상 자동 연동
          </h4>
          <p style={{ color: 'var(--church-text-muted)', fontSize: '0.9rem', lineHeight: '1.5', marginBottom: '25px' }}>
            교회 공식 유튜브 채널에 올려둔 최신 설교 목록을 긁어와 웹사이트 말씀 게시판에 자동으로 업데이트합니다. (매일 백그라운드 자동 연동 외 수동 강제 연동)
          </p>
          <button
            onClick={handleSyncSermons}
            disabled={syncLoading}
            className="church-btn church-btn-primary"
            style={{ width: '100%' }}
          >
            {syncLoading ? '동기화 중...' : '지금 설교 영상 동기화하기'}
          </button>
        </div>

        {/* 주보 등록 카드 */}
        <div className="church-card" style={{ padding: '30px' }}>
          <h4 className="font-serif" style={{ fontSize: '1.25rem', color: 'var(--church-navy)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px' }}>
            <Upload size={20} style={{ color: 'var(--church-gold)' }} /> 새 주보 등록
          </h4>
          <form onSubmit={handleAddBulletin} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input
              type="text"
              placeholder="주보 제목 (예: 2026년 7월 19일 주보)"
              required
              value={bulletinTitle}
              onChange={(e) => setBulletinTitle(e.target.value)}
              className="church-input"
            />
            <input
              type="text"
              placeholder="주보 이미지/PDF 링크 주소"
              required
              value={bulletinFileUrl}
              onChange={(e) => setBulletinFileUrl(e.target.value)}
              className="church-input"
            />
            <input
              type="date"
              placeholder="발행일"
              value={bulletinDate}
              onChange={(e) => setBulletinDate(e.target.value)}
              className="church-input"
            />
            <button
              type="submit"
              disabled={bulletinLoading}
              className="church-btn church-btn-primary"
              style={{ marginTop: '10px' }}
            >
              {bulletinLoading ? '등록 중...' : '새 주보 등록하기'}
            </button>
          </form>
        </div>

        {/* 문자 및 알림톡 발송 카드 */}
        <div className="church-card admin-wide-card" style={{ padding: '30px', gridColumn: 'span 2' }}>
          <h4 className="font-serif" style={{ fontSize: '1.25rem', color: 'var(--church-navy)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px' }}>
            <Send size={20} style={{ color: 'var(--church-gold)' }} /> 교인 단체 공지 발송 (카카오 알림톡/문자)
          </h4>
          <p style={{ color: 'var(--church-text-muted)', fontSize: '0.9rem', marginBottom: '20px' }}>
            중요 공지사항 내용을 적으신 후 발송 버튼을 누르면, 등록된 성도(member 등급)분들의 비상 연락처로 메시지가 자동 전송됩니다.
          </p>
          <form onSubmit={handleSendMessage} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <textarea
              placeholder="전송할 공지 메시지 내용을 적어주세요."
              required
              value={noticeMessage}
              onChange={(e) => setNoticeMessage(e.target.value)}
              style={{
                width: '100%',
                height: '120px',
                padding: '12px 16px',
                borderRadius: '8px',
                border: '1px solid var(--church-beige-dark)',
                fontFamily: 'inherit',
                fontSize: '0.95rem',
                outline: 'none',
                resize: 'none'
              }}
            />
            <button
              type="submit"
              disabled={sendLoading}
              className="church-btn church-btn-gold"
              style={{ alignSelf: 'flex-end', minWidth: '150px' }}
            >
              {sendLoading ? '메시지 발송 중...' : '단체 알림톡/문자 발송'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
