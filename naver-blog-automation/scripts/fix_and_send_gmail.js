const { chromium } = require('playwright');

async function fixAndSendGmail() {
  try {
    const browser = await chromium.connectOverCDP('http://localhost:9222');
    const context = browser.contexts()[0];
    const page = context.pages().find(p => p.url().includes('mail.google.com'));
    if (!page) {
      console.log('Gmail 페이지를 찾지 못함');
      return;
    }

    // 1. "수신자" 텍스트를 가진 요소 클릭
    console.log('수신자 텍스트 클릭 시도...');
    await page.evaluate(() => {
      // 모든 요소를 뒤져서 textContent가 '수신자'인 요소 클릭
      const all = Array.from(document.querySelectorAll('*'));
      const target = all.find(el => el.children.length === 0 && el.textContent.trim() === '수신자');
      if (target) {
        target.click();
        const parent = target.parentElement;
        if (parent) parent.click();
      }
    });

    await page.waitForTimeout(1000);

    // 2. 키보드로 타이핑
    console.log('이메일 주소 타이핑...');
    await page.keyboard.type('yoochangsoo@gmail.com', { delay: 20 });
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1500);

    // 3. 보내기 버튼 클릭 (파란색 버튼: textContent가 '보내기')
    console.log('보내기 버튼 클릭 시도...');
    const clicked = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('div[role="button"], button'));
      const sendBtn = buttons.find(b => b.textContent && b.textContent.trim().startsWith('보내기'));
      if (sendBtn) {
        sendBtn.click();
        return true;
      }
      return false;
    });

    if (!clicked) {
      await page.keyboard.press('Control+Enter');
    }

    await page.waitForTimeout(4000);
    await page.screenshot({ path: 'gmail_after_send.png' });
    console.log('🎉 처리 완료! 스크린샷: gmail_after_send.png');

    await page.close();
  } catch (e) {
    console.error('에러:', e);
  }
}

fixAndSendGmail();
