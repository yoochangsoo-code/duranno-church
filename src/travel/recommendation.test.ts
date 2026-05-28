import assert from 'node:assert/strict';
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
}

assert.equal(getTravelMethodLabel('theme'), '관심사 중심 테마여행');
assert.equal(getTravelMethodLabel('public-transit'), '대중교통 여행');

const recommendations = getRecommendations(baseAnswers);
assert.equal(recommendations.length, 3);
recommendations.forEach((recommendation, index) => {
  assert.equal(recommendation.rank, index + 1);
  assert.ok(recommendation.destination.imageUrl.startsWith('/travel-images/'));
  assert.ok(recommendation.reasons.length >= 3);
  assert.ok(recommendation.budgetRange.includes('1인 예상'));
  assert.ok(recommendation.itinerary.length >= 1);
});
assert.ok(recommendations[0].itinerary.length >= 3);

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
