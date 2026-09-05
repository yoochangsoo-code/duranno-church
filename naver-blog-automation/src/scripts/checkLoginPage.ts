import { chromium } from 'playwright';

async function checkLogin() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('https://nid.naver.com/nidlogin.login', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  const idEl = await page.$('#id');
  const pwEl = await page.$('#pw');
  console.log('ID input 존재:', !!idEl);
  console.log('PW input 존재:', !!pwEl);

  const buttons = await page.$$eval('button, input[type="submit"]', els =>
    els.map(e => ({
      tag: e.tagName,
      type: (e as any).type,
      id: e.id,
      className: e.className,
      text: (e as HTMLElement).innerText?.trim()
    }))
  );

  console.log('페이지 내 버튼 목록:');
  console.log(JSON.stringify(buttons, null, 2));

  await browser.close();
}

checkLogin();
