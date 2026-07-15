import { decryptData } from '../lib/crypto';

// 솔라피 API 연동 설정 인터페이스
export interface MessagePayload {
  to: string;   // 수신번호
  from: string; // 발신번호 (교회 인증번호)
  text: string; // 공지 본문 내용
}

/**
 * 암호화된 성도 연락처 배열을 받아 복호화한 후,
 * Solapi API를 통해 카카오 알림톡/SMS 메시지를 단체 발송합니다.
 * 
 * [보안 유의사항 🔒]
 * 클라이언트(브라우저)에서 직접 Solapi API를 호출하면 API Key가 개발자 도구를 통해 노출될 리스크가 있습니다.
 * 따라서 초기 프로토타입 단계에서는 본 클라이언트 헬퍼를 활용하되,
 * 프로덕션 배포 시에는 반드시 Supabase Edge Functions(백엔드 서버리스)로 이 코드를 마이그레이션해야 안전합니다.
 * 
 * @param encryptedPhones 암호화된 연락처 목록
 * @param cryptoSecret 개인정보 복호화용 비밀키 (대칭키)
 * @param senderNumber 등록된 교회의 발신인 번호 (대표 번호)
 * @param messageText 발송할 공지 메시지 본문
 */
export async function sendGroupMessage(
  encryptedPhones: string[],
  cryptoSecret: string,
  senderNumber: string,
  messageText: string
): Promise<{ success: boolean; sentCount: number; error?: string }> {
  try {
    // 1. 암호화된 연락처 데이터를 대칭키로 안전하게 복호화
    const decryptedNumbers = encryptedPhones
      .map((enc) => decryptData(enc, cryptoSecret))
      .filter((num) => num && num.length >= 10); // 10자리 이상 유효한 번호 필터링

    if (decryptedNumbers.length === 0) {
      throw new Error('유효한 수신 성도 연락처가 존재하지 않습니다.');
    }

    // 2. 솔라피 메시지 포맷에 맞추어 배열 생성
    const messages: MessagePayload[] = decryptedNumbers.map((number) => ({
      to: number,
      from: senderNumber || '021234567', // 기본 발신번호
      text: messageText,
    }));

    // 환경 변수에서 솔라피 API 키 조회
    const solapiApiKey = import.meta.env.VITE_SOLAPI_API_KEY || 'MOCK_API_KEY_12345';

    // API Key가 가짜 키(디폴트)이거나 샌드박스 환경일 경우 시뮬레이션 성공 반환
    if (solapiApiKey === 'MOCK_API_KEY_12345') {
      console.log(`[Solapi Sandbox] 메시지 발송 시뮬레이션 성공. 대상 성도: ${messages.length}명`);
      return { success: true, sentCount: messages.length };
    }

    // 3. 실제 솔라피 API 서버로 전송 요청
    // 발송 요청 URL: https://api.solapi.com/messages/v4/send-many
    const response = await fetch('https://api.solapi.com/messages/v4/send-many', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `HMAC-SHA256 apiKey=${solapiApiKey}, date=${new Date().toISOString()}`,
      },
      body: JSON.stringify({
        agent: {
          sdkVersion: 'javascript/4.0',
          osPlatform: 'web',
        },
        messages: messages,
      }),
    });

    if (!response.ok) {
      const errBody = await response.json();
      throw new Error(`Solapi 발송 오류: ${JSON.stringify(errBody)}`);
    }

    return { success: true, sentCount: messages.length };
  } catch (error: any) {
    console.error('메시지 단체 발송 중 오류:', error);
    return { success: false, sentCount: 0, error: error.message || error };
  }
}
