const { chromium } = require('playwright');

async function sendViaGmailReliable() {
  console.log('🚀 [Gmail 전송] 시작...');
  let page = null;

  try {
    const browser = await chromium.connectOverCDP('http://localhost:9222');
    const context = browser.contexts()[0];
    page = await context.newPage();

    console.log('1. Gmail 접속 중...');
    await page.goto('https://mail.google.com/mail/u/0/#inbox', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(6000);

    // 2. [편지쓰기] 버튼 클릭
    console.log('2. [편지쓰기] 버튼 클릭...');
    const composeSelectors = [
      'div[jscontroller*=""][role="button"]:has-text("편지쓰기")',
      'div.T-I.T-I-KE.L3',
      '[aria-label*="편지쓰기"]',
      '.z0 > div'
    ];

    let composeClicked = false;
    for (const sel of composeSelectors) {
      try {
        const btn = await page.$(sel);
        if (btn && await btn.isVisible()) {
          await btn.click();
          composeClicked = true;
          console.log(`[편지쓰기] 클릭 완료 (${sel})`);
          break;
        }
      } catch (e) {}
    }

    if (!composeClicked) {
      // 단축키 'c' 시도 (Gmail 단축키 활성화 시 편지쓰기)
      await page.keyboard.press('c');
    }

    await page.waitForTimeout(3000);

    // 3. 수신자 입력 영역 찾기
    console.log('3. 받는사람(수신자) 영역 활성화 및 입력...');
    // "수신자" 라벨이나 테이블 셀 클릭
    await page.evaluate(() => {
      // 텍스트에 '수신자' 또는 '받는사람'이 있는 요소의 부모나 형제 클릭
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      let node;
      while (node = walker.nextNode()) {
        const text = (node.nodeValue || '').trim();
        if (text === '수신자' || text === '받는사람' || text === 'To') {
          const el = node.parentElement;
          if (el) {
            el.click();
            if (el.nextElementSibling) el.nextElementSibling.click();
            break;
          }
        }
      }
    });

    await page.waitForTimeout(1000);
    await page.keyboard.type('yoochangsoo@gmail.com', { delay: 30 });
    await page.keyboard.press('Enter');
    console.log('수신자 타이핑 및 Enter 완료!');

    await page.waitForTimeout(1000);

    // 4. 제목 입력
    console.log('4. 제목 입력...');
    const subjectTitle = '[네이버 블로그 포스팅 알림] 14km 성벽 벽돌마다 장인의 이름을 새겨 넣었던 서안의 놀라운 비밀';
    const subjectInput = await page.$('input[name="subjectbox"], input[placeholder*="제목"], input[aria-label*="제목"]');
    if (subjectInput) {
      await subjectInput.click();
      await subjectInput.fill(subjectTitle);
      console.log('제목 fill 완료!');
    } else {
      await page.keyboard.press('Tab');
      await page.keyboard.type(subjectTitle, { delay: 15 });
    }

    await page.waitForTimeout(1000);

    // 5. 본문 입력
    console.log('5. 본문 입력...');
    const emailBody = `[네이버 블로그 포스팅 알림]

📌 글 제목: 14km 성벽 벽돌마다 장인의 이름을 새겨 넣었던 서안의 놀라운 비밀
📂 카테고리: 여행 and 이야기
⏰ 발행 시각: ${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}
🔗 블로그 바로가기: https://blog.naver.com/cbsctour/224401999857
🏷️ 태그: #중국서안 #서안성벽 #실명제벽돌 #역사여행 #문화유산

====================================================
[본문 전문 (사진 제외)]

수많은 여행자가 거대한 성벽 위에서 자전거를 타며 고대 수도의 위용을 만끽하지만, 발아래 놓인 벽돌 하나하나를 유심히 들여다보는 사람은 많지 않습니다. 약 14km에 달하는 거대한 서안 성벽은 명나라 홍무제 시절 축조된 현존하는 가장 완벽한 고성벽 중 하나입니다.

그런데 이 거대한 성벽의 서쪽 구간을 걷다 보면 벽돌 표면에 한자로 새겨진 이름들을 발견할 수 있습니다. 이것은 관리가 남긴 낙서가 아니라, 600년 전 엄격하게 시행되었던 '물품 실명제(물품책임제)'의 생생한 흔적입니다.

벽돌 하나마다 그것을 만든 장인(匠人)의 이름과 감독관, 소속 관청의 직인이 음각으로 또렷하게 새겨져 있습니다. 만약 축조 과정에서 벽돌이 부서지거나 불량이 발생하면 이름이 적힌 장인은 엄중한 문책을 피할 수 없었습니다. 목숨을 걸고 구워낸 벽돌이었기에 600년이 지난 오늘날까지 풍파를 견디며 단단하게 서 있을 수 있었던 것입니다.

장인의 이름이 새겨진 성벽 위에서 맞는 노을은 단순한 풍경 이상의 깊은 울림을 전해줍니다. 이름 없는 민초들이 남긴 책임의 무게가 오늘날 우리에게 건네는 진짜 역사의 의미는 무엇일까요?

====================================================
본 메일은 네이버 블로그 자동 포스팅 시스템에 의해 발송되었습니다.`;

    const bodyArea = await page.$('div[aria-label*="메일 본문"], div[role="textbox"][contenteditable="true"]');
    if (bodyArea) {
      await bodyArea.click();
      // evaluate를 통해 innerText 설정하면 즉시 안전하게 채워짐
      await page.evaluate((text) => {
        const editor = document.querySelector('div[aria-label*="메일 본문"][role="textbox"]') || document.querySelector('div[role="textbox"][contenteditable="true"]');
        if (editor) {
          editor.innerText = text;
          editor.dispatchEvent(new Event('input', { bubbles: true }));
        }
      }, emailBody);
      console.log('본문 evaluate innerText 주입 완료!');
    }

    await page.waitForTimeout(1500);

    // 6. 스크린샷으로 발송 직전 확인
    await page.screenshot({ path: 'gmail_before_send.png' });
    console.log('발송 직전 스크린샷 저장: gmail_before_send.png');

    // 7. 보내기 버튼 클릭
    console.log('7. [보내기] 버튼 클릭...');
    await page.evaluate(() => {
      const allButtons = Array.from(document.querySelectorAll('div[role="button"], button'));
      const sendBtn = allButtons.find(b => {
        const t = (b.textContent || '').trim();
        const tooltip = b.getAttribute('data-tooltip') || '';
        const aria = b.getAttribute('aria-label') || '';
        return t === '보내기' || tooltip.includes('보내기') || aria.includes('보내기');
      });
      if (sendBtn) {
        sendBtn.click();
      }
    });

    await page.waitForTimeout(5000);

    // 8. 발송 후 스크린샷
    await page.screenshot({ path: 'gmail_final_result.png' });
    console.log('🎉 최종 결과 스크린샷 저장: gmail_final_result.png');

    await page.close();
    console.log('모든 작업 완료!');

  } catch (err) {
    console.error('발생 에러:', err);
    if (page) try { await page.close(); } catch(e) {}
  }
}

sendViaGmailReliable();
