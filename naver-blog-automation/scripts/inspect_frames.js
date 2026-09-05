const { chromium } = require('playwright');

(async () => {
  try {
    const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
    const pages = browser.contexts()[0].pages();
    const writePages = pages.filter(p => p.url().includes('Write'));
    const page = writePages[writePages.length - 1];
    if (!page) {
      console.log('No write page found');
      return;
    }
    console.log('Target Page:', page.url());

    const frames = page.frames();
    console.log('Frames count:', frames.length);
    for (let i = 0; i < frames.length; i++) {
      const f = frames[i];
      console.log(`Frame ${i}: name="${f.name()}", url="${f.url()}"`);
      try {
        const pubBtn = await f.$('.publish_btn__m9KHH, [class*="publish_btn"]');
        const confirmBtn = await f.$('.confirm_btn__WEaBq, [class*="confirm_btn"]');
        const libCloseBtn = await f.$('button[class*="close"], .se-toolbar-layer-close');
        console.log(`  pubBtn: ${!!pubBtn}, confirmBtn: ${!!confirmBtn}, libCloseBtn: ${!!libCloseBtn}`);
        
        const allBtns = await f.$$eval('button', btns => btns.map(b => ({
          text: b.innerText.trim(),
          class: b.className
        })));
        console.log(`  Buttons with text:`, allBtns.filter(b => b.text.length > 0));
      } catch (e) {
        console.log(`  Frame error: ${e.message}`);
      }
    }
  } catch (e) {
    console.error('Inspect error:', e);
  }
})();
