import { chromium } from 'playwright';
import path from 'path';

async function testLock() {
  const dataDir = path.join(process.cwd(), 'data', 'naver_user_data');
  try {
    const context = await chromium.launchPersistentContext(dataDir, {
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const cookies = await context.cookies();
    console.log('TOTAL_COOKIES:', cookies.length);
    const naverCookies = cookies.filter(c => c.domain.includes('naver'));
    console.log('NAVER_COOKIES_COUNT:', naverCookies.length);
    console.log('NAVER_COOKIE_NAMES:', naverCookies.map(c => c.name));
    await context.close();
  } catch (err: any) {
    console.log('STATUS: LOCKED_ERROR', err.message);
  }
}

testLock();
