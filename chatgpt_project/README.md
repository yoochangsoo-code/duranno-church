# API 비용 없이 쓰는 ChatGPT 프로젝트 방식

이 폴더는 별도 앱/API Key 호출 없이 ChatGPT 유료 계정의 대화창, 프로젝트, 이미지 생성 기능을 이용해 동일한 작업 흐름을 반복하기 위한 템플릿입니다.

## 왜 이 방식인가?

데스크톱 앱이나 웹앱이 OpenAI 모델을 직접 호출하려면 API Key가 필요하고 API 사용량 기준 비용이 발생합니다. 반면 ChatGPT 대화창 안에서 작업하면 사용자는 본인의 ChatGPT 플랜 한도 안에서 대화, 파일 업로드, 이미지 생성 기능을 사용합니다.


## README만 업로드하면 되나요?

아니요. `README.md`는 사용 설명서라서 이것만 업로드하면 ChatGPT가 전체 제작 규칙을 안정적으로 따르기 어렵습니다.

가장 추천하는 방법은 아래 두 단계를 모두 하는 것입니다.

1. `COPY_ME_TO_CHATGPT_PROJECT.md`의 **1번 프로젝트 작업 지침** 섹션을 ChatGPT Project의 Instructions/지침 영역에 붙여넣습니다.
2. 새 여행 상품을 시작할 때마다 `RUN_PROMPT.md` 또는 `COPY_ME_TO_CHATGPT_PROJECT.md`의 **2번 새 작업 시작 프롬프트**를 대화창에 붙여넣고 이미지를 첨부합니다.

파일 업로드 방식으로 쓰고 싶다면 `README.md`보다 `COPY_ME_TO_CHATGPT_PROJECT.md`, `PROJECT_INSTRUCTIONS.md`, `RUN_PROMPT.md`를 프로젝트 파일로 업로드하는 편이 더 적합합니다.

## 설정 방법

1. ChatGPT에서 새 Project를 만듭니다.
2. 가장 간단하게는 `COPY_ME_TO_CHATGPT_PROJECT.md`의 1번 섹션을 Project instructions에 붙여넣습니다.
3. 또는 `PROJECT_INSTRUCTIONS.md` 내용을 Project instructions에 붙여넣거나 프로젝트 파일로 업로드합니다.
4. 새 여행 상품을 시작할 때 `COPY_ME_TO_CHATGPT_PROJECT.md`의 2번 섹션 또는 `RUN_PROMPT.md` 내용을 붙여넣습니다.
5. 여행지 이미지, 인물 이미지, 로고 이미지를 첨부합니다.
6. 여행지/일정/컨셉/특징/출발 문구를 채운 뒤 실행합니다.

## 장점

- API Key가 필요 없습니다.
- 별도 API 과금이 발생하지 않습니다.
- ChatGPT 프로젝트에 지침과 파일 맥락을 모아둘 수 있습니다.
- 결과를 보면서 사람이 단계별로 승인하고 수정할 수 있습니다.

## 한계

- 외부 앱처럼 완전 자동 저장, 파일명 자동 부여, ZIP 생성까지 항상 보장되지는 않습니다.
- ChatGPT 플랜의 메시지/이미지 생성/파일 업로드 한도는 그대로 적용됩니다.
- 버튼형 GUI가 아니라 대화형 워크플로우입니다.
- 로컬 폴더 `outputs/YYYYMMDD_HHMMSS/`에 자동 저장하는 기능은 앱/API 방식에서만 안정적으로 구현됩니다.

## 추천 운영 방식

- 반복 작업이 많고 API 비용을 피하고 싶다면 이 프로젝트 방식을 사용합니다.
- 결과물을 자동으로 폴더 저장/ZIP/재생성 관리해야 한다면 `web_app.py` 또는 `app.py`를 API Key 방식으로 사용합니다.
