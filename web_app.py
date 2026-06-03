import base64
import json
import os
import zipfile
from datetime import datetime
from pathlib import Path

import streamlit as st
from openai import OpenAI

IMAGE_TYPES = ["png", "jpg", "jpeg", "webp"]
DEFAULT_TEXT_MODEL = "gpt-5.5"
DEFAULT_IMAGE_MODEL = "gpt-image-2"
OUTPUT_ROOT = Path("outputs")


st.set_page_config(page_title="여행 상품 이미지 생성기", page_icon="✈️", layout="wide")


def init_state():
    defaults = {
        "output_dir": None,
        "saved_inputs": None,
        "brand_dna": "",
        "feed_prompts": [],
        "feed_files": [],
        "poster_file": None,
    }
    for key, value in defaults.items():
        if key not in st.session_state:
            st.session_state[key] = value


def get_output_dir():
    if st.session_state.output_dir is None:
        output_dir = OUTPUT_ROOT / datetime.now().strftime("%Y%m%d_%H%M%S")
        output_dir.mkdir(parents=True, exist_ok=True)
        st.session_state.output_dir = str(output_dir)
    return Path(st.session_state.output_dir)


def client_from_key(api_key):
    key = api_key or os.getenv("OPENAI_API_KEY")
    if not key:
        raise ValueError("OpenAI API Key를 입력하거나 OPENAI_API_KEY 환경 변수를 설정하세요. ChatGPT 계정 ID/PW는 사용할 수 없습니다.")
    return OpenAI(api_key=key)


def save_uploaded_files(uploaded_files, subdir, limit=None):
    output_dir = get_output_dir() / "inputs" / subdir
    output_dir.mkdir(parents=True, exist_ok=True)
    paths = []
    files = uploaded_files or []
    if limit is not None:
        files = files[:limit]
    for index, uploaded in enumerate(files, start=1):
        suffix = Path(uploaded.name).suffix.lower() or ".png"
        safe_name = f"{subdir}_{index:02d}{suffix}"
        path = output_dir / safe_name
        path.write_bytes(uploaded.getvalue())
        paths.append(str(path))
    return paths


def save_logo_file(uploaded_file):
    if uploaded_file is None:
        return None
    output_dir = get_output_dir() / "inputs" / "logo"
    output_dir.mkdir(parents=True, exist_ok=True)
    suffix = Path(uploaded_file.name).suffix.lower() or ".png"
    path = output_dir / f"logo{suffix}"
    path.write_bytes(uploaded_file.getvalue())
    return str(path)


def collect_and_save_inputs(form_values):
    output_dir = get_output_dir()
    if form_values["person_uploads"] and len(form_values["person_uploads"]) > 3:
        raise ValueError("인물 이미지는 최대 3장까지 업로드할 수 있습니다.")
    data = {
        "destination_images": save_uploaded_files(form_values["destination_uploads"], "destination"),
        "person_images": save_uploaded_files(form_values["person_uploads"], "person", limit=3),
        "logo_image": save_logo_file(form_values["logo_upload"]),
        "destination": form_values["destination"].strip(),
        "schedule": form_values["schedule"].strip(),
        "concept": form_values["concept"].strip(),
        "features": form_values["features"].strip(),
        "departure": form_values["departure"].strip(),
        "text_model": form_values["text_model"].strip() or DEFAULT_TEXT_MODEL,
        "image_model": form_values["image_model"].strip() or DEFAULT_IMAGE_MODEL,
        "quality": form_values["quality"],
    }
    config = dict(data)
    config["api_key_saved"] = bool(form_values["api_key"])
    (output_dir / "input_config.json").write_text(json.dumps(config, ensure_ascii=False, indent=2), encoding="utf-8")
    st.session_state.saved_inputs = data
    return data


def image_to_data_url(path):
    suffix = Path(path).suffix.lower().lstrip(".")
    mime = "jpeg" if suffix in {"jpg", "jpeg"} else suffix
    data = base64.b64encode(Path(path).read_bytes()).decode("utf-8")
    return f"data:image/{mime};base64,{data}"


def brand_prompt(data):
    return f"""
입력 자료만 근거로 여행 상품 홍보용 브랜드/여행 DNA를 작성하세요.
과장하지 말고 추론 가능한 내용만 쓰세요. 이후 9장 피드와 포스터 생성에 바로 쓸 수 있게 구체적으로 작성하세요.

텍스트 입력:
- 여행지: {data['destination']}
- 여행 일정: {data['schedule']}
- 여행 컨셉: {data['concept']}
- 여행 특징: {data['features']}
- 출발 문구: {data['departure']}

반드시 아래 형식을 지키세요.
# 브랜드 DNA
- 핵심 정체성:
- 차별점:
- 시각 콘셉트:
- 카피 방향:

## 1) 컬러 팔레트 3색
색상명 / HEX / 근거 / 활용 위치 표

## 2) 이 여행의 무드 키워드 3개
각 키워드마다 한 줄 설명

## 3) 타겟이 좋아할 분위기
실제 구매 타겟 관점에서 5줄 이내

## 4) 어울리는 장소/배경
촬영 없이 AI로 만들 수 있는 배경 제안 4개

## 5) 로고 활용 방향
로고 위치, 크기, 색상, 반복 규칙, 금지 사항까지 정리
""".strip()


def feed_prompt_design_prompt(data, brand_dna):
    return f"""
아래 브랜드 DNA와 여행 정보를 바탕으로 gpt-image-2용 1024x1024 인스타그램 피드 이미지 생성 프롬프트 9개를 설계하세요.
JSON 배열만 출력하세요. 각 원소는 number, type, title, prompt 키를 가져야 합니다.

브랜드 DNA:
{brand_dna}

여행 정보:
- 여행지: {data['destination']}
- 일정: {data['schedule']}
- 컨셉: {data['concept']}
- 특징: {data['features']}
- 출발 문구: {data['departure']}

반드시 순서:
1 인물: 기존 인물 사진 그대로 또는 AI로 배경만 교체
2 텍스트: 여행 소개 텍스트 카드
3 무드: 여행지 실내 또는 건물, 소품, 배경, 질감 클로즈업
4 무드: 여행지 풍경
5 인물: 같은 인물 다른 각도, 해당 여행지 느낌의 배경
6 텍스트: 여행 특징 / 장점 스토리 카드
7 텍스트: 여행의 컨셉 / 슬로건 텍스트 카드
8 무드: 여행지 대표적인 풍경 배경
9 인물: 해당 인물이 다른 사람과 자연스럽게 이야기하는 모습, 여행지 배경

체크리스트를 모든 프롬프트에 반영:
- 컬러 통일: 9장 전체에서 같은 3색 반복
- 밝기 통일
- 리듬감: 인물-텍스트-무드 교대감
- 서체 통일: 텍스트 카드 3장이 같은 고급 산세리프 서체
- 조명 통일: 인물 사진 3장의 빛 방향이 같음
- 로고가 필요한 경우 과하지 않게 배치
- 텍스트 카드에는 실제 한국어 카피를 명시
""".strip()


def poster_prompt(data, brand_dna, revision=""):
    extra = f"\n수정사항: {revision}" if revision else ""
    return f"""
세로형 여행 상품 광고 포스터를 1024x1536으로 생성하세요.

브랜드 DNA:
{brand_dna}

포함 요소:
- 여행지: {data['destination']}
- 여행 일정: {data['schedule']}
- 여행 컨셉: {data['concept']}
- 여행 특징: {data['features']}
- 출발 문구: {data['departure']}

구성:
- 인물 이미지를 주인공으로 크게 배치
- 여행지 이미지들을 하나의 자연스러운 콜라주로 배치
- 로고는 상단 우측에 깔끔하게 배치
- 출발 문구는 가장 눈에 띄는 금색 배지 또는 리본 형태로 크게 배치
- 브랜드 DNA에서 추출한 3색 컬러 팔레트 유지
- 여행의 컨셉, 대표 여행지, 주요 특징이 모두 보이게 구성
- 너무 복잡하지 않게 광고 포스터처럼 고급스럽게 구성
- 한국어 텍스트는 오탈자 없이 명확하고 읽기 쉽게 배치
{extra}
""".strip()


def parse_json_array(text):
    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.strip("`")
        if cleaned.startswith("json"):
            cleaned = cleaned[4:].strip()
    start = cleaned.find("[")
    end = cleaned.rfind("]")
    if start >= 0 and end >= start:
        cleaned = cleaned[start : end + 1]
    parsed = json.loads(cleaned)
    if len(parsed) != 9:
        raise ValueError("피드 프롬프트는 반드시 9개여야 합니다.")
    return parsed


def reference_images_for_feed(number, data):
    if number in {1, 5, 9}:
        return data["person_images"] + data["destination_images"][:2]
    if number in {2, 6, 7}:
        logo = [data["logo_image"]] if data["logo_image"] else []
        return logo + data["destination_images"][:1]
    return data["destination_images"][:3]


def call_brand_dna(client, data):
    content = [{"type": "input_text", "text": brand_prompt(data)}]
    for label, paths in [
        ("여행지 이미지", data["destination_images"]),
        ("인물 이미지", data["person_images"]),
        ("로고 이미지", [data["logo_image"]] if data["logo_image"] else []),
    ]:
        for path in paths:
            content.append({"type": "input_text", "text": f"{label}: {Path(path).name}"})
            content.append({"type": "input_image", "image_url": image_to_data_url(path)})
    response = client.responses.create(model=data["text_model"], input=[{"role": "user", "content": content}])
    brand_dna = response.output_text
    (get_output_dir() / "brand_dna.md").write_text(brand_dna, encoding="utf-8")
    st.session_state.brand_dna = brand_dna
    return brand_dna


def generate_image(client, model, prompt, size, quality, output_path, reference_paths=None):
    reference_paths = [path for path in (reference_paths or []) if path]
    files = []
    try:
        if reference_paths:
            for path in reference_paths:
                files.append(open(path, "rb"))
            response = client.images.edit(model=model, image=files, prompt=prompt, size=size, quality=quality)
        else:
            response = client.images.generate(model=model, prompt=prompt, size=size, quality=quality)
    finally:
        for file in files:
            file.close()
    output_path.write_bytes(base64.b64decode(response.data[0].b64_json))
    return str(output_path)


def generate_feed(client, data, brand_dna):
    output_dir = get_output_dir()
    prompt_response = client.responses.create(
        model=data["text_model"],
        input=[{"role": "user", "content": [{"type": "input_text", "text": feed_prompt_design_prompt(data, brand_dna)}]}],
    )
    prompts = parse_json_array(prompt_response.output_text)
    (output_dir / "feed_prompts.json").write_text(json.dumps(prompts, ensure_ascii=False, indent=2), encoding="utf-8")
    files = []
    progress = st.progress(0, text="피드 이미지 생성 준비 중...")
    for index, item in enumerate(prompts, start=1):
        progress.progress((index - 1) / 9, text=f"피드 {index}/9 생성 중...")
        output_path = output_dir / f"feed_{index:02d}.png"
        files.append(generate_image(client, data["image_model"], item["prompt"], "1024x1024", data["quality"], output_path, reference_images_for_feed(index, data)))
    progress.progress(1.0, text="피드 9장 생성 완료")
    st.session_state.feed_prompts = prompts
    st.session_state.feed_files = files
    create_zip_file(output_dir)
    return files


def regenerate_feed_image(client, data, number, revision):
    if not st.session_state.feed_prompts:
        raise ValueError("먼저 작업 2를 실행하세요.")
    output_dir = get_output_dir()
    base_prompt = st.session_state.feed_prompts[number - 1]["prompt"]
    revised_prompt = f"{base_prompt}\n\n수정사항: {revision}\n브랜드 DNA와 전체 9장 톤앤매너를 유지한다."
    output_path = output_dir / f"feed_{number:02d}.png"
    generate_image(client, data["image_model"], revised_prompt, "1024x1024", data["quality"], output_path, reference_images_for_feed(number, data))
    st.session_state.feed_prompts[number - 1]["prompt"] = revised_prompt
    (output_dir / "feed_prompts.json").write_text(json.dumps(st.session_state.feed_prompts, ensure_ascii=False, indent=2), encoding="utf-8")
    files = [str(output_dir / f"feed_{index:02d}.png") for index in range(1, 10) if (output_dir / f"feed_{index:02d}.png").exists()]
    st.session_state.feed_files = files
    create_zip_file(output_dir)
    return str(output_path)


def generate_poster(client, data, brand_dna, revision=""):
    output_dir = get_output_dir()
    prompt = poster_prompt(data, brand_dna, revision)
    (output_dir / "poster_prompt.txt").write_text(prompt, encoding="utf-8")
    refs = data["destination_images"] + data["person_images"] + ([data["logo_image"]] if data["logo_image"] else [])
    path = generate_image(client, data["image_model"], prompt, "1024x1536", data["quality"], output_dir / "poster.png", refs)
    st.session_state.poster_file = path
    create_zip_file(output_dir)
    return path


def create_zip_file(output_dir):
    output_dir = Path(output_dir)
    zip_path = output_dir / "travel_assets.zip"
    if zip_path.exists():
        zip_path.unlink()
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as archive:
        for path in output_dir.rglob("*"):
            if path.is_file() and path.name != zip_path.name:
                archive.write(path, path.relative_to(output_dir))
    return zip_path


def download_zip_widget():
    output_dir = get_output_dir()
    zip_path = create_zip_file(output_dir)
    st.download_button(
        "결과 ZIP 다운로드",
        data=zip_path.read_bytes(),
        file_name="travel_assets.zip",
        mime="application/zip",
        use_container_width=True,
    )


def show_feed_thumbnails(files):
    rows = [files[index : index + 3] for index in range(0, len(files), 3)]
    for row in rows:
        columns = st.columns(3)
        for column, file in zip(columns, row):
            number = Path(file).stem.split("_")[-1]
            column.image(file, caption=f"feed_{number}.png", use_column_width=True)


def render_sidebar_auth():
    st.sidebar.header("인증 / 모델")
    st.sidebar.info("OpenAI API는 API Key 인증을 사용합니다. ChatGPT 계정 ID/PW를 앱에 입력받거나 저장하지 않습니다.")
    api_key = st.sidebar.text_input("OpenAI API Key", value=os.getenv("OPENAI_API_KEY", ""), type="password")
    text_model = st.sidebar.text_input("텍스트 분석 모델", value=DEFAULT_TEXT_MODEL)
    image_model = st.sidebar.text_input("이미지 생성 모델", value=DEFAULT_IMAGE_MODEL)
    quality = st.sidebar.selectbox("이미지 품질", ["medium", "low", "high", "auto"], index=0)
    return api_key, text_model, image_model, quality


def main():
    init_state()
    st.title("여행 상품 인스타그램 9장 + 포스터 생성 웹앱")
    st.caption("브라우저에서 입력하고, outputs/YYYYMMDD_HHMMSS 폴더와 ZIP 파일로 결과를 저장합니다.")
    api_key, text_model, image_model, quality = render_sidebar_auth()

    input_tab, brand_tab, feed_tab, poster_tab = st.tabs(["0. 입력", "1. 브랜드 DNA", "2. 인스타 9장", "3. 포스터"])

    with input_tab:
        st.subheader("입력")
        destination_uploads = st.file_uploader("여행지 이미지 여러 장", type=IMAGE_TYPES, accept_multiple_files=True)
        person_uploads = st.file_uploader("인물 이미지 최대 3장", type=IMAGE_TYPES, accept_multiple_files=True)
        if person_uploads and len(person_uploads) > 3:
            st.warning("인물 이미지는 최대 3장만 저장됩니다.")
        logo_upload = st.file_uploader("로고 이미지 1장", type=IMAGE_TYPES, accept_multiple_files=False)
        destination = st.text_area("여행지")
        schedule = st.text_area("여행 일정")
        concept = st.text_area("여행 컨셉")
        features = st.text_area("여행 특징")
        departure = st.text_input("출발 문구", placeholder="예: 8월 7일 출발")
        if st.button("입력 저장", use_container_width=True):
            form_values = {
                "api_key": api_key,
                "text_model": text_model,
                "image_model": image_model,
                "quality": quality,
                "destination_uploads": destination_uploads,
                "person_uploads": person_uploads,
                "logo_upload": logo_upload,
                "destination": destination,
                "schedule": schedule,
                "concept": concept,
                "features": features,
                "departure": departure,
            }
            try:
                data = collect_and_save_inputs(form_values)
                st.success(f"입력이 저장되었습니다: {get_output_dir()}")
                st.json(data, expanded=False)
            except Exception as exc:
                st.error(str(exc))

    with brand_tab:
        st.subheader("작업 1: 브랜드 / 여행 DNA 추출")
        if st.button("작업 1 실행", use_container_width=True):
            try:
                if st.session_state.saved_inputs is None:
                    st.warning("먼저 0. 입력 탭에서 입력 저장을 눌러주세요.")
                else:
                    with st.spinner("브랜드 DNA 분석 중..."):
                        brand_dna = call_brand_dna(client_from_key(api_key), st.session_state.saved_inputs)
                    st.success("brand_dna.md 저장 완료")
                    st.markdown(brand_dna)
            except Exception as exc:
                st.error(str(exc))
        if st.session_state.brand_dna:
            st.download_button("brand_dna.md 다운로드", st.session_state.brand_dna, file_name="brand_dna.md", mime="text/markdown")
            st.markdown(st.session_state.brand_dna)

    with feed_tab:
        st.subheader("작업 2: 인스타그램 피드 9장 생성")
        if st.button("작업 2 실행", use_container_width=True):
            try:
                if st.session_state.saved_inputs is None or not st.session_state.brand_dna:
                    st.warning("먼저 입력 저장과 작업 1을 완료하세요.")
                else:
                    with st.spinner("피드 프롬프트 설계 및 이미지 생성 중..."):
                        files = generate_feed(client_from_key(api_key), st.session_state.saved_inputs, st.session_state.brand_dna)
                    st.success("피드 9장 생성 완료")
                    show_feed_thumbnails(files)
            except Exception as exc:
                st.error(str(exc))
        if st.session_state.feed_files:
            show_feed_thumbnails(st.session_state.feed_files)
            number = st.selectbox("수정할 이미지 번호", list(range(1, 10)), index=0)
            revision = st.text_area("수정사항", placeholder="예: 여행 특징에서 첫 줄을 빼고, 노팁/노옵션/노쇼핑 문구를 추가해줘")
            if st.button("선택 이미지 수정 재생성", use_container_width=True):
                try:
                    with st.spinner(f"feed_{number:02d}.png 재생성 중..."):
                        path = regenerate_feed_image(client_from_key(api_key), st.session_state.saved_inputs, number, revision)
                    st.success(f"재생성 완료: {path}")
                    st.image(path, caption=f"feed_{number:02d}.png", use_column_width=True)
                except Exception as exc:
                    st.error(str(exc))
            download_zip_widget()

    with poster_tab:
        st.subheader("작업 3: 포스터 생성")
        if st.button("작업 3 실행", use_container_width=True):
            try:
                if st.session_state.saved_inputs is None or not st.session_state.brand_dna:
                    st.warning("먼저 입력 저장과 작업 1을 완료하세요.")
                else:
                    with st.spinner("포스터 생성 중..."):
                        path = generate_poster(client_from_key(api_key), st.session_state.saved_inputs, st.session_state.brand_dna)
                    st.success("poster.png 저장 완료")
                    st.image(path, caption="poster.png", width=520)
            except Exception as exc:
                st.error(str(exc))
        if st.session_state.poster_file:
            st.image(st.session_state.poster_file, caption="poster.png", width=520)
            revision = st.text_area("포스터 수정사항", placeholder="포스터에서 출발 문구를 더 크게 보여줘")
            if st.button("수정사항 반영 재생성", use_container_width=True):
                try:
                    with st.spinner("포스터 재생성 중..."):
                        path = generate_poster(client_from_key(api_key), st.session_state.saved_inputs, st.session_state.brand_dna, revision)
                    st.success("포스터 재생성 완료")
                    st.image(path, caption="poster.png", width=520)
                except Exception as exc:
                    st.error(str(exc))
            download_zip_widget()


if __name__ == "__main__":
    main()
