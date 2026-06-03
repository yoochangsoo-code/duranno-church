import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  Copy,
  Gift,
  MapPin,
  MessageCircle,
  Share2,
  Users,
} from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';
import {
  copyShareLink,
  createCoupon,
  PROGRAM_SHARE_URL,
} from './travel/coupon';
import {
  getRecommendations,
  getTravelMethodLabel,
} from './travel/recommendation';
import type {
  AccommodationPreference,
  CompanionType,
  CouponResult,
  MovementTolerance,
  TravelAnswers,
  TravelFeeling,
  TravelPace,
  TravelPeriod,
  TravelPurpose,
  TravelRegionPreference,
} from './travel/types';

type Option<T extends string> = {
  value: T;
  label: string;
  note: string;
};

type StepKey =
  | 'region'
  | 'mood'
  | 'purpose'
  | 'dates'
  | 'people'
  | 'budget'
  | 'style';

const initialAnswers: TravelAnswers = {
  preferredRegion: 'no-preference',
  feeling: 'rest',
  purpose: 'culture',
  period: '2-night',
  startDate: '',
  endDate: '',
  companion: 'friends',
  people: { adults: 2, children: 0, includesSeniors: false },
  totalBudget: 1200000,
  pace: 'balanced',
  movement: 'medium',
  accommodation: 'location',
};

const regionLabels: Record<TravelRegionPreference, string> = {
  domestic: '국내',
  'southeast-asia': '동남아',
  china: '중국',
  japan: '일본',
  'middle-east': '중동',
  'other-asia': '기타 아시아',
  'western-europe': '서유럽',
  'eastern-europe': '동유럽',
  americas: '미주',
  'latin-america': '중남미',
  oceania: '오세아니아',
  africa: '아프리카',
  'no-preference': '원하는 지역 없음',
};

function getRegionPreferenceText(
  preferredRegion: TravelRegionPreference,
): string {
  return preferredRegion === 'no-preference'
    ? '지역 선호 없음'
    : `${regionLabels[preferredRegion]} 선호`;
}

const feelingLabels: Record<TravelFeeling, string> = {
  rest: '휴식',
  food: '미식',
  city: '도시',
  nature: '자연',
  photo: '사진',
  comfort: '편안함',
};

const purposeLabels: Record<TravelPurpose, string> = {
  culture: '문화',
  food: '미식',
  shopping: '쇼핑',
  nature: '자연',
  activity: '액티비티',
  children: '아이 동반',
  parents: '부모님 동반',
  rest: '휴식',
};

const periodLabels: Record<TravelPeriod, string> = {
  'same-day': '당일',
  '1-night': '1박',
  '2-night': '2박',
  '3-night': '3박',
  '4-night-plus': '4박 이상',
  custom: '직접 입력',
};

const companionLabels: Record<CompanionType, string> = {
  alone: '혼자',
  partner: '커플',
  friends: '친구',
  parents: '부모님',
  family: '가족',
  group: '단체',
};

const steps: { key: StepKey; title: string; subtitle: string }[] = [
  {
    key: 'region',
    title: '원하는 지역이 있나요?',
    subtitle: '선호 지역이 있으면 먼저 반영하고, 없으면 전체 여행지에서 추천합니다.',
  },
  {
    key: 'mood',
    title: '어떤 느낌의 여행을 원하시나요?',
    subtitle: '여행자가 오래 기억할 분위기부터 정해 보세요.',
  },
  {
    key: 'purpose',
    title: '이번 여행의 가장 큰 목적은 무엇인가요?',
    subtitle: '목적에 따라 추천 점수와 코스 흐름이 달라집니다.',
  },
  {
    key: 'dates',
    title: '여행 기간은 어떻게 되나요?',
    subtitle: '상담 연결까지 고려한다면 실제 날짜도 함께 입력해 주세요.',
  },
  {
    key: 'people',
    title: '누구와 함께 떠나나요?',
    subtitle: '인원 구성은 1인 예산과 이동 계획에 직접 반영됩니다.',
  },
  {
    key: 'budget',
    title: '총예산은 어느 정도인가요?',
    subtitle: '희망만 앞선 추천이 아니라 현실적인 여행지를 고릅니다.',
  },
  {
    key: 'style',
    title: '일정은 어떤 방식으로 움직이면 좋을까요?',
    subtitle: '상위 3곳을 보기 전에 속도, 이동 부담, 숙소 선호를 맞춥니다.',
  },
];

const regionOptions: Option<TravelRegionPreference>[] = [
  { value: 'domestic', label: '국내', note: '제주, 부산, 강릉 등 국내 여행' },
  { value: 'southeast-asia', label: '동남아', note: '태국, 베트남, 싱가포르, 발리' },
  { value: 'china', label: '중국', note: '상하이, 항저우, 홍콩, 마카오, 타이베이' },
  { value: 'japan', label: '일본', note: '오사카, 후쿠오카, 도쿄, 삿포로, 오키나와' },
  { value: 'middle-east', label: '중동', note: '두바이, 이스탄불 등 이국적인 도시' },
  { value: 'other-asia', label: '기타 아시아', note: '괌, 사이판, 몰디브, 크루즈' },
  { value: 'western-europe', label: '서유럽', note: '파리, 로마, 런던, 바르셀로나, 빈' },
  { value: 'eastern-europe', label: '동유럽', note: '프라하처럼 고풍스러운 유럽 도시' },
  { value: 'americas', label: '미주', note: '뉴욕, 밴쿠버, 하와이, 캐나다 로키' },
  { value: 'latin-america', label: '중남미', note: '해당 지역 선호를 우선 고려' },
  { value: 'oceania', label: '오세아니아', note: '시드니와 남태평양권 여행' },
  { value: 'africa', label: '아프리카', note: '해당 지역 선호를 우선 고려' },
  { value: 'no-preference', label: '원하는 지역 없음', note: '전체 여행지에서 균형 있게 추천' },
];

const feelingOptions: Option<TravelFeeling>[] = [
  { value: 'rest', label: '휴식', note: '천천히 쉬고 조용히 머무는 여행' },
  { value: 'food', label: '미식', note: '현지 음식과 시장을 즐기는 코스' },
  { value: 'city', label: '도시', note: '쇼핑, 전시, 야경을 담은 일정' },
  { value: 'nature', label: '자연', note: '풍경과 야외 명소 중심' },
  { value: 'photo', label: '사진', note: '전망과 기억에 남는 장소' },
  { value: 'comfort', label: '편안함', note: '이동이 쉽고 숙소가 편한 일정' },
];

const purposeOptions: Option<TravelPurpose>[] = [
  { value: 'culture', label: '문화', note: '역사, 전시, 현지 맥락' },
  { value: 'food', label: '미식', note: '식당, 시장, 카페' },
  { value: 'shopping', label: '쇼핑', note: '브랜드, 아울렛, 로컬 상품' },
  { value: 'nature', label: '자연', note: '바다, 산, 공원' },
  { value: 'activity', label: '액티비티', note: '가벼운 모험과 움직임' },
  { value: 'children', label: '아이 동반', note: '가족 친화 명소' },
  { value: 'parents', label: '부모님 동반', note: '편안한 어른 맞춤 속도' },
  { value: 'rest', label: '휴식', note: '호텔, 스파, 낮은 피로도' },
];

const periodOptions: Option<TravelPeriod>[] = [
  { value: 'same-day', label: '당일', note: '하루에 담는 압축 코스' },
  { value: '1-night', label: '1박', note: '짧은 국내 여행' },
  { value: '2-night', label: '2박', note: '균형 잡힌 주말 계획' },
  { value: '3-night', label: '3박', note: '단거리 해외도 가능한 기간' },
  { value: '4-night-plus', label: '4박 이상', note: '긴 휴식 또는 장거리 여행' },
  { value: 'custom', label: '직접 입력', note: '입력한 날짜를 기준으로 추천' },
];

const companionOptions: Option<CompanionType>[] = [
  { value: 'alone', label: '혼자', note: '유연하고 간결한 일정' },
  { value: 'partner', label: '커플', note: '전망, 음식, 숙소 퀄리티' },
  { value: 'friends', label: '친구', note: '함께 즐길 관심사와 에너지' },
  { value: 'parents', label: '부모님', note: '편안함 우선의 이동' },
  { value: 'family', label: '가족', note: '아이에게 무리 없는 속도와 숙소' },
  { value: 'group', label: '단체', note: '명확한 동선과 쉬운 결정' },
];

const paceOptions: Option<TravelPace>[] = [
  { value: 'relaxed', label: '여유롭게', note: '방문지는 줄이고 휴식은 넉넉하게' },
  { value: 'balanced', label: '균형 있게', note: '하루에 핵심 코스 하나씩' },
  { value: 'full', label: '알차게', note: '빽빽한 일정과 이른 시작' },
];

const movementOptions: Option<MovementTolerance>[] = [
  { value: 'short', label: '짧게', note: '이동 부담을 낮게' },
  { value: 'medium', label: '보통', note: '가장 현실적인 기본값' },
  { value: 'long', label: '길게', note: '넓은 동선도 가능' },
];

const accommodationOptions: Option<AccommodationPreference>[] = [
  { value: 'value', label: '가성비', note: '예산 효율이 좋은 숙소' },
  { value: 'location', label: '위치', note: '핵심 동선 가까이' },
  { value: 'stylish', label: '감성', note: '디자인이 좋은 호텔' },
  { value: 'family', label: '가족형', note: '공간과 편의성' },
  { value: 'premium', label: '프리미엄', note: '리조트 또는 상급 숙소' },
];

const consultationLabels = [
  '이 일정과 예약 상담하기',
  '상위 3곳 견적 요청하기',
];

function App() {
  const [answers, setAnswers] = useState<TravelAnswers>(initialAnswers);
  const [stepIndex, setStepIndex] = useState(0);
  const [coupon, setCoupon] = useState<CouponResult | null>(null);
  const [shareStatus, setShareStatus] = useState('');

  const currentStep = steps[stepIndex];
  const isResults = stepIndex >= steps.length;
  const recommendations = useMemo(() => getRecommendations(answers), [answers]);
  const progress = Math.min(100, Math.round((stepIndex / steps.length) * 100));
  const heroImage =
    recommendations[0]?.destination.imageUrl ?? '/travel-images/jeju.png';

  function updateAnswers(next: Partial<TravelAnswers>) {
    setAnswers((current) => ({ ...current, ...next }));
  }

  function updatePeople(next: Partial<TravelAnswers['people']>) {
    setAnswers((current) => ({
      ...current,
      people: { ...current.people, ...next },
    }));
  }

  function nextStep() {
    setStepIndex((current) => Math.min(steps.length, current + 1));
  }

  function previousStep() {
    setStepIndex((current) => Math.max(0, current - 1));
  }

  function restart() {
    setStepIndex(0);
    setCoupon(null);
    setShareStatus('');
  }

  async function handleShareCoupon() {
    const nextCoupon = createCoupon();
    setCoupon(nextCoupon);

    try {
      await copyShareLink((value) => navigator.clipboard.writeText(value));
      setShareStatus(`프로그램 링크를 복사했습니다: ${PROGRAM_SHARE_URL}`);
    } catch {
      setShareStatus(`복사가 차단되었습니다. 이 링크를 사용하세요: ${PROGRAM_SHARE_URL}`);
    }
  }

  return (
    <main className="min-h-screen bg-[#f6f7f2] text-[#18211f]">
      <section className="relative min-h-[44vh] overflow-hidden">
        <img
          src={heroImage}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-black/45" />
        <div className="relative mx-auto flex min-h-[44vh] max-w-6xl flex-col justify-between px-5 py-6 text-white sm:px-8">
          <nav className="flex items-center justify-end">
            <div className="hidden items-center gap-2 rounded-full bg-white/14 px-4 py-2 text-xs font-semibold backdrop-blur sm:flex">
              <MessageCircle size={16} />
              상담 보드 모드
            </div>
          </nav>
          <div className="max-w-3xl pb-3">
            <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/16 px-4 py-2 text-sm font-semibold backdrop-blur">
              <MapPin size={16} />
              현실적인 여행지 상위 3곳 추천
            </p>
            <h1 className="text-4xl font-black leading-tight sm:text-6xl">
              <span className="block">여행지보다 여행자에게</span>
              <span className="block">먼저 맞춥니다.</span>
            </h1>
            <p className="mt-4 max-w-2xl text-base font-medium text-white/88 sm:text-lg">
              <span className="block">간단한 질문에 답하면</span>
              <span className="block">
                예산 범위와 미니 일정, 상담 연결, 공유 쿠폰까지 담아
              </span>
              <span className="block">실용적인 여행 코스 3가지를 추천합니다.</span>
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-5 py-6 sm:px-8 lg:grid-cols-[1fr_360px]">
        <div className="min-w-0">
          {!isResults ? (
            <div className="rounded-lg border border-[#dfe5d9] bg-white p-5 shadow-sm sm:p-7">
              <div className="mb-6">
                <div className="mb-3 flex items-center justify-between gap-4 text-sm font-bold text-[#58635b]">
                  <span>
                    {steps.length}단계 중 {stepIndex + 1}단계
                  </span>
                  <span>{progress}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-[#e7ece2]">
                  <div
                    className="h-full rounded-full bg-[#256f68]"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              <div className="mb-6">
                <h2 className="text-2xl font-black">{currentStep.title}</h2>
                <p className="mt-2 text-sm font-medium text-[#657067]">
                  {currentStep.subtitle}
                </p>
              </div>

              {currentStep.key === 'region' && (
                <OptionGrid
                  options={regionOptions}
                  value={answers.preferredRegion}
                  onChange={(preferredRegion) =>
                    updateAnswers({ preferredRegion })
                  }
                />
              )}

              {currentStep.key === 'mood' && (
                <OptionGrid
                  options={feelingOptions}
                  value={answers.feeling}
                  onChange={(feeling) => updateAnswers({ feeling })}
                />
              )}

              {currentStep.key === 'purpose' && (
                <OptionGrid
                  options={purposeOptions}
                  value={answers.purpose}
                  onChange={(purpose) => updateAnswers({ purpose })}
                />
              )}

              {currentStep.key === 'dates' && (
                <div className="space-y-5">
                  <OptionGrid
                    options={periodOptions}
                    value={answers.period}
                    onChange={(period) => updateAnswers({ period })}
                  />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="출발일" icon={<CalendarDays size={17} />}>
                      <input
                        type="date"
                        value={answers.startDate}
                        onChange={(event) =>
                          updateAnswers({ startDate: event.target.value })
                        }
                        className="field-input"
                      />
                    </Field>
                    <Field label="도착일" icon={<CalendarDays size={17} />}>
                      <input
                        type="date"
                        value={answers.endDate}
                        onChange={(event) =>
                          updateAnswers({ endDate: event.target.value })
                        }
                        className="field-input"
                      />
                    </Field>
                  </div>
                </div>
              )}

              {currentStep.key === 'people' && (
                <div className="space-y-5">
                  <OptionGrid
                    options={companionOptions}
                    value={answers.companion}
                    onChange={(companion) => updateAnswers({ companion })}
                  />
                  <div className="grid gap-4 sm:grid-cols-3">
                    <Field label="성인" icon={<Users size={17} />}>
                      <input
                        type="number"
                        min={0}
                        value={answers.people.adults}
                        onChange={(event) =>
                          updatePeople({
                            adults: Number.parseInt(event.target.value, 10) || 0,
                          })
                        }
                        className="field-input"
                      />
                    </Field>
                    <Field label="아동" icon={<Users size={17} />}>
                      <input
                        type="number"
                        min={0}
                        value={answers.people.children}
                        onChange={(event) =>
                          updatePeople({
                            children:
                              Number.parseInt(event.target.value, 10) || 0,
                          })
                        }
                        className="field-input"
                      />
                    </Field>
                    <label className="flex min-h-[76px] items-center gap-3 rounded-lg border border-[#dfe5d9] px-4">
                      <input
                        type="checkbox"
                        checked={answers.people.includesSeniors}
                        onChange={(event) =>
                          updatePeople({ includesSeniors: event.target.checked })
                        }
                        className="h-5 w-5 accent-[#256f68]"
                      />
                      <span className="text-sm font-bold">어르신 포함</span>
                    </label>
                  </div>
                </div>
              )}

              {currentStep.key === 'budget' && (
                <div className="max-w-xl">
                  <Field label="총예산" icon={<Gift size={17} />}>
                    <input
                      type="number"
                      min={0}
                      step={10000}
                      value={answers.totalBudget}
                      onChange={(event) =>
                        updateAnswers({
                          totalBudget:
                            Number.parseInt(event.target.value, 10) || 0,
                        })
                      }
                      className="field-input text-lg font-black"
                    />
                  </Field>
                  <p className="mt-3 text-sm font-semibold text-[#657067]">
                    현재 1인 예산:{' '}
                    {Math.round(
                      answers.totalBudget /
                        Math.max(
                          1,
                          answers.people.adults + answers.people.children,
                        ),
                    ).toLocaleString('ko-KR')}{' '}
                    원
                  </p>
                </div>
              )}

              {currentStep.key === 'style' && (
                <div className="space-y-6">
                  <OptionSection title="일정 속도">
                    <OptionGrid
                      options={paceOptions}
                      value={answers.pace}
                      onChange={(pace) => updateAnswers({ pace })}
                    />
                  </OptionSection>
                  <OptionSection title="이동 거리">
                    <OptionGrid
                      options={movementOptions}
                      value={answers.movement}
                      onChange={(movement) => updateAnswers({ movement })}
                    />
                  </OptionSection>
                  <OptionSection title="숙소 선호">
                    <OptionGrid
                      options={accommodationOptions}
                      value={answers.accommodation}
                      onChange={(accommodation) =>
                        updateAnswers({ accommodation })
                      }
                    />
                  </OptionSection>
                </div>
              )}

              <div className="mt-8 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={previousStep}
                  disabled={stepIndex === 0}
                  className="inline-flex h-11 items-center gap-2 rounded-md border border-[#cfd8cc] px-4 text-sm font-bold text-[#35433c] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ArrowLeft size={17} />
                  이전
                </button>
                <button
                  type="button"
                  onClick={nextStep}
                  className="inline-flex h-11 items-center gap-2 rounded-md bg-[#256f68] px-5 text-sm font-bold text-white shadow-sm hover:bg-[#1d5d57]"
                >
                  {stepIndex === steps.length - 1 ? '상위 3곳 보기' : '다음'}
                  <ArrowRight size={17} />
                </button>
              </div>
            </div>
          ) : (
            <ResultsView
              answers={answers}
              coupon={coupon}
              recommendations={recommendations}
              shareStatus={shareStatus}
              onRestart={restart}
              onShareCoupon={handleShareCoupon}
            />
          )}
        </div>

        <aside className="space-y-4">
          <div className="rounded-lg border border-[#dfe5d9] bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#738075]">
              현재 조건
            </p>
            <dl className="mt-4 space-y-3 text-sm">
              <SummaryRow
                label="지역"
                value={regionLabels[answers.preferredRegion]}
              />
              <SummaryRow label="분위기" value={feelingLabels[answers.feeling]} />
              <SummaryRow label="목적" value={purposeLabels[answers.purpose]} />
              <SummaryRow label="기간" value={periodLabels[answers.period]} />
              <SummaryRow label="동행" value={companionLabels[answers.companion]} />
              <SummaryRow
                label="인원"
                value={`성인 ${answers.people.adults}명, 아동 ${answers.people.children}명`}
              />
              <SummaryRow
                label="예산"
                value={`${answers.totalBudget.toLocaleString('ko-KR')}원`}
              />
            </dl>
          </div>

          <div className="overflow-hidden rounded-lg border border-[#dfe5d9] bg-white shadow-sm">
            <img
              src={recommendations[0]?.destination.imageUrl}
              alt=""
              className="h-44 w-full object-cover"
            />
            <div className="p-5">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[#738075]">
                현재 1순위
              </p>
              <h3 className="mt-2 text-xl font-black">
                {recommendations[0]?.destination.name}
              </h3>
              <p className="mt-2 text-sm font-medium leading-6 text-[#657067]">
                {recommendations[0]?.destination.summary}
              </p>
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}

function OptionGrid<T extends string>({
  options,
  value,
  onChange,
}: {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`min-h-[96px] rounded-lg border p-4 text-left transition ${
              selected
                ? 'border-[#256f68] bg-[#eef7f3] shadow-sm'
                : 'border-[#dfe5d9] bg-white hover:border-[#98aaa0]'
            }`}
          >
            <span className="flex items-center justify-between gap-3">
              <span className="text-base font-black">{option.label}</span>
              {selected && (
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#256f68] text-white">
                  <Check size={15} />
                </span>
              )}
            </span>
            <span className="mt-2 block text-sm font-medium leading-5 text-[#657067]">
              {option.note}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function ResultsView({
  answers,
  coupon,
  recommendations,
  shareStatus,
  onRestart,
  onShareCoupon,
}: {
  answers: TravelAnswers;
  coupon: CouponResult | null;
  recommendations: ReturnType<typeof getRecommendations>;
  shareStatus: string;
  onRestart: () => void;
  onShareCoupon: () => void;
}) {
  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-[#dfe5d9] bg-white p-5 shadow-sm sm:p-7">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-[#738075]">
          추천 후보
        </p>
        <h2 className="mt-2 text-3xl font-black">조건에 맞는 여행지 상위 3곳</h2>
        <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-[#657067]">
          답변, 1인 예산, 일정 속도, 실제 이동 부담을 함께 반영했습니다.
          상담 연결은 여행 방식과 상관없이 바로 진행할 수 있습니다.
        </p>
      </div>

      <div className="grid gap-4">
        {recommendations.map((recommendation) => (
          <article
            key={recommendation.destination.id}
            className="overflow-hidden rounded-lg border border-[#dfe5d9] bg-white shadow-sm"
          >
            <div className="grid md:grid-cols-[260px_1fr]">
              <img
                src={recommendation.destination.imageUrl}
                alt=""
                className="h-56 w-full object-cover md:h-full"
              />
              <div className="p-5 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-[#738075]">
                      {recommendation.rank}위
                    </p>
                    <h3 className="mt-1 text-2xl font-black">
                      {recommendation.destination.name}
                    </h3>
                  </div>
                  <span className="rounded-full bg-[#e9f2ed] px-3 py-1 text-xs font-black text-[#256f68]">
                    {getTravelMethodLabel(recommendation.method)}
                  </span>
                </div>

                <p className="mt-3 text-sm font-semibold text-[#3f4c44]">
                  {recommendation.budgetRange}
                </p>

                <ul className="mt-4 grid gap-2">
                  {recommendation.reasons.map((reason) => (
                    <li
                      key={reason}
                      className="flex gap-2 text-sm font-medium leading-6 text-[#56635a]"
                    >
                      <Check
                        size={16}
                        className="mt-1 shrink-0 text-[#256f68]"
                      />
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-5 rounded-md bg-[#f7f8f4] p-4">
                  <p className="mb-3 text-xs font-black uppercase tracking-[0.14em] text-[#738075]">
                    미니 일정
                  </p>
                  <ol className="grid gap-2 text-sm font-bold text-[#35433c] sm:grid-cols-3">
                    {recommendation.itinerary.map((item, index) => (
                      <li key={item} className="flex gap-2">
                        <span className="text-[#256f68]">{index + 1}일차</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-[1fr_1fr]">
        <div className="rounded-lg border border-[#dfe5d9] bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#738075]">
            상담
          </p>
          <div className="mt-4 grid gap-3">
            {consultationLabels.map((label) => (
              <button
                key={label}
                type="button"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-[#256f68] px-4 text-sm font-black text-white hover:bg-[#1d5d57]"
              >
                <MessageCircle size={17} />
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-[#dfe5d9] bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#738075]">
            공유 쿠폰
          </p>
          <button
            type="button"
            onClick={onShareCoupon}
            className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-[#f0a83b] px-4 text-sm font-black text-[#201307] hover:bg-[#dc9429]"
          >
            <Share2 size={17} />
            공유하고 할인 쿠폰 받기
          </button>
          {coupon && (
            <div className="mt-4 rounded-md bg-[#fff8e8] p-4">
              <div className="flex items-center gap-2 text-lg font-black">
                <Gift size={20} />
                {coupon.amount.toLocaleString('ko-KR')}원 쿠폰
              </div>
              <div className="mt-2 inline-flex items-center gap-2 rounded-md bg-white px-3 py-2 font-mono text-sm font-black">
                <Copy size={15} />
                {coupon.code}
              </div>
            </div>
          )}
          {shareStatus && (
            <p className="mt-3 text-sm font-semibold leading-6 text-[#657067]">
              {shareStatus}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#dfe5d9] bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold text-[#657067]">
          {getRegionPreferenceText(answers.preferredRegion)},{' '}
          {companionLabels[answers.companion]} 여행 조건과 총예산{' '}
          {answers.totalBudget.toLocaleString('ko-KR')}원이 저장되었습니다.
        </p>
        <button
          type="button"
          onClick={onRestart}
          className="inline-flex h-11 items-center gap-2 rounded-md border border-[#cfd8cc] px-4 text-sm font-bold text-[#35433c]"
        >
          <ArrowLeft size={17} />
          답변 수정
        </button>
      </div>
    </div>
  );
}

function Field({
  children,
  icon,
  label,
}: {
  children: ReactNode;
  icon: ReactNode;
  label: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center gap-2 text-sm font-black text-[#35433c]">
        {icon}
        {label}
      </span>
      {children}
    </label>
  );
}

function OptionSection({
  children,
  title,
}: {
  children: ReactNode;
  title: string;
}) {
  return (
    <section>
      <h3 className="mb-3 text-sm font-black uppercase tracking-[0.14em] text-[#738075]">
        {title}
      </h3>
      {children}
    </section>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="font-bold text-[#738075]">{label}</dt>
      <dd className="text-right font-black text-[#35433c]">{value}</dd>
    </div>
  );
}

export default App;
