const { chromium } = require('playwright');

async function inspectGmail() {
  try {
    const browser = await chromium.connectOverCDP('http://localhost:9222');
    const context = browser.contexts()[0];
    const page = await context.newPage();
    
    // Compose URL로 이동
    await page.goto('https://mail.google.com/mail/u/0/#inbox?compose=new', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(4000);

    console.log('Opened compose URL. Current URL:', page.url());

    // 1. 받는 사람 요소 찾기
    const toInput = await page.$('input[aria-label*="받는사람"], input[role="combobox"], input.agP');
    console.log('To input found:', !!toInput);

    // 2. 제목 요소 찾기
    const subjectInput = await page.$('input[name="subjectbox"]');
    console.log('Subject input found:', !!subjectInput);

    // 3. 본문 요소 찾기
    const bodyInput = await page.$('div[aria-label*="메시지 본문"], div[role="textbox"][contenteditable="true"]');
    console.log('Body input found:', !!bodyInput);

    // 4. 보내기 버튼 찾기
    const sendBtn = await page.$('div[role="button"][data-tooltip*="보내기"], div[aria-label*="보내기"]');
    console.log('Send button found:', !!sendBtn);

    await page.close();
  } catch (e) {
    console.error('Error:', e.message);
  }
}

inspectGmail();
