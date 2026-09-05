const { chromium } = require('playwright');

(async () => {
  try {
    const browser = await chromium.connectOverCDP('http://localhost:9222');
    const page = browser.contexts()[0].pages()[0];
    const mainFrame = page.frame({ name: 'mainFrame' }) || page;

    // 카테고리 드롭다운 클릭
    await mainFrame.evaluate(() => {
      const catBtn = document.querySelector('.selectbox_button__jb1Dt');
      if (catBtn) catBtn.click();
    });

    await page.waitForTimeout(1000);

    const categories = await mainFrame.evaluate(() => {
      const items = Array.from(document.querySelectorAll('ul, li, [class*="option"], [class*="item"]')).map(el => ({
        tag: el.tagName,
        className: el.className,
        text: el.innerText ? el.innerText.trim() : ''
      }));
      return items.filter(i => i.text.length > 0 && i.text.length < 30);
    });

    console.log('Categories found:', JSON.stringify(categories.slice(0, 20), null, 2));
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
})();
