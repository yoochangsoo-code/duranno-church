const { chromium } = require('playwright');

async function testSendViaGmail() {
  console.log('🚀 [Gmail 발송 테스트] yoochangsoo@gmail.com 계정을 사용하여 이메일 전송을 시작합니다...');

  let page = null;
  try {
    const browser = await chromium.connectOverCDP('http://localhost:9222');
    const context = browser.contexts()[0];
    page = await context.newPage();

    // 1. Gmail 편지쓰기 화면으로 이동
    await page.goto('https://mail.google.com/mail/u/0/#inbox?compose=new', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(4000);

    const recipient = 'yoochangsoo@gmail.com';
    const emailSubject = '[네이버 블로그 포스팅 알림] 14km 성벽 벽돌마다 장인의 이름을 새겨 넣었던 서안의 놀라운 비밀';
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

    // 2. 받는 사람 입력
    console.log('👤 [Gmail] 받는 사람 주소 입력 중:', recipient);
    const toInput = await page.$('input[aria-label*="받는사람"], input[role="combobox"], input.agP, [name="to"]');
    if (toInput) {
      await toInput.click();
      await page.keyboard.type(recipient, { delay: 20 });
      await page.keyboard.press('Enter');
      console.log('✅ 받는 사람 입력 완료');
    } else {
      console.warn('⚠️ 받는 사람 입력창을 찾지 못함');
    }
    await page.waitForTimeout(1000);

    // 3. 제목 입력
    console.log('📌 [Gmail] 제목 입력 중:', emailSubject);
    const subjectInput = await page.$('input[name="subjectbox"], input[placeholder*="제목"], input[aria-label*="제목"]');
    if (subjectInput) {
      await subjectInput.click();
      await page.keyboard.type(emailSubject, { delay: 15 });
      console.log('✅ 제목 입력 완료');
    } else {
      console.warn('⚠️ 제목 입력창을 찾지 못함. Tab으로 이동 시도...');
      await page.keyboard.press('Tab');
      await page.keyboard.type(emailSubject, { delay: 15 });
    }
    await page.waitForTimeout(1000);

    // 4. 본문 입력
    console.log('📝 [Gmail] 본문 내용 입력 중...');
    const bodyInput = await page.$('div[aria-label*="메일 본문"], div[role="textbox"][contenteditable="true"]');
    if (bodyInput) {
      await bodyInput.click();
      // 빠른 입력을 위해 클립보드 붙여넣기 또는 한 문단씩 입력
      const lines = emailBody.split('\n');
      for (const line of lines) {
        if (line.trim().length > 0) {
          await page.keyboard.type(line, { delay: 5 });
        }
        await page.keyboard.press('Enter');
      }
      console.log('✅ 본문 입력 완료');
    } else {
      console.warn('⚠️ 본문 입력 영역을 찾지 못함. Tab으로 이동 시도...');
      await page.keyboard.press('Tab');
      await page.keyboard.type(emailBody, { delay: 5 });
    }
    await page.waitForTimeout(1500);

    // 5. 보내기 실행 (단축키 Control+Enter 및 보내기 버튼)
    console.log('🚀 [Gmail] 보내기 실행 중...');
    let sent = false;
    const sendBtn = await page.$('div[role="button"][data-tooltip*="보내기"], div[aria-label*="보내기"], div.T-I.J-J5-Ji.aoO.v7.T-I-atl.L3');
    if (sendBtn) {
      await sendBtn.click();
      sent = true;
      console.log('✅ 보내기 버튼 클릭 완료!');
    } else {
      console.log('⌨️ Ctrl+Enter 단축키로 발송 시도...');
      await page.keyboard.press('Control+Enter');
      sent = true;
    }

    await page.waitForTimeout(5000);
    console.log('🎉 [Gmail] yoochangsoo@gmail.com으로 이메일 발송 완료!');

    await page.close();
  } catch (e) {
    console.error('❌ [Gmail 에러]:', e);
    if (page) {
      try { await page.close(); } catch (err) {}
    }
  }
}

testSendViaGmail();
