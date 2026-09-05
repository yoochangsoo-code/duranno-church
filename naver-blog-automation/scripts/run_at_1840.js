/**
 * run_at_1840.js - 18시 40분 정시 단일 포스팅 예약 실행 스크립트
 */
const { executeAutoPosting } = require('../dist/services/schedulerService');

async function scheduleAt1840() {
  const now = new Date();
  const target = new Date();
  target.setHours(18, 40, 0, 0);

  const delayMs = target.getTime() - now.getTime();
  console.log(`[Timer] 현재 시각: ${now.toLocaleTimeString('ko-KR', { timeZone: 'Asia/Seoul' })}`);
  console.log(`[Timer] 목표 시각: 18:40:00 (대기 시간: ${Math.round(delayMs / 1000)}초)`);

  if (delayMs > 0) {
    console.log(`[Timer] 18시 40분까지 대기합니다...`);
    setTimeout(async () => {
      console.log(`\n⏰ [18:40:00 정각] 예약된 테스트 포스팅을 시작합니다!`);
      const res = await executeAutoPosting();
      console.log('=== [18:40 포스팅 최종 결과] ===', res);
    }, delayMs);
  } else {
    console.log('이미 18시 40분을 지났으므로 즉시 실행합니다.');
    const res = await executeAutoPosting();
    console.log('=== [포스팅 최종 결과] ===', res);
  }
}

scheduleAt1840();
