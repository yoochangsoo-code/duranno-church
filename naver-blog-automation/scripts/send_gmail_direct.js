const { chromium } = require('playwright');

async function sendGmailDirect() {
  try {
    const browser = await chromium.connectOverCDP('http://localhost:9222');
    const context = browser.contexts()[0];
    const page = context.pages().find(p => p.url().includes('mail.google.com'));
    if (!page) {
      console.log('열려있는 Gmail 페이지를 찾지 못했습니다.');
      return;
    }

    console.log('현재 열려있는 Gmail 페이지 발견:', page.url());

    // 1. 수신자 영역을 클릭하기 위해 "수신자" 라벨 옆의 요소를 찾거나 aria-label="받는사람"을 찾음
    const toInput = await page.$('input.agP, input[role="combobox"], input[aria-label*="받는사람"], input[aria-label*="수신자"]');
    if (toInput) {
      console.log('수신자 input 요소 발견, 클릭 및 입력 중...');
      await toInput.click();
      await toInput.fill('yoochangsoo@gmail.com');
      await page.keyboard.press('Enter');
      console.log('수신자 입력 완료!');
    } else {
      // 텍스트 "수신자" 클릭
      console.log('"수신자" 텍스트 클릭 시도...');
      const recipientLabel = await page.$('span:has-text("수신자"), td:has-text("수신자")');
      if (recipientLabel) {
        await recipientLabel.click();
        await page.keyboard.type('yoochangsoo@gmail.com');
        await page.keyboard.press('Enter');
        console.log('"수신자" 라벨 클릭 후 입력 완료!');
      }
    }

    await page.waitForTimeout(1500);

    // 2. 보내기 버튼 클릭 (파란색 버튼)
    console.log('보내기 버튼 찾는 중...');
    const sendBtn = await page.$('div[role="button"][data-tooltip*="보내기"], div[aria-label*="보내기"], div:has-text("보내기").aoO');
    if (sendBtn) {
      console.log('보내기 버튼 발견! 클릭합니다.');
      await sendBtn.click();
    } else {
      console.log('Ctrl+Enter 단축키로 발송합니다.');
      await page.keyboard.press('Control+Enter');
    }

    await page.waitForTimeout(4000);
    console.log('🎉 Gmail 발송 완료!');

    // 스크린샷 캡처
    await page.screenshot({ path: 'gmail_sent.png' });
    console.log('스크린샷 저장: gmail_sent.png');

    await page.close();
  } catch (err) {
    console.error('에러 발생:', err);
  }
}

sendGmailDirect();
