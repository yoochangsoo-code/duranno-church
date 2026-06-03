import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import {
  calculatePerPersonBudget,
  getDestinationCount,
  getDestinationProfiles,
  getRecommendations,
  getTravelMethodLabel,
  selectTravelMethod,
} from './recommendation';
import type { TravelAnswers } from './types';

const baseAnswers: TravelAnswers = {
  preferredRegion: 'no-preference',
  feeling: 'city',
  purpose: 'culture',
  period: '2-night',
  startDate: '',
  endDate: '',
  companion: 'friends',
  people: { adults: 2, children: 0, includesSeniors: false },
  totalBudget: 1600000,
  pace: 'balanced',
  movement: 'medium',
  accommodation: 'location',
};

assert.equal(
  calculatePerPersonBudget(
    { adults: 2, children: 1, includesSeniors: false },
    900000,
  ),
  300000,
);
assert.equal(
  calculatePerPersonBudget(
    { adults: 0, children: 0, includesSeniors: false },
    900000,
  ),
  900000,
);

const expectedDestinationImages = new Map([
  ['jeju', '/travel-images/jeju.png'],
  ['busan', '/travel-images/busan.png'],
  ['gangneung', '/travel-images/gangneung.png'],
  ['gyeongju', '/travel-images/gyeongju.png'],
  ['seoul', '/travel-images/seoul.png'],
  ['yeosu', '/travel-images/yeosu.png'],
  ['sokcho', '/travel-images/sokcho.png'],
  ['osaka', '/travel-images/osaka.png'],
  ['danang', '/travel-images/danang.png'],
  ['taipei', '/travel-images/taipei.png'],
  ['fukuoka', '/travel-images/fukuoka.png'],
  ['bangkok', '/travel-images/bangkok.png'],
  ['singapore', '/travel-images/singapore.png'],
  ['bali', '/travel-images/bali.png'],
  ['tokyo', '/travel-images/tokyo.png'],
  ['sapporo', '/travel-images/sapporo.png'],
  ['okinawa', '/travel-images/okinawa.png'],
  ['guam', '/travel-images/guam.png'],
  ['saipan', '/travel-images/saipan.png'],
  ['hong-kong-macau', '/travel-images/hong-kong-macau.png'],
  ['sydney', '/travel-images/sydney.png'],
  ['paris', '/travel-images/paris.png'],
  ['rome', '/travel-images/rome.png'],
  ['new-york', '/travel-images/new-york.png'],
  ['london', '/travel-images/london.png'],
  ['barcelona', '/travel-images/barcelona.png'],
  ['istanbul', '/travel-images/istanbul.png'],
  ['dubai', '/travel-images/dubai.png'],
  ['maldives', '/travel-images/maldives.png'],
  ['phuket', '/travel-images/phuket.png'],
  ['chiang-mai', '/travel-images/chiang-mai.png'],
  ['prague', '/travel-images/prague.png'],
  ['vienna', '/travel-images/vienna.png'],
  ['vancouver', '/travel-images/vancouver.png'],
  ['canadian-rockies-aurora', '/travel-images/canadian-rockies-aurora.png'],
  ['hawaii', '/travel-images/hawaii.png'],
  ['shanghai-hangzhou', '/travel-images/shanghai-hangzhou.png'],
  ['cruise', '/travel-images/cruise.png'],
]);

const destinationProfiles = getDestinationProfiles();
assert.equal(getDestinationCount(), expectedDestinationImages.size);
assert.equal(destinationProfiles.length, expectedDestinationImages.size);
assert.deepEqual(
  destinationProfiles.map((destination) => destination.id),
  [...expectedDestinationImages.keys()],
);
for (const destination of destinationProfiles) {
  assert.equal(
    destination.imageUrl,
    expectedDestinationImages.get(destination.id),
  );
  assert.ok(
    existsSync(`public${destination.imageUrl}`),
    `${destination.imageUrl} 파일이 public 폴더에 있어야 합니다.`,
  );
}

assert.equal(getTravelMethodLabel('theme'), '테마 가이드 여행');
assert.equal(getTravelMethodLabel('public-transit'), '대중교통 여행');

const recommendations = getRecommendations(baseAnswers);
assert.equal(recommendations.length, 3);
recommendations.forEach((recommendation, index) => {
  assert.equal(recommendation.rank, index + 1);
  assert.ok(recommendation.destination.imageUrl.startsWith('/travel-images/'));
  assert.ok(recommendation.reasons.length >= 3);
  assert.ok(recommendation.budgetRange.includes('1인당'));
  assert.ok(recommendation.budgetRange.includes('원'));
  assert.ok(recommendation.itinerary.length >= 1);
  assert.doesNotMatch(recommendation.destination.summary, /[A-Za-z]/);
  assert.doesNotMatch(recommendation.reasons.join(' '), /[A-Za-z]/);
  assert.doesNotMatch(recommendation.itinerary.join(' '), /[A-Za-z]/);
});
assert.ok(recommendations[0].itinerary.length >= 3);

const japanRecommendations = getRecommendations({
  ...baseAnswers,
  preferredRegion: 'japan',
  feeling: 'food',
  purpose: 'food',
  period: '2-night',
  totalBudget: 1800000,
  movement: 'medium',
});
assert.ok(japanRecommendations.length > 0);
japanRecommendations.forEach((recommendation) => {
  assert.ok(
    recommendation.destination.regions.includes('japan'),
    `일본 선호 시 일본 여행지가 우선 추천되어야 합니다: ${recommendation.destination.name}`,
  );
});

const domesticRegionRecommendations = getRecommendations({
  ...baseAnswers,
  preferredRegion: 'domestic',
  feeling: 'rest',
  purpose: 'nature',
  period: '2-night',
  totalBudget: 1000000,
});
domesticRegionRecommendations.forEach((recommendation) => {
  assert.ok(
    recommendation.destination.regions.includes('domestic'),
    `국내 선호 시 국내 여행지가 우선 추천되어야 합니다: ${recommendation.destination.name}`,
  );
});

const highBudgetDomesticAnswers: TravelAnswers = {
  ...baseAnswers,
  purpose: 'nature',
  period: '2-night',
  totalBudget: 2000000,
  people: { adults: 2, children: 0, includesSeniors: false },
};
const domesticRecommendations = getRecommendations(
  highBudgetDomesticAnswers,
).filter((recommendation) => recommendation.destination.region === 'domestic');
assert.ok(domesticRecommendations.length > 0);
domesticRecommendations.forEach((recommendation) => {
  const amounts = recommendation.budgetRange
    .match(/\d[\d,]*원/g)
    ?.map((amount) => Number(amount.replace(/[^\d]/g, '')));

  assert.ok(amounts && amounts.length >= 2);
  assert.ok(
    Math.max(...amounts) <= 600000,
    `${recommendation.destination.name} 예산 상한이 60만원을 넘으면 안 됩니다: ${recommendation.budgetRange}`,
  );
});

const yeosuRecommendations = getRecommendations({
  ...baseAnswers,
  feeling: 'rest',
  purpose: 'food',
  period: '2-night',
  companion: 'partner',
  totalBudget: 900000,
  movement: 'short',
  accommodation: 'location',
});
const yeosu = yeosuRecommendations.find(
  (recommendation) => recommendation.destination.id === 'yeosu',
);
assert.ok(yeosu);
assert.match(yeosu.reasons[0], /^여수는 /);

const fukuokaRecommendations = getRecommendations({
  ...baseAnswers,
  feeling: 'city',
  purpose: 'food',
  period: '2-night',
  companion: 'parents',
  totalBudget: 1400000,
  movement: 'short',
  accommodation: 'location',
});
const fukuoka = fukuokaRecommendations.find(
  (recommendation) => recommendation.destination.id === 'fukuoka',
);
assert.ok(fukuoka);
assert.match(fukuoka.reasons[0], /^후쿠오카는 /);

const themeMethod = selectTravelMethod(baseAnswers, [
  'independent',
  'theme',
  'public-transit',
]);
assert.equal(themeMethod, 'theme');

const tightBudgetAnswers: TravelAnswers = {
  ...baseAnswers,
  totalBudget: 300000,
  people: { adults: 2, children: 0, includesSeniors: false },
};
const tightBudgetMethod = selectTravelMethod(tightBudgetAnswers, [
  'independent',
  'theme',
  'public-transit',
]);
assert.notEqual(tightBudgetMethod, 'theme');

console.log('recommendation tests passed');
