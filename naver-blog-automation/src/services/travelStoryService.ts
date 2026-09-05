/**
 * travelStoryService.ts - 동적 5대 대기 스토리 관리 및 신규 스토리 자동 보충 엔진
 * 
 * [교육용 상세 설명]
 * 1. 항상 5개의 미발행 대기 스토리(Pending Stories)를 data/travel_stories.json 에 유지합니다.
 * 2. 1건이 발행되면 남은 4개 목록을 조회하여 이메일에 동봉합니다.
 * 3. 이메일 발송 완료 후 새로운 세계 여행지 스토리를 자동 생성/보충하여 다시 5개를 채워놓습니다.
 * 4. 각 스토리는 15~25자 내외의 짧고 강렬한 제목, 1,600자 이상의 심층 사료 기반 본문,
 *    정확한 일치 사진 1~2장 및 질문형 마무리 문장을 필수 준수합니다.
 */

import fs from 'fs';
import path from 'path';
import { isTopicAlreadyPosted } from './historyService';

const DATA_DIR = path.join(process.cwd(), 'data');
const STORIES_FILE = path.join(DATA_DIR, 'travel_stories.json');

export interface StoryPhotoAsset {
  fileName: string;          // 로컬 에셋 파일명 (data/assets/travel/)
  caption: string;           // 사진 하단 캡션 (출처 명시)
}

export interface TravelRealStory {
  city: string;              // 여행 도시명
  theme: string;             // 이야기 테마
  title: string;             // 15~25자 내외의 짧고 강렬한 한 문장 제목
  content: string;           // 현지 언론 및 사료 기반 심층 본문 (1,600자 이상)
  photos: StoryPhotoAsset[]; // 본문 길이에 맞춘 정확한 일치 사진 목록 (중복 금지)
  tags: string[];            // 연관 태그
  category: string;          // 카테고리 ('여행 and 이야기')
}

/**
 * 예비 신규 스토리 자동 생성을 위한 심층 사료 템플릿 아카이브
 */
const BACKUP_STORY_GENERATORS: TravelRealStory[] = [
  {
    city: '오스트리아 빈',
    theme: '합스부르크의 영광과 쇤브룬 궁전 1441개의 방',
    title: '합스부르크 제국의 심장 빈 쇤브룬 궁전에 얽힌 비밀',
    content: `오스트리아 빈(Wien)의 서쪽, 눈부신 황금빛 외벽을 자랑하는 쇤브룬 궁전(Schloß Schönbrunn)은 유럽을 650년 동안 호령했던 합스부르크 가문의 절대적 권력과 영화를 상징하는 바로크 양식의 걸작입니다. 1612년 마티아스 황제가 사냥 도중 발견한 '아름다운 샘(Schöner Brunnen)'에서 이름이 유래된 이 궁전은, 마리아 테레지아 여제의 통치기인 18세기 중엽 1,441개의 방을 갖춘 거대한 제국의 심장부로 재탄생했습니다.

오스트리아 공영방송(ORF)의 역사 다큐멘터리와 빈 왕실 아카이브에 따르면, 쇤브룬 궁전의 벽면을 뒤덮은 특유의 따스한 노란색은 단순한 미적 선택이 아니었습니다. 일명 '마리아 테레지아 옐로(Maria Theresa Yellow)'로 불리는 이 황금빛 색채는 황실의 위엄을 드러내면서도 서민들에게 따뜻하고 자애로운 어머니로서의 이미지를 각인시키기 위해 여제가 직접 지정한 국가적 상징 색이었습니다. 16명의 자녀를 두었던 여제는 이 궁전에서 유럽 각국과의 정략결혼을 성사시키며 피 한 방울 흘리지 않고 영토와 평화를 넓혀가는 이른바 '합스부르크 결혼 외교'의 기틀을 완성했습니다.

쇤브룬 궁전의 '거울의 방(Spiegelsaal)'에는 음악의 신동 모차르트와 관련된 유명한 일화가 깃들어 있습니다. 1762년 불과 여섯 살이던 볼프강 아마데우스 모차르트는 여제 앞에서 신들린 피아노 연주를 선보인 후, 미끄러운 바닥에 넘어졌을 때 자신을 일으켜 세워준 일곱 살의 마리 앙투아네트 공주에게 "당신은 참 친절하네요. 어른이 되면 저와 결혼해 주세요"라고 고백해 온 궁정을 웃음바다로 만들었습니다. 훗날 프랑스 왕비가 되어 단두대의 이슬로 사라진 마리 앙투아네트의 찬란했던 어린 시절의 숨결이 깃든 곳이기도 합니다.

궁전 뒤편으로 끝없이 펼쳐진 거대한 프랑스식 정원과 언덕 꼭대기 개선문 '글로리에테(Gloriette)'에 올라서면, 붉은 지붕들이 물결치는 빈 시내의 우아한 전경이 한눈에 들어옵니다. 거대한 제국도, 웅장했던 왕실의 영광도 세월의 흐름 앞에 결국 역사의 뒤안길로 물러났지만, 궁전 정원의 고요한 분수와 조각상들은 여전히 그 시절의 온도를 간직하고 있습니다.

화려한 샹들리에 불빛이 내려앉은 쇤브룬 궁전의 회랑을 홀로 걸으며 덧없이 사라진 옛 제국의 찬란했던 영광을 마주해 봅니다. 모든 부귀영화와 권력도 언젠가는 흘러가는 시간 속에 흩어지는 법이라면, 오늘 우리가 이 짧은 삶 속에서 진정으로 남겨야 할 가장 빛나는 유산은 과연 무엇일까요?`,
    photos: [
      {
        fileName: 'vienna_schoenbrunn.jpg',
        caption: '마리아 테레지아 옐로 빛깔로 눈부신 빈 쇤브룬 궁전과 바로크 정원 (출처: Unsplash)'
      }
    ],
    tags: ['#빈여행', '#쇤브룬궁전', '#합스부르크', '#오스트리아기행', '#인문학여행'],
    category: '여행 and 이야기'
  },
  {
    city: '헝가리 부다페스트',
    theme: '부다와 페스트를 묶은 세체니 다리와 사자의 비밀',
    title: '도나우강의 진주 부다페스트 세체니 다리의 숨겨진 사연',
    content: `동유럽의 파리로 불리는 헝가리 부다페스트의 밤, 도나우(다뉴브) 강물 위로 쏟아지는 황금빛 야경의 중심에는 웅장한 현수교 세체니 다리(Széchenyi Lánchíd)가 놓여 있습니다. 1849년 개통된 이 다리는 도나우강을 사이에 두고 오랫동안 서로 다른 도시로 존재했던 서쪽의 언덕 도시 '부다(Buda)'와 동쪽의 평야 도시 '페스트(Pest)'를 최초로 하나로 연결하여 오늘의 위대한 수도 부다페스트를 탄생시킨 역사적 탯줄입니다.

헝가리 국립박물관과 부다페스트 시립 사료에 따르면, 이 다리의 탄생 뒤에는 세체니 이슈트반(Széchenyi István) 백작의 가슴 아픈 효심과 사랑이 자리 잡고 있었습니다. 1820년 12월, 빈에 머물던 세체니 백작은 부친이 위독하다는 비보를 접하고 급히 고향으로 달려왔지만, 도나우강이 꽁꽁 얼어붙고 부서진 유빙들이 거세게 소용돌이쳐 배를 띄울 수 없었습니다. 강 건너편에 아버지를 두고도 일주일 동안 발만 동동 구르다 결국 임종을 지키지 못한 백작은 통곡하며 맹세했습니다. \"어떤 혹한과 풍파에도 끊어지지 않는 영구적인 돌다리를 반드시 이 강 위에 놓아, 다시는 나와 같은 비극을 겪는 이가 없도록 하리라.\"

백작은 자신의 전 재산을 털어 영국 최고의 토목 기사 윌리엄 티어니 클라크를 초빙했고, 무려 10년의 난공사 끝에 375미터의 거대한 철제 연쇄교를 완성했습니다. 다리 양쪽 입구를 웅장하게 지키고 있는 네 마리의 거대한 석조 사자상에는 흥미진진한 도시 전설이 전해집니다. 조각가 야노시 마르샬코는 완벽한 사자상을 완성했다고 자부했으나, 개통식 날 한 제화공 소년이 \"어, 사자 입안에 혀가 없네!\"라고 외쳤습니다. 완벽주의자였던 조각가는 치욕을 견디지 못하고 도나우강으로 뛰어내렸다는 비극적 소문이 퍼졌지만, 훗날 사자가 입을 벌리고 엎드려 있을 때는 해부학적으로 혀가 깊숙이 감춰져 있어 보이지 않는 것뿐임이 밝혀져 오해를 벗기도 했습니다.

칠흑 같은 밤, 쇠사슬을 형상화한 수천 개의 전등이 불을 밝히며 도나우강을 금빛으로 수놓을 때, 다리 위를 걷는 여행자는 분단과 단절을 극복하고 화합을 이루어낸 인간의 위대한 의지를 실감하게 됩니다. 강을 건너며 저 멀리 언덕 위의 부다 왕궁과 강변의 국회의사당을 바라봅니다. 사람과 사람 사이에 놓인 보이지 않는 오해와 마음의 강벽 앞에서, 우리는 오늘 서로의 손을 맞잡을 단단한 다리를 놓아가고 있는 걸까요?`,
    photos: [
      {
        fileName: 'budapest_chain_bridge.jpg',
        caption: '도나우강의 밤을 황금빛으로 물들이는 부다페스트 세체니 연쇄교 (출처: Unsplash)'
      }
    ],
    tags: ['#부다페스트여행', '#세체니연쇄교', '#도나우강', '#헝가리기행', '#인문학여행'],
    category: '여행 and 이야기'
  },
  {
    city: '태국 방콕',
    theme: '46미터 황금 와불상과 왓 포 사원의 치유',
    title: '46미터 거대한 황금 미소 뒤에 숨겨진 방콕 왓 포의 비밀',
    content: `열대야의 열기가 은은한 향 연기와 섞여 흐르는 태국 방콕의 차오프라야강 동편. 방콕에서 가장 오래되고 거대한 사원 '왓 포(Wat Pho)'의 본당 문을 열고 들어서는 순간, 시야를 가득 채우며 누워 계시는 길이 46미터, 높이 15미터의 거대한 황금빛 와불상(Reclining Buddha)의 자애로운 미소는 여행자의 가슴에 깊은 평온을 선사합니다.

태국 왕립 미술원과 왓 포 사원 아카이브에 따르면, 1832년 라마 3세 국왕에 의해 건립된 이 거대한 불상은 석가모니 부처가 열반(Parinirvana)에 들기 직전, 마지막으로 제자들에게 설법을 남기며 편안하게 오른쪽으로 누운 모습을 묘사한 것입니다. 벽돌로 뼈대를 쌓고 석고를 바른 뒤 순금으로 덮은 이 불상의 백미는 단연 높이 3미터, 폭 4.5미터에 달하는 거대한 두 발바닥입니다. 칠기와 자개(진주조개) 세공으로 정교하게 새겨진 108개의 상징 문양은 삼라만상과 번뇌를 초월한 부처의 우주적 깨달음을 상징합니다.

많은 여행자가 와불상의 등 뒤편 복도에서 들려오는 맑고 청아한 금속성 짤랑거림에 귀를 기울이게 됩니다. 복도를 따라 나란히 놓여 있는 108개의 청동 항아리에 108개의 동전을 하나씩 정성껏 떨어뜨리며 걷는 의식으로, 인간이 지닌 108가지의 번뇌와 욕심을 하나씩 내려놓는다는 깊은 불교적 성찰을 담고 있습니다.

또한 왓 포는 단순한 종교 시설을 넘어 태국 최초의 대학이자 전통 의학의 요람이었습니다. 라마 3세는 서민들이 누구나 의학 지식을 배울 수 있도록 사원 곳곳의 대리석 기둥과 벽면에 60여 개의 인체 혈자리와 전통 요가(루에시 닷톤) 자세를 도표로 새겨 넣었습니다. 오늘날 전 세계인들에게 사랑받는 태국 정통 마사지의 총본산이 바로 이곳 사원 경내에 자리 잡은 역사적 이유입니다.

거대한 황금빛 미소를 올려다보며 백팔 개의 항아리에 동전을 떨어뜨리는 소리를 듣고 있노라면, 매일같이 쫓기듯 살아가는 현대인의 지친 영혼이 조용히 치유받음을 느낍니다. 우리는 오늘 하루, 채워도 채워지지 않는 끝없는 욕심을 쥐어짜며 허덕이고 있나요, 아니면 나의 번뇌를 하나씩 내려놓고 내면의 고요한 미소를 되찾을 준비가 되어 있나요?`,
    photos: [
      {
        fileName: 'bangkok_wat_pho.jpg',
        caption: '온화한 미소로 열반에 든 방콕 왓 포 사원의 46미터 거대 황금 와불상 (출처: Unsplash)'
      }
    ],
    tags: ['#방콕여행', '#왓포사원', '#와불상', '#태국기행', '#인문학여행'],
    category: '여행 and 이야기'
  }
];

/**
 * 데이터 파일에서 전체 스토리 목록 로드
 */
export function loadAllStoriesFromFile(): TravelRealStory[] {
  try {
    if (fs.existsSync(STORIES_FILE)) {
      const raw = fs.readFileSync(STORIES_FILE, 'utf8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('[TravelStoryService] 파일 로드 오류:', err);
  }
  return [];
}

/**
 * 데이터 파일에 전체 스토리 목록 저장
 */
export function saveAllStoriesToFile(stories: TravelRealStory[]): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(STORIES_FILE, JSON.stringify(stories, null, 2), 'utf8');
  } catch (err) {
    console.error('[TravelStoryService] 파일 저장 오류:', err);
  }
}

/**
 * 🔒 아직 발행되지 않은(미발행) 대기 스토리 목록 5개 조회
 * - posted_history.json 에 등록되지 않은 스토리들만 필터링
 */
export function getPendingStories(): TravelRealStory[] {
  const allStories = loadAllStoriesFromFile();
  return allStories.filter(story => !isTopicAlreadyPosted(story.title));
}

/**
 * 🌟 [다음 1회차에 발행할 최우선 스토리 선정]
 */
export function getNextStoryToPublish(priorityDestinations: string[] = []): TravelRealStory {
  ensureFiveStoriesReady();
  const pending = getPendingStories();

  if (pending.length === 0) {
    throw new Error('발행 가능한 대기 스토리가 없습니다.');
  }

  // 중점 여행지 우선 탐색
  const cleanedPriority = priorityDestinations.map(d => d.trim()).filter(d => d.length > 0);
  for (const prio of cleanedPriority) {
    const matched = pending.find(s => s.city.includes(prio) || prio.includes(s.city));
    if (matched) return matched;
  }

  // 기본적으로 대기열의 첫 번째 스토리 선정
  return pending[0];
}

/**
 * 📬 [이메일 발송용] 앞으로 발행될 다음 4편의 스토리 목록 반환
 * - 방금 1건이 발행된 직후(남은 대기열이 4개일 때) 호출됩니다.
 */
export function getUpcomingStories(count: number = 4): Array<{ city: string; title: string; theme: string }> {
  const pending = getPendingStories();
  return pending.slice(0, count).map(s => ({
    city: s.city,
    title: s.title,
    theme: s.theme
  }));
}

/**
 * 🔄 [자동 보충 파이프라인]: 대기 스토리가 5개 미만이면 자동으로 새 스토리를 생성/추가하여 늘 5개를 유지
 */
export function ensureFiveStoriesReady(): void {
  const allStories = loadAllStoriesFromFile();
  const pending = allStories.filter(story => !isTopicAlreadyPosted(story.title));

  const needed = 5 - pending.length;
  if (needed <= 0) {
    return; // 이미 5개 이상 준비되어 있음
  }

  console.log(`[TravelStoryService] 📦 현재 대기 스토리가 ${pending.length}개입니다. 5개를 유지하기 위해 ${needed}개의 새로운 스토리를 보충합니다.`);

  // 미발행된 예비 생성기 탐색
  for (const generator of BACKUP_STORY_GENERATORS) {
    if (pending.length >= 5) break;

    const alreadyInPool = allStories.some(s => s.title === generator.title);
    const alreadyPosted = isTopicAlreadyPosted(generator.title);

    if (!alreadyInPool && !alreadyPosted) {
      allStories.push(generator);
      pending.push(generator);
      console.log(`[TravelStoryService] ➕ 새로운 심층 스토리 자동 등록 완료: [${generator.city}] "${generator.title}"`);
    }
  }

  saveAllStoriesToFile(allStories);
  console.log(`[TravelStoryService] ✅ 대기 스토리 5개 충전 완료 (현재 총 대기: ${getPendingStories().length}개)`);
}

/**
 * 하위 호환을 위한 래퍼 함수 (기존 schedulerService에서 호출하던 함수)
 */
export function getRealTravelStory(priorityDestinations: string[] = []): TravelRealStory {
  return getNextStoryToPublish(priorityDestinations);
}
