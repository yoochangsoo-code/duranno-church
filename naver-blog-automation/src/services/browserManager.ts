/**
 * browserManager.ts - 상시 구동 브라우저 창 관리자
 * 
 * [교육용 상세 설명]
 * 이 모듈은 사용자가 직접 로그인한 상태를 그대로 유지할 수 있도록
 * 모니터 화면에 브라우저(크롬) 창을 띄우고, 포스팅이 끝나도 절대로 창을 닫지 않고 유지합니다.
 * 
 * 💡 [작동 원리]:
 * 1. 브라우저 창을 1개만 열어서 메모리에 보관합니다 (싱글톤 패턴).
 * 2. 사용자가 이 창에서 네이버에 직접 로그인해 둡니다.
 * 3. 포스팅 시스템은 이 열려 있는 창의 페이지(`page`)를 그대로 가져와 글을 작성합니다.
 * 4. 포스팅이 끝나도 창을 닫지 않으므로 로그인이 영구히 유지됩니다.
 */

import { chromium, BrowserContext, Page } from 'playwright';
import path from 'path';
import fs from 'fs';

// 세션 저장 디렉터리
const SESSION_DATA_DIR = path.join(process.cwd(), 'data', 'naver_user_data');

let activeContext: BrowserContext | null = null;
let activePage: Page | null = null;

/**
 * 모니터에 보이는 브라우저 창이 열려 있도록 보장하는 함수
 */
export async function ensureBrowserOpen(blogId: string = 'reading-kids'): Promise<Page> {
  // 이미 열려 있고 닫히지 않은 유효한 페이지가 있다면 재사용
  if (activeContext && activePage && !activePage.isClosed()) {
    try {
      await activePage.bringToFront();
      return activePage;
    } catch (e) {
      console.log('[BrowserManager] 기존 페이지 접근 실패, 새로 초기화합니다.');
    }
  }

  if (!fs.existsSync(SESSION_DATA_DIR)) {
    fs.mkdirSync(SESSION_DATA_DIR, { recursive: true });
  }

  console.log('[BrowserManager] 모니터 화면에 브라우저 창을 시작합니다...');

  // 사용자 화면에 실제 크롬 브라우저를 띄웁니다.
  activeContext = await chromium.launchPersistentContext(SESSION_DATA_DIR, {
    channel: 'chrome', // 사용자 PC의 Google Chrome 실행
    headless: false,   // 반드시 화면에 창을 표시
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled'
    ],
    ignoreDefaultArgs: ['--enable-automation'],
    viewport: { width: 1280, height: 900 }
  });

  // navigator.webdriver 숨기기
  await activeContext.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
  });

  const pages = activeContext.pages();
  activePage = pages.length > 0 ? pages[0] : await activeContext.newPage();

  // 창을 맨 앞으로 활성화
  await activePage.bringToFront();

  // 사용자가 바로 확인할 수 있도록 선생님의 블로그 주소로 이동
  const targetBlogUrl = `https://blog.naver.com/${blogId}`;
  console.log(`[BrowserManager] 블로그 페이지로 이동: ${targetBlogUrl}`);
  await activePage.goto(targetBlogUrl, { waitUntil: 'domcontentloaded' });

  return activePage;
}

/**
 * 현재 열려 있는 브라우저 페이지를 가져오는 함수 (없으면 새로 열기)
 */
export async function getActivePage(blogId: string = 'reading-kids'): Promise<Page> {
  return await ensureBrowserOpen(blogId);
}

/**
 * 필요한 경우에만 브라우저를 수동으로 닫는 함수
 */
export async function closeBrowser(): Promise<void> {
  if (activeContext) {
    console.log('[BrowserManager] 브라우저 창을 닫습니다.');
    await activeContext.close();
    activeContext = null;
    activePage = null;
  }
}
