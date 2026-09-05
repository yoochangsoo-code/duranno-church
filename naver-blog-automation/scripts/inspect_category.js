const { chromium } = require('playwright');

(async () => {
  try {
    const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
    const page = await browser.contexts()[0].newPage();
    await page.goto('https://blog.naver.com/cbsctour?Redirect=Write&', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    const frame = page.frame({ name: 'mainFrame' });
    if (!frame) {
      console.log('mainFrame not found');
      return;
    }

    // 1차 발행 버튼 클릭
    const pubBtn = await frame.$('.publish_btn__m9KHH');
    if (pubBtn) {
      await pubBtn.click();
      await page.waitForTimeout(1500);
    }

    // 카테고리 버튼 클릭
    const catBtn = await frame.$('.selectbox_button__jb1Dt');
    if (catBtn) {
      console.log('Cat button text:', await catBtn.innerText());
      await catBtn.click();
      await page.waitForTimeout(1000);

      // 드롭다운 옵션 전체 출력
      const options = await frame.$$eval('.item__sAGX9, .option__x0and, li, [role="option"]', els => els.map(e => ({
        tag: e.tagName,
        class: e.className,
        text: e.innerText.trim()
      })));
      console.log('Category dropdown elements:', options.filter(o => o.text.length > 0 && o.text.length < 30));
    }
  } catch (e) {
    console.error(e);
  }
})();
