import type {
  DestinationProfile,
  PeopleCount,
  TravelAnswers,
  TravelMethod,
  TravelRecommendation,
} from './types';

const TOP_RECOMMENDATION_COUNT = 3;

const METHOD_LABELS: Record<TravelMethod, string> = {
  independent: 'independent trip',
  package: 'package trip',
  'rental-car': 'rental car trip',
  'public-transit': 'public transit trip',
  resort: 'resort stay',
  theme: 'guided theme trip',
};

const DESTINATIONS: DestinationProfile[] = [
  {
    id: 'jeju',
    name: 'Jeju',
    region: 'domestic',
    summary: 'A flexible island route with coast roads, cafes, food, and nature stops.',
    imageUrl: '/travel-images/jeju.png',
    tags: ['rest', 'food', 'nature', 'activity'],
    feelings: ['rest', 'nature', 'photo', 'comfort'],
    goodFor: ['partner', 'family', 'parents', 'friends'],
    methods: ['rental-car', 'theme', 'independent'],
    minBudgetPerPerson: 320000,
    idealPeriods: ['2-night', '3-night', '4-night-plus'],
    movement: ['medium', 'long'],
    accommodations: ['stylish', 'family', 'premium', 'location'],
    itinerary: ['East Jeju oreum walk', 'Coastal cafe route', 'Local seafood dinner'],
  },
  {
    id: 'busan',
    name: 'Busan',
    region: 'domestic',
    summary: 'A seaside city trip for food markets, beaches, shopping, and night views.',
    imageUrl: '/travel-images/busan.png',
    tags: ['food', 'shopping', 'culture'],
    feelings: ['city', 'food', 'photo'],
    goodFor: ['alone', 'partner', 'friends', 'family'],
    methods: ['public-transit', 'theme', 'independent'],
    minBudgetPerPerson: 220000,
    idealPeriods: ['1-night', '2-night', '3-night'],
    movement: ['short', 'medium'],
    accommodations: ['location', 'value', 'stylish'],
    itinerary: ['Haeundae beach walk', 'Jeonpo cafe street', 'Jagalchi market dinner'],
  },
  {
    id: 'gangneung',
    name: 'Gangneung',
    region: 'domestic',
    summary: 'A quiet east-coast break built around coffee, seafood, and relaxed beaches.',
    imageUrl: '/travel-images/gangneung.png',
    tags: ['rest', 'food', 'nature'],
    feelings: ['rest', 'food', 'photo', 'comfort'],
    goodFor: ['partner', 'friends', 'parents'],
    methods: ['public-transit', 'independent', 'rental-car'],
    minBudgetPerPerson: 180000,
    idealPeriods: ['same-day', '1-night', '2-night'],
    movement: ['short', 'medium'],
    accommodations: ['value', 'location', 'stylish'],
    itinerary: ['Anmok coffee street', 'Gyeongpo beach', 'Chodang tofu meal'],
  },
  {
    id: 'gyeongju',
    name: 'Gyeongju',
    region: 'domestic',
    summary: 'A calm cultural route with heritage sites, night scenery, and walkable streets.',
    imageUrl: '/travel-images/gyeongju.png',
    tags: ['culture', 'children', 'parents'],
    feelings: ['city', 'photo', 'comfort'],
    goodFor: ['friends', 'family', 'parents', 'group'],
    methods: ['theme', 'public-transit', 'independent'],
    minBudgetPerPerson: 210000,
    idealPeriods: ['1-night', '2-night', '3-night'],
    movement: ['short', 'medium'],
    accommodations: ['location', 'stylish', 'family'],
    itinerary: ['Daereungwon walk', 'Hwangnidan-gil lunch', 'Donggung and Wolji night view'],
  },
  {
    id: 'seoul',
    name: 'Seoul',
    region: 'domestic',
    summary: 'A dense city break for exhibitions, restaurants, shopping, and easy transit.',
    imageUrl: '/travel-images/seoul.png',
    tags: ['culture', 'shopping', 'food'],
    feelings: ['city', 'food', 'photo'],
    goodFor: ['alone', 'partner', 'friends', 'group'],
    methods: ['public-transit', 'theme', 'independent'],
    minBudgetPerPerson: 200000,
    idealPeriods: ['same-day', '1-night', '2-night'],
    movement: ['short', 'medium', 'long'],
    accommodations: ['location', 'stylish', 'premium', 'value'],
    itinerary: ['Palace or gallery visit', 'Seongsu cafe route', 'Night shopping district'],
  },
  {
    id: 'yeosu',
    name: 'Yeosu',
    region: 'domestic',
    summary: 'A romantic southern coast trip with seafood, islands, and harbor views.',
    imageUrl: '/travel-images/yeosu.png',
    tags: ['rest', 'food', 'nature'],
    feelings: ['rest', 'food', 'photo'],
    goodFor: ['partner', 'friends', 'parents', 'family'],
    methods: ['independent', 'rental-car', 'public-transit'],
    minBudgetPerPerson: 230000,
    idealPeriods: ['1-night', '2-night', '3-night'],
    movement: ['short', 'medium'],
    accommodations: ['location', 'stylish', 'family'],
    itinerary: ['Odongdo walk', 'Marine cable car', 'Romantic pocha street'],
  },
  {
    id: 'sokcho',
    name: 'Sokcho',
    region: 'domestic',
    summary: 'A mountain-and-sea route for short nature breaks and market food.',
    imageUrl: '/travel-images/sokcho.png',
    tags: ['nature', 'food', 'activity'],
    feelings: ['nature', 'food', 'photo'],
    goodFor: ['friends', 'family', 'parents'],
    methods: ['rental-car', 'public-transit', 'independent'],
    minBudgetPerPerson: 190000,
    idealPeriods: ['same-day', '1-night', '2-night'],
    movement: ['medium', 'long'],
    accommodations: ['value', 'location', 'family'],
    itinerary: ['Seoraksan cable car', 'Sokcho central market', 'Lighthouse observatory'],
  },
  {
    id: 'osaka',
    name: 'Osaka',
    region: 'international',
    summary: 'A compact Japan city trip for food, shopping, and nearby cultural day routes.',
    imageUrl: '/travel-images/osaka.png',
    tags: ['food', 'shopping', 'culture'],
    feelings: ['city', 'food', 'photo'],
    goodFor: ['friends', 'partner', 'family'],
    methods: ['public-transit', 'theme', 'independent'],
    minBudgetPerPerson: 650000,
    idealPeriods: ['2-night', '3-night', '4-night-plus'],
    movement: ['medium', 'long'],
    accommodations: ['location', 'value', 'stylish'],
    itinerary: ['Dotonbori food walk', 'Umeda shopping', 'Kyoto or Nara day route'],
  },
  {
    id: 'danang',
    name: 'Da Nang',
    region: 'international',
    summary: 'A good-value beach and resort trip with Hoi An, rest time, and easy meals.',
    imageUrl: '/travel-images/danang.png',
    tags: ['rest', 'food', 'children'],
    feelings: ['rest', 'comfort', 'photo'],
    goodFor: ['family', 'partner', 'friends', 'parents'],
    methods: ['resort', 'package', 'independent'],
    minBudgetPerPerson: 720000,
    idealPeriods: ['3-night', '4-night-plus'],
    movement: ['short', 'medium'],
    accommodations: ['family', 'premium', 'value'],
    itinerary: ['My Khe beach rest', 'Ba Na Hills day trip', 'Hoi An old town evening'],
  },
  {
    id: 'taipei',
    name: 'Taipei',
    region: 'international',
    summary: 'A transit-friendly city trip for night markets, cafes, and nearby old towns.',
    imageUrl: '/travel-images/taipei.png',
    tags: ['food', 'culture', 'shopping'],
    feelings: ['city', 'food', 'comfort'],
    goodFor: ['friends', 'partner', 'alone', 'family'],
    methods: ['public-transit', 'theme', 'independent'],
    minBudgetPerPerson: 620000,
    idealPeriods: ['2-night', '3-night', '4-night-plus'],
    movement: ['short', 'medium'],
    accommodations: ['location', 'value', 'family'],
    itinerary: ['Ximending and local meal', 'Jiufen day route', 'Raohe night market'],
  },
  {
    id: 'fukuoka',
    name: 'Fukuoka',
    region: 'international',
    summary: 'A short Japan escape for ramen, shopping, hot springs, and simple logistics.',
    imageUrl: '/travel-images/fukuoka.png',
    tags: ['food', 'shopping', 'rest'],
    feelings: ['city', 'food', 'comfort'],
    goodFor: ['friends', 'partner', 'parents'],
    methods: ['public-transit', 'theme', 'independent'],
    minBudgetPerPerson: 580000,
    idealPeriods: ['1-night', '2-night', '3-night'],
    movement: ['short', 'medium'],
    accommodations: ['location', 'value', 'premium'],
    itinerary: ['Hakata ramen route', 'Tenjin shopping', 'Yufuin day course'],
  },
  {
    id: 'bangkok',
    name: 'Bangkok',
    region: 'international',
    summary: 'A lively city route with hotels, markets, massage, temples, and strong food value.',
    imageUrl: '/travel-images/bangkok.png',
    tags: ['food', 'shopping', 'culture', 'rest'],
    feelings: ['city', 'food', 'comfort'],
    goodFor: ['friends', 'partner', 'family'],
    methods: ['independent', 'package', 'theme'],
    minBudgetPerPerson: 760000,
    idealPeriods: ['3-night', '4-night-plus'],
    movement: ['medium', 'long'],
    accommodations: ['premium', 'location', 'value'],
    itinerary: ['Grand Palace area', 'Chatuchak or mall shopping', 'Rooftop or massage evening'],
  },
  {
    id: 'singapore',
    name: 'Singapore',
    region: 'international',
    summary: 'A clean premium city trip with family attractions and predictable transit.',
    imageUrl: '/travel-images/singapore.png',
    tags: ['children', 'shopping', 'food', 'culture'],
    feelings: ['city', 'comfort', 'photo'],
    goodFor: ['family', 'parents', 'partner'],
    methods: ['public-transit', 'package', 'theme'],
    minBudgetPerPerson: 1050000,
    idealPeriods: ['3-night', '4-night-plus'],
    movement: ['short', 'medium'],
    accommodations: ['family', 'premium', 'location'],
    itinerary: ['Gardens by the Bay', 'Sentosa', 'Hawker center meal'],
  },
  {
    id: 'bali',
    name: 'Bali',
    region: 'international',
    summary: 'A resort and nature trip that pairs villa rest with light activities.',
    imageUrl: '/travel-images/bali.png',
    tags: ['rest', 'nature', 'activity'],
    feelings: ['rest', 'nature', 'comfort', 'photo'],
    goodFor: ['partner', 'family', 'friends'],
    methods: ['resort', 'package', 'independent'],
    minBudgetPerPerson: 1150000,
    idealPeriods: ['4-night-plus', '3-night'],
    movement: ['medium', 'long'],
    accommodations: ['premium', 'stylish', 'family'],
    itinerary: ['Ubud villa rest', 'Beach club afternoon', 'Spa booking'],
  },
  {
    id: 'canadian-rockies-aurora',
    name: 'Canadian Rockies and Aurora',
    region: 'international',
    summary: 'A long-haul nature theme trip for dramatic scenery and aurora viewing.',
    imageUrl: '/travel-images/canadian-rockies-aurora.png',
    tags: ['nature', 'activity', 'culture'],
    feelings: ['nature', 'photo'],
    goodFor: ['partner', 'friends', 'group'],
    methods: ['theme', 'package', 'rental-car'],
    minBudgetPerPerson: 2600000,
    idealPeriods: ['4-night-plus'],
    movement: ['long'],
    accommodations: ['premium', 'location'],
    itinerary: ['Banff National Park', 'Icefields Parkway', 'Aurora viewing night'],
  },
  {
    id: 'hawaii',
    name: 'Hawaii',
    region: 'international',
    summary: 'A long-haul beach trip balancing rest, shopping, and soft activities.',
    imageUrl: '/travel-images/hawaii.png',
    tags: ['rest', 'shopping', 'activity'],
    feelings: ['rest', 'photo', 'comfort'],
    goodFor: ['partner', 'family', 'parents'],
    methods: ['resort', 'package', 'rental-car'],
    minBudgetPerPerson: 2200000,
    idealPeriods: ['4-night-plus'],
    movement: ['medium', 'long'],
    accommodations: ['premium', 'family', 'location'],
    itinerary: ['Waikiki beach', 'Ala Moana shopping', 'Oahu scenic drive'],
  },
  {
    id: 'shanghai-hangzhou',
    name: 'Shanghai and Hangzhou',
    region: 'international',
    summary: 'A China city-and-culture route mixing skyline views, food, and classical scenery.',
    imageUrl: '/travel-images/shanghai-hangzhou.png',
    tags: ['culture', 'food', 'shopping'],
    feelings: ['city', 'food', 'photo'],
    goodFor: ['friends', 'partner', 'group', 'parents'],
    methods: ['theme', 'public-transit', 'package'],
    minBudgetPerPerson: 780000,
    idealPeriods: ['3-night', '4-night-plus'],
    movement: ['medium', 'long'],
    accommodations: ['location', 'premium', 'value'],
    itinerary: ['The Bund night view', 'Yu Garden walk', 'West Lake day route'],
  },
  {
    id: 'cruise',
    name: 'Cruise',
    region: 'international',
    summary: 'A low-friction group trip where transport, meals, and entertainment stay bundled.',
    imageUrl: '/travel-images/cruise.png',
    tags: ['parents', 'rest', 'food'],
    feelings: ['comfort', 'rest'],
    goodFor: ['parents', 'family', 'group'],
    methods: ['package', 'theme', 'resort'],
    minBudgetPerPerson: 1300000,
    idealPeriods: ['3-night', '4-night-plus'],
    movement: ['short'],
    accommodations: ['premium', 'family'],
    itinerary: ['Boarding and cabin check-in', 'Port city excursion', 'Onboard show and dinner'],
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
    `${destination.name} fits your ${answers.purpose} focus and ${answers.feeling} mood.`,
    `A ${getTravelMethodLabel(method)} keeps the ${answers.period} schedule realistic for your movement preference.`,
    `Your per-person budget is about ${formatWon(perPersonBudget)}, which is compared against local minimum trip costs.`,
  ];

  if (method === 'theme') {
    reasons.push(
      'A themed route groups food, culture, scenery, and photo stops into a clearer story instead of listing unrelated sights.',
    );
  }

  if (answers.people.includesSeniors) {
    reasons.push('The route can be paced with shorter transfers and longer rest windows.');
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
  const low = Math.max(
    destination.minBudgetPerPerson,
    Math.round(perPersonBudget * 0.85),
  );
  const high = Math.max(low + 120000, Math.round(perPersonBudget * 1.1));

  return `per person ${formatWon(low)}-${formatWon(high)}`;
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
  return `${amount.toLocaleString('ko-KR')} KRW`;
}
