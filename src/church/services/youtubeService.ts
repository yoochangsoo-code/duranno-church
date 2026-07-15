import { supabase } from '../lib/supabaseClient';
import { addSermon, Sermon } from './dbService';

/**
 * YouTube API를 통해 교회의 최신 동영상 목록을 가져옵니다.
 * @param channelId 유튜브 채널 ID
 * @param apiKey Google API Key
 */
export async function fetchLatestVideosFromYouTube(
  channelId: string,
  apiKey: string
): Promise<any[]> {
  if (!channelId || !apiKey) {
    console.warn('유튜브 API 키 또는 채널 ID가 누락되었습니다.');
    return [];
  }

  // 최신 동영상 조회를 위한 YouTube API 요청 URL (최대 10개 조회)
  const url = `https://www.googleapis.com/youtube/v3/search?key=${apiKey}&channelId=${channelId}&part=snippet,id&order=date&maxResults=10&type=video`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      const errData = await response.json();
      throw new Error(`YouTube API 호출 실패: ${JSON.stringify(errData)}`);
    }

    const result = await response.json();
    return result.items || [];
  } catch (error) {
    console.error('YouTube API 가져오기 오류:', error);
    throw error;
  }
}

/**
 * 유튜브의 최신 비디오들을 가져와 이미 DB에 저장된 영상과 비교한 뒤,
 * 새 영상을 자동으로 'sermons' 테이블에 동기화(적재)합니다.
 * 
 * @param channelId 유튜브 채널 ID
 * @param apiKey Google API Key
 * @param preacher 기본 설교자 이름 (예: 'OOO 담임목사')
 */
export async function syncYouTubeSermons(
  channelId: string,
  apiKey: string,
  preacher: string = '담임목사'
): Promise<{ addedCount: number; errors: string[] }> {
  const errors: string[] = [];
  let addedCount = 0;

  try {
    // 1. 유튜브 최신 영상 조회
    const ytVideos = await fetchLatestVideosFromYouTube(channelId, apiKey);
    if (ytVideos.length === 0) {
      return { addedCount: 0, errors: ['유튜브에서 가져온 영상이 없습니다.'] };
    }

    // 2. DB에 이미 등록된 설교들의 youtube_video_id 목록 조회
    const { data: existingSermons, error: dbError } = await supabase
      .from('sermons')
      .select('youtube_video_id');

    if (dbError) {
      throw dbError;
    }

    const existingIds = new Set((existingSermons || []).map((s) => s.youtube_video_id));

    // 3. 중복되지 않은 신규 영상만 필터링하여 DB 적재
    for (const item of ytVideos) {
      const videoId = item.id?.videoId;
      const title = item.snippet?.title;
      const publishedAt = item.snippet?.publishedAt; // 형식: '2026-07-15T08:00:00Z'

      if (!videoId || !title) continue;

      // 이미 DB에 존재하는 비디오면 스킵
      if (existingIds.has(videoId)) {
        continue;
      }

      // 날짜 포맷팅 (YYYY-MM-DD)
      const preachedDate = publishedAt ? publishedAt.split('T')[0] : new Date().toISOString().split('T')[0];

      // 제목에서 본문 정보(예: [창세기 1:1-5]) 파싱 시도 (단순 정규식 활용)
      const passageRegex = /\[([^\]]+)\]/;
      const match = title.match(passageRegex);
      const passage = match ? match[1] : '';

      const newSermon: Sermon = {
        title: title,
        youtube_video_id: videoId,
        preacher: preacher,
        passage: passage || '본문 성경 구절',
        preached_at: preachedDate,
      };

      try {
        await addSermon(newSermon);
        addedCount++;
      } catch (insertError: any) {
        console.error(`설교 동기화 실패 (${title}):`, insertError);
        errors.push(`${title}: ${insertError.message || insertError}`);
      }
    }
  } catch (error: any) {
    console.error('동기화 프로세스 전체 실패:', error);
    errors.push(`전체 오류: ${error.message || error}`);
  }

  return { addedCount, errors };
}
