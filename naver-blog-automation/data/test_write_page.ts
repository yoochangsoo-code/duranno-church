import { chromium } from 'playwright';
import path from 'path';

async function checkWritePage() {
  const dataDir = path.join(process.cwd(), 'data', 'naver_user_data');
  const context = await chromium.launchPersistentContext(dataDir, {
    channel: 'chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await context.newPage();
  console.log('블로그 글쓰기 페이지 진입 시도...');
  await page.goto('https://blog.naver.com/reading-kids?Redirect=Write', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(4000);

  const url = page.url();
  const title = await page.title();
  console.log('현재 URL:', url);
  console.log('페이지 타이틀:', title);

  await page.screenshot({ path: path.join(process.cwd(), 'data', 'write_page_test.png') });
  console.log('스크린샷 저장 완료: data/write_page_test.png');

  // 프레임 목록 확인
  for (const f of page.frames()) {
    console.log('프레임 발견:', f.name(), f.url());
  }

  await context.close();
}

checkWritePage();
