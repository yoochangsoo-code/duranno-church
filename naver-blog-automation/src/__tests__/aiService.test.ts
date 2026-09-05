/**
 * aiService.test.ts - AI 원고 작성 서비스 단위 테스트
 * 
 * [교육용 상세 설명]
 * 이 테스트 코드는 AI 서비스가 전달받은 키워드를 바탕으로
 * 네이버 블로그 작성에 적합한 제목, 본문, 태그를 올바른 데이터 구조로 생성하는지 검증합니다.
 */

import { generateBlogPost, BlogPostContent } from '../services/aiService';

describe('AI 원고 작성 서비스 테스트', () => {
  test('키워드가 입력되면 제목, 본문, 태그 배열이 포함된 블로그 원고 객체를 생성해야 함', async () => {
    const keyword = '강남역 맛집 추천';
    const result: BlogPostContent = await generateBlogPost({
      keyword,
      provider: 'mock', // 테스트를 위한 모크(Mock) 인공지능 생성기
    });

    // 1. 결과가 존재해야 함
    expect(result).toBeDefined();

    // 2. 제목에 키워드 관련 텍스트가 포함되어 있는지 검증
    expect(result.title).toContain('강남역 맛집');

    // 3. 본문 내용이 비어있지 않아야 함
    expect(result.content.length).toBeGreaterThan(50);

    // 4. 태그 배열이 존재하고 최소 1개 이상이어야 함
    expect(Array.isArray(result.tags)).toBe(true);
    expect(result.tags.length).toBeGreaterThan(0);
  });
});
