# Travel Instagram Feed & Poster Generator

여행 입력 이미지와 텍스트를 바탕으로 브랜드 DNA, 인스타그램 피드 9장, 세로 포스터 1장을 생성하는 작업 도구입니다.

## Authentication

이 프로젝트는 **ChatGPT 계정 이메일/비밀번호를 요청하거나 저장하지 않습니다.**

OpenAI 텍스트/이미지 생성 API를 호출하려면 앱의 사이드바 또는 입력칸에 **OpenAI API Key**를 입력하거나 `OPENAI_API_KEY` 환경 변수를 설정하세요.

### Can this use a ChatGPT login instead of an API key?

No. This app intentionally does **not** collect ChatGPT account email/password credentials. OpenAI's API is authenticated with API keys, so production apps should use a server-side `OPENAI_API_KEY` or a key entered by the operator. If you need end-user sign-in for your own product, implement your own OAuth/login layer and keep the OpenAI API key on the server.

## No-API ChatGPT Project Workflow

API 사용 비용을 줄이고 ChatGPT 유료 플랜 안에서 대화형으로 비슷한 결과를 만들고 싶다면 `chatgpt_project/` 템플릿을 사용하세요. 이 방식은 앱이 아니라 ChatGPT Project 안에 지침과 시작 프롬프트를 넣어두고 필요한 이미지를 첨부해 작업하는 흐름입니다.

- `chatgpt_project/COPY_ME_TO_CHATGPT_PROJECT.md`: 작업 지침과 시작 프롬프트를 한 번에 복사하기 위한 통합본
- `chatgpt_project/PROJECT_INSTRUCTIONS.md`: 프로젝트 지침으로 붙여넣을 전체 워크플로우
- `chatgpt_project/RUN_PROMPT.md`: 새 여행 상품 작업을 시작할 때 붙여넣는 프롬프트
- `chatgpt_project/README.md`: 설정 방법, 장점, 한계

README만 업로드하는 것은 권장하지 않습니다. ChatGPT Project에서는 `COPY_ME_TO_CHATGPT_PROJECT.md`의 1번 섹션을 Project Instructions에 붙여넣고, 새 작업마다 2번 섹션 또는 `RUN_PROMPT.md`를 대화창에 붙여넣는 방식이 가장 안정적입니다.

## Web App

```bash
pip install -r requirements.txt
streamlit run web_app.py
```

브라우저에서 다음 탭을 사용합니다.

- `0. 입력`: 여행지/인물/로고 이미지와 여행 텍스트, 모델명, 이미지 마진 입력
- `1. 브랜드 DNA`: 텍스트 모델로 브랜드 DNA 생성 및 `brand_dna.md` 저장
- `2. 인스타 9장`: `feed_prompts.json` 생성 후 이미지 모델로 `feed_01.png`부터 `feed_09.png`까지 생성
- `3. 포스터`: 1024x1536 포스터 생성, 재생성, ZIP 다운로드

## Desktop App

기존 PySide6 데스크톱 앱도 유지합니다.

```bash
pip install -r requirements.txt
python app.py
```

## React Travel Recommendation App

이 저장소에는 Vite/React 기반 여행 추천 앱도 포함되어 있습니다.

```bash
npm install
npm run test
npm run build
npm run dev
```

## Outputs

각 프로젝트는 `outputs/YYYYMMDD_HHMMSS/` 아래에 저장됩니다.

- `input_config.json`
- `inputs/` 업로드 이미지 복사본
- `brand_dna.md`
- `feed_prompts.json`
- `feed_01.png` ... `feed_09.png`
- `poster_prompt.txt`
- `poster.png`
- `travel_assets.zip`
