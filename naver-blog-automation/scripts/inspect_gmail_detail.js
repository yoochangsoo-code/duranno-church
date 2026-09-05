const { chromium } = require('playwright');

async function inspectGmailDetailed() {
  try {
    const browser = await chromium.connectOverCDP('http://localhost:9222');
    const context = browser.contexts()[0];
    const page = await context.newPage();
    
    await page.goto('https://mail.google.com/mail/u/0/#inbox?compose=new', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(5000);

    // 받는사람 입력란 찾아서 클릭
    const toInput = await page.$('input[aria-label*="받는사람"], input[role="combobox"], input.agP, [name="to"]');
    if (toInput) {
      console.log('Clicking to input...');
      await toInput.click();
      await page.keyboard.type('yoochangsoo@gmail.com');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(1000);
    }

    // 인풋들과 텍스트에어리어 조사
    const inputs = await page.$$eval('input, textarea, div[contenteditable="true"]', (elems) => {
      return elems.map(e => ({
        tag: e.tagName,
        name: e.getAttribute('name'),
        ariaLabel: e.getAttribute('aria-label'),
        placeholder: e.getAttribute('placeholder'),
        role: e.getAttribute('role'),
        className: e.className
      }));
    });

    console.log('Found elements in compose dialog:', JSON.stringify(inputs, null, 2));

    await page.close();
  } catch (e) {
    console.error('Error:', e.message);
  }
}

inspectGmailDetailed();
