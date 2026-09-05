const { chromium } = require('playwright');

async function inspectEditorCaption() {
  try {
    const browser = await chromium.connectOverCDP('http://localhost:9222');
    const context = browser.contexts()[0];
    const page = context.pages().find(p => p.url().includes('Redirect=Update') || p.url().includes('PostWrite'));
    if (!page) {
      console.log('에디터 수정 페이지를 찾지 못했습니다.');
      return;
    }

    console.log('열려있는 에디터 페이지 발견:', page.url());
    const frame = page.frames().find(f => f.url().includes('PostWrite') || f.url().includes('editor')) || page.mainFrame();

    const info = await frame.evaluate(() => {
      const imgComps = Array.from(document.querySelectorAll('.se-component-image, .se-image, [data-module="image"]'));
      return imgComps.map((comp, idx) => {
        // 컴포넌트 내부의 모든 태그들
        const captionArea = comp.querySelector('.se-caption, [placeholder*="설명"], .se-placeholder, p.se-text-paragraph');
        return {
          idx,
          className: comp.className,
          hasCaptionArea: !!captionArea,
          captionHtml: captionArea ? captionArea.outerHTML : null,
          innerHtmlPreview: comp.innerHTML.substring(0, 300)
        };
      });
    });

    console.log('이미지 컴포넌트 분석 결과:', JSON.stringify(info, null, 2));

  } catch (err) {
    console.error('에러:', err);
  }
}

inspectEditorCaption();
