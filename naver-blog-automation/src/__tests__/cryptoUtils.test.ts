/**
 * cryptoUtils.test.ts - 암호화 및 복호화 유틸리티 모듈 단위 테스트
 * 
 * [교육용 상세 설명]
 * 이 테스트 코드는 AES-256-GCM 방식을 이용해 문자열(예: 네이버 비밀번호, API Key)을
 * 성공적으로 암호화하고 복호화할 수 있는지 검증합니다.
 */

import { encryptText, decryptText } from '../utils/cryptoUtils';

describe('AES-256-GCM 보안 암호화 유틸리티 테스트', () => {
  // 테스트용 32글자 비밀키 (AES-256 규격에 맞는 32바이트 Key)
  const testSecretKey = 'v9Y8x7W6v5U4t3S2r1Q0p9O8n7M6k5J4';

  test('민감한 평문 문자열을 암호화 후 복호화하면 원래 평문과 일치해야 함', () => {
    // 1. 암호화할 원본 비밀번호 평문
    const originalText = 'mySuperSecretPassword123!';

    // 2. 암호화 실행
    const encryptedResult = encryptText(originalText, testSecretKey);

    // 암호화된 결과는 평문과 달라야 함
    expect(encryptedResult).not.toEqual(originalText);
    expect(typeof encryptedResult).toBe('string');

    // 3. 복호화 실행
    const decryptedText = decryptText(encryptedResult, testSecretKey);

    // 복호화 결과는 원본 평문과 정확히 동일해야 함
    expect(decryptedText).toEqual(originalText);
  });

  test('잘못된 비밀키로 복호화 시 시도하면 오류가 발생하거나 복호화에 실패해야 함', () => {
    const originalText = 'naverSecretPass2026';
    const encryptedResult = encryptText(originalText, testSecretKey);

    const wrongKey = '11112222333344445555666677778888'; // 잘못된 키

    // 잘못된 키로 복호화 시 예외 발생 검증
    expect(() => {
      decryptText(encryptedResult, wrongKey);
    }).toThrow();
  });
});
