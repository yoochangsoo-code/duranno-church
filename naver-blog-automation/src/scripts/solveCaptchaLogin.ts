/**
 * solveCaptchaLogin.ts - 네이버 1회성 영수증 캡차 자동 해결 및 세션 저장기
 */

import { chromium } from 'playwright';
import { getSystemConfig } from '../services/schedulerService';
import { decryptText } from '../utils/cryptoUtils';
import fs from 'fs';
import path from 'path';

const SESSION_DATA_DIR = path.join(process.cwd(), 'data', 'naver_user_data');
const ANSWER_FILE = path.join(process.cwd(), 'data', 'captcha_answer.txt');
const QUIZ_FILE = path.join(process.cwd(), 'data', 'captcha_quiz.png');

async function solveAndLogin() {
  const config = getSystemConfig();
  const pw = decryptText(config.encryptedNaverPw, process.env.ENCRYPTION_KEY || 'v9Y8x7W6v5U4t3S2r1Q0p9O8n7M6k5J4');

  // 이전 답변 파일 삭제
  if (fs.existsSync(ANSWER_FILE)) {
    fs.unlinkSync(ANSWER_FILE);
  }

  console.log('[CaptchaLogin] 브라우저 세션 시작...');
  const context = await chromium.launchPersistentContext(SESSION_DATA_DIR, {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled'
    ],
    ignoreDefaultArgs: ['--enable-automation'],
    viewport: { width: 1280, height: 900 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
    permissions: ['clipboard-read', 'clipboard-write']
  });

  const page = await context.newPage();

  console.log('[CaptchaLogin] 네이버 로그인 페이지 이동...');
  await page.goto('https://nid.naver.com/nidlogin.login', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  console.log('[CaptchaLogin] 아이디/비밀번호 입력 중...');
  await page.click('#id');
  await page.waitForTimeout(200);
  await page.keyboard.type(config.naverId, { delay: 40 });

  await page.waitForTimeout(300);
  await page.click('#pw');
  await page.waitForTimeout(200);
  await page.keyboard.type(pw, { delay: 40 });

  await page.waitForTimeout(500);

  console.log('[CaptchaLogin] 로그인 버튼 클릭...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button')) as HTMLButtonElement[];
    const target = buttons.find(b => b.innerText.trim() === '로그인' && b.offsetParent !== null)
                 || buttons.find(b => b.id.startsWith('loginBtn') && b.offsetParent !== null);
    if (target) target.click();
  });

  console.log('[CaptchaLogin] 로그인 결과 대기 중 (5초)...');
  await page.waitForTimeout(5000);

  // 만약 바로 성공했는지 확인
  if (!page.url().includes('nidlogin.login')) {
    console.log('🎉 [CaptchaLogin] 캡차 없이 즉시 로그인 성공! URL:', page.url());
    await context.close();
    return;
  }

  // 캡차 여부 확인
  const answerInput = await page.$('input[placeholder*="정답"]');
  if (!answerInput) {
    console.log('[CaptchaLogin] 캡차 입력창이 없습니다. 현재 URL:', page.url());
    await page.screenshot({ path: QUIZ_FILE });
    await context.close();
    return;
  }

  console.log('📸 [CaptchaLogin] 영수증 캡차 감지! 퀴즈 스크린샷 저장 중...');
  await page.screenshot({ path: QUIZ_FILE });
  console.log(`[CaptchaLogin] 스크린샷이 "${QUIZ_FILE}"에 저장되었습니다.`);
  console.log('[CaptchaLogin] data/captcha_answer.txt 파일에 정답이 입력되기를 기다립니다 (최대 60초)...');

  // 답변 파일이 생성될 때까지 폴링 대기 (최대 60초)
  const startTime = Date.now();
  let answer = '';
  while (Date.now() - startTime < 60000) {
    if (fs.existsSync(ANSWER_FILE)) {
      answer = fs.readFileSync(ANSWER_FILE, 'utf8').trim();
      if (answer) {
        break;
      }
    }
    await new Promise(r => setTimeout(r, 1000));
  }

  if (!answer) {
    console.log('❌ [CaptchaLogin] 제한 시간 내에 정답이 입력되지 않았습니다.');
    await context.close();
    return;
  }

  console.log(`[CaptchaLogin] 정답 "${answer}" 입력 중...`);
  await answerInput.click();
  await page.keyboard.type(answer, { delay: 50 });
  await page.waitForTimeout(500);

  console.log('[CaptchaLogin] [확인] 버튼 클릭...');
  const confirmBtn = await page.$('button:has-text("확인"), .btn_done:has-text("확인"), button.btn_done');
  if (confirmBtn) {
    await confirmBtn.click();
  } else {
    await page.keyboard.press('Enter');
  }

  console.log('[CaptchaLogin] 인증 완료 대기 중 (5초)...');
  await page.waitForTimeout(5000);

  console.log('최종 URL:', page.url());
  await page.screenshot({ path: path.join(process.cwd(), 'data', 'captcha_final.png') });

  // 캡차 통과 후 "다시 로그인해 주세요" 화면이 뜬 경우 2차 로그인 수행
  const bodyText = await page.textContent('body') || '';
  if (bodyText.includes('다시 로그인해 주세요') || page.url().includes('chp=')) {
    console.log('[CaptchaLogin] 캡차 인증 성공 확인! "다시 로그인해 주세요" 감지 -> 비밀번호 재입력 및 로그인 진행...');
    await page.waitForSelector('#pw', { state: 'visible' });
    await page.click('#pw');
    await page.waitForTimeout(500);

    // 비밀번호 확실하게 입력 및 이벤트 발생
    await page.evaluate((val) => {
      const pwEl = document.getElementById('pw') as HTMLInputElement;
      if (pwEl) {
        pwEl.value = val;
        pwEl.dispatchEvent(new Event('input', { bubbles: true }));
        pwEl.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }, pw);

    await page.waitForTimeout(500);
    const filledPwLen = await page.evaluate(() => (document.getElementById('pw') as HTMLInputElement)?.value.length);
    console.log(`[CaptchaLogin] 비밀번호 입력 확인 (입력된 글자수: ${filledPwLen})`);

    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button')) as HTMLButtonElement[];
      const target = buttons.find(b => b.innerText.trim() === '로그인' && !b.id.toLowerCase().includes('passkey') && b.offsetParent !== null)
                   || document.getElementById('loginBtn_row')
                   || document.getElementById('loginBtn_column');
      if (target) {
        target.click();
      }
    });

    console.log('[CaptchaLogin] 최종 로그인 완료 대기 (6초)...');
    await page.waitForTimeout(6000);
    console.log('최종 완료 URL:', page.url());
    await page.screenshot({ path: path.join(process.cwd(), 'data', 'login_success.png') });
  }

  if (!page.url().includes('nidlogin.login')) {
    console.log('🎉 [CaptchaLogin] 캡차 통과 및 로그인 최종 성공! 세션이 안전하게 저장되었습니다.');
  } else {
    console.log('⚠️ [CaptchaLogin] 아직 로그인 페이지입니다. final 스크린샷을 확인해 주세요.');
  }

  await context.close();
}

solveAndLogin();
