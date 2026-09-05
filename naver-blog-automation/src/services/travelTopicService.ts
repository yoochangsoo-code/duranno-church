/**
 * travelTopicService.ts - 5대 여행 전문 테마 자동 생성 및 가중치 엔진
 * 
 * [교육용 상세 설명]
 * 이 모듈은 여행 전문 블로그의 성격에 맞춰 5가지 기획 공식에 따라
 * 사람들의 시선을 사로잡는 매력적인 한 문장 제목과 주제를 자동으로 생성합니다.
 * 
 * 💡 [사용자 지침 엄격 반영]:
 * 1. 제목에 [말머리] 일체 금지 (대괄호 태그 사용 금지).
 * 2. 사람들의 호기심과 클릭을 유도하는 매력적인 '한 문장' 제목.
 * 3. 기기나 장비에 관한 글은 제목에 해당 기기 이름이 반드시 포함되어야 함.
 * 4. 5대 테마 및 카테고리 매핑:
 *    - 테마 1, 2, 3 ➔ '여행 and 이야기'
 *    - 테마 4 ➔ '사진과 생각'
 *    - 테마 5 ➔ '여행도 장비빨'
 * 5. 중점 여행지는 2배 가중치 적용.
 */

export interface TravelTopicResult {
  topic: string;             // 최종 선정된 포스팅 주제 (제목 후보)
  category: string;          // 네이버 블로그 카테고리 ('여행 and 이야기' | '사진과 생각' | '여행도 장비빨')
  themeType: number;         // 1 ~ 5 테마 번호
  themeName: string;         // 테마 명칭
  destination?: string;      // 선정된 여행 도시
  gearName?: string;         // 기기/장비 명칭 (테마 5의 경우)
  photoKeyword: string;      // 이미지 검색 키워드
  exactImageUrl?: string;    // 해당 기기의 정확한 실물 이미지 URL
  specs?: string;            // 기기 핵심 사양 및 특징
}

// 기본 글로벌 및 국내 인기 여행 도시 풀
const DEFAULT_DESTINATIONS = [
  '중국 서안', '일본 교토', '태국 방콕', '스페인 바르셀로나', '이탈리아 로마',
  '체코 프라하', '프랑스 파리', '베트남 다낭', '일본 오사카', '대만 타이베이',
  '튀르키예 이스탄불', '포르투갈 리스본', '스위스 인터라켄', '미국 뉴욕', '영국 런던',
  '제주도', '부산', '경주', '강릉', '여수', '오스트리아 비엔나', '헝가리 부다페스트'
];

// 5번 테마: 최신 인기 여행 장비 및 기기 목록 (사양 및 정확한 기기 사진 매핑)
export const TRAVEL_GEAR_POOL = [
  {
    name: 'DJI 오즈모 포켓 3',
    headline: '무거운 카메라 대신 주머니에서 1초 만에 꺼내 찍는 DJI 오즈모 포켓 3 솔직 사용기',
    specs: '1인치 CMOS 고감도 센서, 4K/120fps 초고화질, 2인치 회전식 OLED 터치스크린, 3축 기계식 짐벌 흔들림 보정, 16분 80% 고속 충전, 본체 무게 179g',
    price: '단품 64만 원선 / 크리에이터 콤보 83만 원선',
    use: '흔들림 없는 여행지 브이로그, 야시장 및 골목길 야간 도보 촬영',
    tag: 'DJI Osmo Pocket 3 gimbal camera',
    imageUrl: 'dji_pocket3.jpg'
  },
  {
    name: '인스타360 X4',
    headline: '여행의 모든 순간을 놓치지 않고 360도로 담아내는 인스타360 X4 8K 액션캠의 진짜 매력',
    specs: '8K 30fps 초고해상도 360도 촬영, 5.7K 60fps, 10m 자체 방수, 탈부착식 렌즈 가드, 2290mAh 대용량 배터리(최대 135분 연속 촬영), 무게 203g',
    price: '약 70만 원대',
    use: '스마트폰으로 담기 힘든 파노라마 전체 풍경 기록 및 액티비티',
    tag: 'Insta360 X4 action camera',
    imageUrl: 'insta360_x4.jpg'
  },
  {
    name: '소니 ZV-E10 II',
    headline: '여행지 인생샷과 고화질 브이로그를 한 번에 끝내는 소니 ZV-E10 II 미러리스 카메라',
    specs: '2,600만 화소 Exmor R BSI 센서, 크롭 없는 4K 60p, 시네마틱 브이로그 모드, 실시간 AI 인물 눈동자 추적 AF, Z배터리 장시간 운용, 무게 377g',
    price: '바디 기준 약 110만 원대',
    use: '여행지 풍경 사진과 인물 인생샷, 유튜브 및 릴스 제작',
    tag: 'Sony ZV-E10 II mirrorless camera',
    imageUrl: 'sony_zve10.jpg'
  },
  {
    name: '보스 QC 울트라 헤드폰',
    headline: '장거리 비행기 소음이 마법처럼 사라지는 보스 QC 울트라 노이즈 캔슬링 헤드폰',
    specs: '공간 음향 몰입 모드(Immersive Audio), 최고 등급 커스텀 액티브 노이즈 캔슬링, 블루투스 5.3, 최대 24시간 연속 재생, 극상의 착용감',
    price: '약 49만 원대',
    use: '장시간 비행기/기차 소음 차단 및 여행지 이동 중 몰입 휴식',
    tag: 'Bose QuietComfort Ultra headphones',
    imageUrl: 'bose_qc_ultra.jpg'
  },
  {
    name: '앤커 프라임 20000mAh 보조배터리',
    headline: '노트북과 스마트폰을 동시에 초고속 충전하는 앤커 프라임 20000mAh 여행용 보조배터리',
    specs: '총 200W 초고출력 3포트 동시 충전, 단일 포트 최대 100W PD 출력, 스마트 디스플레이 탑재, 기내 반입 허용 기준 충족',
    price: '약 15만 원대',
    use: '배터리 걱정 없이 떠나는 장시간 외출 및 사진/영상 백업',
    tag: 'Anker Prime powerbank',
    imageUrl: 'anker_prime.jpg'
  }
];

/**
 * 중점 여행지에 2배 가중치를 적용하여 도시를 추첨하는 함수
 */
function pickDestinationWithWeight(priorityDestinations: string[] = []): string {
  const cleanedPriority = priorityDestinations
    .map(d => d.trim())
    .filter(d => d.length > 0);

  const weightedPool: string[] = [];

  // 1. 중점 여행지 2배 추가
  for (const p of cleanedPriority) {
    weightedPool.push(p);
    weightedPool.push(p);
  }

  // 2. 기본 여행지 풀 추가
  for (const d of DEFAULT_DESTINATIONS) {
    if (!cleanedPriority.some(p => d.includes(p) || p.includes(d))) {
      weightedPool.push(d);
    }
  }

  const randomIndex = Math.floor(Math.random() * weightedPool.length);
  return weightedPool[randomIndex] || '중국 서안';
}

/**
 * 5대 여행 테마에 따라 주제와 카테고리를 자동 생성하는 메인 함수
 * (말머리 없는 매력적인 한 문장 제목 보장)
 */
export function generateTravelTopic(priorityDestinations: string[] = []): TravelTopicResult {
  const themeType = Math.floor(Math.random() * 5) + 1;
  const city = pickDestinationWithWeight(priorityDestinations);

  switch (themeType) {
    case 1: {
      // 🌟 테마 1: 도시의 숨은 이야기 (말머리 없이 호기심을 끄는 한 문장)
      const headlines = [
        `천년의 세월을 품은 ${city} 골목길에서 마주친 뜻밖의 비밀 이야기`,
        `관광 가이드북에는 절대 나오지 않는 ${city} 현지인들의 은밀한 아지트`,
        `낯선 바람 속에서 만난 ${city}의 따스한 사람들과 잊지 못할 온기`
      ];
      const topic = headlines[Math.floor(Math.random() * headlines.length)];
      return {
        topic,
        category: '여행 and 이야기',
        themeType: 1,
        themeName: '도시의 숨은 이야기',
        destination: city,
        photoKeyword: `${city} travel street`
      };
    }

    case 2: {
      // 🌟 테마 2: 도시 테마별 Top 5
      const headlines = [
        `${city} 여행 가서 여기 안 들르면 두고두고 후회하는 인생 맛집 Top 5`,
        `카메라 셔터만 누르면 바로 인생샷 완성되는 ${city} 최고의 명소 Top 5`,
        `${city}을 처음 방문했다면 반드시 걸어봐야 할 필수 산책 코스 Top 5`
      ];
      const topic = headlines[Math.floor(Math.random() * headlines.length)];
      return {
        topic,
        category: '여행 and 이야기',
        themeType: 2,
        themeName: '도시 테마별 Top 5',
        destination: city,
        photoKeyword: `${city} landmark view`
      };
    }

    case 3: {
      // 🌟 테마 3: 도시의 역사, 음식의 유래, 역사적 인물 비화
      const headlines = [
        `수백 년 전 ${city}의 번화한 거리에선 과연 어떤 일들이 펼쳐졌을까`,
        `${city}에서 한 번 맛보면 잊을 수 없는 시그니처 음식에 담긴 흥미진진한 역사`,
        `${city}의 거리를 걷다 마주친 위대한 역사 속 인물들의 숨은 발자취`
      ];
      const topic = headlines[Math.floor(Math.random() * headlines.length)];
      return {
        topic,
        category: '여행 and 이야기',
        themeType: 3,
        themeName: '도시의 역사와 음식 유래',
        destination: city,
        photoKeyword: `${city} historical heritage`
      };
    }

    case 4: {
      // 🌟 테마 4: 공식 사진에 얽힌 생각과 포토 에세이
      const headlines = [
        `렌즈를 통해 바라본 ${city}의 찰나의 순간과 가슴에 깊이 남은 생각들`,
        `카메라 뷰파인더 속에 담긴 ${city}의 따스한 빛과 여행자의 시선`,
        `한 장의 사진이 건네는 위로, 길 위에서 만난 ${city}의 결정적 순간`
      ];
      const topic = headlines[Math.floor(Math.random() * headlines.length)];
      return {
        topic,
        category: '사진과 생각',
        themeType: 4,
        themeName: '사진과 생각 (포토 에세이)',
        destination: city,
        photoKeyword: `${city} photography mood`
      };
    }

    case 5:
    default: {
      // 🌟 테마 5: 여행 기기/장비 (제목에 기기 이름 필수 포함, 말머리 배제)
      const gear = TRAVEL_GEAR_POOL[Math.floor(Math.random() * TRAVEL_GEAR_POOL.length)];
      return {
        topic: gear.headline, // 제목에 gear.name이 명확히 들어간 매력적인 한 문장
        category: '여행도 장비빨',
        themeType: 5,
        themeName: '여행도 장비빨 (기기/장비 리뷰)',
        destination: '여행 장비',
        gearName: gear.name,
        photoKeyword: gear.tag,
        exactImageUrl: gear.imageUrl,
        specs: `[기기 핵심 정보]\n- 제품명: ${gear.name}\n- 주요 사양: ${gear.specs}\n- 가격대: ${gear.price}\n- 주요 용도: ${gear.use}`
      };
    }
  }
}
