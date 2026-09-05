const { chromium } = require('playwright');

(async () => {
  try {
    const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
    const pages = browser.contexts()[0].pages();
    const writePages = pages.filter(p => p.url().includes('Write'));
    const page = writePages[writePages.length - 1] || pages[0];
    console.log('Target Page URL:', page.url());

    const info = await page.evaluate(() => {
      const pubBtn = document.querySelector('.publish_btn__m9KHH, [class*="publish_btn"]');
      const confirmBtn = document.querySelector('.confirm_btn__WEaBq, [class*="confirm_btn"]');
      const allBtns = Array.from(document.querySelectorAll('button')).map(b => ({
        text: b.innerText.trim(),
        className: b.className
      }));
      return {
        pubBtn: pubBtn ? { text: pubBtn.innerText, class: pubBtn.className } : null,
        confirmBtn: confirmBtn ? { text: confirmBtn.innerText, class: confirmBtn.className, visible: confirmBtn.offsetParent !== null } : null,
        relevantBtns: allBtns.filter(b => b.text.includes('발행') || b.text.includes('카테고리') || b.text.includes('등록') || b.text.includes('닫기'))
      };
    });
    console.log('DOM Info:', JSON.stringify(info, null, 2));

    await page.screenshot({ path: 'data/current_write_page.png' });
    console.log('Screenshot saved to data/current_write_page.png');
  } catch (e) {
    console.error('Error:', e);
  }
})();
