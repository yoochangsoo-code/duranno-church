import { chromium } from 'playwright';
import { getSystemConfig } from '../services/schedulerService';
import { decryptText } from '../utils/cryptoUtils';

async function testFullLogin() {
  const config = getSystemConfig();
  const pw = decryptText(config.encryptedNaverPw, process.env.ENCRYPTION_KEY || 'v9Y8x7W6v5U4t3S2r1Q0p9O8n7M6k5J4');

  console.log('아이디:', config.naverId);
  console.log('비밀번호 복호화 성공 여부:', pw.length > 0);

  const browser = await chromium.launch({
    headless: true,
    channel: 'chrome',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled'
    ],
    ignoreDefaultArgs: ['--enable-automation']
  });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
    permissions: ['clipboard-read', 'clipboard-write']
  });

  // navigator.webdriver 숨기기 (Stealth)
  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
  });

  const page = await context.newPage();

  console.log('로그인 페이지 접속 중...');
  await page.goto('https://nid.naver.com/nidlogin.login', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  console.log('아이디 클립보드 붙여넣기 (Ctrl+V)...');
  await page.evaluate((text) => navigator.clipboard.writeText(text), config.naverId);
  await page.click('#id');
  await page.waitForTimeout(300);
  await page.keyboard.press('Control+KeyV');

  await page.waitForTimeout(500);

  console.log('비밀번호 클립보드 붙여넣기 (Ctrl+V)...');
  await page.evaluate((text) => navigator.clipboard.writeText(text), pw);
  await page.click('#pw');
  await page.waitForTimeout(300);
  await page.keyboard.press('Control+KeyV');

  await page.waitForTimeout(500);

  console.log('로그인 버튼 클릭...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button')) as HTMLButtonElement[];
    const target = buttons.find(b => b.innerText.trim() === '로그인' && b.offsetParent !== null)
                 || buttons.find(b => b.id.startsWith('loginBtn') && b.offsetParent !== null);
    if (target) {
      target.click();
    }
  });

  console.log('결과 대기 중...');
  await page.waitForTimeout(5000);

  console.log('현재 URL:', page.url());
  await page.screenshot({ path: 'data/login_debug.png' });
  console.log('스크린샷 저장 완료: data/login_debug.png');

  const errorEl = await page.$('.error_message, #err_common, #err_empty_pw, .desc_error');
  if (errorEl) {
    console.log('감지된 에러 메시지:', await errorEl.innerText());
  } else {
    console.log('별도 에러 요소 없음.');
  }

  // 캡차 여부
  const hasCaptcha = await page.$('#captcha, #chptcha, #captcha_img, .captcha_area');
  console.log('캡차(자동입력방지) 감지:', !!hasCaptcha);

  await browser.close();
}

testFullLogin();
