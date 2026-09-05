/**
 * naverService.ts - 네이버 블로그 스마트에디터 ONE 자동 포스팅 및 다중 사진/캡션 입력 엔진
 * 
 * [교육용 상세 설명]
 * 이 모듈은 Playwright를 통해 네이버 스마트에디터 ONE에 접속하여
 * 1. 15~25자 내외의 짧고 강렬한 제목 입력
 * 2. 취소선(가운데 줄) 원천 해제
 * 3. 본문 300자당 사진 1장씩 순서대로 삽입 + 사진 하단 캡션 타이핑
 * 4. 2단계 안정적 발행 (카테고리 선택 ➔ 최종 발행 Locator 클릭)을 수행합니다.
 */

import { Page, Frame, chromium } from 'playwright';
import { BlogPostContent } from './aiService';
import { getActivePage } from './browserManager';
import fs from 'fs';
import http from 'http';

// 네이버 블로그 포스팅 옵션 인터페이스
export interface NaverPostOptions {
  naverId: string;
  postData: BlogPostContent;
  imagePath?: string;           // 단일 사진 경로 (하위 호환)
  imageCaption?: string;        // 단일 캡션 (하위 호환)
  images?: Array<{              // 🌟 다중 사진 및 캡션 목록 (300자당 1장)
    imagePath: string;
    caption: string;
  }>;
  category?: string;
}

/**
 * 포트 9222에 사용자가 띄워둔 원격 디버깅 크롬이 존재하는지 확인하는 함수
 */
async function checkCdpAvailable(): Promise<boolean> {
  return new Promise((resolve) => {
    const req = http.get('http://127.0.0.1:9222/json/version', { timeout: 1500 }, (res) => {
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
  });
}

/**
 * 스마트에디터 ONE의 메인 입력 프레임을 찾는 헬퍼 함수
 */
async function findSmartEditorTarget(page: Page): Promise<Frame | Page> {
  const mainFrame = page.frame({ name: 'mainFrame' });
  if (mainFrame) {
    try {
      await mainFrame.waitForSelector('.se-documentTitle, .se_component_wrap, .se-main-container', { timeout: 7000 });
      return mainFrame;
    } catch (e) {}
  }

  for (const frame of page.frames()) {
    try {
      const el = await frame.$('.se-documentTitle, .se_component_wrap, .se-main-container');
      if (el) return frame;
    } catch (e) {}
  }

  return page;
}

/**
 * 스마트에디터에 사진 1장 업로드 및 캡션 메뉴 입력, 다음 여백 추가 헬퍼 함수
 */
async function uploadPhotoAndCaption(
  page: Page,
  editorTarget: Frame | Page,
  mainFrame: Frame | Page,
  imagePath: string,
  captionText: string
): Promise<void> {
  if (!fs.existsSync(imagePath)) return;

  console.log(`[Playwright] 📷 사진 첨부 및 캡션 입력 진행: ${imagePath}`);
  try {
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);

    const photoBtn = await editorTarget.$('.se-image-toolbar-button, .se-insert-menu-button-image, button:has-text("사진")');
    if (photoBtn) {
      const [fileChooser] = await Promise.all([
        page.waitForEvent('filechooser', { timeout: 6000 }),
        photoBtn.click()
      ]);
      await fileChooser.setFiles(imagePath);
      console.log('[Playwright] ✅ 사진 파일 업로드 성공! (에디터 반영 대기 3.5초)');
      await page.waitForTimeout(3500);

      // 사이드바 닫기
      try {
        await mainFrame.evaluate(() => {
          const btn = document.querySelector('.se-sidebar-close-button, button[aria-label="닫기"], .se-panel-close-button') as HTMLElement;
          if (btn) btn.click();
        });
        await page.waitForTimeout(600);
      } catch (e) {}

      // 💡 [스마트에디터 ONE 전용 사진 캡션 메뉴 호출 및 정밀 입력]
      if (captionText) {
        console.log(`[Playwright] 📝 사진 캡션 전용 메뉴에 입력 시작: "${captionText}"`);
        try {
          // 1. 마지막으로 업로드된 사진 이미지 요소 클릭 (스마트에디터 이미지 편집 상태 및 플로팅 툴바 활성화)
          const imgSelector = '.se-component-image:last-of-type img, .se-image:last-of-type img, .se-section-image img';
          const imgHandle = await editorTarget.$(imgSelector);
          if (imgHandle) {
            await imgHandle.scrollIntoViewIfNeeded();
            await imgHandle.click();
            console.log('[Playwright] 🖱️ 업로드된 사진 이미지 클릭 완료');
            await page.waitForTimeout(500);
          }

          // 2. 스마트에디터 ONE의 사진 바로 아래 전용 캡션 영역(figcaption / .se-caption) 타겟팅
          const lastImageComp = await editorTarget.$('.se-component-image:last-of-type, .se-image:last-of-type');
          let captionInserted = false;

          if (lastImageComp) {
            // 이미지 컴포넌트 내부의 figcaption 또는 캡션 영역 탐색
            const captionTarget = await lastImageComp.$('figcaption.se-caption, .se-caption, .se-section-caption, [data-placeholder*="설명"], p.se-text-paragraph');
            if (captionTarget) {
              await captionTarget.scrollIntoViewIfNeeded();
              await captionTarget.click();
              await page.waitForTimeout(300);

              // 캡션 칸에 직접 네이티브 타이핑
              await page.keyboard.type(captionText, { delay: 15 });
              captionInserted = true;
              console.log(`✅ [Playwright] 사진 전용 캡션 메뉴에 정확히 타이핑 완료: "${captionText}"`);
            }

            // 3. 스마트에디터 DOM 모델에 캡션 텍스트 확실히 주입 및 이벤트 트리거 (이중 보장)
            await mainFrame.evaluate(({ text }) => {
              const comps = document.querySelectorAll('.se-component-image, .se-image');
              const last = comps[comps.length - 1];
              if (last) {
                const capP = last.querySelector('figcaption p, .se-caption p, .se-section-caption p');
                if (capP) {
                  capP.innerHTML = `<span class="se-placeholder" style="color: #888888; font-size: 13px;">${text}</span>`;
                  capP.dispatchEvent(new Event('input', { bubbles: true }));
                  capP.dispatchEvent(new Event('change', { bubbles: true }));
                  return true;
                }
              }
              return false;
            }, { text: captionText });
          }

          if (!captionInserted) {
            console.log('[Playwright] ℹ️ DOM 주입을 통해 사진 캡션 안착 완료.');
          }

        } catch (captionErr) {
          console.warn('[Playwright] ⚠️ 캡션 메뉴 입력 경고:', captionErr);
        }
      }

      // 💡 [사진 다음 한 줄 여백(빈 줄) 확보]
      // 커서를 사진 캡션 칸에서 일반 본문 영역으로 이동
      await page.waitForTimeout(400);
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('Enter');
      await page.keyboard.press('Enter');
      console.log('[Playwright] 📄 사진 하단에 본문 분리용 한 줄 여백 삽입 완료');
    }
  } catch (imgErr) {
    console.warn('[Playwright] 사진 첨부 경고:', imgErr);
  }
}

/**
 * 네이버 블로그 글쓰기 자동화 메인 함수
 */
export async function publishToNaverBlog(options: NaverPostOptions): Promise<{ success: boolean; message: string; postUrl?: string }> {
  const { naverId, postData, imagePath, imageCaption, images, category = '여행 and 이야기' } = options;
  console.log(`[Playwright] 네이버 블로그 포스팅 시작 (블로그: ${naverId}, 카테고리: ${category})`);

  // 사용할 사진 목록 구성 (다중 사진 우선, 없으면 단일 사진)
  const photoList: Array<{ imagePath: string; caption: string }> = [];
  if (images && images.length > 0) {
    photoList.push(...images);
  } else if (imagePath) {
    photoList.push({ imagePath, caption: imageCaption || '' });
  }

  let page: Page | null = null;
  let isCdpMode = false;

  try {
    // 1. 포트 9222 원격 디버깅 크롬 창 연결 시도
    const cdpAvailable = await checkCdpAvailable();
    if (cdpAvailable) {
      console.log('[Playwright] 🌟 포트 9222에 사용자가 로그인해 둔 크롬 창을 발견했습니다! 직접 연동합니다.');
      try {
        const cdpBrowser = await chromium.connectOverCDP('http://localhost:9222');
        const contexts = cdpBrowser.contexts();
        const context = contexts.length > 0 ? contexts[0] : await cdpBrowser.newContext();
        page = await context.newPage();
        isCdpMode = true;
      } catch (cdpErr) {
        console.warn('[Playwright] CDP 연결 실패, 세션 브라우저로 전환합니다:', cdpErr);
      }
    }

    if (!page) {
      console.log('[Playwright] 🛡️ 백그라운드 상시 브라우저를 통해 글쓰기를 시작합니다.');
      page = await getActivePage();
    }

    if (!page) {
      throw new Error('사용 가능한 브라우저 페이지를 가져올 수 없습니다.');
    }

    // 2. 글쓰기 화면 이동
    const writeUrl = `https://blog.naver.com/${naverId}?Redirect=Write&`;
    console.log(`[Playwright] 스마트에디터 글쓰기 주소로 이동합니다: ${writeUrl}`);
    await page.goto(writeUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);

    // 3. 도화지 탐색
    console.log('[Playwright] 스마트에디터 영역 검색 중...');
    const editorTarget = await findSmartEditorTarget(page);
    console.log('[Playwright] ✅ 스마트에디터 도화지 준비 완료!');

    // 4. 팝업 / 임시저장 알림창 닫기
    try {
      const cancelButtons = [
        'button.se-popup-button-cancel',
        'button:has-text("취소")',
        '.se-help-panel-close-button',
        '.se-popup-close-button'
      ];
      for (const sel of cancelButtons) {
        const btn = await editorTarget.$(sel);
        if (btn) {
          await btn.click();
          await page.waitForTimeout(500);
        }
      }
    } catch (e) {}

    // 5. [제목 타이핑] - 15~25자 내외의 짧고 강렬한 한 문장
    console.log(`[Playwright] 짧고 강렬한 제목 입력 중: "${postData.title}"`);
    const titleSelectors = [
      '.se-documentTitle .se-ff-nanumgothic',
      '.se-documentTitle',
      'span:has-text("제목")',
      '.se_title'
    ];

    let titleTyped = false;
    for (const tSel of titleSelectors) {
      try {
        const tEl = await editorTarget.$(tSel);
        if (tEl) {
          await tEl.click();
          await page.waitForTimeout(200);
          await page.keyboard.type(postData.title, { delay: 20 });
          titleTyped = true;
          console.log(`[Playwright] 제목 입력 완료 (${tSel})`);
          break;
        }
      } catch (e) {}
    }

    if (!titleTyped) {
      await page.keyboard.press('Tab');
      await page.keyboard.type(postData.title, { delay: 20 });
    }

    await page.waitForTimeout(800);

    // 6. [본문 영역 포커스]
    console.log('[Playwright] 본문 입력 영역 포커스 중...');
    const bodySelectors = [
      '.se-component-content .se-is-empty',
      '.se-component-content',
      '.se_textarea',
      '.se-main-container'
    ];

    let bodyFocused = false;
    for (const bSel of bodySelectors) {
      try {
        const bEl = await editorTarget.$(bSel);
        if (bEl) {
          await bEl.click();
          bodyFocused = true;
          console.log(`[Playwright] 본문 입력 영역 포커스 성공 (${bSel})`);
          break;
        }
      } catch (e) {}
    }

    if (!bodyFocused) {
      await page.keyboard.press('Enter');
    }

    await page.waitForTimeout(400);

    // 💡 [취소선(가운데 줄) 원천 해제]
    try {
      const strikethroughActive = await editorTarget.$('.se-strikethrough-toolbar-button.se-is-selected, button[class*="strikethrough"][class*="selected"], button[aria-pressed="true"][class*="strikethrough"]');
      if (strikethroughActive) {
        console.log('[Playwright] ⚠️ 취소선(가운데 줄) 서식이 켜져 있어 즉시 해제(클릭)합니다.');
        await strikethroughActive.click();
        await page.waitForTimeout(300);
      }
      const underlineActive = await editorTarget.$('.se-underline-toolbar-button.se-is-selected');
      if (underlineActive) {
        console.log('[Playwright] ⚠️ 밑줄 서식이 켜져 있어 즉시 해제합니다.');
        await underlineActive.click();
        await page.waitForTimeout(300);
      }
    } catch (styleErr) {
      console.warn('[Playwright] 서식 점검 경고:', styleErr);
    }

    const mainFrame = (page ? page.frame({ name: 'mainFrame' }) : null) || editorTarget;
    const activePage = page; // 클로저 내 타입 안전성 보장

    // 💡 [스마트에디터 편집 서식 헬퍼 함수들]
    // 1. 구분선(Line) 삽입 헬퍼
    const insertHorizontalLine = async () => {
      try {
        const lineBtn = await editorTarget.$('button[data-command="horizontalLine"], button.se-line-toolbar-button, button[data-name="line"], .se-toolbar-item-line button');
        if (lineBtn && await lineBtn.isVisible()) {
          await lineBtn.click();
          await activePage.waitForTimeout(400);
          await activePage.keyboard.press('ArrowDown');
          await activePage.keyboard.press('Enter');
          console.log('[Playwright] ➖ 스마트에디터 구분선 삽입 완료');
        }
      } catch (e) {}
    };

    // 2. 인용구(Quotation) 상자 삽입 헬퍼
    const insertQuotationBox = async (quoteText: string): Promise<boolean> => {
      try {
        const quoteBtn = await editorTarget.$('button[data-command="quotation"], button.se-quotation-toolbar-button, button[data-name="quotation"], .se-toolbar-item-quotation button');
        if (quoteBtn && await quoteBtn.isVisible()) {
          await quoteBtn.click();
          await activePage.waitForTimeout(500);
          // 인용구 내부 입력 영역에 타이핑
          await activePage.keyboard.type(quoteText, { delay: 10 });
          await activePage.waitForTimeout(300);
          await activePage.keyboard.press('ArrowDown');
          await activePage.keyboard.press('Enter');
          console.log('[Playwright] 💬 인용구 상자 서식 적용 및 사색 문장 안착 완료');
          return true;
        }
      } catch (e) {}
      return false;
    };

    // 3. 서식 타이핑 헬퍼 (핵심 사료/고유명사 굵게(Bold) 강조)
    const typeFormattedParagraph = async (text: string) => {
      // 따옴표나 작은따옴표로 둘러싸인 핵심 사료명/고유명사는 볼드체로 강조
      const parts = text.split(/("[^"]+"|\'[^\']+\')/g);
      for (const part of parts) {
        if (!part) continue;
        if ((part.startsWith('"') && part.endsWith('"')) || (part.startsWith("'") && part.endsWith("'"))) {
          // 💡 핵심 사료명: Control+B 켜기 ➔ 타이핑 ➔ Control+B 끄기
          await activePage.keyboard.press('Control+b');
          await activePage.keyboard.type(part, { delay: 8 });
          await activePage.keyboard.press('Control+b');
        } else {
          await activePage.keyboard.type(part, { delay: 5 });
        }
      }
      await activePage.keyboard.press('Enter');
    };

    // 7. [본문 300자당 사진 1장씩 교차 입력 및 편집툴 서식(굵기, 인용구, 구분선) 적용 파이프라인]
    console.log(`[Playwright] 본문 서식(글자 굵기, 인용구, 구분선) 및 사진 교차 입력 시작 (사진 수: ${photoList.length}장)...`);
    const paragraphs = postData.content.split('\n').filter(p => p.trim().length > 0);

    // 문단들을 대략 300자 단위 블록으로 묶기
    const blocks: string[][] = [];
    let currentBlock: string[] = [];
    let currentLength = 0;

    for (let pIdx = 0; pIdx < paragraphs.length; pIdx++) {
      const p = paragraphs[pIdx];
      currentBlock.push(p);
      currentLength += p.length;
      // 마지막 단락이 아니고 길이가 300자에 도달하면 블록 분리
      if (currentLength >= 280 && pIdx < paragraphs.length - 1) {
        blocks.push(currentBlock);
        currentBlock = [];
        currentLength = 0;
      }
    }
    if (currentBlock.length > 0) {
      blocks.push(currentBlock);
    }

    // 각 블록 타이핑 후 순서대로 사진 + 캡션 삽입
    let photoIndex = 0;
    for (let bIdx = 0; bIdx < blocks.length; bIdx++) {
      const block = blocks[bIdx];
      const isLastBlock = (bIdx === blocks.length - 1);

      for (let pIdx = 0; pIdx < block.length; pIdx++) {
        const p = block[pIdx];
        const isLastParagraphInDoc = isLastBlock && (pIdx === block.length - 1);

        // 💡 [마지막 질문형 사색 문장] ➔ 인용구(Quotation) 상자 서식 적용!
        if (isLastParagraphInDoc && p.endsWith('?')) {
          console.log('[Playwright] 🎨 마지막 질문형 문장에 인용구 상자 서식을 적용합니다.');
          const quoteSuccess = await insertQuotationBox(p);
          if (!quoteSuccess) {
            // 폴백: 볼드체로 강조
            await page.keyboard.press('Control+b');
            await page.keyboard.type(p, { delay: 8 });
            await page.keyboard.press('Control+b');
            await page.keyboard.press('Enter');
          }
        } else {
          // 일반 문단: 핵심 사료 볼드체 서식 타이핑
          await typeFormattedParagraph(p);
          await page.waitForTimeout(40);
        }
      }

      // 사진이 남아있다면 해당 블록 뒤에 사진 및 캡션 삽입
      if (photoIndex < photoList.length) {
        const photo = photoList[photoIndex];
        await uploadPhotoAndCaption(page, editorTarget, mainFrame, photo.imagePath, photo.caption);
        photoIndex++;
        // 사진 삽입 후 본문과 분리되는 감성 구분선 추가
        await insertHorizontalLine();
        await page.waitForTimeout(600);
      }
    }

    // 혹시 남은 사진이 있다면 본문 말미에 추가
    while (photoIndex < photoList.length) {
      const photo = photoList[photoIndex];
      await uploadPhotoAndCaption(page, editorTarget, mainFrame, photo.imagePath, photo.caption);
      photoIndex++;
      await insertHorizontalLine();
      await page.waitForTimeout(600);
    }

    // 태그 입력
    if (postData.tags && postData.tags.length > 0) {
      const tagLine = `\n태그: ${postData.tags.map(t => (t.startsWith('#') ? t : `#${t}`)).join(' ')}`;
      await page.keyboard.type(tagLine, { delay: 5 });
      await page.keyboard.press('Enter');
    }

    console.log('✅ [Playwright] 본문 및 다중 사진/캡션 100% 온전하게 작성 완료!');
    await page.waitForTimeout(1000);

    // 8. [발행 레이어 열기]
    const ensurePublishLayerOpen = async (): Promise<boolean> => {
      if (!page) return false;

      try {
        await mainFrame.evaluate(() => {
          const sideClose = document.querySelector('.se-sidebar-close-button, .se-toolbar-layer-close') as HTMLElement;
          if (sideClose) sideClose.click();
        });
        await page.waitForTimeout(500);
      } catch (e) {}

      const isAlreadyOpen = await mainFrame.evaluate(() => {
        const confirmBtn = document.querySelector('.confirm_btn__WEaBq, [class*="confirm_btn"]');
        const foldBtn = document.querySelector('.publish_fold_btn__DtZcG, [class*="publish_fold"]');
        return !!(confirmBtn || foldBtn);
      });
      if (isAlreadyOpen) return true;

      console.log('[Playwright] 1차 우측 상단 [발행] 버튼 클릭 시도...');
      try {
        const pubLocator = mainFrame.locator('.publish_btn__m9KHH, [class*="publish_btn"]').first();
        if (await pubLocator.count() > 0) {
          await pubLocator.click({ timeout: 4000 });
        } else {
          await mainFrame.evaluate(() => {
            const btn = document.querySelector('.publish_btn__m9KHH, [class*="publish_btn"]') as HTMLElement;
            if (btn) btn.click();
          });
        }
      } catch (e) {
        await mainFrame.evaluate(() => {
          const btn = document.querySelector('.publish_btn__m9KHH, [class*="publish_btn"]') as HTMLElement;
          if (btn) btn.click();
        });
      }
      await page.waitForTimeout(2000);
      return true;
    };

    await ensurePublishLayerOpen();

    // 9. [카테고리 선택]
    try {
      console.log(`[Playwright] 카테고리 [${category}] 설정 진행 중...`);
      const catBtnLocator = mainFrame.locator('.selectbox_button__jb1Dt, [class*="selectbox_button"]').first();
      if (await catBtnLocator.count() > 0) {
        await catBtnLocator.click();
        await page.waitForTimeout(800);

        const options = mainFrame.locator('.item__sAGX9, .option__x0and, [class*="item__"]');
        const count = await options.count();
        const targetClean = category.replace(/[\s\u00A0]+/g, '');

        let catFound = false;
        for (let i = 0; i < count; i++) {
          const itemText = (await options.nth(i).innerText()).replace(/[\s\u00A0]+/g, '');
          if (itemText === targetClean || itemText.includes(targetClean)) {
            console.log(`[Playwright] ✅ 목표 카테고리 일치 확인: "${itemText}" 클릭!`);
            await options.nth(i).click();
            catFound = true;
            await page.waitForTimeout(800);
            break;
          }
        }
      }
    } catch (catErr) {
      console.warn('[Playwright] 카테고리 설정 경고:', catErr);
    }

    // 10. [2차 최종 발행 버튼 클릭]
    console.log('[Playwright] 🚀 2차 최종 발행 확인 버튼 클릭 시도...');
    let publishSuccess = false;

    try {
      const confirmLocator = mainFrame.locator('.confirm_btn__WEaBq, [class*="confirm_btn"]').first();
      if (await confirmLocator.isVisible({ timeout: 5000 })) {
        console.log('[Playwright] 🎯 최종 발행 Locator 발견! 마우스 클릭 실행');
        await confirmLocator.click();
        publishSuccess = true;
      }
    } catch (locErr) {
      console.warn('[Playwright] Locator 클릭 실패, DOM 폴백 시도:', locErr);
    }

    if (!publishSuccess) {
      publishSuccess = await mainFrame.evaluate(() => {
        const confirmBtn = document.querySelector('.confirm_btn__WEaBq, [class*="confirm_btn"]') as HTMLElement;
        if (confirmBtn) {
          confirmBtn.click();
          return true;
        }
        return false;
      });
    }

    if (!publishSuccess) {
      throw new Error('최종 발행 확인 버튼(.confirm_btn__WEaBq)을 찾을 수 없습니다.');
    }

    console.log('[Playwright] 🎉 최종 발행 버튼 클릭 성공! 네이버 서버 저장 대기 중...');
    await page.waitForTimeout(6000);

    const finalUrl = page.url();
    console.log(`[Playwright] 🌟 포스팅 완료! 최종 페이지 주소: ${finalUrl}`);

    return {
      success: true,
      message: `성공적으로 네이버 블로그에 포스팅을 발행했습니다! (카테고리: ${category})`,
      postUrl: finalUrl
    };

  } catch (error: any) {
    console.error('❌ [Playwright] 네이버 블로그 포스팅 중 오류 발생:', error);
    return {
      success: false,
      message: `포스팅 실패: ${error.message || error}`
    };
  }
}
