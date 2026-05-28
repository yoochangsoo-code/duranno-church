# Travel Recommendation App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current generated broadcast-editing app with a board-attachable travel recommendation program that asks guided questions, recommends TOP 3 realistic trips, and provides consultation plus share-coupon actions.

**Architecture:** Keep the app client-only and deterministic. Put recommendation and coupon rules in small TypeScript domain modules with direct tests, then make `src/App.tsx` a focused React wizard that consumes those modules. The first version uses static destination data and heuristic scoring, with theme-travel weighting intentionally higher but not exposed as a sales pitch in CTA labels.

**Tech Stack:** React 19, TypeScript, Vite, Tailwind CSS 4, lucide-react, Node `assert` with `tsx` for lightweight domain tests, existing `npm run lint` and `npm run build`.

---

## File Structure

- Create `src/travel/types.ts`: shared travel answer, destination, recommendation, itinerary, and coupon types.
- Create `src/travel/recommendation.ts`: destination data, scoring, per-person budget calculation, TOP 3 selection, theme-travel weighting, mini itinerary generation.
- Create `src/travel/recommendation.test.ts`: executable TypeScript tests for budget calculation, TOP 3 shape, and theme-travel weighting.
- Create `src/travel/coupon.ts`: share link constant, coupon amount selection, coupon code generation, clipboard helper.
- Create `src/travel/coupon.test.ts`: executable TypeScript tests for amount digit mapping and coupon code format.
- Replace `src/App.tsx`: questionnaire, result page, consultation CTAs, and share coupon UI.
- Modify `src/index.css`: global font/background rules for the travel app.
- Modify `package.json`: add domain test scripts.

## Task 1: Add Travel Domain Types

**Files:**
- Create: `src/travel/types.ts`
- Modify: `package.json`

- [ ] **Step 1: Create travel type definitions**

Create `src/travel/types.ts` with:

```ts
export type TravelFeeling =
  | 'rest'
  | 'food'
  | 'city'
  | 'nature'
  | 'photo'
  | 'comfort';

export type TravelPurpose =
  | 'rest'
  | 'food'
  | 'shopping'
  | 'nature'
  | 'activity'
  | 'culture'
  | 'children'
  | 'parents';

export type TravelPeriod =
  | 'same-day'
  | '1-night'
  | '2-night'
  | '3-night'
  | '4-night-plus'
  | 'custom';

export type CompanionType =
  | 'alone'
  | 'partner'
  | 'friends'
  | 'parents'
  | 'family'
  | 'group';

export type TravelPace = 'relaxed' | 'balanced' | 'full';
export type MovementTolerance = 'short' | 'medium' | 'long';
export type AccommodationPreference =
  | 'value'
  | 'location'
  | 'stylish'
  | 'family'
  | 'premium';

export type TravelMethod =
  | 'independent'
  | 'package'
  | 'rental-car'
  | 'public-transit'
  | 'resort'
  | 'theme';

export interface PeopleCount {
  adults: number;
  children: number;
  includesSeniors: boolean;
}

export interface TravelAnswers {
  feeling: TravelFeeling;
  purpose: TravelPurpose;
  period: TravelPeriod;
  startDate: string;
  endDate: string;
  companion: CompanionType;
  people: PeopleCount;
  totalBudget: number;
  pace: TravelPace;
  movement: MovementTolerance;
  accommodation: AccommodationPreference;
}

export interface DestinationProfile {
  id: string;
  name: string;
  region: 'domestic' | 'international';
  summary: string;
  tags: TravelPurpose[];
  feelings: TravelFeeling[];
  goodFor: CompanionType[];
  methods: TravelMethod[];
  minBudgetPerPerson: number;
  idealPeriods: TravelPeriod[];
  movement: MovementTolerance[];
  accommodations: AccommodationPreference[];
  itinerary: string[];
}

export interface TravelRecommendation {
  rank: number;
  destination: DestinationProfile;
  method: TravelMethod;
  score: number;
  reasons: string[];
  budgetRange: string;
  itinerary: string[];
}

export interface CouponResult {
  amount: 10000 | 20000 | 30000 | 40000 | 50000;
  amountDigit: '1' | '2' | '3' | '4' | '5';
  code: string;
}
```

- [ ] **Step 2: Add test scripts**

Modify `package.json` scripts to include:

```json
"test:domain": "tsx src/travel/recommendation.test.ts && tsx src/travel/coupon.test.ts",
"test": "npm run test:domain && npm run lint"
```

Keep existing scripts unchanged.

- [ ] **Step 3: Run typecheck**

Run: `npm run lint`

Expected: it may fail until later tasks create referenced test files only if scripts are malformed. If it fails on unrelated existing encoding strings in `src/App.tsx`, continue and replace `src/App.tsx` in Task 4.

- [ ] **Step 4: Commit**

Run:

```bash
git add package.json src/travel/types.ts
git commit -m "feat: add travel domain types"
```

## Task 2: Implement Recommendation Rules With Tests

**Files:**
- Create: `src/travel/recommendation.test.ts`
- Create: `src/travel/recommendation.ts`

- [ ] **Step 1: Write failing recommendation tests**

Create `src/travel/recommendation.test.ts`:

```ts
import assert from 'node:assert/strict';
import {
  calculatePerPersonBudget,
  getRecommendations,
  selectTravelMethod,
} from './recommendation';
import { TravelAnswers } from './types';

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

assert.equal(calculatePerPersonBudget({ adults: 2, children: 1, includesSeniors: false }, 900000), 300000);
assert.equal(calculatePerPersonBudget({ adults: 0, children: 0, includesSeniors: false }, 900000), 900000);

const recommendations = getRecommendations(baseAnswers);
assert.equal(recommendations.length, 3);
assert.equal(recommendations[0].rank, 1);
assert.ok(recommendations[0].reasons.length >= 3);
assert.ok(recommendations[0].budgetRange.includes('1인 예상'));
assert.ok(recommendations[0].itinerary.length >= 3);

const themeMethod = selectTravelMethod(baseAnswers, ['independent', 'theme', 'public-transit']);
assert.equal(themeMethod, 'theme');

const tightBudgetAnswers: TravelAnswers = {
  ...baseAnswers,
  totalBudget: 300000,
  people: { adults: 2, children: 0, includesSeniors: false },
};
const tightBudgetMethod = selectTravelMethod(tightBudgetAnswers, ['independent', 'theme', 'public-transit']);
assert.notEqual(tightBudgetMethod, 'theme');

console.log('recommendation tests passed');
```

- [ ] **Step 2: Run tests to verify failure**

Run: `npx tsx src/travel/recommendation.test.ts`

Expected: FAIL because `src/travel/recommendation.ts` does not exist.

- [ ] **Step 3: Implement recommendation module**

Create `src/travel/recommendation.ts` with deterministic destination data and scoring:

```ts
import {
  AccommodationPreference,
  CompanionType,
  DestinationProfile,
  PeopleCount,
  TravelAnswers,
  TravelMethod,
  TravelPeriod,
  TravelRecommendation,
} from './types';

const destinations: DestinationProfile[] = [
  {
    id: 'jeju',
    name: '제주',
    region: 'domestic',
    summary: '자연, 맛집, 렌터카 동선이 잘 맞는 국내 대표 여행지',
    tags: ['nature', 'food', 'rest', 'children', 'parents'],
    feelings: ['nature', 'rest', 'comfort', 'photo'],
    goodFor: ['partner', 'friends', 'parents', 'family', 'group'],
    methods: ['rental-car', 'theme', 'independent'],
    minBudgetPerPerson: 350000,
    idealPeriods: ['2-night', '3-night', '4-night-plus'],
    movement: ['medium', 'long'],
    accommodations: ['family', 'stylish', 'premium', 'location'],
    itinerary: ['공항 도착 후 해안도로와 숙소 체크인', '오름 또는 숲길 산책과 로컬 맛집', '카페 거리와 기념품 쇼핑 후 귀가'],
  },
  {
    id: 'busan',
    name: '부산',
    region: 'domestic',
    summary: '바다, 미식, 도시 산책을 짧은 일정에 담기 좋은 여행지',
    tags: ['food', 'shopping', 'culture', 'parents'],
    feelings: ['food', 'city', 'photo', 'comfort'],
    goodFor: ['alone', 'partner', 'friends', 'parents', 'group'],
    methods: ['public-transit', 'theme', 'independent'],
    minBudgetPerPerson: 250000,
    idealPeriods: ['1-night', '2-night', '3-night'],
    movement: ['short', 'medium'],
    accommodations: ['location', 'value', 'stylish'],
    itinerary: ['해운대 또는 광안리 산책', '시장 미식 코스와 원도심 투어', '카페와 바다 전망 코스 후 귀가'],
  },
  {
    id: 'gangneung',
    name: '강릉',
    region: 'domestic',
    summary: '바다와 커피, 느긋한 휴식에 강한 국내 여행지',
    tags: ['rest', 'food', 'nature', 'parents'],
    feelings: ['rest', 'nature', 'food', 'comfort'],
    goodFor: ['partner', 'friends', 'parents', 'family'],
    methods: ['independent', 'public-transit', 'theme'],
    minBudgetPerPerson: 220000,
    idealPeriods: ['same-day', '1-night', '2-night'],
    movement: ['short', 'medium'],
    accommodations: ['value', 'location', 'stylish'],
    itinerary: ['바다 산책과 커피 거리', '초당/중앙시장 미식 코스', '경포 또는 주문진 여유 일정'],
  },
  {
    id: 'osaka',
    name: '오사카',
    region: 'international',
    summary: '짧은 해외 일정으로 미식, 쇼핑, 도시 산책을 즐기기 좋은 곳',
    tags: ['food', 'shopping', 'culture'],
    feelings: ['food', 'city', 'photo'],
    goodFor: ['alone', 'partner', 'friends', 'group'],
    methods: ['independent', 'theme', 'package', 'public-transit'],
    minBudgetPerPerson: 750000,
    idealPeriods: ['2-night', '3-night', '4-night-plus'],
    movement: ['medium', 'long'],
    accommodations: ['location', 'value', 'stylish'],
    itinerary: ['도톤보리와 난바 미식 코스', '교토 또는 고베 당일 코스', '쇼핑과 카페 후 귀국'],
  },
  {
    id: 'danang',
    name: '다낭',
    region: 'international',
    summary: '휴양, 리조트, 가족 여행을 예산 대비 편하게 구성하기 좋은 곳',
    tags: ['rest', 'food', 'children', 'parents', 'nature'],
    feelings: ['rest', 'comfort', 'nature', 'photo'],
    goodFor: ['partner', 'parents', 'family', 'group'],
    methods: ['resort', 'package', 'theme'],
    minBudgetPerPerson: 900000,
    idealPeriods: ['3-night', '4-night-plus'],
    movement: ['medium', 'long'],
    accommodations: ['premium', 'family', 'location'],
    itinerary: ['리조트 체크인과 해변 휴식', '호이안 야경과 로컬 식사', '바나힐 또는 마사지 휴식', '브런치 후 귀국'],
  },
  {
    id: 'taipei',
    name: '타이베이',
    region: 'international',
    summary: '미식, 야시장, 근교 투어를 균형 있게 즐기는 도시 여행지',
    tags: ['food', 'culture', 'shopping'],
    feelings: ['food', 'city', 'photo'],
    goodFor: ['alone', 'partner', 'friends', 'parents', 'group'],
    methods: ['independent', 'theme', 'public-transit', 'package'],
    minBudgetPerPerson: 700000,
    idealPeriods: ['2-night', '3-night', '4-night-plus'],
    movement: ['medium', 'long'],
    accommodations: ['location', 'value'],
    itinerary: ['시먼딩과 야시장 미식', '예스진지 또는 온천 근교 코스', '카페와 기념품 쇼핑 후 귀국'],
  },
];

const methodLabel: Record<TravelMethod, string> = {
  independent: '자유여행',
  package: '패키지 여행',
  'rental-car': '렌터카 여행',
  'public-transit': '대중교통 여행',
  resort: '휴양형 여행',
  theme: '관심사 중심 테마여행',
};

export function calculatePerPersonBudget(people: PeopleCount, totalBudget: number): number {
  const count = people.adults + people.children;
  return Math.round(totalBudget / Math.max(1, count));
}

export function selectTravelMethod(answers: TravelAnswers, methods: TravelMethod[]): TravelMethod {
  const perPerson = calculatePerPersonBudget(answers.people, answers.totalBudget);
  const themeFriendlyCompanion = ['alone', 'friends', 'group'].includes(answers.companion);
  const themeFriendlyPurpose = ['culture', 'food', 'nature', 'activity'].includes(answers.purpose);
  const themeFriendlyFeeling = ['city', 'photo', 'nature', 'food'].includes(answers.feeling);
  const themeFriendlyPace = answers.pace === 'balanced' || answers.pace === 'full';

  if (
    methods.includes('theme') &&
    perPerson >= 450000 &&
    themeFriendlyPace &&
    (themeFriendlyCompanion || themeFriendlyPurpose || themeFriendlyFeeling)
  ) {
    return 'theme';
  }

  if (answers.accommodation === 'premium' && methods.includes('resort')) return 'resort';
  if (answers.companion === 'family' && methods.includes('package')) return 'package';
  if (answers.movement === 'short' && methods.includes('public-transit')) return 'public-transit';
  return methods[0];
}

function scoreDestination(destination: DestinationProfile, answers: TravelAnswers): number {
  const perPerson = calculatePerPersonBudget(answers.people, answers.totalBudget);
  let score = 0;

  if (destination.tags.includes(answers.purpose)) score += 26;
  if (destination.feelings.includes(answers.feeling)) score += 22;
  if (destination.goodFor.includes(answers.companion)) score += 14;
  if (destination.idealPeriods.includes(answers.period)) score += 14;
  if (destination.movement.includes(answers.movement)) score += 8;
  if (destination.accommodations.includes(answers.accommodation)) score += 8;
  if (perPerson >= destination.minBudgetPerPerson) score += 18;
  if (perPerson < destination.minBudgetPerPerson) score -= 24;
  if (destination.methods.includes('theme')) score += 8;
  if (destination.methods.includes('theme') && answers.pace !== 'relaxed') score += 8;

  return score;
}

function buildReasons(destination: DestinationProfile, answers: TravelAnswers, method: TravelMethod): string[] {
  const reasons = [
    `${destination.name}은(는) ${destination.summary}입니다.`,
    `선택한 여행 목적과 분위기에 맞는 ${methodLabel[method]} 방식으로 구성하기 좋습니다.`,
    `총예산을 인원수로 나누면 1인 약 ${calculatePerPersonBudget(answers.people, answers.totalBudget).toLocaleString('ko-KR')}원 수준이라 현실적인 일정 설계가 가능합니다.`,
  ];

  if (method === 'theme') {
    reasons.push('유명 코스를 나열하기보다 미식, 역사, 사진, 자연 해설처럼 주제가 있는 동선으로 잡으면 만족도가 높습니다.');
  }

  if (answers.people.includesSeniors) {
    reasons.push('어르신 동행을 고려해 이동 부담을 줄이고 휴식 시간을 일정에 포함하는 구성이 좋습니다.');
  }

  return reasons;
}

function buildBudgetRange(destination: DestinationProfile, answers: TravelAnswers): string {
  const perPerson = calculatePerPersonBudget(answers.people, answers.totalBudget);
  const low = Math.max(destination.minBudgetPerPerson, Math.round(perPerson * 0.85));
  const high = Math.round(perPerson * 1.1);
  return `1인 예상 ${low.toLocaleString('ko-KR')}원 ~ ${high.toLocaleString('ko-KR')}원`;
}

function buildItinerary(destination: DestinationProfile, period: TravelPeriod): string[] {
  if (period === 'same-day') return destination.itinerary.slice(0, 1);
  if (period === '1-night') return destination.itinerary.slice(0, 2);
  if (period === '2-night') return destination.itinerary.slice(0, 3);
  return destination.itinerary;
}

export function getRecommendations(answers: TravelAnswers): TravelRecommendation[] {
  return destinations
    .map((destination) => {
      const method = selectTravelMethod(answers, destination.methods);
      return {
        destination,
        method,
        score: scoreDestination(destination, answers),
        reasons: buildReasons(destination, answers, method),
        budgetRange: buildBudgetRange(destination, answers),
        itinerary: buildItinerary(destination, answers.period),
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((recommendation, index) => ({ ...recommendation, rank: index + 1 }));
}

export function getTravelMethodLabel(method: TravelMethod): string {
  return methodLabel[method];
}
```

- [ ] **Step 4: Run recommendation tests**

Run: `npx tsx src/travel/recommendation.test.ts`

Expected: PASS and output `recommendation tests passed`.

- [ ] **Step 5: Commit**

Run:

```bash
git add src/travel/recommendation.ts src/travel/recommendation.test.ts
git commit -m "feat: add travel recommendation rules"
```

## Task 3: Implement Coupon Rules With Tests

**Files:**
- Create: `src/travel/coupon.test.ts`
- Create: `src/travel/coupon.ts`

- [ ] **Step 1: Write failing coupon tests**

Create `src/travel/coupon.test.ts`:

```ts
import assert from 'node:assert/strict';
import {
  COUPON_AMOUNTS,
  PROGRAM_SHARE_URL,
  createCoupon,
  getAmountDigit,
} from './coupon';

assert.equal(PROGRAM_SHARE_URL, 'https://changsoo-travel.example.com/recommend');
assert.deepEqual(COUPON_AMOUNTS, [10000, 20000, 30000, 40000, 50000]);
assert.equal(getAmountDigit(10000), '1');
assert.equal(getAmountDigit(50000), '5');

const coupon = createCoupon(() => 0.99);
assert.equal(coupon.amount, 50000);
assert.equal(coupon.amountDigit, '5');
assert.match(coupon.code, /^ctour[A-Z0-9]{6}5$/);

const firstCoupon = createCoupon(() => 0);
assert.equal(firstCoupon.amount, 10000);
assert.equal(firstCoupon.amountDigit, '1');
assert.match(firstCoupon.code, /^ctour[A-Z0-9]{6}1$/);

console.log('coupon tests passed');
```

- [ ] **Step 2: Run tests to verify failure**

Run: `npx tsx src/travel/coupon.test.ts`

Expected: FAIL because `src/travel/coupon.ts` does not exist.

- [ ] **Step 3: Implement coupon module**

Create `src/travel/coupon.ts`:

```ts
import { CouponResult } from './types';

export const PROGRAM_SHARE_URL = 'https://changsoo-travel.example.com/recommend';
export const COUPON_AMOUNTS = [10000, 20000, 30000, 40000, 50000] as const;

export function getAmountDigit(amount: CouponResult['amount']): CouponResult['amountDigit'] {
  return String(amount / 10000) as CouponResult['amountDigit'];
}

function randomToken(random: () => number): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let token = '';

  for (let index = 0; index < 6; index += 1) {
    const position = Math.floor(random() * alphabet.length) % alphabet.length;
    token += alphabet[position];
  }

  return token;
}

export function createCoupon(random: () => number = Math.random): CouponResult {
  const amountIndex = Math.min(COUPON_AMOUNTS.length - 1, Math.floor(random() * COUPON_AMOUNTS.length));
  const amount = COUPON_AMOUNTS[amountIndex];
  const amountDigit = getAmountDigit(amount);

  return {
    amount,
    amountDigit,
    code: `ctour${randomToken(random)}${amountDigit}`,
  };
}

export async function copyShareLink(writeText: (value: string) => Promise<void>): Promise<string> {
  await writeText(PROGRAM_SHARE_URL);
  return PROGRAM_SHARE_URL;
}
```

- [ ] **Step 4: Run coupon tests**

Run: `npx tsx src/travel/coupon.test.ts`

Expected: PASS and output `coupon tests passed`.

- [ ] **Step 5: Commit**

Run:

```bash
git add src/travel/coupon.ts src/travel/coupon.test.ts
git commit -m "feat: add share coupon rules"
```

## Task 4: Build The React Travel Wizard

**Files:**
- Replace: `src/App.tsx`

- [ ] **Step 1: Replace the app UI**

Replace `src/App.tsx` with a focused questionnaire and results UI. The component should:

- Maintain `TravelAnswers` state.
- Render one question card per step.
- Support text inputs for dates, people count, and budget.
- Show a progress indicator.
- Generate TOP 3 recommendations by calling `getRecommendations`.
- Show common CTA labels for all travel methods.
- Provide the `Share and get a discount coupon` action that copies `PROGRAM_SHARE_URL` and displays `CouponResult`.

Use these labels for CTAs:

```ts
const consultationLabels = [
  '이 일정으로 상담/예약 문의하기',
  'TOP 3 후보로 견적 문의하기',
];
```

Use this share handler:

```ts
async function handleShareCoupon() {
  const coupon = createCoupon();
  setCoupon(coupon);

  try {
    await copyShareLink((value) => navigator.clipboard.writeText(value));
    setShareStatus(`프로그램 링크가 복사되었습니다: ${PROGRAM_SHARE_URL}`);
  } catch {
    setShareStatus(`클립보드 복사가 제한되어 링크를 직접 확인해주세요: ${PROGRAM_SHARE_URL}`);
  }
}
```

The result page must display the theme travel explanation only as natural recommendation text, never as CTA wording.

- [ ] **Step 2: Run typecheck**

Run: `npm run lint`

Expected: PASS, or fail only for old code if replacement was incomplete. Fix any TypeScript errors in `src/App.tsx`.

- [ ] **Step 3: Commit**

Run:

```bash
git add src/App.tsx
git commit -m "feat: build travel recommendation wizard"
```

## Task 5: Refresh Global Styling

**Files:**
- Modify: `src/index.css`

- [ ] **Step 1: Update global visual foundation**

Modify `src/index.css` so the app uses a travel-service visual base:

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Noto+Sans+KR:wght@400;500;700;900&display=swap');
@import "tailwindcss";

@theme {
  --font-sans: "Inter", "Noto Sans KR", ui-sans-serif, system-ui, sans-serif;
}

@layer base {
  * {
    box-sizing: border-box;
  }

  body {
    margin: 0;
    min-width: 320px;
    background: #f6f7f2;
    color: #18211f;
  }

  button,
  input {
    font: inherit;
  }
}
```

- [ ] **Step 2: Run build**

Run: `npm run build`

Expected: PASS and Vite writes production assets to `dist/`.

- [ ] **Step 3: Commit**

Run:

```bash
git add src/index.css
git commit -m "style: refresh travel app foundation"
```

## Task 6: Final Verification

**Files:**
- Read: `docs/superpowers/specs/2026-05-28-travel-recommendation-storyline-design.md`
- Read: `src/App.tsx`
- Read: `src/travel/recommendation.ts`
- Read: `src/travel/coupon.ts`

- [ ] **Step 1: Run full test command**

Run: `npm test`

Expected: PASS. It should run domain tests and TypeScript typecheck.

- [ ] **Step 2: Run production build**

Run: `npm run build`

Expected: PASS.

- [ ] **Step 3: Confirm Git status**

Run: `git status --short`

Expected: no output, or only intentionally untracked build output ignored by `.gitignore`.

- [ ] **Step 4: Commit final plan updates if any**

If implementation revealed a needed correction to this plan or the spec, commit the doc change:

```bash
git add docs/superpowers/plans/2026-05-28-travel-recommendation-app.md docs/superpowers/specs/2026-05-28-travel-recommendation-storyline-design.md
git commit -m "docs: update travel recommendation implementation notes"
```

Skip this commit if no documentation changed after implementation begins.

---

## Self-Review

Spec coverage:

- Questionnaire flow is covered by Task 4.
- Budget and per-person calculation are covered by Task 2.
- TOP 3 recommendations and mini itineraries are covered by Task 2 and Task 4.
- Theme-travel higher frequency with neutral CTA labels is covered by Task 2 and Task 4.
- Share coupon behavior and code format are covered by Task 3 and Task 4.
- Consultation/booking placement after results is covered by Task 4.

Placeholder scan:

- No placeholder markers or undefined future work are required to complete the first implementation.
- Coupon validation and CRM integration are intentionally out of scope for this implementation and not needed for the requested behavior.

Type consistency:

- `TravelAnswers`, `TravelRecommendation`, and `CouponResult` are defined in Task 1 and reused consistently in Tasks 2-4.
- `createCoupon`, `copyShareLink`, `getRecommendations`, and `getTravelMethodLabel` are defined before React imports them.
