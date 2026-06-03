import base64
import json
import os
import platform
import shutil
import subprocess
import sys
import zipfile
from datetime import datetime
from pathlib import Path

from openai import OpenAI
from PySide6.QtCore import QObject, QRunnable, Qt, QThreadPool, Signal
from PySide6.QtGui import QPixmap
from PySide6.QtWidgets import (
    QApplication,
    QComboBox,
    QFileDialog,
    QFormLayout,
    QGridLayout,
    QGroupBox,
    QHBoxLayout,
    QLabel,
    QLineEdit,
    QListWidget,
    QListWidgetItem,
    QMainWindow,
    QMessageBox,
    QPushButton,
    QPlainTextEdit,
    QScrollArea,
    QSpinBox,
    QTabWidget,
    QTextEdit,
    QVBoxLayout,
    QWidget,
)

IMAGE_FILTER = "Images (*.png *.jpg *.jpeg *.webp)"
DEFAULT_TEXT_MODEL = "gpt-5.5"
DEFAULT_IMAGE_MODEL = "gpt-image-2"


class WorkerSignals(QObject):
    started = Signal()
    progress = Signal(str)
    result = Signal(object)
    error = Signal(str)
    finished = Signal()


class Worker(QRunnable):
    def __init__(self, fn, *args, **kwargs):
        super().__init__()
        self.fn = fn
        self.args = args
        self.kwargs = kwargs
        self.signals = WorkerSignals()

    def run(self):
        self.signals.started.emit()
        try:
            result = self.fn(self.signals.progress, *self.args, **self.kwargs)
            self.signals.result.emit(result)
        except Exception as exc:
            self.signals.error.emit(str(exc))
        finally:
            self.signals.finished.emit()


class TravelGeneratorApp(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("여행 상품 인스타그램/포스터 자동 생성기")
        self.resize(1280, 900)
        self.thread_pool = QThreadPool.globalInstance()
        self.destination_images = []
        self.person_images = []
        self.logo_image = None
        self.output_dir = None
        self.brand_dna = ""
        self.feed_prompts = []
        self.selected_feed_number = 1
        self.poster_path = None
        self._build_ui()

    def _build_ui(self):
        self.tabs = QTabWidget()
        self.setCentralWidget(self.tabs)
        self.tabs.addTab(self._build_input_tab(), "0. 입력")
        self.tabs.addTab(self._build_brand_tab(), "1. 브랜드 DNA")
        self.tabs.addTab(self._build_feed_tab(), "2. 인스타 9장")
        self.tabs.addTab(self._build_poster_tab(), "3. 포스터")

    def _build_input_tab(self):
        root = QWidget()
        layout = QVBoxLayout(root)

        auth_group = QGroupBox("인증 / 모델")
        auth_layout = QFormLayout(auth_group)
        self.api_key_edit = QLineEdit(os.getenv("OPENAI_API_KEY", ""))
        self.api_key_edit.setEchoMode(QLineEdit.Password)
        self.api_key_edit.setPlaceholderText("OpenAI API key (ChatGPT 로그인 ID/PW 사용 불가)")
        self.text_model_edit = QLineEdit(DEFAULT_TEXT_MODEL)
        self.image_model_edit = QLineEdit(DEFAULT_IMAGE_MODEL)
        self.quality_combo = QComboBox()
        self.quality_combo.addItems(["medium", "low", "high", "auto"])
        auth_layout.addRow("OpenAI API Key", self.api_key_edit)
        auth_layout.addRow("텍스트 분석 모델", self.text_model_edit)
        auth_layout.addRow("이미지 생성 모델", self.image_model_edit)
        auth_layout.addRow("이미지 품질", self.quality_combo)
        layout.addWidget(auth_group)

        image_group = QGroupBox("이미지 입력")
        image_layout = QGridLayout(image_group)
        self.destination_list = QListWidget()
        self.person_list = QListWidget()
        self.logo_label = QLabel("선택된 로고 없음")
        add_destination = QPushButton("여행지 이미지 추가")
        add_destination.clicked.connect(self.add_destination_images)
        add_person = QPushButton("인물 이미지 추가 (최대 3장)")
        add_person.clicked.connect(self.add_person_images)
        add_logo = QPushButton("로고 이미지 추가 (1장)")
        add_logo.clicked.connect(self.add_logo_image)
        clear_images = QPushButton("이미지 입력 초기화")
        clear_images.clicked.connect(self.clear_images)
        image_layout.addWidget(add_destination, 0, 0)
        image_layout.addWidget(add_person, 0, 1)
        image_layout.addWidget(add_logo, 0, 2)
        image_layout.addWidget(QLabel("여행지 이미지"), 1, 0)
        image_layout.addWidget(QLabel("인물 이미지"), 1, 1)
        image_layout.addWidget(QLabel("로고"), 1, 2)
        image_layout.addWidget(self.destination_list, 2, 0)
        image_layout.addWidget(self.person_list, 2, 1)
        image_layout.addWidget(self.logo_label, 2, 2)
        image_layout.addWidget(clear_images, 3, 0, 1, 3)
        layout.addWidget(image_group)

        text_group = QGroupBox("텍스트 입력")
        text_layout = QFormLayout(text_group)
        self.destination_text = QPlainTextEdit()
        self.schedule_text = QPlainTextEdit()
        self.concept_text = QPlainTextEdit()
        self.features_text = QPlainTextEdit()
        self.departure_text = QLineEdit()
        self.departure_text.setPlaceholderText("예: 8월 7일 출발")
        for editor in [self.destination_text, self.schedule_text, self.concept_text, self.features_text]:
            editor.setFixedHeight(70)
        text_layout.addRow("여행지", self.destination_text)
        text_layout.addRow("여행 일정", self.schedule_text)
        text_layout.addRow("여행 컨셉", self.concept_text)
        text_layout.addRow("여행 특징", self.features_text)
        text_layout.addRow("출발 문구", self.departure_text)
        layout.addWidget(text_group)

        save_button = QPushButton("입력 저장 버튼")
        save_button.clicked.connect(self.save_inputs)
        layout.addWidget(save_button)
        layout.addStretch(1)
        return root

    def _build_brand_tab(self):
        root = QWidget()
        layout = QVBoxLayout(root)
        self.brand_status = QLabel("대기 중")
        run_button = QPushButton("작업 1 실행")
        run_button.clicked.connect(self.run_brand_dna)
        save_button = QPushButton("결과 TXT 또는 MD 저장")
        save_button.clicked.connect(self.save_brand_dna_as)
        self.brand_output = QTextEdit()
        self.brand_output.setAcceptRichText(False)
        layout.addWidget(run_button)
        layout.addWidget(self.brand_status)
        layout.addWidget(self.brand_output)
        layout.addWidget(save_button)
        return root

    def _build_feed_tab(self):
        root = QWidget()
        layout = QVBoxLayout(root)
        controls = QHBoxLayout()
        run_button = QPushButton("작업 2 실행")
        run_button.clicked.connect(self.run_feed_generation)
        open_button = QPushButton("생성 이미지 폴더 열기")
        open_button.clicked.connect(self.open_output_dir)
        zip_button = QPushButton("결과 ZIP 만들기/다운로드")
        zip_button.clicked.connect(self.create_zip)
        controls.addWidget(run_button)
        controls.addWidget(open_button)
        controls.addWidget(zip_button)
        layout.addLayout(controls)
        self.feed_status = QLabel("대기 중")
        layout.addWidget(self.feed_status)
        self.feed_grid = QGridLayout()
        thumbs = QWidget()
        thumbs.setLayout(self.feed_grid)
        scroll = QScrollArea()
        scroll.setWidgetResizable(True)
        scroll.setWidget(thumbs)
        layout.addWidget(scroll, 1)
        edit_controls = QHBoxLayout()
        self.feed_number = QSpinBox()
        self.feed_number.setRange(1, 9)
        self.feed_number.valueChanged.connect(lambda n: setattr(self, "selected_feed_number", n))
        self.feed_revision = QPlainTextEdit()
        self.feed_revision.setPlaceholderText("선택 이미지 수정사항을 입력하세요")
        regen_button = QPushButton("선택 이미지 수정 재생성")
        regen_button.clicked.connect(self.regenerate_selected_feed)
        edit_controls.addWidget(QLabel("이미지 번호"))
        edit_controls.addWidget(self.feed_number)
        edit_controls.addWidget(self.feed_revision, 1)
        edit_controls.addWidget(regen_button)
        layout.addLayout(edit_controls)
        return root

    def _build_poster_tab(self):
        root = QWidget()
        layout = QVBoxLayout(root)
        controls = QHBoxLayout()
        run_button = QPushButton("작업 3 실행")
        run_button.clicked.connect(self.run_poster_generation)
        open_button = QPushButton("저장 폴더 열기")
        open_button.clicked.connect(self.open_output_dir)
        controls.addWidget(run_button)
        controls.addWidget(open_button)
        layout.addLayout(controls)
        self.poster_status = QLabel("대기 중")
        layout.addWidget(self.poster_status)
        self.poster_preview = QLabel("포스터 미리보기")
        self.poster_preview.setAlignment(Qt.AlignCenter)
        self.poster_preview.setMinimumHeight(520)
        layout.addWidget(self.poster_preview, 1)
        self.poster_revision = QPlainTextEdit()
        self.poster_revision.setPlaceholderText("포스터 수정사항 입력")
        regen_button = QPushButton("수정사항 반영 재생성")
        regen_button.clicked.connect(self.regenerate_poster)
        layout.addWidget(self.poster_revision)
        layout.addWidget(regen_button)
        return root

    def add_destination_images(self):
        files, _ = QFileDialog.getOpenFileNames(self, "여행지 이미지 선택", "", IMAGE_FILTER)
        self.destination_images.extend(files)
        self._refresh_image_lists()

    def add_person_images(self):
        files, _ = QFileDialog.getOpenFileNames(self, "인물 이미지 선택", "", IMAGE_FILTER)
        if len(self.person_images) + len(files) > 3:
            QMessageBox.warning(self, "인물 이미지 제한", "인물 이미지는 최대 3장까지 선택할 수 있습니다.")
            files = files[: max(0, 3 - len(self.person_images))]
        self.person_images.extend(files)
        self._refresh_image_lists()

    def add_logo_image(self):
        file, _ = QFileDialog.getOpenFileName(self, "로고 이미지 선택", "", IMAGE_FILTER)
        if file:
            self.logo_image = file
            self._refresh_image_lists()

    def clear_images(self):
        self.destination_images = []
        self.person_images = []
        self.logo_image = None
        self._refresh_image_lists()

    def _refresh_image_lists(self):
        self.destination_list.clear()
        self.person_list.clear()
        for path in self.destination_images:
            self.destination_list.addItem(path)
        for path in self.person_images:
            self.person_list.addItem(path)
        self.logo_label.setText(self.logo_image or "선택된 로고 없음")

    def collect_inputs(self):
        return {
            "destination_images": self.destination_images,
            "person_images": self.person_images,
            "logo_image": self.logo_image,
            "destination": self.destination_text.toPlainText().strip(),
            "schedule": self.schedule_text.toPlainText().strip(),
            "concept": self.concept_text.toPlainText().strip(),
            "features": self.features_text.toPlainText().strip(),
            "departure": self.departure_text.text().strip(),
            "text_model": self.text_model_edit.text().strip() or DEFAULT_TEXT_MODEL,
            "image_model": self.image_model_edit.text().strip() or DEFAULT_IMAGE_MODEL,
            "quality": self.quality_combo.currentText(),
        }

    def ensure_output_dir(self):
        if self.output_dir is None:
            self.output_dir = Path("outputs") / datetime.now().strftime("%Y%m%d_%H%M%S")
            self.output_dir.mkdir(parents=True, exist_ok=True)
        return self.output_dir

    def save_inputs(self):
        output_dir = self.ensure_output_dir()
        config = self.collect_inputs()
        config_without_key = dict(config)
        config_without_key["api_key_saved"] = bool(self.api_key_edit.text().strip())
        (output_dir / "input_config.json").write_text(
            json.dumps(config_without_key, ensure_ascii=False, indent=2), encoding="utf-8"
        )
        QMessageBox.information(self, "저장 완료", f"입력이 저장되었습니다:\n{output_dir}")

    def _client(self):
        api_key = self.api_key_edit.text().strip() or os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("OpenAI API key를 입력하거나 OPENAI_API_KEY 환경 변수를 설정하세요. ChatGPT 계정 비밀번호는 사용하지 않습니다.")
        return OpenAI(api_key=api_key)

    def run_brand_dna(self):
        self.save_inputs()
        worker = Worker(self._brand_dna_task, self.collect_inputs(), str(self.ensure_output_dir()))
        worker.signals.progress.connect(self.brand_status.setText)
        worker.signals.result.connect(self._brand_done)
        worker.signals.error.connect(lambda e: QMessageBox.critical(self, "작업 1 오류", e))
        self.thread_pool.start(worker)

    def _brand_dna_task(self, progress, data, output_dir):
        progress.emit("브랜드 DNA 분석 중...")
        client = self._client()
        content = [
            {"type": "input_text", "text": brand_prompt(data)},
        ]
        for label, paths in [
            ("여행지 이미지", data["destination_images"]),
            ("인물 이미지", data["person_images"]),
            ("로고 이미지", [data["logo_image"]] if data["logo_image"] else []),
        ]:
            for path in paths:
                content.append({"type": "input_text", "text": f"{label}: {Path(path).name}"})
                content.append({"type": "input_image", "image_url": image_to_data_url(path)})
        response = client.responses.create(model=data["text_model"], input=[{"role": "user", "content": content}])
        text = response.output_text
        Path(output_dir, "brand_dna.md").write_text(text, encoding="utf-8")
        return text

    def _brand_done(self, text):
        self.brand_dna = text
        self.brand_output.setPlainText(text)
        self.brand_status.setText("완료: brand_dna.md 저장됨")

    def save_brand_dna_as(self):
        if not self.brand_output.toPlainText().strip():
            QMessageBox.warning(self, "저장 불가", "저장할 브랜드 DNA 결과가 없습니다.")
            return
        file, _ = QFileDialog.getSaveFileName(self, "브랜드 DNA 저장", "brand_dna.md", "Markdown (*.md);;Text (*.txt)")
        if file:
            Path(file).write_text(self.brand_output.toPlainText(), encoding="utf-8")

    def run_feed_generation(self):
        if not self.brand_output.toPlainText().strip():
            QMessageBox.warning(self, "작업 순서", "작업 1 브랜드 DNA를 먼저 실행하세요.")
            return
        worker = Worker(self._feed_task, self.collect_inputs(), self.brand_output.toPlainText(), str(self.ensure_output_dir()))
        worker.signals.progress.connect(self.feed_status.setText)
        worker.signals.result.connect(self._feed_done)
        worker.signals.error.connect(lambda e: QMessageBox.critical(self, "작업 2 오류", e))
        self.thread_pool.start(worker)

    def _feed_task(self, progress, data, brand_dna, output_dir):
        client = self._client()
        progress.emit("9장 프롬프트 설계 중...")
        prompt_response = client.responses.create(
            model=data["text_model"],
            input=[{"role": "user", "content": [{"type": "input_text", "text": feed_prompt_design_prompt(data, brand_dna)}]}],
        )
        prompts = parse_json_array(prompt_response.output_text)
        Path(output_dir, "feed_prompts.json").write_text(json.dumps(prompts, ensure_ascii=False, indent=2), encoding="utf-8")
        files = []
        for index, item in enumerate(prompts, start=1):
            progress.emit(f"피드 {index}/9 생성 중...")
            refs = reference_images_for_feed(index, data)
            output_path = Path(output_dir, f"feed_{index:02d}.png")
            generate_image(client, data["image_model"], item["prompt"], "1024x1024", data["quality"], output_path, refs)
            files.append(str(output_path))
        create_zip_file(output_dir)
        return {"prompts": prompts, "files": files}

    def _feed_done(self, result):
        self.feed_prompts = result["prompts"]
        self.feed_status.setText("완료: 9장 이미지 생성됨")
        self.show_feed_thumbnails(result["files"])

    def show_feed_thumbnails(self, files):
        clear_layout(self.feed_grid)
        for idx, path in enumerate(files, start=1):
            button = QPushButton()
            button.setText(f"{idx}번")
            pixmap = QPixmap(path)
            if not pixmap.isNull():
                button.setIcon(pixmap.scaled(180, 180, Qt.KeepAspectRatio, Qt.SmoothTransformation))
                button.setIconSize(button.icon().actualSize(button.sizeHint()))
            button.clicked.connect(lambda checked=False, n=idx: self.feed_number.setValue(n))
            self.feed_grid.addWidget(button, (idx - 1) // 3, (idx - 1) % 3)

    def regenerate_selected_feed(self):
        if not self.feed_prompts:
            QMessageBox.warning(self, "재생성 불가", "먼저 작업 2를 실행하세요.")
            return
        n = self.feed_number.value()
        revision = self.feed_revision.toPlainText().strip()
        worker = Worker(self._regen_feed_task, self.collect_inputs(), self.brand_output.toPlainText(), str(self.ensure_output_dir()), n, revision)
        worker.signals.progress.connect(self.feed_status.setText)
        worker.signals.result.connect(lambda _: self.show_feed_thumbnails([str(self.ensure_output_dir() / f"feed_{i:02d}.png") for i in range(1, 10)]))
        worker.signals.error.connect(lambda e: QMessageBox.critical(self, "피드 재생성 오류", e))
        self.thread_pool.start(worker)

    def _regen_feed_task(self, progress, data, brand_dna, output_dir, n, revision):
        client = self._client()
        base_prompt = self.feed_prompts[n - 1]["prompt"] if self.feed_prompts else ""
        revised_prompt = f"{base_prompt}\n\n수정사항: {revision}\n브랜드 DNA와 전체 9장 톤앤매너를 유지한다."
        progress.emit(f"피드 {n}번 재생성 중...")
        generate_image(client, data["image_model"], revised_prompt, "1024x1024", data["quality"], Path(output_dir, f"feed_{n:02d}.png"), reference_images_for_feed(n, data))
        if self.feed_prompts:
            self.feed_prompts[n - 1]["prompt"] = revised_prompt
            Path(output_dir, "feed_prompts.json").write_text(json.dumps(self.feed_prompts, ensure_ascii=False, indent=2), encoding="utf-8")
        create_zip_file(output_dir)
        return True

    def run_poster_generation(self):
        if not self.brand_output.toPlainText().strip():
            QMessageBox.warning(self, "작업 순서", "작업 1 브랜드 DNA를 먼저 실행하세요.")
            return
        worker = Worker(self._poster_task, self.collect_inputs(), self.brand_output.toPlainText(), str(self.ensure_output_dir()), "")
        worker.signals.progress.connect(self.poster_status.setText)
        worker.signals.result.connect(self._poster_done)
        worker.signals.error.connect(lambda e: QMessageBox.critical(self, "작업 3 오류", e))
        self.thread_pool.start(worker)

    def regenerate_poster(self):
        worker = Worker(
            self._poster_task,
            self.collect_inputs(),
            self.brand_output.toPlainText(),
            str(self.ensure_output_dir()),
            self.poster_revision.toPlainText().strip(),
        )
        worker.signals.progress.connect(self.poster_status.setText)
        worker.signals.result.connect(self._poster_done)
        worker.signals.error.connect(lambda e: QMessageBox.critical(self, "포스터 재생성 오류", e))
        self.thread_pool.start(worker)

    def _poster_task(self, progress, data, brand_dna, output_dir, revision):
        client = self._client()
        prompt = poster_prompt(data, brand_dna, revision)
        Path(output_dir, "poster_prompt.txt").write_text(prompt, encoding="utf-8")
        progress.emit("포스터 생성 중...")
        output_path = Path(output_dir, "poster.png")
        refs = data["destination_images"] + data["person_images"] + ([data["logo_image"]] if data["logo_image"] else [])
        generate_image(client, data["image_model"], prompt, "1024x1536", data["quality"], output_path, refs)
        create_zip_file(output_dir)
        return str(output_path)

    def _poster_done(self, path):
        self.poster_path = path
        pixmap = QPixmap(path)
        self.poster_preview.setPixmap(pixmap.scaled(520, 760, Qt.KeepAspectRatio, Qt.SmoothTransformation))
        self.poster_status.setText("완료: poster.png 저장됨")

    def open_output_dir(self):
        output_dir = self.ensure_output_dir().resolve()
        if platform.system() == "Darwin":
            subprocess.Popen(["open", str(output_dir)])
        elif platform.system() == "Windows":
            os.startfile(str(output_dir))
        else:
            subprocess.Popen(["xdg-open", str(output_dir)])

    def create_zip(self):
        output_dir = self.ensure_output_dir()
        zip_path = create_zip_file(output_dir)
        QMessageBox.information(self, "ZIP 생성 완료", f"ZIP 파일이 생성되었습니다:\n{zip_path}")


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


def image_to_data_url(path):
    suffix = Path(path).suffix.lower().lstrip(".")
    mime = "jpeg" if suffix in {"jpg", "jpeg"} else suffix
    data = base64.b64encode(Path(path).read_bytes()).decode("utf-8")
    return f"data:image/{mime};base64,{data}"


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
        return ([data["logo_image"]] if data["logo_image"] else []) + data["destination_images"][:1]
    return data["destination_images"][:3]


def generate_image(client, model, prompt, size, quality, output_path, reference_paths=None):
    reference_paths = [p for p in (reference_paths or []) if p]
    response = None
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
    image_b64 = response.data[0].b64_json
    output_path.write_bytes(base64.b64decode(image_b64))


def create_zip_file(output_dir):
    output_dir = Path(output_dir)
    zip_path = output_dir / "travel_assets.zip"
    if zip_path.exists():
        zip_path.unlink()
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as archive:
        for path in output_dir.iterdir():
            if path.is_file() and path.name != zip_path.name:
                archive.write(path, path.name)
    return zip_path


def clear_layout(layout):
    while layout.count():
        item = layout.takeAt(0)
        widget = item.widget()
        if widget is not None:
            widget.deleteLater()


if __name__ == "__main__":
    app = QApplication(sys.argv)
    window = TravelGeneratorApp()
    window.show()
    sys.exit(app.exec())
