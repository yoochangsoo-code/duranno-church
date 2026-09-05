/**
 * cryptoUtils.ts - AES-256-GCM 고성능 및 강력한 보안 암호화 유틸리티
 * 
 * [교육용 상세 코드 설명]
 * 이 모듈은 네이버 계정 비밀번호 및 API Key와 같이 민감한 개인정보 데이터를
 * 데이터베이스나 파일에 저장하기 전에 안전하게 암호화하고, 필요 시 복호화하는 역할을 합니다.
 * 
 * - Algorithm: AES-256-GCM (Authenticated Encryption with Associated Data)
 * - IV (Initialization Vector): 암호화 시마다 생성되는 12바이트 랜덤 값
 * - Auth Tag: 데이터가 위변조되지 않았음을 검증하는 인증 태그
 */

import crypto from 'crypto';

// AES-256 알고리즘 규격 정의
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // GCM 권장 IV 길이 (12 bytes)

/**
 * 32바이트(256비트) 규격의 키를 보장하기 위한 헬퍼 함수
 * @param secretKey 사용자가 입력한 비밀키 문자열
 * @returns 32바이트 Buffer 객체
 */
function getValidKeyBuffer(secretKey: string): Buffer {
  // 입력된 키가 32바이트가 아니더라도 sha256 해시를 통해 항상 32바이트 바이너리 버퍼 생성
  return crypto.createHash('sha256').update(secretKey).digest();
}

/**
 * 평문 텍스트를 AES-256-GCM 알고리즘으로 암호화합니다.
 * @param text 암호화할 평문 문자열 (예: 비밀번호)
 * @param secretKey32 32자리의 보안 비밀키
 * @returns 'IV:AuthTag:EncryptedText' 포맷의 암호화된 Hex 문자열
 */
export function encryptText(text: string, secretKey32: string): string {
  if (!text) {
    return '';
  }

  // 1. 매번 새로운 12바이트 랜덤 IV 생성
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = getValidKeyBuffer(secretKey32);

  // 2. AES-256-GCM 암호화 객체 생성
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  // 3. 평문 암호화 수행
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  // 4. 무결성 검증을 위한 인증 태그(Auth Tag) 생성 (16바이트)
  const authTag = cipher.getAuthTag().toString('hex');

  // 5. 복호화에 필요한 IV, AuthTag, EncryptedText를 조합하여 반환
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * 암호화된 텍스트를 복호화하여 원본 평문으로 복원합니다.
 * @param encryptedString 'IV:AuthTag:EncryptedText' 포맷의 암호화 문자열
 * @param secretKey32 32자리의 보안 비밀키
 * @returns 복호화된 원본 평문 문자열
 */
export function decryptText(encryptedString: string, secretKey32: string): string {
  if (!encryptedString) {
    return '';
  }

  // 1. 콜론(:) 문자로 IV, AuthTag, EncryptedText 분리
  const parts = encryptedString.split(':');
  if (parts.length !== 3) {
    throw new Error('유효하지 않은 암호화 데이터 포맷입니다.');
  }

  const [ivHex, authTagHex, encryptedHex] = parts;

  // 2. Hex 문자열을 바이너리 Buffer로 변환
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const key = getValidKeyBuffer(secretKey32);

  // 3. AES-256-GCM 복호화 객체 생성 및 인증 태그 설정
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  // 4. 복호화 실행 (데이터가 위변조된 경우 여기서 Error 발생)
  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
