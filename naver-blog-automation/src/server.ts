/**
 * server.ts - 네이버 블로그 자동화 웹 대시보드 Express 백엔드 서버
 * 
 * [교육용 상세 설명]
 * 이 서버는 프론트엔드 대시보드(HTML/CSS/JS)와 통신하여
 * 사용자의 설정 저장, 암호화, 포스팅 수동 즉시 실행, 정기 스케줄러 관리,
 * 5대 여행 테마 및 중점 여행지 가중치 설정, 그리고 실행 로그 조회를 제공하는 RESTful API 서버입니다.
 */

import express, { Request, Response } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import {
  getSystemConfig,
  saveSystemConfig,
  getLogs,
  executeAutoPosting,
  startScheduler,
  stopScheduler,
  SystemConfig
} from './services/schedulerService';
import { encryptText, decryptText } from './utils/cryptoUtils';
import { ensureBrowserOpen } from './services/browserManager';

// 환경 변수 (.env) 로드
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET_KEY = process.env.ENCRYPTION_KEY || 'v9Y8x7W6v5U4t3S2r1Q0p9O8n7M6k5J4';

// JSON 및 URL-encoded 미들웨어 설정
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 정적 프론트엔드 웹 자원 (public 디렉터리) 제공
app.use(express.static(path.join(process.cwd(), 'public')));

/**
 * [GET] /api/config
 * 현재 시스템 설정 조회 (민감한 데이터는 보안 마스킹)
 */
app.get('/api/config', (req: Request, res: Response) => {
  try {
    const config = getSystemConfig();

    // 마스킹 처리하여 프론트엔드로 전달
    const safeConfig = {
      ...config,
      encryptedNaverPw: config.encryptedNaverPw ? '********' : '',
      encryptedAiApiKey: config.encryptedAiApiKey ? '********' : ''
    };

    res.json({ success: true, config: safeConfig });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * [POST] /api/config
 * 설정 정보 업데이트 및 비밀번호/API key AES-256 암호화 저장
 */
app.post('/api/config', (req: Request, res: Response) => {
  try {
    const {
      naverId,
      naverPw,
      aiProvider,
      aiApiKey,
      keywords,
      cronSchedule,
      isEnabled,
      promptTemplate,
      customTopicEnabled,
      customTopic,
      priorityDestinations
    } = req.body;

    const currentConfig = getSystemConfig();

    // 비밀번호가 새로 입력된 경우 AES-256 암호화 적용, 없으면 기존 정보 유지
    let encryptedNaverPw = currentConfig.encryptedNaverPw;
    if (naverPw && naverPw !== '********') {
      encryptedNaverPw = encryptText(naverPw, SECRET_KEY);
    }

    // AI API Key가 새로 입력된 경우 AES-256 암호화 적용
    let encryptedAiApiKey = currentConfig.encryptedAiApiKey;
    if (aiApiKey && aiApiKey !== '********') {
      encryptedAiApiKey = encryptText(aiApiKey, SECRET_KEY);
    }

    const updatedConfig: SystemConfig = {
      naverId: naverId !== undefined ? naverId : currentConfig.naverId,
      encryptedNaverPw,
      aiProvider: aiProvider || currentConfig.aiProvider,
      encryptedAiApiKey,
      keywords: Array.isArray(keywords) ? keywords : currentConfig.keywords,
      cronSchedule: cronSchedule || currentConfig.cronSchedule,
      isEnabled: typeof isEnabled === 'boolean' ? isEnabled : currentConfig.isEnabled,
      promptTemplate: promptTemplate !== undefined ? promptTemplate : currentConfig.promptTemplate,
      customTopicEnabled: typeof customTopicEnabled === 'boolean' ? customTopicEnabled : currentConfig.customTopicEnabled,
      customTopic: customTopic !== undefined ? customTopic : currentConfig.customTopic,
      priorityDestinations: Array.isArray(priorityDestinations) ? priorityDestinations : currentConfig.priorityDestinations
    };

    saveSystemConfig(updatedConfig);

    // 스케줄러 상태 재설정
    if (updatedConfig.isEnabled) {
      startScheduler();
    } else {
      stopScheduler();
    }

    res.json({ success: true, message: '설정이 성공적으로 저장되었습니다.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: `설정 저장 실패: ${error.message}` });
  }
});

/**
 * [POST] /api/browser/open
 * 사용자가 직접 로그인할 수 있도록 모니터에 브라우저 창을 띄우는 엔드포인트
 */
app.post('/api/browser/open', async (req: Request, res: Response) => {
  try {
    const config = getSystemConfig();
    await ensureBrowserOpen(config.naverId || 'cbsctour');
    res.json({
      success: true,
      message: '모니터 화면에 브라우저 창이 열렸습니다. 네이버에 로그인해 두세요!'
    });
  } catch (error: any) {
    console.error('[Server] 브라우저 열기 오류:', error);
    res.status(500).json({ success: false, message: `브라우저 실행 실패: ${error.message}` });
  }
});

/**
 * [GET] /api/browser/status
 * 현재 열려 있는 브라우저의 URL 및 화면 상태를 진단하는 엔드포인트
 */
app.get('/api/browser/status', async (req: Request, res: Response) => {
  try {
    const config = getSystemConfig();
    const page = await ensureBrowserOpen(config.naverId || 'cbsctour');
    const url = page.url();
    const title = await page.title();
    const screenshotPath = path.join(process.cwd(), 'data', 'current_browser_screen.png');
    await page.screenshot({ path: screenshotPath });
    
    // 현재 저장된 쿠키 확인
    const cookies = await page.context().cookies('https://naver.com');
    const hasNID = cookies.some(c => c.name === 'NID_AUT' || c.name === 'NID_SES');

    res.json({ success: true, url, title, hasNaverLoginCookies: hasNID, cookieCount: cookies.length });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * [POST] /api/post/now
 * 즉시 포스팅 실행 (수동 테스트 또는 즉시 발행)
 */
app.post('/api/post/now', async (req: Request, res: Response) => {
  try {
    const { keyword } = req.body;

    console.log(`[API] 즉시 포스팅 요청 수신 (전달된 키워드: ${keyword || '설정 규칙에 따름'})`);
    const result = await executeAutoPosting(keyword);

    res.json({
      success: result.success,
      message: result.message
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * [GET] /api/logs
 * 포스팅 이력 로그 조회
 */
app.get('/api/logs', (req: Request, res: Response) => {
  try {
    const logs = getLogs();
    res.json({ success: true, logs });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * [POST] /api/scheduler/toggle
 * 스케줄러 시작 / 일시정지 스위치
 */
app.post('/api/scheduler/toggle', (req: Request, res: Response) => {
  try {
    const config = getSystemConfig();
    config.isEnabled = !config.isEnabled;
    saveSystemConfig(config);

    if (config.isEnabled) {
      startScheduler();
    } else {
      stopScheduler();
    }

    res.json({
      success: true,
      isEnabled: config.isEnabled,
      message: config.isEnabled ? '정기 스케줄러가 시작되었습니다.' : '정기 스케줄러가 일시정지되었습니다.'
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 서버 실행 및 초기 스케줄러 가동
app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`[네이버 블로그 자동화 서버 구동 완료]`);
  console.log(`웹 대시보드 접속 주소: http://localhost:${PORT}`);
  console.log(`====================================================`);

  // 서비스 시작 시 스케줄러 활성화 여부 점검
  startScheduler();
});
