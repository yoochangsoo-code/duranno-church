import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchLatestVideosFromYouTube } from '../services/youtubeService';

describe('YouTube 서비스 테스트', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('유튜브 API 호출 시 올바른 JSON 결과를 파싱하여 반환한다.', async () => {
    // Fetch API Mocking
    const mockItems = [
      {
        id: { videoId: 'mock-video-id-1' },
        snippet: {
          title: '주일 설교 [창세기 1:1]',
          publishedAt: '2026-07-15T08:00:00Z',
        },
      },
    ];

    const mockResponse = {
      ok: true,
      json: async () => ({ items: mockItems }),
    };

    global.fetch = vi.fn().mockResolvedValue(mockResponse as Response);

    const result = await fetchLatestVideosFromYouTube('mock-channel', 'mock-key');

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(result).toHaveLength(1);
    expect(result[0].id.videoId).toBe('mock-video-id-1');
  });

  it('유튜브 API 호출 실패 시 에러를 유발한다.', async () => {
    const mockResponse = {
      ok: false,
      json: async () => ({ error: 'invalid key' }),
    };

    global.fetch = vi.fn().mockResolvedValue(mockResponse as Response);

    await expect(fetchLatestVideosFromYouTube('mock-channel', 'mock-key')).rejects.toThrow();
  });
});
