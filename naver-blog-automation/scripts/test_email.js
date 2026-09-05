/**
 * test_email.js - 이메일 발송 기능 단독 검증 스크립트
 * 
 * [교육용 설명]
 * 이 스크립트는 방금 네이버 블로그에 발행된 실제 포스팅 내용(사진 제외)을
 * yoochangsoo@gmail.com으로 안전하게 전송하는지 테스트합니다.
 */

const { sendPostNotificationEmail } = require('../dist/services/emailService');

async function runEmailTest() {
  console.log('🚀 [테스트] yoochangsoo@gmail.com으로 포스팅 내용 이메일 전송 테스트를 시작합니다...');

  const samplePayload = {
    to: 'yoochangsoo@gmail.com',
    title: '14km 성벽 벽돌마다 장인의 이름을 새겨 넣었던 서안의 놀라운 비밀',
    category: '여행 and 이야기',
    postUrl: 'https://blog.naver.com/cbsctour/224401999857',
    timestamp: new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }),
    tags: ['중국서안', '서안성벽', '실명제벽돌', '역사여행', '문화유산'],
    content: `수많은 여행자가 거대한 성벽 위에서 자전거를 타며 고대 수도의 위용을 만끽하지만, 발아래 놓인 벽돌 하나하나를 유심히 들여다보는 사람은 많지 않습니다. 약 14km에 달하는 거대한 서안 성벽은 명나라 홍무제 시절 축조된 현존하는 가장 완벽한 고성벽 중 하나입니다.

그런데 이 거대한 성벽의 서쪽 구간을 걷다 보면 벽돌 표면에 한자로 새겨진 이름들을 발견할 수 있습니다. 이것은 관리가 남긴 낙서가 아니라, 600년 전 엄격하게 시행되었던 '물품 실명제(물품책임제)'의 생생한 흔적입니다.

벽돌 하나마다 그것을 만든 장인(匠人)의 이름과 감독관, 소속 관청의 직인이 음각으로 또렷하게 새겨져 있습니다. 만약 축조 과정에서 벽돌이 부서지거나 불량이 발생하면 이름이 적힌 장인은 엄중한 문책을 피할 수 없었습니다. 목숨을 걸고 구워낸 벽돌이었기에 600년이 지난 오늘날까지 풍파를 견디며 단단하게 서 있을 수 있었던 것입니다.

장인의 이름이 새겨진 성벽 위에서 맞는 노을은 단순한 풍경 이상의 깊은 울림을 전해줍니다. 이름 없는 민초들이 남긴 책임의 무게가 오늘날 우리에게 건네는 진짜 역사의 의미는 무엇일까요?`
  };

  try {
    const success = await sendPostNotificationEmail(samplePayload);
    if (success) {
      console.log('🎉 [테스트 성공] 이메일 발송 및 아카이빙이 정상 완료되었습니다!');
    } else {
      console.log('⚠️ [테스트 결과] 발송 실패 또는 예외 발생');
    }
  } catch (err) {
    console.error('❌ [테스트 에러]:', err);
  }
}

runEmailTest();
