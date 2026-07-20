import { describe, it, expect } from 'vitest';
import { generateUnyangBulletinData, UnyangBulletinData } from '../services/unyangBulletinService';

describe('Unyang Bulletin Service Test', () => {
  it('should format Unyang bulletin data payload correctly', () => {
    const input: UnyangBulletinData = {
      date: '2026-07-26',
      sermonTitle: '은혜의 보좌 앞으로',
      passage: '히브리서 4:14-16',
      preacher: '이상문 담임목사',
      notices: ['하반기 일대일 제자양육 모집', '주일 대중교통 이용 권장'],
    };

    const result = generateUnyangBulletinData(input);
    expect(result.title).toContain('2026-07-26');
    expect(result.sermonTitle).toBe('은혜의 보좌 앞으로');
    expect(result.notices.length).toBe(2);
  });
});
