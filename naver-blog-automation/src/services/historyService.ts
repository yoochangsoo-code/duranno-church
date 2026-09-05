/**
 * historyService.ts - 포스팅 이력 관리 및 중복 발행 방지 엔진
 * 
 * [교육용 상세 설명]
 * 이 모듈은 한 번 작성된 주제, 키워드, 도시, 또는 기기명이
 * 다음 자동 포스팅에서 다시 중복으로 작성되는 일이 없도록
 * 영구 히스토리 파일(data/posted_history.json)에 기록하고 필터링합니다.
 * 
 * 💡 [중복 방지 강화]:
 * - 제목뿐 아니라 '도시명(city)'도 함께 기록하여
 *   같은 도시의 다른 스토리 제목으로 중복 방지를 우회하는 것을 원천 차단합니다.
 */

import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const HISTORY_FILE = path.join(DATA_DIR, 'posted_history.json');

export interface PostedItem {
  id: string;
  topic: string;
  title: string;
  category: string;
  city?: string;        // 🌟 도시명 (중복 방지 강화용)
  postedAt: string;
}

function ensureHistoryFile(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(HISTORY_FILE)) {
    // 기존에 발행되었던 글 목록을 초기 히스토리로 등록하여 중복 차단
    const initialHistory: PostedItem[] = [
      {
        id: '1',
        topic: '서안 성벽 벽돌에 새겨진 비밀',
        title: '서안 성벽 벽돌에 새겨진 비밀',
        category: '여행 and 이야기',
        city: '중국 서안',
        postedAt: '2026-09-05T21:01:00'
      },
      {
        id: '2',
        topic: '14km 성벽 벽돌마다 장인의 이름을 새겨 넣었던 서안의 놀라운 비밀',
        title: '14km 성벽 벽돌마다 장인의 이름을 새겨 넣었던 서안의 놀라운 비밀',
        category: '여행 and 이야기',
        city: '중국 서안',
        postedAt: '2026-09-05T18:41:00'
      },
      {
        id: '3',
        topic: '천년의 세월을 품은 교토 골목길',
        title: '천년의 세월을 품은 교토 골목길에서 마주친 뜻밖의 비밀 이야기',
        category: '여행 and 이야기',
        city: '일본 교토',
        postedAt: '2026-09-05T18:19:00'
      }
    ];
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(initialHistory, null, 2), 'utf8');
  }
}

export function getPostedHistory(): PostedItem[] {
  ensureHistoryFile();
  try {
    const raw = fs.readFileSync(HISTORY_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

/**
 * 주어진 이야기 제목/주제가 이미 발행되었는지 검사하는 함수
 * 
 * [교육용 설명]
 * 같은 도시라도 다른 이야기라면 발행 가능합니다.
 * 중복 여부는 '이야기 제목/주제'로만 판단합니다.
 * 예: 로마 판테온 글을 썼더라도, 로마 트레비 분수 글은 새로 쓸 수 있음.
 */
export function isTopicAlreadyPosted(topicOrTitle: string): boolean {
  const history = getPostedHistory();
  const cleanTarget = topicOrTitle.replace(/\s+/g, '').toLowerCase();

  return history.some(item => {
    const cleanItemTopic = item.topic.replace(/\s+/g, '').toLowerCase();
    const cleanItemTitle = item.title.replace(/\s+/g, '').toLowerCase();

    // 1. 이야기 제목/주제 완전 일치 또는 상호 포함 검사
    if (cleanTarget.includes(cleanItemTopic) || cleanItemTopic.includes(cleanTarget)) {
      return true;
    }
    if (cleanTarget.includes(cleanItemTitle) || cleanItemTitle.includes(cleanTarget)) {
      return true;
    }

    // 2. 핵심 고유명사(이야기 소재) 겹침 검사 — 도시명이 아닌 이야기 핵심 키워드
    const storyKeywords = ['서안성벽벽돌', '판테온돔', '카를교성상', '두오모쿠폴라', '가우디미완'];
    for (const kw of storyKeywords) {
      if (cleanTarget.includes(kw) && (cleanItemTopic.includes(kw) || cleanItemTitle.includes(kw))) {
        return true;
      }
    }

    return false;
  });
}

/**
 * 발행 완료된 포스팅을 영구 히스토리에 기록하는 함수
 * 
 * @param topic - 포스팅 주제
 * @param title - 포스팅 제목
 * @param category - 카테고리
 * @param city - 🌟 도시명 (중복 방지 강화: 같은 도시 재발행 차단)
 */
export function recordPostedTopic(topic: string, title: string, category: string, city?: string): void {
  ensureHistoryFile();
  const history = getPostedHistory();
  const newItem: PostedItem = {
    id: Date.now().toString(),
    topic,
    title,
    category,
    city: city || '',
    postedAt: new Date().toISOString()
  };
  history.push(newItem);
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2), 'utf8');
  console.log(`[HistoryService] 🔒 중복 방지 히스토리에 영구 등록 완료: "${topic}" (도시: ${city || '없음'})`);
}
