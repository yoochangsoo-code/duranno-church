const { chromium } = require('playwright');

(async () => {
  try {
    const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
    const pages = browser.contexts()[0].pages();
    const writePages = pages.filter(p => p.url().includes('Write'));
    const page = writePages[writePages.length - 1];
    const frame = page.frame({ name: 'mainFrame' });

    console.log('1. Closing sidebar if open...');
    const closeBtn = await frame.$('.se-sidebar-close-button');
    if (closeBtn) {
      await closeBtn.click();
      console.log('Sidebar closed via .se-sidebar-close-button');
      await page.waitForTimeout(1000);
    }

    console.log('2. Clicking publish button (.publish_btn__m9KHH)...');
    const pubBtn = await frame.$('.publish_btn__m9KHH');
    if (pubBtn) {
      await pubBtn.click();
      console.log('Publish button clicked');
      await page.waitForTimeout(2000);
    }

    console.log('3. Checking publish layer and confirm button...');
    const confirmBtn = await frame.$('.confirm_btn__WEaBq, [class*="confirm_btn"]');
    console.log('Confirm button found:', !!confirmBtn);
    if (confirmBtn) {
      const isVisible = await confirmBtn.isVisible();
      const text = await confirmBtn.innerText();
      console.log(`Confirm button text: "${text}", isVisible: ${isVisible}`);
    }

    // 카테고리 셀렉트박스 확인
    const catBtn = await frame.$('.selectbox_button__jb1Dt, [class*="selectbox_button"]');
    console.log('Category select button found:', !!catBtn);

    const layerBtns = await frame.$$eval('button', btns => btns.map(b => ({
      text: b.innerText.trim(),
      class: b.className
    })).filter(b => b.text.includes('발행') || b.text.includes('카테고리')));
    console.log('Relevant buttons after publish click:', layerBtns);

  } catch (e) {
    console.error('Test error:', e);
  }
})();
