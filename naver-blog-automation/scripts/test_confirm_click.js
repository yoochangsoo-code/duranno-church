const { chromium } = require('playwright');

(async () => {
  try {
    const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
    const pages = browser.contexts()[0].pages();
    const writePages = pages.filter(p => p.url().includes('Write'));
    const page = writePages[writePages.length - 1];
    const frame = page.frame({ name: 'mainFrame' });

    console.log('1. Checking category and selectbox...');
    const catBtn = await frame.$('.selectbox_button__jb1Dt');
    if (catBtn) {
      const catText = await catBtn.innerText();
      console.log('Current category text:', catText);
      if (!catText.includes('여행도 장비빨')) {
        await catBtn.click();
        await page.waitForTimeout(800);
        
        // 카테고리 옵션 찾기
        const options = await frame.$$('.item__sAGX9, .option__x0and, .selectbox_layer__lVnC8 li');
        console.log('Category options found:', options.length);
        for (const opt of options) {
          const txt = await opt.innerText();
          if (txt.includes('여행도 장비빨')) {
            console.log('Found category option:', txt);
            await opt.click();
            await page.waitForTimeout(800);
            break;
          }
        }
      }
    }

    console.log('2. Clicking final confirm button with locator.click()...');
    const confirmLocator = frame.locator('.confirm_btn__WEaBq, [class*="confirm_btn"]').first();
    const count = await confirmLocator.count();
    console.log('Confirm locator count:', count);
    if (count > 0) {
      await confirmLocator.click({ timeout: 5000 });
      console.log('✅ Confirm button clicked via Playwright locator!');
      
      console.log('Waiting 5s to check navigation...');
      await page.waitForTimeout(5000);
      console.log('Current page URL after click:', page.url());
    } else {
      console.log('Confirm button not found');
    }
  } catch (e) {
    console.error('Click error:', e);
  }
})();
