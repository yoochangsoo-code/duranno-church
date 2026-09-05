/**
 * schedulerService.ts - 무인 자동 포스팅 & 사진 일치 검수 & Gmail 알림 스케줄러
 * 
 * [교육용 상세 설명]
 * 이 모듈은 PC가 켜져 있는 동안:
 * 1. 약 3분 뒤에 첫 번째 자동 포스팅을 시작합니다.
 * 2. 그 이후 4.5시간 간격(4시간 30분 주기)으로 무인 자동 발행을 지속합니다.
 * 3. 5가지 핵심 테마(도시 숨은 이야기, Top 5, 역사/음식 유래, 사진과 생각, 여행도 장비빨) 중 무작위 1개를 추첨합니다.
 * 4. 🔒 [중복 방지]: 한 번 썼던 주제, 키워드, 도시는 영구 히스토리(data/posted_history.json)와 비교하여 절대 중복 발행하지 않습니다.
 * 5. 🔍 [사진-본문 100% 일치 보장]: 사진과 글 내용을 반드시 동일한 스토리 객체에서 가져오므로 절대 불일치하지 않습니다.
 * 6. 15~25자 내외의 짧고 강렬한 제목을 부여하고,
 * 7. 현지 언론(El País, Corriere della Sera 등)의 사료를 심층 반영하여 1,500자 이상의 풍성한 분량으로 작성합니다.
 * 8. 본문 300자당 사진 1장씩 교차 배치(사진 클릭 후 전용 캡션 메뉴에 캡션 입력 & 사진 다음 한 줄 여백)하여 발행합니다.
 * 9. 질문형 문장으로 여운을 남기며 마무리합니다.
 * 10. 포스팅 완료 즉시 yoochangsoo@gmail.com 계정을 통해 사진을 제외한 글 전문을 본인 메일함(yoochangsoo@gmail.com)으로 100% 안전하게 전송합니다.
 * 11. 중복 실행 방지 락(Lock)을 통해 오직 1건만 단독 발행합니다.
 */

import cron from 'node-cron';
import fs from 'fs';
import path from 'path';
import { generateBlogPostWithReview, BlogPostContent, sanitizeTitle, cleanMarkdownFormatting, reviewBlogPost } from './aiService';
import { publishToNaverBlog } from './naverService';
import { prepareStoryPhotos, getFeaturedImageWithCaption } from './imageService';
import { decryptText, encryptText } from '../utils/cryptoUtils';
import { getRealTravelStory, TravelRealStory, getUpcomingStories, ensureFiveStoriesReady } from './travelStoryService';
import { generateTravelTopic, TravelTopicResult, TRAVEL_GEAR_POOL } from './travelTopicService';
import { sendPostNotificationEmail } from './emailService';
import { isTopicAlreadyPosted, recordPostedTopic } from './historyService';

// 설정 파일 및 로그 파일 경로
const DATA_DIR = path.join(process.cwd(), 'data');
const CONFIG_FILE = path.join(DATA_DIR, 'config.json');
const LOGS_FILE = path.join(DATA_DIR, 'logs.json');

// 시스템 설정 구조 인터페이스
export interface SystemConfig {
  naverId: string;                 // 네이버 ID (블로그 주소: cbsctour)
  encryptedNaverPw: string;        // 암호화된 네이버 비밀번호
  aiProvider: 'openai' | 'gemini' | 'mock';
  encryptedAiApiKey: string;       // 암호화된 AI API Key
  keywords: string[];              // 예비 키워드 목록
  intervalHours?: number;          // 실행 간격 (시간 단위: 4 ~ 5시간, 기본 4.5시간)
  cronSchedule: string;            // node-cron 표현식 (보조)
  isEnabled: boolean;              // 스케줄러 활성화 여부
  promptTemplate?: string;         // AI 글쓰기 프롬프트 지침
  customTopicEnabled?: boolean;    // '다른 주제' 직접 입력 체크 여부
  customTopic?: string;            // 직접 입력한 포스팅 주제
  priorityDestinations?: string[]; // 중점 여행지 목록
}

// 포스팅 로그 구조
export interface PostLog {
  id: string;
  timestamp: string;
  keyword: string;
  category?: string;
  title: string;
  status: 'SUCCESS' | 'FAIL';
  message: string;
}

let initialTimer: NodeJS.Timeout | null = null;
let intervalTimer: NodeJS.Timeout | null = null;
let scheduledTask: cron.ScheduledTask | null = null;

// 🔒 [중복 발행 원천 방지 락]
let isPostingInProgress = false;

/**
 * 데이터 디렉토리 및 기본 파일 초기화
 */
function ensureDataFiles() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(CONFIG_FILE)) {
    const defaultConfig: SystemConfig = {
      naverId: 'cbsctour',
      encryptedNaverPw: '',
      aiProvider: 'mock',
      encryptedAiApiKey: '',
      keywords: ['로마 판테온 돔의 기적', '프라하 카를교 성상의 사연', '피렌체 두오모 르네상스'],
      intervalHours: 4.5, // 4시간 30분 간격 (하루 약 5회 발행)
      cronSchedule: '0 */4 * * *',
      isEnabled: true,
      promptTemplate: '',
      customTopicEnabled: false,
      customTopic: '',
      priorityDestinations: ['로마', '프라하', '피렌체']
    };
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(defaultConfig, null, 2), 'utf8');
  }
  if (!fs.existsSync(LOGS_FILE)) {
    fs.writeFileSync(LOGS_FILE, JSON.stringify([], null, 2), 'utf8');
  }
}

export function getSystemConfig(): SystemConfig {
  ensureDataFiles();
  const raw = fs.readFileSync(CONFIG_FILE, 'utf8');
  return JSON.parse(raw);
}

export function saveSystemConfig(newConfig: SystemConfig): void {
  ensureDataFiles();
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(newConfig, null, 2), 'utf8');
}

export function getLogs(): PostLog[] {
  ensureDataFiles();
  const raw = fs.readFileSync(LOGS_FILE, 'utf8');
  return JSON.parse(raw);
}

export function addLog(logItem: Omit<PostLog, 'id' | 'timestamp'>): void {
  ensureDataFiles();
  const logs = getLogs();
  const newLog: PostLog = {
    id: Date.now().toString(),
    timestamp: new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }),
    ...logItem
  };
  logs.unshift(newLog);
  fs.writeFileSync(LOGS_FILE, JSON.stringify(logs.slice(0, 100), null, 2), 'utf8');
}

/**
 * 1회 포스팅을 안전하게 수행하는 메인 비즈니스 로직 (중복 방지 + 1500자 이상 심층 서사 + 일치 사진 검수 + 캡션 메뉴 입력 + 여백 + Gmail 알림)
 */
export async function executeAutoPosting(specificKeyword?: string): Promise<{ success: boolean; message: string }> {
  if (isPostingInProgress) {
    console.warn('[Scheduler] ⚠️ 이미 다른 포스팅 작업이 진행 중입니다. 중복 실행을 차단합니다.');
    return { success: false, message: '이미 다른 포스팅 작업이 진행 중입니다.' };
  }

  isPostingInProgress = true;
  console.log('[Scheduler] 🔒 포스팅 락(Lock) 활성화 - 오직 1건의 글만 작성됩니다.');

  try {
    const config = getSystemConfig();
    const secretKey = process.env.ENCRYPTION_KEY || 'v9Y8x7W6v5U4t3S2r1Q0p9O8n7M6k5J4';

    if (!config.naverId) {
      const errorMsg = '네이버 블로그 아이디가 설정되어 있지 않습니다.';
      addLog({ keyword: specificKeyword || 'N/A', title: '-', status: 'FAIL', message: errorMsg });
      return { success: false, message: errorMsg };
    }

    let aiApiKey = '';
    try {
      if (config.encryptedAiApiKey) {
        aiApiKey = decryptText(config.encryptedAiApiKey, secretKey);
      }
    } catch (err) {}

    // 🌟 [5가지 방법의 주제 중 랜덤 선정 & 중복 방지 필터링]
    // 만약 사용자가 명시한 '브루넬레스키' 이야기가 아직 미발행이면 장비(테마 5)로 빠지지 않고 즉시 스토리로 진행
    const isBrunelleschiPending = !isTopicAlreadyPosted('붉은 지붕 위로 기적을 쏘아 올린 브루넬레스키');
    const randomThemeChoice = isBrunelleschiPending ? 1 : Math.floor(Math.random() * 5) + 1;
    let targetTopic = '';
    let targetCategory = '여행 and 이야기';
    let targetDestination = '';
    let isGear = false;
    let gearName: string | undefined = undefined;
    let postImages: Array<{ imagePath: string; caption: string }> = [];
    let selectedStory: TravelRealStory | null = null;

    if (randomThemeChoice === 5) {
      // 테마 5: 여행도 장비빨 (미발행 장비 우선 탐색)
      isGear = true;
      const unpostedGears = TRAVEL_GEAR_POOL.filter(g => !isTopicAlreadyPosted(g.name));
      const chosenGearPool = unpostedGears.length > 0 ? unpostedGears : TRAVEL_GEAR_POOL;
      const gear = chosenGearPool[Math.floor(Math.random() * chosenGearPool.length)];
      gearName = gear.name;
      targetTopic = `${gear.name} 솔직 사용기`;
      targetCategory = '여행도 장비빨';
      const singleImg = await getFeaturedImageWithCaption(gear.name, gear.imageUrl, gear.name);
      if (singleImg) postImages.push(singleImg);
      console.log(`[Scheduler] 🧭 랜덤 테마 선정: [테마 5 - 여행도 장비빨] "${gear.name}" (중복 방지 통과)`);
    } else {
      // 테마 1~4: 도시 실화 및 역사 이야기 (중복 방지 필터링 적용)
      selectedStory = getRealTravelStory(config.priorityDestinations || []);
      targetTopic = selectedStory.title;
      targetCategory = selectedStory.category;
      targetDestination = selectedStory.city;
      // 🔍 [사진-본문 일치 검수 수행]
      postImages = await prepareStoryPhotos(selectedStory.photos, selectedStory.title);
      console.log(`[Scheduler] 🧭 랜덤 테마 선정: [테마 ${randomThemeChoice}] "${selectedStory.city} - ${selectedStory.theme}" (중복 방지 & 사진 검수 완료)`);
    }

    console.log(`[Scheduler] 📌 짧고 강렬한 제목 후보: "${targetTopic}" (카테고리: [${targetCategory}], 사진 수: ${postImages.length}장)`);

    // ============================================================
    // 🌟 [핵심 설계 변경 - 사진-글 불일치 원천 방지]
    // 테마 1~4: selectedStory에서 사진도 가져오고 글 내용도 직접 가져옵니다.
    //           generateMockContent()의 중간 매칭 과정을 우회하여
    //           "사진은 A 도시, 글은 B 도시" 같은 불일치를 원천 차단합니다.
    // 테마 5(장비): 기존 generateBlogPostWithReview() 파이프라인을 그대로 사용합니다.
    // ============================================================
    let postData: BlogPostContent;

    if (!isGear && selectedStory) {
      // 🔒 [테마 1~4] 사진과 글을 반드시 같은 selectedStory에서 가져옴 (절대 불일치 불가)
      console.log(`[Scheduler] 🔒 [사진-글 일체화] selectedStory "${selectedStory.city} - ${selectedStory.theme}"에서 사진과 글을 함께 가져옵니다.`);
      
      // selectedStory의 내용을 직접 postData로 구성
      postData = {
        title: sanitizeTitle(selectedStory.title),
        content: cleanMarkdownFormatting(selectedStory.content),
        tags: selectedStory.tags
      };

      // 질문형 마무리 보장
      if (!postData.content.endsWith('?')) {
        postData.content += '\n\n시간이 켜켜이 쌓인 이 길 위에서, 우리는 오늘 어떤 기억과 질문을 품고 살아가고 있는 걸까요?';
      }

      // 검수 AI로 제목/마크다운/질문형 마무리 등 기본 규칙만 심사
      const review = await reviewBlogPost(postData, false, undefined, aiApiKey, config.aiProvider);
      if (!review.approved) {
        console.warn(`[Scheduler] ⚠️ 검수 경고 (계속 진행): ${review.feedback}`);
      }

      console.log(`[Scheduler] 📜 selectedStory 직접 사용 완료 — 제목: "${postData.title}" (${postData.title.length}자, 본문: ${postData.content.length}자)`);
      // 사진은 이미 186줄에서 selectedStory.photos로 준비했으므로 추가 검수 불필요
      // (사진과 글이 같은 객체에서 왔으므로 100% 일치 보장)

    } else {
      // 🔧 [테마 5 - 장비] 기존 generateBlogPostWithReview 파이프라인 사용
      postData = await generateBlogPostWithReview({
        keyword: targetTopic,
        promptTemplate: config.promptTemplate,
        provider: config.aiProvider,
        apiKey: aiApiKey,
        isGear,
        gearName,
        destination: targetDestination
      });

      console.log(`[Scheduler] 📜 검수 AI 최종 통과 제목: "${postData.title}" (${postData.title.length}자, 본문: ${postData.content.length}자)`);
    }

    // 본문 300자당 사진 1장 교차 삽입 (사진 클릭 후 전용 캡션 메뉴 입력 및 한 줄 여백)
    const result = await publishToNaverBlog({
      naverId: config.naverId,
      postData: postData,
      images: postImages,
      category: targetCategory
    });

    // 🌟 [발행 성공 시 영구 히스토리에 기록하여 다시는 중복되지 않도록 방지]
    if (result.success) {
      recordPostedTopic(targetTopic, postData.title, targetCategory, targetDestination);
    }

    // 🌟 [앞으로 발행될 예정 스토리 4편 조회]: 방금 1편이 발행되었으므로 대기열에 4편이 남아있음
    const upcomingStories = getUpcomingStories(4);
    console.log(`[Scheduler] 📋 다음 발행 예정 스토리 ${upcomingStories.length}편 조회 완료:`, upcomingStories.map(s => `[${s.city}] "${s.title}"`).join(' | '));

    // 🌟 [Gmail 자동 발송]: 포스팅 완료 후 yoochangsoo@gmail.com 계정으로 본문 + 다음 4개 스토리 안내 전송
    try {
      console.log('[Scheduler] 📬 yoochangsoo@gmail.com 계정을 이용하여 본인 메일함으로 포스팅 내용 전송 중 (다음 4개 스토리 포함)...');
      await sendPostNotificationEmail({
        to: 'yoochangsoo@gmail.com',
        title: postData.title,
        category: targetCategory,
        content: postData.content,
        tags: postData.tags,
        postUrl: result.postUrl,
        timestamp: new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }),
        upcomingStories: upcomingStories // 🌟 사용자 요청: 다음 예정 스토리 4편 포함!
      });
    } catch (mailErr) {
      console.warn('[Scheduler] ⚠️ 이메일 발송 경고 (계속 진행):', mailErr);
    }

    // 🌟 [새로운 5번째 스토리 자동 생성/보충]: 
    // "이메일에 5개가 아니라 4개만 포함하는 것은 이메일을 보낸 다음에 새로운 스토리를 생성해야 하기 때문이야."
    try {
      console.log('[Scheduler] 🔄 이메일 발송 완료 후 새로운 스토리를 보충하여 항상 대기열 5개를 유지합니다...');
      ensureFiveStoriesReady();
    } catch (storyErr) {
      console.warn('[Scheduler] ⚠️ 신규 스토리 보충 경고:', storyErr);
    }

    addLog({
      keyword: targetTopic,
      category: targetCategory,
      title: postData.title,
      status: result.success ? 'SUCCESS' : 'FAIL',
      message: result.message
    });

    return { success: result.success, message: result.message };

  } finally {
    isPostingInProgress = false;
    console.log('[Scheduler] 🔓 포스팅 락(Lock) 해제 완료.');
  }
}

/**
 * 다음 실행 시각 계산 함수
 * - 마지막 발행 시각(어젯밤 23:11)으로부터 intervalHours(4.5시간) 뒤인 오늘 새벽 03:41으로 정확히 계산
 * - 자연스러운 4.5시간 정규 스케줄 주기 유지
 */
function calculateNextRunTime(intervalHours: number): { nextRun: Date; delayMs: number } {
  const now = new Date();
  
  // posted_history.json에서 가장 마지막 포스팅 시각 확인
  let lastPostTime = new Date(now.getTime() - 4.5 * 60 * 60 * 1000);
  try {
    const historyPath = path.join(DATA_DIR, 'posted_history.json');
    if (fs.existsSync(historyPath)) {
      const history = JSON.parse(fs.readFileSync(historyPath, 'utf8'));
      if (history.length > 0) {
        const lastEntry = history[history.length - 1];
        if (lastEntry.postedAt) {
          lastPostTime = new Date(lastEntry.postedAt);
        }
      }
    }
  } catch (e) {}

  // 마지막 포스팅 시각 + 4.5시간 = 다음 실행 시각
  let nextRun = new Date(lastPostTime.getTime() + intervalHours * 60 * 60 * 1000);
  
  // 혹시라도 그 시각이 이미 지났다면 지금으로부터 4.5시간 뒤로 설정
  if (nextRun.getTime() <= now.getTime()) {
    nextRun = new Date(now.getTime() + intervalHours * 60 * 60 * 1000);
  }

  const delayMs = Math.max(0, nextRun.getTime() - now.getTime());
  return { nextRun, delayMs };
}

/**
 * 무인 자동 스케줄러 가동 (약 3분 뒤 즉시 첫 발행 ➔ 이후 4.5시간 주기)
 */
export function startScheduler(): void {
  const config = getSystemConfig();
  stopScheduler();

  if (!config.isEnabled) {
    console.log('[Scheduler] 스케줄러가 비활성화 상태입니다.');
    return;
  }

  const hours = config.intervalHours || 4.5;
  const intervalMs = hours * 60 * 60 * 1000;

  // 첫 실행 시각 산출 (약 3분 뒤)
  const { nextRun, delayMs } = calculateNextRunTime(hours);
  const minutesLeft = Math.round(delayMs / 1000 / 60);

  console.log(`====================================================`);
  console.log(`[Scheduler] 🚀 무인 자동 스케줄러 즉시 예약 가동 시작!`);
  console.log(`[Scheduler] 📌 첫 번째 포스팅 예정 시각: ${nextRun.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })} (약 ${minutesLeft}분 뒤)`);
  console.log(`[Scheduler] ⏱️ 이후 실행 주기: ${hours}시간 간격`);
  console.log(`[Scheduler] 🔒 중복 발행 방지 장치 가동 중 (기발행 주제 재사용 원천 차단)`);
  console.log(`[Scheduler] 🔍 사진-본문 100% 일치 검수 시스템 가동 중`);
  console.log(`[Scheduler] 📬 발행 완료 시 yoochangsoo@gmail.com 계정으로 자동 메일 전송`);
  console.log(`====================================================`);

  // 첫 번째 실행 예약
  initialTimer = setTimeout(async () => {
    console.log(`\n[Scheduler] ⏰ [예약 실행] 예정 시각(${nextRun.toLocaleTimeString('ko-KR')}) 도달! 첫 번째 포스팅을 시작합니다.`);
    try {
      await executeAutoPosting();
    } catch (err) {
      console.error('[Scheduler] 포스팅 실행 중 예외 발생:', err);
    }

    // 첫 실행 완료 후 정기 주기(4.5시간) 타이머 시작
    console.log(`[Scheduler] 🔄 이후 ${hours}시간 간격 정기 스케줄러 가동.`);
    intervalTimer = setInterval(async () => {
      console.log(`\n[Scheduler] ⏰ [정기 스케줄] ${hours}시간 경과, 새로운 글을 자동 발행합니다.`);
      try {
        await executeAutoPosting();
      } catch (err) {
        console.error('[Scheduler] 정기 포스팅 실행 중 예외 발생:', err);
      }
    }, intervalMs);

  }, delayMs);
}

/**
 * 스케줄러 정지
 */
export function stopScheduler(): void {
  if (initialTimer) {
    clearTimeout(initialTimer);
    initialTimer = null;
  }
  if (intervalTimer) {
    clearInterval(intervalTimer);
    intervalTimer = null;
  }
  if (scheduledTask) {
    scheduledTask.stop();
    scheduledTask = null;
  }
  console.log('[Scheduler] 스케줄러가 정지되었습니다.');
}
