const { chromium } = require('playwright');

(async () => {
  try {
    const browser = await chromium.connectOverCDP('http://localhost:9222');
    const page = browser.contexts()[0].pages()[0];
    
    // 메인 페이지 및 모든 프레임 탐색
    const targets = [page, ...page.frames()];
    for (let i = 0; i < targets.length; i++) {
      const target = targets[i];
      try {
        const info = await target.evaluate(() => {
          const allButtons = Array.from(document.querySelectorAll('button, a')).map(b => ({
            text: b.innerText ? b.innerText.trim() : '',
            className: b.className,
            dataAction: b.getAttribute('data-action') || '',
            tag: b.tagName
          }));

          const matched = allButtons.filter(b => b.text.includes('발행') || b.text.includes('사진'));
          return {
            count: allButtons.length,
            matched
          };
        });

        if (info.matched.length > 0) {
          console.log(`[Target ${i} (${target.name ? target.name() : 'page'}) Matched]:`, JSON.stringify(info.matched, null, 2));
        }
      } catch (e) {}
    }

    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
})();
