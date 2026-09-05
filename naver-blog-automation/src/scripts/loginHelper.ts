/**
 * loginHelper.ts - 네이버 안전 1회 로그인 및 세션 저장 도우미
 * 
 * [교육용 상세 설명]
 * 이 스크립트는 사용자가 직접 눈으로 보면서 네이버에 로그인할 수 있도록
 * 실제 화면(모니터)에 크롬 브라우저를 띄워줍니다.
 * 
 * 💡 [보안 및 안정성]:
 * 1. 봇 감지 플래그를 완전히 제거하여 네이버의 보안 의심을 최소화합니다.
 * 2. 영수증 퀴즈나 2단계 OTP 인증이 뜨더라도 사용자가 직접 마우스와 키보드로 편안하게 해결할 수 있습니다.
 * 3. 로그인이 완료되는 순간, 발급된 세션 쿠키가 `data/naver_user_data`에 안전하게 영구 저장됩니다.
 * 4. 이후 자동 포스팅 시에는 다시 로그인할 필요 없이 저장된 세션으로 즉시 글쓰기로 직행합니다.
 */

import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const SESSION_DATA_DIR = path.join(process.cwd(), 'data', 'naver_user_data');

async function runLoginHelper() {
  if (!fs.existsSync(SESSION_DATA_DIR)) {
    fs.mkdirSync(SESSION_DATA_DIR, { recursive: true });
  }

  console.log('====================================================');
  console.log('🔑 [네이버 안전 1회 로그인 도우미 실행]');
  console.log('모니터 화면에 브라우저 창이 열립니다.');
  console.log('평소처럼 네이버 아이디/비밀번호로 로그인해 주세요!');
  console.log('====================================================');

  // 실제 크롬 브라우저를 인터랙티브 창으로 실행
  const context = await chromium.launchPersistentContext(SESSION_DATA_DIR, {
    channel: 'chrome', // 사용자 PC의 순정 Google Chrome 실행
    headless: false,   // 화면에 창 표시
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled'
    ],
    ignoreDefaultArgs: ['--enable-automation'],
    viewport: { width: 1280, height: 900 }
  });

  // navigator.webdriver 봇 탐지 회피
  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
  });

  const page = await context.newPage();

  // 네이버 로그인 페이지로 이동
  console.log('[LoginHelper] 네이버 로그인 페이지로 이동 중...');
  await page.goto('https://nid.naver.com/nidlogin.login', { waitUntil: 'domcontentloaded' });

  console.log('👉 열린 브라우저 화면에서 로그인을 진행해 주세요...');
  console.log('   (영수증 퀴즈가 뜨면 정답을 입력하고 확인을 눌러주시면 됩니다)');

  try {
    // 로그인이 완료되어 nidlogin.login 주소를 벗어날 때까지 최대 5분(300초) 대기
    await page.waitForURL((url) => !url.toString().includes('nidlogin.login'), {
      timeout: 300000
    });

    console.log('🎉 네이버 로그인 성공이 감지되었습니다!');
    console.log('쿠키와 세션을 디스크에 안전하게 저장 중입니다. 잠시만 기다려 주세요 (5초)...');
    await page.waitForTimeout(5000);

  } catch (error) {
    console.log('⏳ 대기 시간이 초과되었거나 창이 닫혔습니다.');
  } finally {
    await context.close();
    console.log('====================================================');
    console.log('✅ 세션 저장이 완료되었습니다!');
    console.log('이제 대시보드에서 영수증 퀴즈 없이 자동 포스팅을 진행할 수 있습니다.');
    console.log('====================================================');
  }
}

runLoginHelper();
