import type {
  DestinationProfile,
  PeopleCount,
  TravelAnswers,
  TravelMethod,
  TravelRecommendation,
} from './types';

const TOP_RECOMMENDATION_COUNT = 3;

const METHOD_LABELS: Record<TravelMethod, string> = {
  independent: '자유 여행',
  package: '패키지 여행',
  'rental-car': '렌터카 여행',
  'public-transit': '대중교통 여행',
  resort: '리조트 여행',
  theme: '관심사 중심 테마여행',
};

const DESTINATIONS: DestinationProfile[] = [
  {
    id: 'jeju',
    name: '제주',
    region: 'domestic',
    summary: '바다, 오름, 카페를 여유 있게 섞기 좋은 국내 대표 휴양지',
    imageUrl: '/travel-images/jeju.png',
    tags: ['rest', 'food', 'nature', 'activity'],
    feelings: ['rest', 'nature', 'photo', 'comfort'],
    goodFor: ['partner', 'family', 'parents', 'friends'],
    methods: ['rental-car', 'independent', 'package'],
    minBudgetPerPerson: 320000,
    idealPeriods: ['2-night', '3-night', '4-night-plus'],
    movement: ['medium', 'long'],
    accommodations: ['stylish', 'family', 'premium', 'location'],
    itinerary: ['동쪽 오름 산책', '해안도로 카페', '흑돼지 저녁'],
  },
  {
    id: 'busan',
    name: '부산',
    region: 'domestic',
    summary: '해변, 시장, 도시 야경을 한 번에 즐기는 활기 있는 항구 도시',
    imageUrl: '/travel-images/busan.png',
    tags: ['food', 'shopping', 'culture'],
    feelings: ['city', 'food', 'photo'],
    goodFor: ['alone', 'partner', 'friends', 'family'],
    methods: ['public-transit', 'independent', 'theme'],
    minBudgetPerPerson: 220000,
    idealPeriods: ['1-night', '2-night', '3-night'],
    movement: ['short', 'medium'],
    accommodations: ['location', 'value', 'stylish'],
    itinerary: ['해운대 산책', '전포 카페거리', '자갈치 시장 식사'],
  },
  {
    id: 'gangneung',
    name: '강릉',
    region: 'domestic',
    summary: '동해 바다와 커피, 한적한 산책 코스가 잘 맞는 휴식 여행지',
    imageUrl: '/travel-images/gangneung.png',
    tags: ['rest', 'food', 'nature'],
    feelings: ['rest', 'food', 'photo', 'comfort'],
    goodFor: ['partner', 'friends', 'parents'],
    methods: ['public-transit', 'independent', 'rental-car'],
    minBudgetPerPerson: 180000,
    idealPeriods: ['same-day', '1-night', '2-night'],
    movement: ['short', 'medium'],
    accommodations: ['value', 'location', 'stylish'],
    itinerary: ['안목 커피거리', '경포호 산책', '초당두부 식사'],
  },
  {
    id: 'gyeongju',
    name: '경주',
    region: 'domestic',
    summary: '유적지와 한옥 분위기를 차분하게 둘러보는 문화 여행지',
    imageUrl: '/travel-images/gyeongju.png',
    tags: ['culture', 'children', 'parents'],
    feelings: ['city', 'photo', 'comfort'],
    goodFor: ['friends', 'family', 'parents', 'group'],
    methods: ['theme', 'public-transit', 'independent'],
    minBudgetPerPerson: 210000,
    idealPeriods: ['1-night', '2-night', '3-night'],
    movement: ['short', 'medium'],
    accommodations: ['location', 'stylish', 'family'],
    itinerary: ['대릉원 산책', '황리단길 점심', '동궁과 월지 야경'],
  },
  {
    id: 'seoul',
    name: '서울',
    region: 'domestic',
    summary: '전시, 쇼핑, 맛집 동선을 촘촘하게 구성하기 좋은 대도시 여행지',
    imageUrl: '/travel-images/seoul.png',
    tags: ['culture', 'shopping', 'food'],
    feelings: ['city', 'food', 'photo'],
    goodFor: ['alone', 'partner', 'friends', 'group'],
    methods: ['public-transit', 'theme', 'independent'],
    minBudgetPerPerson: 200000,
    idealPeriods: ['same-day', '1-night', '2-night'],
    movement: ['short', 'medium', 'long'],
    accommodations: ['location', 'stylish', 'premium', 'value'],
    itinerary: ['궁궐 또는 전시 관람', '성수동 카페', '한강 야경'],
  },
  {
    id: 'yeosu',
    name: '여수',
    region: 'domestic',
    summary: '남해 바다와 해산물, 야경을 편하게 즐기는 감성 여행지',
    imageUrl: '/travel-images/yeosu.png',
    tags: ['rest', 'food', 'nature'],
    feelings: ['rest', 'food', 'photo'],
    goodFor: ['partner', 'friends', 'parents', 'family'],
    methods: ['independent', 'rental-car', 'public-transit'],
    minBudgetPerPerson: 230000,
    idealPeriods: ['1-night', '2-night', '3-night'],
    movement: ['short', 'medium'],
    accommodations: ['location', 'stylish', 'family'],
    itinerary: ['오동도 산책', '해상 케이블카', '낭만포차 거리'],
  },
  {
    id: 'sokcho',
    name: '속초',
    region: 'domestic',
    summary: '설악산과 동해, 시장 먹거리를 짧은 일정에 담기 좋은 여행지',
    imageUrl: '/travel-images/sokcho.png',
    tags: ['nature', 'food', 'activity'],
    feelings: ['nature', 'food', 'photo'],
    goodFor: ['friends', 'family', 'parents'],
    methods: ['rental-car', 'public-transit', 'independent'],
    minBudgetPerPerson: 190000,
    idealPeriods: ['same-day', '1-night', '2-night'],
    movement: ['medium', 'long'],
    accommodations: ['value', 'location', 'family'],
    itinerary: ['설악산 케이블카', '속초중앙시장', '영금정 일몰'],
  },
  {
    id: 'osaka',
    name: '오사카',
    region: 'international',
    summary: '먹거리, 쇼핑, 근교 문화 코스를 균형 있게 넣기 좋은 일본 도시',
    imageUrl: '/travel-images/osaka.png',
    tags: ['food', 'shopping', 'culture'],
    feelings: ['city', 'food', 'photo'],
    goodFor: ['friends', 'partner', 'family'],
    methods: ['public-transit', 'independent', 'theme'],
    minBudgetPerPerson: 650000,
    idealPeriods: ['2-night', '3-night', '4-night-plus'],
    movement: ['medium', 'long'],
    accommodations: ['location', 'value', 'stylish'],
    itinerary: ['도톤보리 식도락', '우메다 쇼핑', '교토 또는 나라 근교'],
  },
  {
    id: 'danang',
    name: '다낭',
    region: 'international',
    summary: '가성비 리조트와 해변, 호이안 야경을 함께 즐기는 휴양지',
    imageUrl: '/travel-images/danang.png',
    tags: ['rest', 'food', 'children'],
    feelings: ['rest', 'comfort', 'photo'],
    goodFor: ['family', 'partner', 'friends', 'parents'],
    methods: ['resort', 'package', 'independent'],
    minBudgetPerPerson: 720000,
    idealPeriods: ['3-night', '4-night-plus'],
    movement: ['short', 'medium'],
    accommodations: ['family', 'premium', 'value'],
    itinerary: ['미케비치 휴식', '바나힐 투어', '호이안 올드타운'],
  },
  {
    id: 'taipei',
    name: '타이베이',
    region: 'international',
    summary: '야시장, 온천, 근교 마을을 대중교통으로 다니기 좋은 도시',
    imageUrl: '/travel-images/taipei.png',
    tags: ['food', 'culture', 'shopping'],
    feelings: ['city', 'food', 'comfort'],
    goodFor: ['friends', 'partner', 'alone', 'family'],
    methods: ['public-transit', 'independent', 'theme'],
    minBudgetPerPerson: 620000,
    idealPeriods: ['2-night', '3-night', '4-night-plus'],
    movement: ['short', 'medium'],
    accommodations: ['location', 'value', 'family'],
    itinerary: ['용산사 관람', '스린 야시장', '지우펀 근교'],
  },
  {
    id: 'fukuoka',
    name: '후쿠오카',
    region: 'international',
    summary: '짧은 일정에도 음식과 쇼핑, 온천 근교를 넣기 쉬운 일본 여행지',
    imageUrl: '/travel-images/fukuoka.png',
    tags: ['food', 'shopping', 'rest'],
    feelings: ['city', 'food', 'comfort'],
    goodFor: ['friends', 'partner', 'parents'],
    methods: ['public-transit', 'independent', 'theme'],
    minBudgetPerPerson: 580000,
    idealPeriods: ['1-night', '2-night', '3-night'],
    movement: ['short', 'medium'],
    accommodations: ['location', 'value', 'premium'],
    itinerary: ['하카타 라멘', '텐진 쇼핑', '유후인 당일 코스'],
  },
  {
    id: 'bangkok',
    name: '방콕',
    region: 'international',
    summary: '호텔, 마사지, 시장과 사원을 넉넉한 예산 효율로 즐기는 도시',
    imageUrl: '/travel-images/bangkok.png',
    tags: ['food', 'shopping', 'culture', 'rest'],
    feelings: ['city', 'food', 'comfort'],
    goodFor: ['friends', 'partner', 'family'],
    methods: ['independent', 'package', 'theme'],
    minBudgetPerPerson: 760000,
    idealPeriods: ['3-night', '4-night-plus'],
    movement: ['medium', 'long'],
    accommodations: ['premium', 'location', 'value'],
    itinerary: ['왕궁과 사원', '짜뚜짝 시장', '루프톱 또는 마사지'],
  },
  {
    id: 'singapore',
    name: '싱가포르',
    region: 'international',
    summary: '깨끗한 도시 동선과 가족형 관광지가 강한 프리미엄 여행지',
    imageUrl: '/travel-images/singapore.png',
    tags: ['children', 'shopping', 'food', 'culture'],
    feelings: ['city', 'comfort', 'photo'],
    goodFor: ['family', 'parents', 'partner'],
    methods: ['public-transit', 'package', 'theme'],
    minBudgetPerPerson: 1050000,
    idealPeriods: ['3-night', '4-night-plus'],
    movement: ['short', 'medium'],
    accommodations: ['family', 'premium', 'location'],
    itinerary: ['가든스 바이 더 베이', '센토사', '호커센터 식사'],
  },
  {
    id: 'bali',
    name: '발리',
    region: 'international',
    summary: '풀빌라 휴식과 자연 액티비티를 함께 구성하기 좋은 휴양지',
    imageUrl: '/travel-images/bali.png',
    tags: ['rest', 'nature', 'activity'],
    feelings: ['rest', 'nature', 'comfort', 'photo'],
    goodFor: ['partner', 'family', 'friends'],
    methods: ['resort', 'package', 'independent'],
    minBudgetPerPerson: 1150000,
    idealPeriods: ['4-night-plus', '3-night'],
    movement: ['medium', 'long'],
    accommodations: ['premium', 'stylish', 'family'],
    itinerary: ['우붓 논뷰 산책', '비치클럽 휴식', '스파 예약'],
  },
  {
    id: 'canadian-rockies-aurora',
    name: '캐나다 로키 오로라',
    region: 'international',
    summary: '대자연 드라이브와 오로라 관측을 목표로 하는 장거리 테마 여행',
    imageUrl: '/travel-images/canadian-rockies-aurora.png',
    tags: ['nature', 'activity', 'culture'],
    feelings: ['nature', 'photo'],
    goodFor: ['partner', 'friends', 'group'],
    methods: ['theme', 'package', 'rental-car'],
    minBudgetPerPerson: 2600000,
    idealPeriods: ['4-night-plus'],
    movement: ['long'],
    accommodations: ['premium', 'location'],
    itinerary: ['밴프 국립공원', '아이스필드 파크웨이', '오로라 관측'],
  },
  {
    id: 'hawaii',
    name: '하와이',
    region: 'international',
    summary: '해변 휴식, 쇼핑, 액티비티를 안정적으로 조합하는 장거리 휴양지',
    imageUrl: '/travel-images/hawaii.png',
    tags: ['rest', 'shopping', 'activity'],
    feelings: ['rest', 'photo', 'comfort'],
    goodFor: ['partner', 'family', 'parents'],
    methods: ['resort', 'package', 'rental-car'],
    minBudgetPerPerson: 2200000,
    idealPeriods: ['4-night-plus'],
    movement: ['medium', 'long'],
    accommodations: ['premium', 'family', 'location'],
    itinerary: ['와이키키 해변', '알라모아나 쇼핑', '오아후 드라이브'],
  },
  {
    id: 'shanghai-hangzhou',
    name: '상하이·항저우',
    region: 'international',
    summary: '도시 야경과 수향, 미식 코스를 묶기 좋은 중국 문화 여행지',
    imageUrl: '/travel-images/shanghai-hangzhou.png',
    tags: ['culture', 'food', 'shopping'],
    feelings: ['city', 'food', 'photo'],
    goodFor: ['friends', 'partner', 'group', 'parents'],
    methods: ['theme', 'public-transit', 'package'],
    minBudgetPerPerson: 780000,
    idealPeriods: ['3-night', '4-night-plus'],
    movement: ['medium', 'long'],
    accommodations: ['location', 'premium', 'value'],
    itinerary: ['와이탄 야경', '예원 산책', '항저우 서호'],
  },
  {
    id: 'cruise',
    name: '크루즈',
    region: 'international',
    summary: '숙박과 이동, 식사가 묶여 부모님 또는 단체 여행에 편한 선택지',
    imageUrl: '/travel-images/cruise.png',
    tags: ['parents', 'rest', 'food'],
    feelings: ['comfort', 'rest'],
    goodFor: ['parents', 'family', 'group'],
    methods: ['package', 'theme', 'resort'],
    minBudgetPerPerson: 1300000,
    idealPeriods: ['3-night', '4-night-plus'],
    movement: ['short'],
    accommodations: ['premium', 'family'],
    itinerary: ['승선 후 선내 식사', '기항지 반나절 관광', '공연과 휴식'],
  },
];

export function calculatePerPersonBudget(
  people: PeopleCount,
  totalBudget: number,
): number {
  const headcount = people.adults + people.children;
  if (headcount <= 0) {
    return totalBudget;
  }

  return Math.floor(totalBudget / headcount);
}

export function getDestinationCount(): number {
  return DESTINATIONS.length;
}

export function getDestinationProfiles(): readonly DestinationProfile[] {
  return DESTINATIONS.map((destination) => ({
    ...destination,
    tags: [...destination.tags],
    feelings: [...destination.feelings],
    goodFor: [...destination.goodFor],
    methods: [...destination.methods],
    idealPeriods: [...destination.idealPeriods],
    movement: [...destination.movement],
    accommodations: [...destination.accommodations],
    itinerary: [...destination.itinerary],
  }));
}

export function getTravelMethodLabel(method: TravelMethod): string {
  return METHOD_LABELS[method];
}

export function selectTravelMethod(
  answers: TravelAnswers,
  methods: TravelMethod[],
): TravelMethod {
  const perPersonBudget = calculatePerPersonBudget(
    answers.people,
    answers.totalBudget,
  );
  const canChooseLowerCostMethod =
    methods.includes('independent') || methods.includes('public-transit');
  const isTightBudget = perPersonBudget < 250000;

  if (
    methods.includes('theme') &&
    !isTightBudget &&
    isThemeFriendlyTrip(answers)
  ) {
    return 'theme';
  }

  if (isTightBudget && methods.includes('public-transit')) {
    return 'public-transit';
  }

  if (isTightBudget && methods.includes('independent')) {
    return 'independent';
  }

  if (
    methods.includes('theme') &&
    !canChooseLowerCostMethod &&
    !isTightBudget
  ) {
    return 'theme';
  }

  return (
    methods.find((method) => preferredMethodOrder(answers).includes(method)) ??
    methods[0]
  );
}

export function getRecommendations(
  answers: TravelAnswers,
): TravelRecommendation[] {
  return DESTINATIONS.map((destination, index) => {
    const method = selectTravelMethod(answers, destination.methods);
    return {
      destination,
      method,
      score: scoreDestination(destination, answers, method),
      order: index,
    };
  })
    .sort((left, right) => right.score - left.score || left.order - right.order)
    .slice(0, TOP_RECOMMENDATION_COUNT)
    .map(({ destination, method, score }, index) => ({
      rank: index + 1,
      destination,
      method,
      score,
      reasons: buildReasons(destination, answers, method),
      budgetRange: buildBudgetRange(destination, answers),
      itinerary: destination.itinerary,
    }));
}

function scoreDestination(
  destination: DestinationProfile,
  answers: TravelAnswers,
  method: TravelMethod,
): number {
  const perPersonBudget = calculatePerPersonBudget(
    answers.people,
    answers.totalBudget,
  );
  let score = 0;

  if (destination.tags.includes(answers.purpose)) score += 30;
  if (destination.feelings.includes(answers.feeling)) score += 24;
  if (destination.goodFor.includes(answers.companion)) score += 16;
  if (destination.idealPeriods.includes(answers.period)) score += 14;
  if (destination.movement.includes(answers.movement)) score += 10;
  if (destination.accommodations.includes(answers.accommodation)) score += 8;

  const budgetGap = perPersonBudget - destination.minBudgetPerPerson;
  if (budgetGap >= 0) {
    score += Math.min(18, Math.floor(budgetGap / 100000) + 8);
  } else {
    score -= Math.min(30, Math.ceil(Math.abs(budgetGap) / 50000) * 3);
  }

  if (method === 'theme') {
    score += isThemeFriendlyTrip(answers) ? 18 : 5;
  }

  if (answers.people.includesSeniors && destination.goodFor.includes('parents')) {
    score += 8;
  }

  return score;
}

function isThemeFriendlyTrip(answers: TravelAnswers): boolean {
  return (
    (answers.purpose === 'culture' ||
      answers.purpose === 'parents' ||
      answers.companion === 'group') &&
    answers.pace !== 'full'
  );
}

function preferredMethodOrder(answers: TravelAnswers): TravelMethod[] {
  if (answers.accommodation === 'premium') {
    return [
      'resort',
      'package',
      'theme',
      'rental-car',
      'public-transit',
      'independent',
    ];
  }

  if (answers.movement === 'short') {
    return [
      'public-transit',
      'resort',
      'theme',
      'package',
      'independent',
      'rental-car',
    ];
  }

  return [
    'independent',
    'public-transit',
    'rental-car',
    'theme',
    'package',
    'resort',
  ];
}

function buildReasons(
  destination: DestinationProfile,
  answers: TravelAnswers,
  method: TravelMethod,
): string[] {
  const reasons = [
    `${destination.summary}라서 이번 여행 목적과 잘 맞습니다.`,
    `${getTravelMethodLabel(method)} 기준으로 동선을 잡으면 ${answers.period} 일정에 무리가 적습니다.`,
    `숙소는 ${answers.accommodation} 선호에 맞춰 잡기 쉽고, 이동 강도도 ${answers.movement} 수준으로 조절하기 좋습니다.`,
  ];

  if (method === 'theme') {
    reasons.push(
      '관심사에 맞춘 문화 코스와 식사 동선을 함께 묶어 친구들과 흐름이 끊기지 않습니다.',
    );
  }

  return reasons;
}

function buildBudgetRange(
  destination: DestinationProfile,
  answers: TravelAnswers,
): string {
  const perPersonBudget = calculatePerPersonBudget(
    answers.people,
    answers.totalBudget,
  );
  const low = destination.minBudgetPerPerson;
  const high = Math.max(low + 120000, Math.round(perPersonBudget * 1.1));

  return `1인 예상 ${formatWon(low)}~${formatWon(high)}`;
}

function formatWon(amount: number): string {
  return `${amount.toLocaleString('ko-KR')}원`;
}
