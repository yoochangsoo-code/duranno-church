import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sendGroupMessage } from '../services/messageService';
import { encryptData } from '../lib/crypto';

describe('메시지 단체 발송 서비스 테스트', () => {
  const secretKey = 'test-secret-key-12345';
  const senderNumber = '02-123-4567';
  const messageText = '예배 공지드립니다.';

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('암호화된 성도 연락처 목록을 받아 복호화하고, Mock 샌드박스로 발송 시뮬레이션에 성공한다.', async () => {
    // 1. 성도 실 번호 암호화
    const rawPhones = ['01012345678', '01098765432'];
    const encryptedPhones = rawPhones.map(phone => encryptData(phone, secretKey));

    // 2. 샌드박스 키 상태(VITE_SOLAPI_API_KEY 기본값)로 발송 시도
    const result = await sendGroupMessage(
      encryptedPhones,
      secretKey,
      senderNumber,
      messageText
    );

    // VITE_SOLAPI_API_KEY 미설정 시 기본 Mock 처리되므로 성공을 뱉어야 함
    expect(result.success).toBe(true);
    expect(result.sentCount).toBe(2);
    expect(result.error).toBeUndefined();
  });

  it('수신자 연락처가 비어있거나 유효하지 않으면 에러를 반환한다.', async () => {
    const result = await sendGroupMessage(
      [],
      secretKey,
      senderNumber,
      messageText
    );

    expect(result.success).toBe(false);
    expect(result.sentCount).toBe(0);
    expect(result.error).toContain('유효한 수신 성도 연락처가 존재하지 않습니다.');
  });
});
