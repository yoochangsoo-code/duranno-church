/**
 * imageService.ts - 네이버 블로그 포스팅용 대표 이미지 수집 및 본문-사진 100% 일치 검수 엔진
 * 
 * [교육용 상세 설명]
 * 이 모듈은 블로그 글의 주목도를 높이고 독자의 시각적 몰입감을 위해,
 * 포스팅 주제 및 본문 핵심 소재와 100% 일치하는 고화질 이미지를 준비하고 캡션을 매칭합니다.
 * 
 * 💡 [엄격한 사진 검수 규칙 (Image Relevance Verification)]:
 * 1. 글의 주제(도시, 대상, 기기)와 사진의 내용(파일명, 캡션)이 100% 일치하는지 엄격히 검수합니다.
 * 2. 가우디 성당 글에 서안 성벽 사진이 들어가는 등 엉뚱한 사진이 섞이는 것을 원천 차단합니다.
 * 3. 본문 300자당 사진 1장씩 순서대로 삽입할 수 있도록 배열(`PostImageData[]`) 지원.
 * 4. AI 생성 사진은 `(AI 생성 이미지)`, 공식/실제 사진은 `(출처: Unsplash)` 또는 `(출처: 공식 사이트)` 명시.
 */

import fs from 'fs';
import path from 'path';
import https from 'https';
import { StoryPhotoAsset } from './travelStoryService';

// 이미지 및 에셋 저장 디렉터리 경로
const IMAGES_DIR = path.join(process.cwd(), 'data', 'images');
const ASSETS_GEAR_DIR = path.join(process.cwd(), 'data', 'assets', 'gears');
const ASSETS_TRAVEL_DIR = path.join(process.cwd(), 'data', 'assets', 'travel');

export interface PostImageData {
  imagePath: string;     // 로컬 이미지 파일 절대 경로
  caption: string;       // 사진 바로 아래에 입력될 캡션 설명 (AI 생성 이미지 or 출처 명시)
}

function ensureImageDir(): void {
  if (!fs.existsSync(IMAGES_DIR)) fs.mkdirSync(IMAGES_DIR, { recursive: true });
  if (!fs.existsSync(ASSETS_GEAR_DIR)) fs.mkdirSync(ASSETS_GEAR_DIR, { recursive: true });
  if (!fs.existsSync(ASSETS_TRAVEL_DIR)) fs.mkdirSync(ASSETS_TRAVEL_DIR, { recursive: true });
}

/**
 * 🔒 [사진-본문 일치 검수 함수 — 범용 키워드 기반 긍정 매칭(Positive Match)]
 * 
 * [교육용 설명]
 * 이전 방식(블랙리스트): "로마 글에 xian 사진이면 차단" → 예상 못한 조합은 통과되는 허점이 있었음
 * 새 방식(화이트리스트): "사진 파일명 또는 캡션에 글 주제와 관련된 도시 키워드가 반드시 포함되어야 통과"
 * 
 * 예시:
 * - 로마 판테온 글 + roma_pantheon.jpg → "roma"가 로마와 매칭 → ✅ 통과
 * - 로마 판테온 글 + praha_charles_bridge.jpg → "praha"는 로마와 무관 → ❌ 차단
 */

// 도시명과 사진 파일명/캡션에서 찾을 수 있는 키워드 매핑 테이블
const CITY_PHOTO_KEYWORDS: Record<string, string[]> = {
  '로마': ['roma', 'pantheon', 'rome', 'oculus', '로마', '판테온', '오쿨루스'],
  '프라하': ['praha', 'prague', 'charles_bridge', 'nepomuk', '프라하', '카를교', '네포무크'],
  '피렌체': ['florence', 'firenze', 'duomo', 'cupola', '피렌체', '두오모', '쿠폴라', '브루넬레스키'],
  '바르셀로나': ['barcelona', 'sagrada', 'gaudi', '바르셀로나', '가우디', '사그라다'],
  '서안': ['xian', 'wall_brick', 'sunset_wall', '서안', '성벽'],
  '교토': ['kyoto', 'pontocho', '교토', '골목'],
  '파리': ['paris', 'eiffel', '파리', '에펠'],
  '이스탄불': ['istanbul', 'hagia', '이스탄불', '아야소피아'],
  '리스본': ['lisbon', 'lisboa', 'tram', '리스본', '트램'],
  '빈': ['vienna', 'wien', 'schoenbrunn', '빈', '비엔나', '쇤브룬'],
  '부다페스트': ['budapest', 'chain_bridge', '부다페스트', '세체니'],
  '방콕': ['bangkok', 'wat_pho', '방콕', '왓포'],
  '오사카': ['osaka', '오사카'],
  '부산': ['busan', '부산'],
  '경주': ['gyeongju', '경주'],
};

export function verifyImageMatchesTopic(fileName: string, caption: string, topic: string): boolean {
  const cleanTopic = topic.toLowerCase();
  const cleanFile = fileName.toLowerCase();
  const cleanCaption = caption.toLowerCase();

  // 1단계: 글 주제에서 어떤 도시나 핵심 소재가 언급되었는지 찾기
  let topicCity: string | null = null;
  let topicKeywords: string[] = [];

  for (const [city, keywords] of Object.entries(CITY_PHOTO_KEYWORDS)) {
    // 글 주제(제목)에 이 도시의 한글명이 포함되어 있는지 확인
    if (cleanTopic.includes(city.toLowerCase()) || keywords.some(kw => cleanTopic.includes(kw))) {
      topicCity = city;
      topicKeywords = keywords;
      break;
    }
  }

  // 2단계: 도시/소재를 특정할 수 없는 글이면 검수 통과 (범용 글, 장비 리뷰 등)
  if (!topicCity) {
    console.log(`[ImageVerifier] ℹ️ 글 주제에서 특정 도시/소재를 식별할 수 없음 → 범용 주제로 판단하여 통과: ${fileName}`);
    return true;
  }

  // 3단계: 🔒 화이트리스트 검증 — 사진 파일명이나 캡션에 해당 소재 키워드가 포함되어야만 통과
  const photoMatchesCity = topicKeywords.some(kw => cleanFile.includes(kw) || cleanCaption.includes(kw));

  if (!photoMatchesCity) {
    console.error(`[ImageVerifier] ❌ 불일치 차단! 글 주제 도시/소재: [${topicCity}], 사진 파일: [${fileName}] — 사진에 "${topicCity}" 관련 키워드가 없습니다.`);
    return false;
  }

  console.log(`[ImageVerifier] ✅ 일치 확인! 글 도시/소재: [${topicCity}], 사진: [${fileName}]`);
  return true;
}

/**
 * 주제에 따라 정확한 사진 목록을 준비하고 검수하는 메인 함수
 * - 사진과 글의 100% 일치 검수
 * - 🔒 동일한 사진 파일이 중복 첨부되는 것을 원천 차단
 */
export async function prepareStoryPhotos(photos: StoryPhotoAsset[], topic: string = ''): Promise<PostImageData[]> {
  ensureImageDir();
  const results: PostImageData[] = [];
  const attachedFileNames = new Set<string>();

  for (let i = 0; i < photos.length; i++) {
    const p = photos[i];

    // 🔒 [중복 사진 차단]: 같은 글에 동일한 사진 파일이 두 번 이상 들어가지 않도록 방어
    if (attachedFileNames.has(p.fileName)) {
      console.warn(`[ImageService] ⚠️ 동일한 사진 파일(${p.fileName})이 이미 첨부 목록에 존재하여 중복 방지를 위해 제외합니다.`);
      continue;
    }

    // 검수: 사진과 주제가 맞는지 확인
    if (topic && !verifyImageMatchesTopic(p.fileName, p.caption, topic)) {
      console.warn(`[ImageService] ⚠️ 주제와 맞지 않는 사진(${p.fileName})은 검수 탈락하여 제외합니다.`);
      continue;
    }

    const assetPath = path.join(ASSETS_TRAVEL_DIR, p.fileName);
    const targetFilePath = path.join(IMAGES_DIR, `story_img_${i}_${Date.now()}.jpg`);

    if (fs.existsSync(assetPath)) {
      fs.copyFileSync(assetPath, targetFilePath);
      attachedFileNames.add(p.fileName);
      results.push({
        imagePath: targetFilePath,
        caption: p.caption
      });
      console.log(`[ImageService] ✅ 사진 검수 통과 및 고유 첨부 완료: ${p.fileName}`);
    } else {
      console.warn(`[ImageService] ⚠️ 에셋 파일 없음: ${assetPath}`);
    }
  }

  return results;
}

/**
 * 단일 사진 요청에 대한 하위 호환 헬퍼 함수
 */
export async function getFeaturedImageWithCaption(
  keyword: string,
  exactAssetOrUrl?: string,
  gearName?: string,
  destination?: string
): Promise<PostImageData | null> {
  ensureImageDir();

  const safeKeyword = keyword.replace(/[^a-zA-Z0-9가-힣]/g, '_').substring(0, 40);
  const targetFilePath = path.join(IMAGES_DIR, `${safeKeyword}_${Date.now()}.jpg`);

  try {
    const checkText = `${keyword} ${gearName || ''} ${destination || ''}`;

    // 1. 지정된 로컬 여행 에셋
    if (exactAssetOrUrl && !exactAssetOrUrl.startsWith('http')) {
      const localTravelAsset = path.join(ASSETS_TRAVEL_DIR, exactAssetOrUrl);
      if (fs.existsSync(localTravelAsset)) {
        fs.copyFileSync(localTravelAsset, targetFilePath);
        return {
          imagePath: targetFilePath,
          caption: '본문 핵심 소재와 일치하는 현장 사진'
        };
      }
    }

    // 2. 바르셀로나 가우디
    if (checkText.includes('바르셀로나') || checkText.includes('가우디') || checkText.includes('사그라다')) {
      const asset = path.join(ASSETS_TRAVEL_DIR, 'barcelona_sagrada_familia.jpg');
      if (fs.existsSync(asset)) {
        fs.copyFileSync(asset, targetFilePath);
        return {
          imagePath: targetFilePath,
          caption: '사그라다 파밀리아 대성당의 웅장한 석조 기둥과 스테인드글라스 (출처: Unsplash)'
        };
      }
    }

    // 3. 로마 판테온
    if (checkText.includes('로마') || checkText.includes('판테온')) {
      const asset = path.join(ASSETS_TRAVEL_DIR, 'roma_pantheon.jpg');
      if (fs.existsSync(asset)) {
        fs.copyFileSync(asset, targetFilePath);
        return {
          imagePath: targetFilePath,
          caption: '2천 년 세월을 견뎌낸 로마 판테온의 경이로운 석조 돔 (출처: Unsplash)'
        };
      }
    }

    // 4. 프라하 카를교
    if (checkText.includes('프라하') || checkText.includes('카를교')) {
      const asset = path.join(ASSETS_TRAVEL_DIR, 'praha_charles_bridge.jpg');
      if (fs.existsSync(asset)) {
        fs.copyFileSync(asset, targetFilePath);
        return {
          imagePath: targetFilePath,
          caption: '블타바강 위를 수놓은 프라하 카를교와 성상들의 풍경 (출처: Unsplash)'
        };
      }
    }

    // 5. 피렌체 두오모
    if (checkText.includes('피렌체') || checkText.includes('두오모')) {
      const asset = path.join(ASSETS_TRAVEL_DIR, 'florence_duomo.jpg');
      if (fs.existsSync(asset)) {
        fs.copyFileSync(asset, targetFilePath);
        return {
          imagePath: targetFilePath,
          caption: '르네상스 건축의 정점, 피렌체 두오모 쿠폴라의 붉은 지붕 (출처: Unsplash)'
        };
      }
    }

    // 6. 장비 사진 (DJI, 소니, 인스타360 등)
    if (gearName) {
      const gearFiles = fs.readdirSync(ASSETS_GEAR_DIR);
      const matched = gearFiles.find(f => {
        const lower = f.toLowerCase();
        if (gearName.includes('포켓') && lower.includes('pocket')) return true;
        if (gearName.includes('소니') && lower.includes('sony')) return true;
        if (gearName.includes('인스타') && lower.includes('insta360')) return true;
        if (gearName.includes('보스') && lower.includes('bose')) return true;
        if (gearName.includes('앤커') && lower.includes('anker')) return true;
        return false;
      });

      if (matched) {
        const fullPath = path.join(ASSETS_GEAR_DIR, matched);
        fs.copyFileSync(fullPath, targetFilePath);
        return {
          imagePath: targetFilePath,
          caption: `${gearName} 실전 제품 상세 사진 (출처: 공식 제품 사양)`
        };
      }
    }

    return null;
  } catch (err) {
    console.warn('[ImageService] 이미지 준비 중 오류:', err);
    return null;
  }
}
