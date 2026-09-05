const { sendPostNotificationEmail } = require('../dist/services/emailService');

async function testGmailV2() {
  console.log('🚀 [Gmail 전송 V2 테스트] 보내는 사람: yoochangsoo@gmail.com, 받는 사람: yoochangsoo@gmail.com');

  const testPayload = {
    to: 'yoochangsoo@gmail.com',
    title: '테스트 알림: 10시 정규 스케줄러 및 Gmail 수신자 검증',
    category: '여행 and 이야기',
    content: `안녕하세요!\n\n오늘 밤 10시(22:00)부터 4~5시간(4.5시간) 주기로 실행될 네이버 블로그 무인 자동 포스팅 알림 시스템입니다.\n\n수신자 및 발신자 주소(yoochangsoo@gmail.com)가 정확히 입력되어 전송되는지 최종 확인하는 안내 메시지입니다.`,
    tags: ['#자동포스팅', '#스케줄러', '#검증완료'],
    postUrl: 'https://blog.naver.com/cbsctour',
    timestamp: new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })
  };

  try {
    const res = await sendPostNotificationEmail(testPayload);
    console.log('테스트 결과 반환값:', res);
  } catch (err) {
    console.error('테스트 중 오류:', err);
  }
}

testGmailV2();
