import assert from 'node:assert/strict';
import {
  calculatePerPersonBudget,
  getDestinationCount,
  getRecommendations,
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
assert.ok(getDestinationCount() >= 18);

const recommendations = getRecommendations(baseAnswers);
assert.equal(recommendations.length, 3);
assert.equal(recommendations[0].rank, 1);
assert.ok(
  recommendations[0].destination.imageUrl.startsWith('/travel-images/'),
);
assert.ok(recommendations[0].reasons.length >= 3);
assert.ok(recommendations[0].budgetRange.includes('1인 예상'));
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
