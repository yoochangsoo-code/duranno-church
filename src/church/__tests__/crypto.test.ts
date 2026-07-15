import { describe, it, expect } from 'vitest';
import { encryptData, decryptData } from '../lib/crypto';

describe('개인정보 암호화 모듈 테스트', () => {
  const rawText = '홍길동';
  const secretKey = 'test-secret-key-12345';

  it('텍스트를 암호화하면 원본과 다른 문자열이 반환된다.', () => {
    const encrypted = encryptData(rawText, secretKey);
    expect(encrypted).not.toBe(rawText);
  });

  it('암호화된 텍스트를 복호화하면 원본 텍스트가 나온다.', () => {
    const encrypted = encryptData(rawText, secretKey);
    const decrypted = decryptData(encrypted, secretKey);
    expect(decrypted).toBe(rawText);
  });
});
