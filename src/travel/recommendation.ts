import type {
  DestinationProfile,
  PeopleCount,
  TravelAnswers,
  TravelMethod,
  TravelRecommendation,
  TravelRegionPreference,
} from './types';

const TOP_RECOMMENDATION_COUNT = 3;

const PURPOSE_LABELS: Record<TravelAnswers['purpose'], string> = {
  rest: '휴식',
  food: '미식',
  shopping: '쇼핑',
  nature: '자연',
  activity: '액티비티',
  culture: '문화',
  children: '아이 동반',
  parents: '부모님 동반',
};

const FEELING_LABELS: Record<TravelAnswers['feeling'], string> = {
  rest: '편안한 휴식',
  food: '맛있는 여행',
  city: '도시 감성',
  nature: '자연 속 시간',
  photo: '사진 남기기',
  comfort: '편한 동선',
};

const PERIOD_LABELS: Record<TravelAnswers['period'], string> = {
  'same-day': '당일',
  '1-night': '1박',
  '2-night': '2박',
  '3-night': '3박',
  '4-night-plus': '4박 이상',
  custom: '직접 입력한 일정',
};

const METHOD_LABELS: Record<TravelMethod, string> = {
  independent: '자유 여행',
  package: '패키지 여행',
  'rental-car': '렌터카 여행',
  'public-transit': '대중교통 여행',
  resort: '리조트 휴양',
  theme: '테마 가이드 여행',
};

const REGION_MATCH_SCORE = 80;

const DESTINATIONS: DestinationProfile[] = [
  {
    id: 'jeju',
    name: '제주',
    region: 'domestic',
    regions: ['domestic'],
    summary: '해안도로, 카페, 맛집, 자연 명소를 유연하게 묶기 좋은 섬 여행지입니다.',
    imageUrl: '/travel-images/jeju.png',
    tags: ['rest', 'food', 'nature', 'activity'],
    feelings: ['rest', 'nature', 'photo', 'comfort'],
    goodFor: ['partner', 'family', 'parents', 'friends'],
    methods: ['rental-car', 'theme', 'independent'],
    minBudgetPerPerson: 320000,
    idealPeriods: ['2-night', '3-night', '4-night-plus'],
    movement: ['medium', 'long'],
    accommodations: ['stylish', 'family', 'premium', 'location'],
    itinerary: ['동쪽 오름 산책', '해안 카페 코스', '현지 해산물 저녁'],
  },
  {
    id: 'busan',
    name: '부산',
    region: 'domestic',
    regions: ['domestic'],
    summary: '먹거리 시장, 해변, 쇼핑, 야경을 함께 즐기는 바다 도시 여행지입니다.',
    imageUrl: '/travel-images/busan.png',
    tags: ['food', 'shopping', 'culture'],
    feelings: ['city', 'food', 'photo'],
    goodFor: ['alone', 'partner', 'friends', 'family'],
    methods: ['public-transit', 'theme', 'independent'],
    minBudgetPerPerson: 220000,
    idealPeriods: ['1-night', '2-night', '3-night'],
    movement: ['short', 'medium'],
    accommodations: ['location', 'value', 'stylish'],
    itinerary: ['해운대 해변 산책', '전포 카페거리', '자갈치시장 저녁'],
  },
  {
    id: 'gangneung',
    name: '강릉',
    region: 'domestic',
    regions: ['domestic'],
    summary: '커피, 해산물, 여유로운 해변을 중심으로 쉬어가기 좋은 동해 여행지입니다.',
    imageUrl: '/travel-images/gangneung.png',
    tags: ['rest', 'food', 'nature'],
    feelings: ['rest', 'food', 'photo', 'comfort'],
    goodFor: ['partner', 'friends', 'parents'],
    methods: ['public-transit', 'independent', 'rental-car'],
    minBudgetPerPerson: 180000,
    idealPeriods: ['same-day', '1-night', '2-night'],
    movement: ['short', 'medium'],
    accommodations: ['value', 'location', 'stylish'],
    itinerary: ['안목 커피거리', '경포해변', '초당두부 식사'],
  },
  {
    id: 'gyeongju',
    name: '경주',
    region: 'domestic',
    regions: ['domestic'],
    summary: '유적지, 야경, 걷기 좋은 거리를 차분하게 잇는 문화 여행지입니다.',
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
    regions: ['domestic'],
    summary: '전시, 맛집, 쇼핑, 편한 대중교통을 촘촘하게 즐기는 도시 여행지입니다.',
    imageUrl: '/travel-images/seoul.png',
    tags: ['culture', 'shopping', 'food'],
    feelings: ['city', 'food', 'photo'],
    goodFor: ['alone', 'partner', 'friends', 'group'],
    methods: ['public-transit', 'theme', 'independent'],
    minBudgetPerPerson: 200000,
    idealPeriods: ['same-day', '1-night', '2-night'],
    movement: ['short', 'medium', 'long'],
    accommodations: ['location', 'stylish', 'premium', 'value'],
    itinerary: ['고궁 또는 갤러리 관람', '성수 카페 코스', '야간 쇼핑 거리'],
  },
  {
    id: 'yeosu',
    name: '여수',
    region: 'domestic',
    regions: ['domestic'],
    summary: '해산물, 섬, 항구 전망을 낭만적으로 즐기는 남해안 여행지입니다.',
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
    regions: ['domestic'],
    summary: '산과 바다를 함께 보고 시장 먹거리까지 즐기는 짧은 자연 여행지입니다.',
    imageUrl: '/travel-images/sokcho.png',
    tags: ['nature', 'food', 'activity'],
    feelings: ['nature', 'food', 'photo'],
    goodFor: ['friends', 'family', 'parents'],
    methods: ['rental-car', 'public-transit', 'independent'],
    minBudgetPerPerson: 190000,
    idealPeriods: ['same-day', '1-night', '2-night'],
    movement: ['medium', 'long'],
    accommodations: ['value', 'location', 'family'],
    itinerary: ['설악산 케이블카', '속초중앙시장', '등대전망대'],
  },
  {
    id: 'osaka',
    name: '오사카',
    region: 'international',
    regions: ['japan'],
    summary: '맛집, 쇼핑, 근교 문화 코스를 짧고 알차게 묶는 일본 도시 여행지입니다.',
    imageUrl: '/travel-images/osaka.png',
    tags: ['food', 'shopping', 'culture'],
    feelings: ['city', 'food', 'photo'],
    goodFor: ['friends', 'partner', 'family'],
    methods: ['public-transit', 'theme', 'independent'],
    minBudgetPerPerson: 650000,
    idealPeriods: ['2-night', '3-night', '4-night-plus'],
    movement: ['medium', 'long'],
    accommodations: ['location', 'value', 'stylish'],
    itinerary: ['도톤보리 먹거리 산책', '우메다 쇼핑', '교토 또는 나라 당일 코스'],
  },
  {
    id: 'danang',
    name: '다낭',
    region: 'international',
    regions: ['southeast-asia'],
    summary: '해변과 리조트 휴식, 호이안 일정, 편한 식사를 합리적으로 누리는 여행지입니다.',
    imageUrl: '/travel-images/danang.png',
    tags: ['rest', 'food', 'children'],
    feelings: ['rest', 'comfort', 'photo'],
    goodFor: ['family', 'partner', 'friends', 'parents'],
    methods: ['resort', 'package', 'independent'],
    minBudgetPerPerson: 720000,
    idealPeriods: ['3-night', '4-night-plus'],
    movement: ['short', 'medium'],
    accommodations: ['family', 'premium', 'value'],
    itinerary: ['미케비치 휴식', '바나힐 당일치기', '호이안 올드타운 저녁'],
  },
  {
    id: 'taipei',
    name: '타이베이',
    region: 'international',
    regions: ['china'],
    summary: '야시장, 카페, 근교 옛 마을을 대중교통으로 편하게 잇는 도시 여행지입니다.',
    imageUrl: '/travel-images/taipei.png',
    tags: ['food', 'culture', 'shopping'],
    feelings: ['city', 'food', 'comfort'],
    goodFor: ['friends', 'partner', 'alone', 'family'],
    methods: ['public-transit', 'theme', 'independent'],
    minBudgetPerPerson: 620000,
    idealPeriods: ['2-night', '3-night', '4-night-plus'],
    movement: ['short', 'medium'],
    accommodations: ['location', 'value', 'family'],
    itinerary: ['시먼딩과 현지 식사', '지우펀 당일 코스', '라오허 야시장'],
  },
  {
    id: 'fukuoka',
    name: '후쿠오카',
    region: 'international',
    regions: ['japan'],
    summary: '라멘, 쇼핑, 온천을 간단한 동선으로 즐기는 짧은 일본 여행지입니다.',
    imageUrl: '/travel-images/fukuoka.png',
    tags: ['food', 'shopping', 'rest'],
    feelings: ['city', 'food', 'comfort'],
    goodFor: ['friends', 'partner', 'parents'],
    methods: ['public-transit', 'theme', 'independent'],
    minBudgetPerPerson: 580000,
    idealPeriods: ['1-night', '2-night', '3-night'],
    movement: ['short', 'medium'],
    accommodations: ['location', 'value', 'premium'],
    itinerary: ['하카타 라멘 코스', '텐진 쇼핑', '유후인 당일 코스'],
  },
  {
    id: 'bangkok',
    name: '방콕',
    region: 'international',
    regions: ['southeast-asia'],
    summary: '호텔, 시장, 마사지, 사원, 가성비 좋은 음식을 활기 있게 즐기는 도시 여행지입니다.',
    imageUrl: '/travel-images/bangkok.png',
    tags: ['food', 'shopping', 'culture', 'rest'],
    feelings: ['city', 'food', 'comfort'],
    goodFor: ['friends', 'partner', 'family'],
    methods: ['independent', 'package', 'theme'],
    minBudgetPerPerson: 760000,
    idealPeriods: ['3-night', '4-night-plus'],
    movement: ['medium', 'long'],
    accommodations: ['premium', 'location', 'value'],
    itinerary: ['왕궁 일대', '짜뚜짝 또는 쇼핑몰', '루프톱 또는 마사지 저녁'],
  },
  {
    id: 'singapore',
    name: '싱가포르',
    region: 'international',
    regions: ['southeast-asia'],
    summary: '가족 명소와 예측 가능한 교통이 장점인 깔끔한 프리미엄 도시 여행지입니다.',
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
    regions: ['southeast-asia'],
    summary: '빌라 휴식과 가벼운 액티비티를 함께 구성하기 좋은 리조트 자연 여행지입니다.',
    imageUrl: '/travel-images/bali.png',
    tags: ['rest', 'nature', 'activity'],
    feelings: ['rest', 'nature', 'comfort', 'photo'],
    goodFor: ['partner', 'family', 'friends'],
    methods: ['resort', 'package', 'independent'],
    minBudgetPerPerson: 1150000,
    idealPeriods: ['4-night-plus', '3-night'],
    movement: ['medium', 'long'],
    accommodations: ['premium', 'stylish', 'family'],
    itinerary: ['우붓 빌라 휴식', '비치클럽 오후', '스파 예약'],
  },
  {
    id: 'tokyo',
    name: '도쿄',
    region: 'international',
    regions: ['japan'],
    summary: '전시, 쇼핑, 미식, 근교 당일 코스를 촘촘하게 선택할 수 있는 일본 대표 도시 여행지입니다.',
    imageUrl: '/travel-images/tokyo.png',
    tags: ['culture', 'shopping', 'food'],
    feelings: ['city', 'food', 'photo'],
    goodFor: ['alone', 'partner', 'friends', 'family'],
    methods: ['public-transit', 'theme', 'independent'],
    minBudgetPerPerson: 820000,
    idealPeriods: ['2-night', '3-night', '4-night-plus'],
    movement: ['short', 'medium', 'long'],
    accommodations: ['location', 'stylish', 'premium', 'value'],
    itinerary: ['시부야와 하라주쿠', '긴자 또는 미술관', '가마쿠라 당일 코스'],
  },
  {
    id: 'sapporo',
    name: '삿포로',
    region: 'international',
    regions: ['japan'],
    summary: '눈 풍경, 온천, 해산물, 여유로운 도시 산책을 함께 즐기기 좋은 홋카이도 여행지입니다.',
    imageUrl: '/travel-images/sapporo.png',
    tags: ['food', 'nature', 'rest'],
    feelings: ['nature', 'food', 'comfort', 'photo'],
    goodFor: ['partner', 'friends', 'parents', 'family'],
    methods: ['theme', 'package', 'public-transit'],
    minBudgetPerPerson: 780000,
    idealPeriods: ['2-night', '3-night', '4-night-plus'],
    movement: ['medium', 'long'],
    accommodations: ['location', 'premium', 'family'],
    itinerary: ['오도리공원 산책', '오타루 당일 코스', '해산물 시장 식사'],
  },
  {
    id: 'okinawa',
    name: '오키나와',
    region: 'international',
    regions: ['japan'],
    summary: '에메랄드빛 바다, 렌터카 드라이브, 리조트 휴식을 묶기 좋은 일본 휴양 여행지입니다.',
    imageUrl: '/travel-images/okinawa.png',
    tags: ['rest', 'nature', 'activity'],
    feelings: ['rest', 'nature', 'photo', 'comfort'],
    goodFor: ['partner', 'family', 'friends', 'parents'],
    methods: ['rental-car', 'resort', 'package'],
    minBudgetPerPerson: 850000,
    idealPeriods: ['3-night', '4-night-plus'],
    movement: ['medium', 'long'],
    accommodations: ['family', 'premium', 'location'],
    itinerary: ['츄라우미 수족관', '해변 드라이브', '국제거리 저녁'],
  },
  {
    id: 'guam',
    name: '괌',
    region: 'international',
    regions: ['other-asia'],
    summary: '짧은 비행으로 리조트, 쇼핑, 해변 휴식을 편하게 누리는 가족 휴양 여행지입니다.',
    imageUrl: '/travel-images/guam.png',
    tags: ['rest', 'shopping', 'children'],
    feelings: ['rest', 'comfort', 'photo'],
    goodFor: ['family', 'parents', 'partner'],
    methods: ['resort', 'package', 'rental-car'],
    minBudgetPerPerson: 1050000,
    idealPeriods: ['3-night', '4-night-plus'],
    movement: ['short', 'medium'],
    accommodations: ['family', 'premium', 'location'],
    itinerary: ['투몬비치 휴식', '쇼핑몰 방문', '남부 드라이브'],
  },
  {
    id: 'saipan',
    name: '사이판',
    region: 'international',
    regions: ['other-asia'],
    summary: '조용한 해변, 스노클링, 리조트 휴식을 단순한 동선으로 즐기는 휴양 여행지입니다.',
    imageUrl: '/travel-images/saipan.png',
    tags: ['rest', 'nature', 'activity'],
    feelings: ['rest', 'nature', 'comfort', 'photo'],
    goodFor: ['partner', 'family', 'parents'],
    methods: ['resort', 'package', 'rental-car'],
    minBudgetPerPerson: 980000,
    idealPeriods: ['3-night', '4-night-plus'],
    movement: ['short', 'medium'],
    accommodations: ['premium', 'family', 'location'],
    itinerary: ['마나가하섬', '리조트 휴식', '별빛 투어'],
  },
  {
    id: 'hong-kong-macau',
    name: '홍콩과 마카오',
    region: 'international',
    regions: ['china'],
    summary: '야경, 미식, 쇼핑, 카지노 리조트를 짧은 일정에 밀도 있게 담는 도시 여행지입니다.',
    imageUrl: '/travel-images/hong-kong-macau.png',
    tags: ['food', 'shopping', 'culture'],
    feelings: ['city', 'food', 'photo'],
    goodFor: ['friends', 'partner', 'group', 'parents'],
    methods: ['public-transit', 'theme', 'package'],
    minBudgetPerPerson: 820000,
    idealPeriods: ['2-night', '3-night', '4-night-plus'],
    movement: ['short', 'medium'],
    accommodations: ['location', 'premium', 'stylish'],
    itinerary: ['빅토리아 피크 야경', '딤섬 식사', '마카오 당일 코스'],
  },
  {
    id: 'sydney',
    name: '시드니',
    region: 'international',
    regions: ['oceania'],
    summary: '항구 전망, 해변 산책, 도시 문화와 자연을 함께 즐기는 호주 대표 여행지입니다.',
    imageUrl: '/travel-images/sydney.png',
    tags: ['nature', 'culture', 'activity'],
    feelings: ['city', 'nature', 'photo', 'comfort'],
    goodFor: ['partner', 'friends', 'family'],
    methods: ['independent', 'theme', 'package'],
    minBudgetPerPerson: 1900000,
    idealPeriods: ['4-night-plus'],
    movement: ['medium', 'long'],
    accommodations: ['location', 'premium', 'family'],
    itinerary: ['오페라하우스', '본다이 해변', '블루마운틴 당일 코스'],
  },
  {
    id: 'paris',
    name: '파리',
    region: 'international',
    regions: ['western-europe'],
    summary: '미술관, 카페, 쇼핑, 클래식한 거리 산책을 중심으로 한 유럽 문화 여행지입니다.',
    imageUrl: '/travel-images/paris.png',
    tags: ['culture', 'shopping', 'food'],
    feelings: ['city', 'photo', 'food'],
    goodFor: ['partner', 'friends', 'parents'],
    methods: ['theme', 'package', 'public-transit'],
    minBudgetPerPerson: 2400000,
    idealPeriods: ['4-night-plus'],
    movement: ['medium', 'long'],
    accommodations: ['location', 'premium', 'stylish'],
    itinerary: ['루브르 또는 오르세', '마레 지구 산책', '센강 야경'],
  },
  {
    id: 'rome',
    name: '로마',
    region: 'international',
    regions: ['western-europe'],
    summary: '고대 유적, 바티칸, 이탈리아 음식을 한 흐름으로 즐기는 역사 문화 여행지입니다.',
    imageUrl: '/travel-images/rome.png',
    tags: ['culture', 'food', 'parents'],
    feelings: ['city', 'food', 'photo'],
    goodFor: ['partner', 'parents', 'friends', 'group'],
    methods: ['theme', 'package', 'public-transit'],
    minBudgetPerPerson: 2300000,
    idealPeriods: ['4-night-plus'],
    movement: ['medium', 'long'],
    accommodations: ['location', 'premium', 'stylish'],
    itinerary: ['콜로세움', '바티칸 박물관', '트라스테베레 저녁'],
  },
  {
    id: 'new-york',
    name: '뉴욕',
    region: 'international',
    regions: ['americas'],
    summary: '뮤지컬, 미술관, 쇼핑, 도시 야경을 강하게 즐기는 장거리 대도시 여행지입니다.',
    imageUrl: '/travel-images/new-york.png',
    tags: ['culture', 'shopping', 'food'],
    feelings: ['city', 'photo', 'food'],
    goodFor: ['friends', 'partner', 'alone'],
    methods: ['independent', 'theme', 'public-transit'],
    minBudgetPerPerson: 2600000,
    idealPeriods: ['4-night-plus'],
    movement: ['medium', 'long'],
    accommodations: ['location', 'premium', 'stylish'],
    itinerary: ['센트럴파크', '브로드웨이 뮤지컬', '전망대 야경'],
  },
  {
    id: 'london',
    name: '런던',
    region: 'international',
    regions: ['western-europe'],
    summary: '박물관, 왕실 명소, 뮤지컬, 공원 산책을 차분하게 묶는 영국 대표 도시 여행지입니다.',
    imageUrl: '/travel-images/london.png',
    tags: ['culture', 'shopping', 'food'],
    feelings: ['city', 'photo', 'comfort'],
    goodFor: ['partner', 'friends', 'parents', 'alone'],
    methods: ['public-transit', 'theme', 'package'],
    minBudgetPerPerson: 2400000,
    idealPeriods: ['4-night-plus'],
    movement: ['medium', 'long'],
    accommodations: ['location', 'premium', 'stylish'],
    itinerary: ['대영박물관', '코번트가든 산책', '웨스트엔드 뮤지컬'],
  },
  {
    id: 'barcelona',
    name: '바르셀로나',
    region: 'international',
    regions: ['western-europe'],
    summary: '가우디 건축, 지중해 분위기, 타파스 미식을 함께 즐기는 스페인 문화 여행지입니다.',
    imageUrl: '/travel-images/barcelona.png',
    tags: ['culture', 'food', 'shopping'],
    feelings: ['city', 'photo', 'food'],
    goodFor: ['partner', 'friends', 'group'],
    methods: ['public-transit', 'theme', 'package'],
    minBudgetPerPerson: 2200000,
    idealPeriods: ['4-night-plus'],
    movement: ['medium', 'long'],
    accommodations: ['location', 'stylish', 'premium'],
    itinerary: ['사그라다 파밀리아', '고딕 지구 산책', '보케리아 시장'],
  },
  {
    id: 'istanbul',
    name: '이스탄불',
    region: 'international',
    regions: ['middle-east'],
    summary: '동서양 문화, 시장, 사원, 보스포루스 풍경을 한 번에 경험하는 역사 여행지입니다.',
    imageUrl: '/travel-images/istanbul.png',
    tags: ['culture', 'food', 'shopping'],
    feelings: ['city', 'photo', 'food'],
    goodFor: ['partner', 'friends', 'parents', 'group'],
    methods: ['theme', 'package', 'public-transit'],
    minBudgetPerPerson: 1700000,
    idealPeriods: ['3-night', '4-night-plus'],
    movement: ['medium', 'long'],
    accommodations: ['location', 'premium', 'value'],
    itinerary: ['아야소피아', '그랜드 바자르', '보스포루스 크루즈'],
  },
  {
    id: 'dubai',
    name: '두바이',
    region: 'international',
    regions: ['middle-east'],
    summary: '초고층 전망, 쇼핑몰, 사막 투어, 리조트 휴식을 화려하게 즐기는 도시 여행지입니다.',
    imageUrl: '/travel-images/dubai.png',
    tags: ['shopping', 'activity', 'rest'],
    feelings: ['city', 'photo', 'comfort'],
    goodFor: ['partner', 'family', 'friends', 'group'],
    methods: ['theme', 'package', 'resort'],
    minBudgetPerPerson: 1800000,
    idealPeriods: ['3-night', '4-night-plus'],
    movement: ['medium', 'long'],
    accommodations: ['premium', 'family', 'location'],
    itinerary: ['부르즈 할리파 전망대', '두바이몰', '사막 사파리'],
  },
  {
    id: 'maldives',
    name: '몰디브',
    region: 'international',
    regions: ['other-asia'],
    summary: '수상 빌라, 투명한 바다, 조용한 휴식을 중심으로 하는 프리미엄 휴양 여행지입니다.',
    imageUrl: '/travel-images/maldives.png',
    tags: ['rest', 'nature', 'activity'],
    feelings: ['rest', 'nature', 'photo', 'comfort'],
    goodFor: ['partner', 'parents'],
    methods: ['resort', 'package'],
    minBudgetPerPerson: 2500000,
    idealPeriods: ['4-night-plus'],
    movement: ['short'],
    accommodations: ['premium'],
    itinerary: ['수상 빌라 휴식', '스노클링', '선셋 디너'],
  },
  {
    id: 'phuket',
    name: '푸껫',
    region: 'international',
    regions: ['southeast-asia'],
    summary: '해변 리조트, 섬 투어, 마사지와 야시장을 함께 즐기는 태국 휴양 여행지입니다.',
    imageUrl: '/travel-images/phuket.png',
    tags: ['rest', 'food', 'activity'],
    feelings: ['rest', 'food', 'photo', 'comfort'],
    goodFor: ['partner', 'friends', 'family', 'parents'],
    methods: ['resort', 'package', 'theme'],
    minBudgetPerPerson: 900000,
    idealPeriods: ['3-night', '4-night-plus'],
    movement: ['short', 'medium'],
    accommodations: ['family', 'premium', 'value'],
    itinerary: ['빠통 해변', '피피섬 투어', '야시장 저녁'],
  },
  {
    id: 'chiang-mai',
    name: '치앙마이',
    region: 'international',
    regions: ['southeast-asia'],
    summary: '사원, 숲, 카페, 야시장을 느린 속도로 즐기는 북태국 감성 여행지입니다.',
    imageUrl: '/travel-images/chiang-mai.png',
    tags: ['culture', 'food', 'nature'],
    feelings: ['rest', 'food', 'nature', 'comfort'],
    goodFor: ['alone', 'partner', 'friends', 'parents'],
    methods: ['theme', 'independent', 'package'],
    minBudgetPerPerson: 820000,
    idealPeriods: ['3-night', '4-night-plus'],
    movement: ['short', 'medium'],
    accommodations: ['value', 'stylish', 'location'],
    itinerary: ['도이수텝 사원', '님만 카페거리', '선데이 야시장'],
  },
  {
    id: 'prague',
    name: '프라하',
    region: 'international',
    regions: ['eastern-europe'],
    summary: '중세 도시 풍경, 성, 다리, 클래식한 야경을 걷기 좋게 묶는 유럽 여행지입니다.',
    imageUrl: '/travel-images/prague.png',
    tags: ['culture', 'food', 'parents'],
    feelings: ['city', 'photo', 'comfort'],
    goodFor: ['partner', 'friends', 'parents'],
    methods: ['theme', 'package', 'public-transit'],
    minBudgetPerPerson: 2100000,
    idealPeriods: ['4-night-plus'],
    movement: ['short', 'medium'],
    accommodations: ['location', 'stylish', 'premium'],
    itinerary: ['프라하성', '카를교 산책', '구시가지 야경'],
  },
  {
    id: 'vienna',
    name: '빈',
    region: 'international',
    regions: ['western-europe'],
    summary: '궁전, 클래식 음악, 카페 문화를 차분하게 즐기는 오스트리아 문화 여행지입니다.',
    imageUrl: '/travel-images/vienna.png',
    tags: ['culture', 'food', 'parents'],
    feelings: ['city', 'comfort', 'photo'],
    goodFor: ['partner', 'parents', 'friends'],
    methods: ['theme', 'package', 'public-transit'],
    minBudgetPerPerson: 2200000,
    idealPeriods: ['4-night-plus'],
    movement: ['short', 'medium'],
    accommodations: ['location', 'premium', 'stylish'],
    itinerary: ['쇤브룬 궁전', '링 거리 산책', '클래식 공연'],
  },
  {
    id: 'vancouver',
    name: '밴쿠버',
    region: 'international',
    regions: ['americas'],
    summary: '도시와 바다, 숲과 산이 가까워 자연 산책과 미식을 함께 즐기는 캐나다 여행지입니다.',
    imageUrl: '/travel-images/vancouver.png',
    tags: ['nature', 'food', 'activity'],
    feelings: ['nature', 'city', 'photo', 'comfort'],
    goodFor: ['partner', 'friends', 'family'],
    methods: ['independent', 'theme', 'rental-car'],
    minBudgetPerPerson: 2300000,
    idealPeriods: ['4-night-plus'],
    movement: ['medium', 'long'],
    accommodations: ['location', 'family', 'premium'],
    itinerary: ['스탠리파크', '그랜빌 아일랜드', '캐필라노 브리지'],
  },
  {
    id: 'canadian-rockies-aurora',
    name: '캐나다 로키와 오로라',
    region: 'international',
    regions: ['americas'],
    summary: '웅장한 자연 풍경과 오로라 관측을 목표로 하는 장거리 테마 여행지입니다.',
    imageUrl: '/travel-images/canadian-rockies-aurora.png',
    tags: ['nature', 'activity', 'culture'],
    feelings: ['nature', 'photo'],
    goodFor: ['partner', 'friends', 'group'],
    methods: ['theme', 'package', 'rental-car'],
    minBudgetPerPerson: 2600000,
    idealPeriods: ['4-night-plus'],
    movement: ['long'],
    accommodations: ['premium', 'location'],
    itinerary: ['밴프 국립공원', '아이스필드 파크웨이', '오로라 관측의 밤'],
  },
  {
    id: 'hawaii',
    name: '하와이',
    region: 'international',
    regions: ['americas', 'oceania'],
    summary: '휴식, 쇼핑, 부담 없는 액티비티를 균형 있게 즐기는 장거리 해변 여행지입니다.',
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
    name: '상하이와 항저우',
    region: 'international',
    regions: ['china'],
    summary: '스카이라인 전망, 음식, 고전적인 풍경을 함께 보는 중국 도시 문화 여행지입니다.',
    imageUrl: '/travel-images/shanghai-hangzhou.png',
    tags: ['culture', 'food', 'shopping'],
    feelings: ['city', 'food', 'photo'],
    goodFor: ['friends', 'partner', 'group', 'parents'],
    methods: ['theme', 'public-transit', 'package'],
    minBudgetPerPerson: 780000,
    idealPeriods: ['3-night', '4-night-plus'],
    movement: ['medium', 'long'],
    accommodations: ['location', 'premium', 'value'],
    itinerary: ['와이탄 야경', '예원 산책', '서호 당일 코스'],
  },
  {
    id: 'cruise',
    name: '크루즈',
    region: 'international',
    regions: ['other-asia'],
    summary: '이동, 식사, 공연이 한 번에 묶여 단체가 편하게 움직이는 여행 방식입니다.',
    imageUrl: '/travel-images/cruise.png',
    tags: ['parents', 'rest', 'food'],
    feelings: ['comfort', 'rest'],
    goodFor: ['parents', 'family', 'group'],
    methods: ['package', 'theme', 'resort'],
    minBudgetPerPerson: 1300000,
    idealPeriods: ['3-night', '4-night-plus'],
    movement: ['short'],
    accommodations: ['premium', 'family'],
    itinerary: ['승선과 객실 체크인', '기항지 관광', '선상 공연과 저녁'],
  },
];

export function calculatePerPersonBudget(
  people: PeopleCount,
  totalBudget: number,
): number {
  const headcount = people.adults + people.children;
  return Math.round(totalBudget / Math.max(1, headcount));
}

export function getDestinationCount(): number {
  return DESTINATIONS.length;
}

export function getDestinationProfiles(): readonly DestinationProfile[] {
  return DESTINATIONS.map((destination) => ({
    ...destination,
    regions: [...destination.regions],
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
  const themeFriendlyCompanion = ['friends', 'group', 'parents'].includes(
    answers.companion,
  );
  const themeFriendlyPurpose = [
    'culture',
    'food',
    'nature',
    'activity',
    'parents',
  ].includes(answers.purpose);
  const themeFriendlyFeeling = ['city', 'photo', 'nature', 'food'].includes(
    answers.feeling,
  );
  const themeFriendlyPace = answers.pace === 'balanced' || answers.pace === 'relaxed';

  if (
    methods.includes('theme') &&
    perPersonBudget >= 450000 &&
    themeFriendlyPace &&
    (themeFriendlyCompanion || themeFriendlyPurpose || themeFriendlyFeeling)
  ) {
    return 'theme';
  }

  if (perPersonBudget < 250000 && methods.includes('public-transit')) {
    return 'public-transit';
  }

  if (perPersonBudget < 250000 && methods.includes('independent')) {
    return 'independent';
  }

  if (answers.accommodation === 'premium' && methods.includes('resort')) {
    return 'resort';
  }

  if (answers.companion === 'family' && methods.includes('package')) {
    return 'package';
  }

  if (answers.movement === 'short' && methods.includes('public-transit')) {
    return 'public-transit';
  }

  return methods[0];
}

export function getRecommendations(
  answers: TravelAnswers,
): TravelRecommendation[] {
  return DESTINATIONS.map((destination, order) => {
    const method = selectTravelMethod(answers, destination.methods);
    return {
      destination,
      method,
      score: scoreDestination(destination, answers, method),
      order,
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
      itinerary: buildItinerary(destination, answers.period),
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
  if (matchesPreferredRegion(destination.regions, answers.preferredRegion)) {
    score += REGION_MATCH_SCORE;
  }

  const budgetGap = perPersonBudget - destination.minBudgetPerPerson;
  if (budgetGap >= 0) {
    score += Math.min(18, Math.floor(budgetGap / 100000) + 8);
  } else {
    score -= Math.min(30, Math.ceil(Math.abs(budgetGap) / 50000) * 3);
  }

  if (method === 'theme') {
    score += 18;
  }

  if (answers.people.includesSeniors && destination.goodFor.includes('parents')) {
    score += 8;
  }

  return score;
}

function buildReasons(
  destination: DestinationProfile,
  answers: TravelAnswers,
  method: TravelMethod,
): string[] {
  const perPersonBudget = calculatePerPersonBudget(
    answers.people,
    answers.totalBudget,
  );
  const reasons = [
    `${destination.name}${topicParticle(destination.name)} ${PURPOSE_LABELS[answers.purpose]} 목적과 ${FEELING_LABELS[answers.feeling]} 분위기에 잘 맞습니다.`,
    `${getTravelMethodLabel(method)} 방식이면 ${PERIOD_LABELS[answers.period]} 일정과 원하는 이동 부담을 현실적으로 맞출 수 있습니다.`,
    `1인 예산은 약 ${formatWon(perPersonBudget)}이며, 현지 최소 여행 비용과 비교해 추천했습니다.`,
  ];

  if (method === 'theme') {
    reasons.push(
      '테마 코스는 맛집, 문화, 풍경, 사진 명소를 흩어진 목록이 아니라 하나의 흐름으로 묶어 줍니다.',
    );
  }

  if (answers.people.includesSeniors) {
    reasons.push('짧은 이동과 넉넉한 휴식 시간을 넣어 부모님도 편하게 움직일 수 있습니다.');
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
  const displayBudget =
    destination.region === 'domestic'
      ? Math.min(perPersonBudget, 600000)
      : perPersonBudget;
  const low = Math.max(
    destination.minBudgetPerPerson,
    Math.round(displayBudget * 0.85),
  );
  const high =
    destination.region === 'domestic'
      ? Math.min(600000, Math.max(low + 120000, displayBudget))
      : Math.max(low + 120000, Math.round(displayBudget * 1.1));

  return `1인당 ${formatWon(low)}-${formatWon(high)}`;
}

function matchesPreferredRegion(
  destinationRegions: TravelRegionPreference[],
  preferredRegion: TravelRegionPreference,
): boolean {
  return (
    preferredRegion !== 'no-preference' &&
    destinationRegions.includes(preferredRegion)
  );
}

function topicParticle(value: string): '은' | '는' {
  const lastCharacter = [...value].at(-1);
  if (!lastCharacter) return '는';

  const code = lastCharacter.charCodeAt(0);
  const hangulStart = 0xac00;
  const hangulEnd = 0xd7a3;

  if (code < hangulStart || code > hangulEnd) {
    return '는';
  }

  return (code - hangulStart) % 28 === 0 ? '는' : '은';
}

function buildItinerary(
  destination: DestinationProfile,
  period: TravelAnswers['period'],
): string[] {
  if (period === 'same-day') return destination.itinerary.slice(0, 1);
  if (period === '1-night') return destination.itinerary.slice(0, 2);
  if (period === '2-night') return destination.itinerary.slice(0, 3);
  return destination.itinerary;
}

function formatWon(amount: number): string {
  return `${amount.toLocaleString('ko-KR')}원`;
}
