# 🌐 네이버 블로그 AI 자동 포스팅 & 정기 스케줄러 시스템

이 프로젝트는 네이버 블로그(cbsctour)에 인문학적 깊이를 지닌 고품질 세계 여행 실화 스토리와 여행 장비 리뷰를 4.5시간 간격으로 자동 발행하고, 발행 완료 시 Gmail을 통해 본문 및 향후 발행 예정 스토리를 본인 계정으로 안내하는 무인 자동화 시스템입니다.

---

## 🌟 주요 기능

1. **인문학 심층 스토리텔링 (1,600자 이상)**
   - 현지 언론(El País, Corriere della Sera, La Nazione 등) 및 역사 아카이브 사료를 심층 반영하여 깊이 있는 서사 작성.
   - 15~25자 내외의 짧고 강렬한 한 문장 제목 부여.
   - 마지막 문장은 독자에게 깊은 사색을 던지는 질문형 문장(?)으로 마무리.

2. **사진 100% 일치 검수 & 스마트에디터 ONE 전용 캡션 메뉴 입력**
   - 글의 소재(판테온, 두오모, 카를교 등)와 100% 일치하는 고해상도 검증 실사진 매칭.
   - 하나의 글에 동일한 사진 파일이 중복 첨부되는 것을 원천 차단(Set 기반 검사).
   - 사진 첨부 후 스마트에디터 ONE의 사진 바로 아래 전용 캡션 메뉴(`figcaption.se-caption`)에 정확히 설명 타이핑.

3. **스마트에디터 편집툴 서식 자동 적용**
   - 핵심 역사 사료명 및 고유명사에 **굵게(Bold: Ctrl+B)** 서식 적용.
   - 사진 하단에 본문 분리용 **감성 구분선(Horizontal Line)** 삽입.
   - 마지막 사색 질문 문장에 스마트에디터 **인용구(Quotation) 상자** 서식 적용.

4. **대기 스토리 풀 항상 5개 유지 파이프라인**
   - 미발행된 대기 스토리(`data/travel_stories.json`)를 항상 5개 준비.
   - 1건이 발행되면 남은 4개 목록을 추출하여 이메일에 동봉 발송.
   - 이메일 발송이 성공한 직후, 새로운 5번째 스토리를 자동 생성/보충하여 5개 유지.

5. **Gmail 자동 알림 (yoochangsoo@gmail.com)**
   - 포스팅 완료 즉시 사진을 제외한 글 전문과 함께 **[앞으로 발행될 예정 스토리 4편 안내]**를 본인 메일함으로 자동 발송.

---

## 💻 다른 PC에서 이어서 작업하는 방법

### 1. 저장소 클론 및 패키지 설치
```bash
git clone https://github.com/yoochangsoo-code/duranno-church.git
cd duranno-church/naver-blog-automation
npm install
```

### 2. 크롬 브라우저 원격 디버깅 모드로 실행
네이버 스마트에디터는 캡차(CAPTCHA) 및 2단계 인증 방지를 위해 사용자가 로그인해 둔 크롬 창과 직접 연동(CDP 포트 9222)됩니다.

**Windows PowerShell 실행 명령:**
```powershell
& "C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222 --user-data-dir="C:\chrome-dev-profile"
```

열린 크롬 창에서:
1. 네이버(https://nid.naver.com)에 로그인 (`cbsctour` 계정)
2. Gmail(https://mail.google.com)에 로그인 (`yoochangsoo@gmail.com` 계정)

### 3. 스케줄러 서버 구동
```bash
npm start
```
- 웹 대시보드: `http://localhost:3000`
- 서버가 시작되면 현재 시각 기준 최적의 정규 스케줄(4.5시간 주기)로 무인 자동 포스팅이 시작됩니다.

---

## 📁 주요 디렉터리 구조

```
naver-blog-automation/
├── data/
│   ├── assets/travel/         # 검증된 실제 도시/건축물 고해상도 사진 에셋
│   ├── travel_stories.json    # 상시 5개 유지되는 미발행 대기 스토리 풀
│   ├── posted_history.json    # 영구 발행 이력 (중복 방지)
│   └── config.json            # 시스템 설정
├── src/
│   ├── services/
│   │   ├── naverService.ts        # Playwright 기반 스마트에디터 ONE 포스팅 & 서식 엔진
│   │   ├── travelStoryService.ts  # 5대 대기 스토리 관리 및 자동 보충 엔진
│   │   ├── emailService.ts        # Gmail 알림 및 다음 4개 스토리 안내 발송
│   │   ├── imageService.ts        # 사진-주제 일치 검수 및 중복 차단
│   │   └── schedulerService.ts    # 무인 정기 스케줄러
│   └── server.ts                  # Express 웹 서버
└── package.json
```
