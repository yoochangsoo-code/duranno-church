/**
 * debugEditor.ts - 네이버 블로그 글쓰기 페이지 구조 진단 스크립트
 */

import { chromium } from 'playwright';
import path from 'path';

const SESSION_DATA_DIR = path.join(process.cwd(), 'data', 'naver_user_data');

async function debugEditor() {
  const context = await chromium.launchPersistentContext(SESSION_DATA_DIR, {
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await context.newPage();
  console.log('글쓰기 페이지 이동 중...');
  await page.goto('https://blog.naver.com/purunsol_readers?Redirect=Write', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(5000);

  console.log('현재 URL:', page.url());
  console.log('프레임 개수:', page.frames().length);
  page.frames().forEach((f, idx) => {
    console.log(`프레임 [${idx}]: name="${f.name()}", url="${f.url()}"`);
  });

  // mainFrame 찾기
  let frame = page.frame({ name: 'mainFrame' });
  if (!frame) {
    console.log('mainFrame frame() 검색 실패. frameLocator 또는 모든 프레임 탐색:');
    for (const f of page.frames()) {
      const hasEditor = await f.$('.se-component-content, .se-documentTitle, .se_title');
      if (hasEditor) {
        console.log(`=> 프레임 "${f.name()}" (${f.url()}) 에서 에디터 요소 발견!`);
        frame = f;
        break;
      }
    }
  }

  if (frame) {
    console.log('발견된 에디터 프레임:', frame.url());
    const titleEl = await frame.$('.se-documentTitle, .se_title, .se-title-text, textarea');
    console.log('제목 요소 발견 여부:', !!titleEl);
  } else {
    console.log('탑레벨 페이지에서 에디터 탐색...');
    const topTitle = await page.$('.se-documentTitle, .se_title, textarea');
    console.log('탑레벨 제목 요소:', !!topTitle);
  }

  await page.waitForTimeout(5000);
  await context.close();
}

debugEditor();
