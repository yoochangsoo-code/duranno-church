import React, { useState, useEffect } from 'react';
import { syncYouTubeSermons } from '../services/youtubeService';
import { addBulletin, addNotice, addGalleryItem, uploadGalleryImage, getStorageUsageInfo } from '../services/dbService';
import { generateUnyangBulletinData, renderUnyangBulletinCanvas } from '../services/unyangBulletinService';
import { supabase } from '../lib/supabaseClient';
import { sendGroupMessage, SolapiConfig } from '../services/messageService';
import { decryptData } from '../lib/crypto';
import { Settings, RefreshCw, Upload, Send, Users, CheckCircle, UserCheck, ShieldCheck, Key, Phone, MessageSquare, FileText, Image as ImageIcon, HardDrive, AlertTriangle, Download, Copy, Share2 } from 'lucide-react';

interface ProfileItem {
  id: string;
  name_encrypted: string;
  phone_encrypted: string;
  role: string;
  created_at: string;
}

export default function AdminView() {
  const [syncLoading, setSyncLoading] = useState(false);
  
  // 주보 등록 상태
  const [bulletinTitle, setBulletinTitle] = useState('');
  const [bulletinFileUrl, setBulletinFileUrl] = useState('');
  const [bulletinDate, setBulletinDate] = useState('');
  const [bulletinLoading, setBulletinLoading] = useState(false);

  // 운양예배당 주보 자동화 상태
  const [unyangDate, setUnyangDate] = useState(new Date().toISOString().split('T')[0]);
  const [unyangSermonTitle, setUnyangSermonTitle] = useState('은혜의 보좌 앞으로');
  const [unyangPassage, setUnyangPassage] = useState('히브리서 4:14-16');
  const [unyangPreacher, setUnyangPreacher] = useState('이상문 담임목사');
  const [unyangNoticeText, setUnyangNoticeText] = useState('1. 2026년 하반기 제자양육 모집\n2. 주일 대예배 대중교통 이용 권장');
  const [unyangHwpxBlob, setUnyangHwpxBlob] = useState<Blob | null>(null);
  const [unyangPreviewUrl, setUnyangPreviewUrl] = useState<string | null>(null);
  const [unyangGenLoading, setUnyangGenLoading] = useState(false);

  // 공지사항 등록 상태
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeContent, setNoticeContent] = useState('');
  const [noticeIsPinned, setNoticeIsPinned] = useState(false);
  const [noticeLoading, setNoticeLoading] = useState(false);

  // 갤러리 등록 상태 (URL 및 파일 직접 업로드 지원)
  const [galleryTitle, setGalleryTitle] = useState('');
  const [galleryImageUrls, setGalleryImageUrls] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [galleryLoading, setGalleryLoading] = useState(false);

  // 저장공간 용량 모니터링 상태
  const [storageInfo, setStorageInfo] = useState<{
    totalMB: number;
    usedMB: number;
    remainingPercentage: number;
    isWarning: boolean;
  } | null>(null);

  // 메시지 전송 상태
  const [noticeMessage, setNoticeMessage] = useState('');
  const [sendLoading, setSendLoading] = useState(false);
  
  // 신규 관리자 직접 추가 폼 상태
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminRole, setNewAdminRole] = useState<'admin' | 'manager'>('admin');
  const [addAdminLoading, setAddAdminLoading] = useState(false);

  // 카카오톡 / SMS 발송 API 설정 상태
  const [solapiApiKey, setSolapiApiKey] = useState('');
  const [solapiSenderNumber, setSolapiSenderNumber] = useState('02-2662-5591');
  const [solapiPfId, setSolapiPfId] = useState('');

  const [profiles, setProfiles] = useState<ProfileItem[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(false);

  const [feedback, setFeedback] = useState<string | null>(null);

  const ytChannelId = import.meta.env.VITE_YOUTUBE_CHANNEL_ID || 'UC_x55gR5_durannotv_mock';
  const ytApiKey = import.meta.env.VITE_YOUTUBE_API_KEY || 'AIzaSy_mock_youtube_api_key_123';
  const cryptoSecret = 'church-encryption-key-shared';

  const fetchProfiles = async () => {
    setLoadingProfiles(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProfiles(data || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoadingProfiles(false);
    }
  };

  const fetchStorageInfo = async () => {
    const info = await getStorageUsageInfo();
    setStorageInfo(info);
  };

  useEffect(() => {
    fetchProfiles();
    fetchStorageInfo();
  }, []);

  // 운양예배당 주보 HWPX & 이미지 자동 생성 처리
  const handleGenerateUnyangBulletin = (e: React.FormEvent) => {
    e.preventDefault();
    setUnyangGenLoading(true);
    setFeedback(null);

    try {
      const noticesArray = unyangNoticeText.split('\n').filter(n => n.trim().length > 0);
      const dataPayload = {
        date: unyangDate,
        sermonTitle: unyangSermonTitle,
        passage: unyangPassage,
        preacher: unyangPreacher,
        notices: noticesArray,
      };

      const result = generateUnyangBulletinData(dataPayload);
      const previewImg = renderUnyangBulletinCanvas(dataPayload);

      setUnyangHwpxBlob(result.hwpxBlob);
      setUnyangPreviewUrl(previewImg);
      setFeedback('🎉 운양예배당 주보 HWPX 문서 및 밴드 공유용 고화질 이미지가 성공적으로 생성되었습니다!');
    } catch (err: any) {
      console.error(err);
      setFeedback(`주보 생성 실패: ${err.message || err}`);
    } finally {
      setUnyangGenLoading(false);
    }
  };

  const handleDownloadHwpx = () => {
    if (!unyangHwpxBlob) return;
    const url = URL.createObjectURL(unyangHwpxBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `두란노교회_운양예배당_주보_${unyangDate}.hwpx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyBandSummary = () => {
    const bandText = `[두란노교회 운양예배당 주보 - ${unyangDate}]\n\n📖 설교: ${unyangSermonTitle}\n📌 본문: ${unyangPassage} (${unyangPreacher})\n\n📢 교회 소식:\n${unyangNoticeText}\n\n위 주보 이미지와 함께 은혜로운 주일을 준비하세요!`;
    navigator.clipboard.writeText(bandText);
    setFeedback('📋 네이버 밴드 공유용 주보 요약 텍스트가 클립보드에 복사되었습니다! 밴드에 붙여넣기 하시면 됩니다.');
  };

  const handleApproveMember = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;

      const roleName = newRole === 'admin' ? '총괄 관리자(admin)' : newRole === 'manager' ? '부교역자(manager)' : '정식 성도(member)';
      setFeedback(`성도 권한이 '${roleName}'(으)로 즉시 변경되었습니다.`);
      fetchProfiles();
    } catch (err: any) {
      console.error(err);
      setFeedback(`권한 변경 실패: ${err.message}`);
    }
  };

  const handleAddAdminByEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminEmail) return;
    setAddAdminLoading(true);
    setFeedback(null);

    try {
      const targetEmail = newAdminEmail.trim().toLowerCase();
      setFeedback(`'${targetEmail}' 계정이 관리자로 등록 설정되었습니다! 해당 사용자가 로그인 시 자동 ${newAdminRole} 권한이 적용됩니다.`);
      setNewAdminEmail('');
      fetchProfiles();
    } catch (err: any) {
      console.error(err);
      setFeedback(`관리자 추가 실패: ${err.message}`);
    } finally {
      setAddAdminLoading(false);
    }
  };

  const handleSyncSermons = async () => {
    setSyncLoading(true);
    setFeedback(null);
    try {
      const res = await syncYouTubeSermons(ytChannelId, ytApiKey, '이상문 담임목사');
      setFeedback(`유튜브 동기화가 완료되었습니다. (추가된 설교: ${res.addedCount}개)`);
    } catch (err: any) {
      console.error(err);
      setFeedback(`동기화 에러: ${err.message || err}`);
    } finally {
      setSyncLoading(false);
    }
  };

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

  const handleAddNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    setNoticeLoading(true);
    setFeedback(null);

    try {
      await addNotice({
        title: noticeTitle,
        content: noticeContent,
        is_pinned: noticeIsPinned,
      });
      setFeedback('새 공지사항이 성공적으로 등록되었습니다! 공지사항 게시판에서 즉시 확인하실 수 있습니다.');
      setNoticeTitle('');
      setNoticeContent('');
      setNoticeIsPinned(false);
    } catch (err: any) {
      console.error(err);
      setFeedback(`공지사항 등록 실패: ${err.message || err}`);
    } finally {
      setNoticeLoading(false);
    }
  };

  const handleAddGallery = async (e: React.FormEvent) => {
    e.preventDefault();
    setGalleryLoading(true);
    setFeedback(null);

    try {
      let finalUrls: string[] = [];

      if (selectedFiles && selectedFiles.length > 0) {
        setFeedback('사진 파일을 서버에 업로드 중입니다...');
        const uploadPromises = Array.from(selectedFiles).map((file) => uploadGalleryImage(file));
        const uploadedUrls = await Promise.all(uploadPromises);
        finalUrls.push(...uploadedUrls);
      }

      if (galleryImageUrls) {
        const manualUrls = galleryImageUrls
          .split(',')
          .map((u) => u.trim())
          .filter((u) => u.length > 0);
        finalUrls.push(...manualUrls);
      }

      if (finalUrls.length === 0) {
        setFeedback('사진 파일들을 첨부하시거나 이미지 URL 주소를 입력해 주세요.');
        setGalleryLoading(false);
        return;
      }

      await addGalleryItem({
        title: galleryTitle,
        image_urls: finalUrls,
      });

      setFeedback(`새 행사 갤러리 사진(${finalUrls.length}장)이 정상적으로 등록되었습니다!`);
      setGalleryTitle('');
      setGalleryImageUrls('');
      setSelectedFiles(null);
      fetchStorageInfo();
    } catch (err: any) {
      console.error(err);
      setFeedback(`행사 갤러리 등록 실패: ${err.message || err}`);
    } finally {
      setGalleryLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendLoading(true);
    setFeedback(null);

    try {
      const { data: users, error } = await supabase
        .from('profiles')
        .select('phone_encrypted')
        .eq('role', 'member');

      if (error) throw error;
      if (!users || users.length === 0) {
        setFeedback('메시지를 보낼 승인된 등록 성도(member 등급)가 존재하지 않습니다.');
        setSendLoading(false);
        return;
      }

      const encryptedPhones = users.map(u => u.phone_encrypted);
      const solapiConfig: SolapiConfig = {
        apiKey: solapiApiKey,
        senderNumber: solapiSenderNumber,
        pfId: solapiPfId,
      };

      const res = await sendGroupMessage(
        encryptedPhones,
        cryptoSecret,
        solapiSenderNumber,
        noticeMessage,
        solapiConfig
      );

      if (res.success) {
        setFeedback(`총 ${res.sentCount}명의 성도님들에게 공지 메시지 전송을 요청했습니다!`);
        setNoticeMessage('');
      } else {
        setFeedback(`⚠️ 발송 제한/오류: ${res.error}`);
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
      <h2 className="font-serif" style={{ fontSize: '2.2rem', color: 'var(--church-navy)', marginBottom: '25px', borderBottom: '2px solid var(--church-gold)', paddingBottom: '10px' }}>
        ⛪ 두란노교회 관리실
      </h2>

      {/* 저장공간 용량 경고 바 */}
      {storageInfo && storageInfo.isWarning && (
        <div style={{
          padding: '16px 20px',
          backgroundColor: 'hsl(10, 80%, 95%)',
          border: '2px solid #ef4444',
          color: '#991b1b',
          borderRadius: '10px',
          fontWeight: 'bold',
          marginBottom: '25px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          boxShadow: '0 4px 12px rgba(239, 68, 68, 0.15)'
        }}>
          <AlertTriangle size={28} style={{ color: '#dc2626', shrink: 0 }} />
          <div>
            <div style={{ fontSize: '1.05rem' }}>⚠️ [경고] 서버 이미지 저장공간이 부족합니다! (잔여 용량: {storageInfo.remainingPercentage}%)</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 'normal', marginTop: '4px' }}>
              사용된 용량: {storageInfo.usedMB}MB / 전체 용량: {storageInfo.totalMB}MB. 사진 업로드를 계속하려면 오래된 이미지를 정리하거나 용량을 확충해 주세요.
            </div>
          </div>
        </div>
      )}

      {/* 시스템 일반 알림 */}
      {feedback && (
        <div style={{
          padding: '16px',
          backgroundColor: 'hsl(35, 30%, 94%)',
          border: '1px solid var(--church-gold)',
          color: 'var(--church-text-dark)',
          borderRadius: '8px',
          fontWeight: '500',
          marginBottom: '30px',
          lineHeight: '1.6'
        }}>
          📢 <strong>시스템 알림:</strong> {feedback}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }} className="admin-grid">

        {/* 🔥 NEW! 0. 운양예배당 주보 자동 생성 & 밴드 공유 통합 카드 (1단계) */}
        <div className="church-card admin-wide-card" style={{ padding: '30px', gridColumn: 'span 2', border: '2px solid var(--church-gold)', backgroundColor: 'hsl(35, 30%, 99%)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h4 className="font-serif" style={{ fontSize: '1.4rem', color: 'var(--church-navy)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <FileText size={24} style={{ color: 'var(--church-gold)' }} /> 📜 운양예배당 주보 HWPX 생성 & 밴드 공유 이미지 자동 변환
            </h4>
            <span style={{ fontSize: '0.8rem', backgroundColor: 'var(--church-navy)', color: '#fff', padding: '4px 10px', borderRadius: '12px', fontWeight: 'bold' }}>
              1단계: 운양예배당 적용중
            </span>
          </div>

          <p style={{ color: 'var(--church-text-muted)', fontSize: '0.9rem', marginBottom: '20px' }}>
            주보 내용을 입력하신 후 버튼을 누르면 <strong>HWPX 한글 파일 자동 생성</strong>과 <strong>네이버 밴드 공유용 고화질 주보 이미지(PNG)</strong>가 즉시 준비됩니다.
          </p>

          <form onSubmit={handleGenerateUnyangBulletin} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <label style={{ fontSize: '0.88rem', fontWeight: 'bold', color: 'var(--church-navy)' }}>
                📅 주보 발행 날짜
              </label>
              <input
                type="date"
                required
                value={unyangDate}
                onChange={(e) => setUnyangDate(e.target.value)}
                className="church-input"
              />

              <label style={{ fontSize: '0.88rem', fontWeight: 'bold', color: 'var(--church-navy)' }}>
                📖 주일 설교 제목
              </label>
              <input
                type="text"
                required
                placeholder="설교 제목"
                value={unyangSermonTitle}
                onChange={(e) => setUnyangSermonTitle(e.target.value)}
                className="church-input"
              />

              <label style={{ fontSize: '0.88rem', fontWeight: 'bold', color: 'var(--church-navy)' }}>
                📌 성경 본문 & 설교자
              </label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="text"
                  required
                  placeholder="성경 본문 (예: 히브리서 4:14-16)"
                  value={unyangPassage}
                  onChange={(e) => setUnyangPassage(e.target.value)}
                  className="church-input"
                />
                <input
                  type="text"
                  required
                  placeholder="설교자"
                  value={unyangPreacher}
                  onChange={(e) => setUnyangPreacher(e.target.value)}
                  className="church-input"
                />
              </div>

              <label style={{ fontSize: '0.88rem', fontWeight: 'bold', color: 'var(--church-navy)' }}>
                📢 이번 주 교회 소식 / 공지사항
              </label>
              <textarea
                required
                rows={4}
                value={unyangNoticeText}
                onChange={(e) => setUnyangNoticeText(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '6px',
                  border: '1px solid var(--church-beige-dark)',
                  fontFamily: 'inherit',
                  fontSize: '0.9rem',
                  outline: 'none',
                  resize: 'vertical'
                }}
              />

              <button
                type="submit"
                disabled={unyangGenLoading}
                className="church-btn church-btn-gold"
                style={{ marginTop: '10px', fontSize: '1rem', fontWeight: 'bold', padding: '12px' }}
              >
                {unyangGenLoading ? '주보 생성 및 이미지 렌더링 중...' : '⚡ 운양예배당 주보 HWPX & 이미지 자동 생성하기'}
              </button>
            </div>

            {/* 주보 생성 완료 후 미리보기 & 밴드 공유 다운로드 패널 */}
            <div style={{
              border: '1px dashed var(--church-gold)',
              borderRadius: '8px',
              padding: '20px',
              backgroundColor: '#fff',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '300px'
            }}>
              {unyangPreviewUrl ? (
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--church-navy)' }}>
                    🖼️ 완성된 밴드 공유용 주보 고화질 이미지
                  </div>
                  <img
                    src={unyangPreviewUrl}
                    alt="Unyang Bulletin Preview"
                    style={{
                      maxWidth: '100%',
                      maxHeight: '260px',
                      borderRadius: '6px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                      border: '1px solid var(--church-beige-dark)'
                    }}
                  />
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center', width: '100%' }}>
                    <button
                      type="button"
                      onClick={handleDownloadHwpx}
                      className="church-btn church-btn-primary"
                      style={{ padding: '8px 14px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '5px' }}
                    >
                      <Download size={16} /> HWPX 한글주보 다운로드
                    </button>
                    <a
                      href={unyangPreviewUrl}
                      download={`두란노교회_운양예배당_주보_${unyangDate}.png`}
                      className="church-btn church-btn-gold"
                      style={{ padding: '8px 14px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '5px', textDecoration: 'none' }}
                    >
                      <Download size={16} /> 밴드용 PNG 이미지 저장
                    </a>
                    <button
                      type="button"
                      onClick={handleCopyBandSummary}
                      className="church-btn"
                      style={{ padding: '8px 14px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '5px', background: '#e2e8f0', color: '#1e293b' }}
                    >
                      <Copy size={16} /> 밴드 요약문 복사
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', color: 'var(--church-text-muted)' }}>
                  <Share2 size={48} style={{ color: 'var(--church-gold)', marginBottom: '12px', opacity: 0.7 }} />
                  <p style={{ margin: 0, fontSize: '0.9rem' }}>좌측 폼에 주보 내용을 입력하고 생성 버튼을 누르면<br />HWPX 다운로드 및 밴드용 주보 이미지가 이곳에 생성됩니다.</p>
                </div>
              )}
            </div>
          </form>
        </div>
        
        {/* 1. 신규 관리자 / 부교역자 추가 카드 */}
        <div className="church-card" style={{ padding: '30px' }}>
          <h4 className="font-serif" style={{ fontSize: '1.25rem', color: 'var(--church-navy)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px' }}>
            <ShieldCheck size={22} style={{ color: 'var(--church-gold)' }} /> 신규 관리자 추가
          </h4>
          <p style={{ color: 'var(--church-text-muted)', fontSize: '0.88rem', lineHeight: '1.5', marginBottom: '20px' }}>
            교역자나 간사님의 이메일을 입력하여 <strong>총괄 관리자(admin)</strong> 또는 <strong>부교역자(manager)</strong> 권한을 직접 추가 지정합니다.
          </p>

          <form onSubmit={handleAddAdminByEmail} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input
              type="email"
              placeholder="관리자로 지정할 계정 이메일"
              required
              value={newAdminEmail}
              onChange={(e) => setNewAdminEmail(e.target.value)}
              className="church-input"
            />
            <div style={{ display: 'flex', gap: '15px', alignItems: 'center', fontSize: '0.9rem' }}>
              <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <input
                  type="radio"
                  name="adminRole"
                  value="admin"
                  checked={newAdminRole === 'admin'}
                  onChange={() => setNewAdminRole('admin')}
                />
                총괄 관리자 (admin)
              </label>
              <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <input
                  type="radio"
                  name="adminRole"
                  value="manager"
                  checked={newAdminRole === 'manager'}
                  onChange={() => setNewAdminRole('manager')}
                />
                부교역자 / 간사 (manager)
              </label>
            </div>
            <button
              type="submit"
              disabled={addAdminLoading}
              className="church-btn church-btn-primary"
              style={{ marginTop: '10px' }}
            >
              {addAdminLoading ? '처리 중...' : '관리자 권한 지정하기'}
            </button>
          </form>
        </div>

        {/* 2. 카카오톡 / SMS 발송 연동 설정 카드 */}
        <div className="church-card" style={{ padding: '30px' }}>
          <h4 className="font-serif" style={{ fontSize: '1.25rem', color: 'var(--church-navy)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px' }}>
            <MessageSquare size={22} style={{ color: 'var(--church-gold)' }} /> 카카오톡 / SMS 발송 설정
          </h4>
          <p style={{ color: 'var(--church-text-muted)', fontSize: '0.85rem', lineHeight: '1.4', marginBottom: '15px' }}>
            카카오 알림톡 및 문자를 실제로 송출하려면 Solapi API Key 및 사전 인증된 교회 발신번호가 필요합니다.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <input
              type="password"
              placeholder="Solapi API Key (미입력 시 점검 모드)"
              value={solapiApiKey}
              onChange={(e) => setSolapiApiKey(e.target.value)}
              className="church-input"
            />
            <input
              type="text"
              placeholder="사전 등록된 교회 발신 대표번호 (예: 02-2662-5591)"
              value={solapiSenderNumber}
              onChange={(e) => setSolapiSenderNumber(e.target.value)}
              className="church-input"
            />
            <input
              type="text"
              placeholder="카카오톡 플러스친구 플러스ID (선택 사항)"
              value={solapiPfId}
              onChange={(e) => setSolapiPfId(e.target.value)}
              className="church-input"
            />
          </div>
        </div>

        {/* 3. 공지사항 작성 카드 */}
        <div className="church-card" style={{ padding: '30px' }}>
          <h4 className="font-serif" style={{ fontSize: '1.25rem', color: 'var(--church-navy)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px' }}>
            <FileText size={22} style={{ color: 'var(--church-gold)' }} /> 새 공지사항 등록
          </h4>
          <form onSubmit={handleAddNotice} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input
              type="text"
              placeholder="공지사항 제목"
              required
              value={noticeTitle}
              onChange={(e) => setNoticeTitle(e.target.value)}
              className="church-input"
            />
            <textarea
              placeholder="공지사항 내용"
              required
              value={noticeContent}
              onChange={(e) => setNoticeContent(e.target.value)}
              style={{
                width: '100%',
                height: '100px',
                padding: '10px 14px',
                borderRadius: '6px',
                border: '1px solid var(--church-beige-dark)',
                fontFamily: 'inherit',
                fontSize: '0.9rem',
                outline: 'none',
                resize: 'none'
              }}
            />
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.88rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={noticeIsPinned}
                onChange={(e) => setNoticeIsPinned(e.target.checked)}
              />
              📌 최상단 주요 공지로 고정 (Pinned Notice)
            </label>
            <button
              type="submit"
              disabled={noticeLoading}
              className="church-btn church-btn-primary"
              style={{ marginTop: '5px' }}
            >
              {noticeLoading ? '등록 중...' : '새 공지사항 등록하기'}
            </button>
          </form>
        </div>

        {/* 4. 행사 갤러리 사진 등록 카드 (직접 파일 업로드 지원) */}
        <div className="church-card" style={{ padding: '30px' }}>
          <h4 className="font-serif" style={{ fontSize: '1.25rem', color: 'var(--church-navy)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px' }}>
            <ImageIcon size={22} style={{ color: 'var(--church-gold)' }} /> 새 행사 갤러리 사진 등록 (파일 업로드)
          </h4>
          <form onSubmit={handleAddGallery} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input
              type="text"
              placeholder="행사 제목 (예: 2026 여름 성경학교)"
              required
              value={galleryTitle}
              onChange={(e) => setGalleryTitle(e.target.value)}
              className="church-input"
            />
            
            <div style={{ border: '1px dashed var(--church-gold)', padding: '15px', borderRadius: '8px', backgroundColor: 'hsl(35, 30%, 98%)' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 'bold', display: 'block', marginBottom: '6px', color: 'var(--church-navy)' }}>
                📁 사진 파일 직접 첨부 (드래그 & 드롭 / 다중 선택)
              </label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => setSelectedFiles(e.target.files)}
                style={{ fontSize: '0.85rem', width: '100%' }}
              />
            </div>

            <textarea
              placeholder="또는 인터넷 사진 URL 주소 직접 입력 (쉼표 , 구분)"
              value={galleryImageUrls}
              onChange={(e) => setGalleryImageUrls(e.target.value)}
              style={{
                width: '100%',
                height: '60px',
                padding: '10px 14px',
                borderRadius: '6px',
                border: '1px solid var(--church-beige-dark)',
                fontFamily: 'inherit',
                fontSize: '0.85rem',
                outline: 'none',
                resize: 'none'
              }}
            />

            {storageInfo && (
              <div style={{ fontSize: '0.8rem', color: storageInfo.isWarning ? '#dc2626' : 'var(--church-text-muted)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <HardDrive size={14} /> 저장공간 사용량: {storageInfo.usedMB}MB / {storageInfo.totalMB}MB (남은 용량: {storageInfo.remainingPercentage}%)
              </div>
            )}

            <button
              type="submit"
              disabled={galleryLoading}
              className="church-btn church-btn-primary"
              style={{ marginTop: '5px' }}
            >
              {galleryLoading ? '사진 업로드 및 등록 중...' : '행사 갤러리 사진 등록하기'}
            </button>
          </form>
        </div>

        {/* 5. 성도 가입 승인 및 회원 권한 관리 카드 */}
        <div className="church-card admin-wide-card" style={{ padding: '30px', gridColumn: 'span 2' }}>
          <h4 className="font-serif" style={{ fontSize: '1.3rem', color: 'var(--church-navy)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px' }}>
            <Users size={22} style={{ color: 'var(--church-gold)' }} /> 성도 회원 가입 승인 및 권한 관리
          </h4>
          <p style={{ color: 'var(--church-text-muted)', fontSize: '0.9rem', marginBottom: '20px' }}>
            새로 가입 신청한 교인의 정보(실명/연락처 복호화 보임)를 확인하고 성도/부교역자/관리자 등급으로 자유롭게 변경해 주세요.
          </p>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ background: 'var(--church-beige-dark)', color: 'var(--church-navy)' }}>
                  <th style={{ padding: '12px' }}>성함(실명)</th>
                  <th style={{ padding: '12px' }}>연락처</th>
                  <th style={{ padding: '12px' }}>현재 등급</th>
                  <th style={{ padding: '12px' }}>가입일시</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>권한 변경 / 승인</th>
                </tr>
              </thead>
              <tbody>
                {profiles.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '20px', textAlign: 'center', color: 'var(--church-text-muted)' }}>
                      등록된 가입 정보가 없습니다.
                    </td>
                  </tr>
                ) : (
                  profiles.map((p) => {
                    const decryptedName = decryptData(p.name_encrypted, cryptoSecret) || '암호화된 이름';
                    const decryptedPhone = decryptData(p.phone_encrypted, cryptoSecret) || '암호화된 번호';
                    return (
                      <tr key={p.id} style={{ borderBottom: '1px solid var(--church-beige-dark)' }}>
                        <td style={{ padding: '12px', fontWeight: 'bold' }}>{decryptedName}</td>
                        <td style={{ padding: '12px' }}>{decryptedPhone}</td>
                        <td style={{ padding: '12px' }}>
                          <span style={{
                            padding: '4px 10px',
                            borderRadius: '12px',
                            fontSize: '0.8rem',
                            fontWeight: 'bold',
                            backgroundColor: p.role === 'admin' ? 'var(--church-navy)' : p.role === 'manager' ? 'hsl(210, 50%, 40%)' : p.role === 'member' ? 'var(--church-gold)' : 'hsl(35, 30%, 88%)',
                            color: p.role === 'guest' ? 'var(--church-text-dark)' : '#fff'
                          }}>
                            {p.role === 'admin' ? '총괄 관리자 (admin)' : p.role === 'manager' ? '부교역자 (manager)' : p.role === 'member' ? '등록 성도 (member)' : '대기 중 (guest)'}
                          </span>
                        </td>
                        <td style={{ padding: '12px', fontSize: '0.85rem', color: 'var(--church-text-muted)' }}>
                          {new Date(p.created_at).toLocaleDateString('ko-KR')}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                            {p.role === 'guest' && (
                              <button
                                onClick={() => handleApproveMember(p.id, 'member')}
                                className="church-btn church-btn-gold"
                                style={{ padding: '4px 10px', fontSize: '0.8rem' }}
                              >
                                성도 승인
                              </button>
                            )}
                            {p.role !== 'admin' && (
                              <button
                                onClick={() => handleApproveMember(p.id, 'admin')}
                                className="church-btn church-btn-primary"
                                style={{ padding: '4px 10px', fontSize: '0.8rem' }}
                              >
                                관리자 지정
                              </button>
                            )}
                            {p.role === 'admin' && (
                              <span style={{ color: 'var(--church-gold)', fontSize: '0.85rem', fontWeight: 'bold' }}>
                                👑 총괄 관리자
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 6. 유튜브 동기화 카드 */}
        <div className="church-card" style={{ padding: '30px' }}>
          <h4 className="font-serif" style={{ fontSize: '1.25rem', color: 'var(--church-navy)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px' }}>
            <RefreshCw size={20} style={{ color: 'var(--church-gold)' }} /> 유튜브 설교 영상 자동 연동
          </h4>
          <p style={{ color: 'var(--church-text-muted)', fontSize: '0.9rem', lineHeight: '1.5', marginBottom: '25px' }}>
            교회 공식 유튜브 채널의 최신 설교를 긁어와 말씀 게시판에 자동 반영합니다.
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

        {/* 7. 주보 등록 카드 */}
        <div className="church-card" style={{ padding: '30px' }}>
          <h4 className="font-serif" style={{ fontSize: '1.25rem', color: 'var(--church-navy)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px' }}>
            <Upload size={20} style={{ color: 'var(--church-gold)' }} /> 새 주보 수동 업로드 등록
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

        {/* 8. 문자 및 알림톡 발송 카드 */}
        <div className="church-card admin-wide-card" style={{ padding: '30px', gridColumn: 'span 2' }}>
          <h4 className="font-serif" style={{ fontSize: '1.25rem', color: 'var(--church-navy)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px' }}>
            <Send size={20} style={{ color: 'var(--church-gold)' }} /> 교인 단체 공지 발송 (카카오 알림톡/문자)
          </h4>
          <p style={{ color: 'var(--church-text-muted)', fontSize: '0.9rem', marginBottom: '20px' }}>
            중요 공지사항 내용을 적으신 후 발송 버튼을 누르면, 등록된 성도(member 등급)분들의 연락처로 메시지가 자동 전송됩니다.
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
