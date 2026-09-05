const { chromium } = require('playwright');

(async () => {
  try {
    const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
    const context = browser.contexts()[0];
    const page = await context.newPage();

    console.log('1. 스마트에디터 접속...');
    await page.goto('https://blog.naver.com/cbsctour?Redirect=Write&', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    const frame = page.frame({ name: 'mainFrame' }) || page;

    // 취소 팝업
    try {
      const cancel = await frame.locator('button.se-popup-button-cancel, button:has-text("취소")').first();
      if (await cancel.isVisible()) await cancel.click();
    } catch (e) {}

    console.log('2. 본문 영역 포커스...');
    const body = frame.locator('.se-component-content .se-is-empty, .se-component-content').first();
    if (await body.isVisible()) await body.click();
    await page.waitForTimeout(500);

    console.log('3. 사진 첨부...');
    const photoBtn = frame.locator('.se-image-toolbar-button, button:has-text("사진")').first();
    const [fileChooser] = await Promise.all([
      page.waitForEvent('filechooser', { timeout: 6000 }),
      photoBtn.click()
    ]);
    await fileChooser.setFiles('data/assets/gears/sony_zve10.jpg');
    console.log('사진 업로드 중... 3초 대기');
    await page.waitForTimeout(3500);

    // 사이드바 닫기
    console.log('4. 사이드바 닫기...');
    await frame.evaluate(() => {
      const btn = document.querySelector('.se-sidebar-close-button, button[aria-label="닫기"]');
      if (btn) btn.click();
    });
    await page.waitForTimeout(600);

    console.log('5. 캡션 입력 시도...');
    // DOM을 이용해 캡션 p 요소를 확실하게 클릭
    const captionFound = await frame.evaluate(() => {
      const p = document.querySelector('.se-component.se-image .se-caption p, .se-component.se-image .se-caption');
      if (p) {
        p.scrollIntoView();
        p.click();
        return true;
      }
      return false;
    });

    console.log('Caption found & clicked:', captionFound);

    if (captionFound) {
      await page.waitForTimeout(300);
      const testCaption = '골목길의 고요한 저녁 풍경. (출처: Unsplash)';
      await page.keyboard.type(testCaption, { delay: 15 });
      console.log('캡션 타이핑 완료!');
      await page.waitForTimeout(1000);

      await page.screenshot({ path: 'data/caption_verify.png' });
      console.log('스크린샷 저장 완료: data/caption_verify.png');
    }

  } catch (err) {
    console.error('테스트 에러:', err);
  }
})();
