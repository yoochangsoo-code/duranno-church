# 네이버 블로그 작성 자동화 시스템 구현 계획 (Implementation Plan)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** AI 원고 작성 기능과 Playwright 자동 포스팅 엔진, `node-cron` 백그라운드 스케줄러 및 Express 기반 웹 대시보드를 결합한 네이버 블로그 자동 발행 시스템 구축.

**Architecture:** Express.js REST API 서버에 AES-256-GCM 보안 암호화 서비스, AI 글 작성 서비스, Playwright 네이버 포스팅 서비스를 모듈화하여 결합하고, node-cron으로 예약 시간에 포스팅을 수행하며 웹 대시보드에서 상태와 로그를 실시간 관리함.

**Tech Stack:** Node.js, Express, TypeScript, Playwright, node-cron, OpenAI API / Google Gemini API, crypto (AES-256-GCM), HTML5/CSS3/Vanilla JS.

---

### User Review Required

> [!IMPORTANT]
> 1. 네이버 로그인 자동화의 경우 최초 1회 로그인 시 보안 인증(2단계 인증 또는 Captcha) 또는 로그인 정보 생성을 위해 `headful`(브라우저 화면 보임) 모드로 세션을 저장/확인해야 할 수 있습니다.
> 2. 네이버 비밀번호 및 API 키는 AES-256-GCM으로 암호화되어 `.env` 및 데이터 파일에 안전하게 저장됩니다.

---

### Proposed Tasks

#### Task 1: 프로젝트 환경 설정 및 라이브러리 설치
**Files:**
- Create: `c:\ai\naver-blog-automation\package.json`
- Create: `c:\ai\naver-blog-automation\tsconfig.json`
- Create: `c:\ai\naver-blog-automation\.env.example`

- [ ] **Step 1: package.json 생성 및 필요한 의존성 라이브러리 추가**
- [ ] **Step 2: tsconfig.json 및 기본 프로젝트 폴더 구조 생성 (`src/`, `public/`, `data/`)**
- [ ] **Step 3: 의존성 설치 (`npm install express playwright node-cron dotenv openai @google/genai`) 및 Playwright 브라우저 설치**

---

#### Task 2: 보안 및 데이터 암호화 모듈 (`cryptoUtils.ts`)
**Files:**
- Create: `c:\ai\naver-blog-automation\src\utils\cryptoUtils.ts`
- Create: `c:\ai\naver-blog-automation\src\__tests__\cryptoUtils.test.ts`

- [ ] **Step 1: AES-256-GCM 방식의 암호화/복호화 실패 테스트 작성 (`cryptoUtils.test.ts`)**
- [ ] **Step 2: 테스트 실행 및 실패 확인**
- [ ] **Step 3: `cryptoUtils.ts` 구현 (비밀번호 및 API key 암호화 및 복호화 함수)**
- [ ] **Step 4: 테스트 실행 및 성공 확인**

---

#### Task 5: Express 서버 및 node-cron 스케줄러 백엔드 연동 (`server.ts`)
**Files:**
- Create: `c:\ai\naver-blog-automation\src\services\schedulerService.ts`
- Create: `c:\ai\naver-blog-automation\src\server.ts`

- [ ] **Step 1: `schedulerService.ts` 작성 (node-cron으로 예약 시간에 포스팅 자동 실행)**
- [ ] **Step 2: Express 서버 구현 (설정 저장, 스케줄 변경, 원고 즉시 포스팅 API 등)**

---

#### Task 6: 웹 대시보드 프론트엔드 UI 구축 (`public/`)
**Files:**
- Create: `c:\ai\naver-blog-automation\public\index.html`
- Create: `c:\ai\naver-blog-automation\public\style.css`
- Create: `c:\ai\naver-blog-automation\public\app.js`

- [ ] **Step 1: 대시보드 UI HTML & CSS 디자인 (설정, 예약 포스팅 시각, 실행 로그 모니터링)**
- [ ] **Step 2: Express API와 연동하는 Vanilla JS 앱 로직 작성**
- [ ] **Step 3: 전체 시스템 통합 검증 및 시연**

---

## Verification Plan

### Automated Tests
- `npm test`: 암호화 유틸리티(`cryptoUtils`) 및 AI 원고 생성 로직 검증

### Manual Verification
- Express 백엔드 서버 구동 (`npm start`) 후 `http://localhost:3000` 접속
- 대시보드에서 테스트 키워드 입력 후 즉시 포스팅(또는 예약 포스팅) 테스트
- Playwright가 브라우저를 열어 네이버 블로그에 포스팅이 정상 등록되는지 확인
