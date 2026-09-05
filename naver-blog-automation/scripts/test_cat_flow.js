const { chromium } = require('playwright');

(async () => {
  try {
    const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
    const pages = browser.contexts()[0].pages();
    const writePages = pages.filter(p => p.url().includes('Write'));
    const page = writePages[writePages.length - 1];
    const frame = page.frame({ name: 'mainFrame' });

    console.log('1. Click publish button');
    await frame.locator('.publish_btn__m9KHH').click();
    await page.waitForTimeout(1500);

    let confirmVisible = await frame.locator('.confirm_btn__WEaBq').isVisible();
    console.log('Confirm button visible after step 1:', confirmVisible);

    console.log('2. Click category select button');
    await frame.locator('.selectbox_button__jb1Dt').click();
    await page.waitForTimeout(800);

    console.log('3. Click category option [여행도 장비빨]');
    const options = frame.locator('.item__sAGX9, .option__x0and');
    const count = await options.count();
    for (let i = 0; i < count; i++) {
      const txt = (await options.nth(i).innerText()).replace(/[\s\u00A0]+/g, '');
      if (txt === '여행도장비빨') {
        console.log('Found option:', txt);
        await options.nth(i).click();
        break;
      }
    }

    await page.waitForTimeout(1000);
    confirmVisible = await frame.locator('.confirm_btn__WEaBq').isVisible();
    console.log('Confirm button visible after category selection:', confirmVisible);

    const catText = await frame.locator('.selectbox_button__jb1Dt').innerText();
    console.log('Category button text after selection:', catText);

    if (confirmVisible) {
      console.log('4. Click confirm button now!');
      await frame.locator('.confirm_btn__WEaBq').click();
      console.log('Confirm clicked! Waiting 5s...');
      await page.waitForTimeout(5000);
      console.log('Page URL after confirm:', page.url());
    }

  } catch (e) {
    console.error(e);
  }
})();
