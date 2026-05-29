import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  Copy,
  Gift,
  MapPin,
  MessageCircle,
  Plane,
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
} from './travel/types';

type Option<T extends string> = {
  value: T;
  label: string;
  note: string;
};

type StepKey =
  | 'mood'
  | 'purpose'
  | 'dates'
  | 'people'
  | 'budget'
  | 'style';

const initialAnswers: TravelAnswers = {
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

const steps: { key: StepKey; title: string; subtitle: string }[] = [
  {
    key: 'mood',
    title: 'What should the trip feel like?',
    subtitle: 'Start with the mood the traveler will remember.',
  },
  {
    key: 'purpose',
    title: 'What is the main reason for going?',
    subtitle: 'This drives destination scoring and the route story.',
  },
  {
    key: 'dates',
    title: 'How long is the trip?',
    subtitle: 'Use exact dates if the board needs a real consultation handoff.',
  },
  {
    key: 'people',
    title: 'Who is traveling?',
    subtitle: 'Party size controls the per-person budget and movement plan.',
  },
  {
    key: 'budget',
    title: 'What budget should we design around?',
    subtitle: 'Recommendations stay realistic instead of aspirational.',
  },
  {
    key: 'style',
    title: 'How should the itinerary move?',
    subtitle: 'Tune pace, transfers, and hotel preference before the TOP 3.',
  },
];

const feelingOptions: Option<TravelFeeling>[] = [
  { value: 'rest', label: 'Rest', note: 'Slow reset and quiet stays' },
  { value: 'food', label: 'Food', note: 'Local meals and market routes' },
  { value: 'city', label: 'City', note: 'Shopping, galleries, nightlife' },
  { value: 'nature', label: 'Nature', note: 'Scenery and outdoor stops' },
  { value: 'photo', label: 'Photo', note: 'Views and memorable locations' },
  { value: 'comfort', label: 'Comfort', note: 'Simple movement and easy stays' },
];

const purposeOptions: Option<TravelPurpose>[] = [
  { value: 'culture', label: 'Culture', note: 'History, exhibits, local context' },
  { value: 'food', label: 'Food', note: 'Restaurants, markets, cafes' },
  { value: 'shopping', label: 'Shopping', note: 'Brands, outlets, local goods' },
  { value: 'nature', label: 'Nature', note: 'Coast, mountains, parks' },
  { value: 'activity', label: 'Activity', note: 'Light adventure and movement' },
  { value: 'children', label: 'Kids', note: 'Family-friendly attractions' },
  { value: 'parents', label: 'Parents', note: 'Comfortable senior pacing' },
  { value: 'rest', label: 'Rest', note: 'Hotels, spas, low pressure' },
];

const periodOptions: Option<TravelPeriod>[] = [
  { value: 'same-day', label: 'Same day', note: 'One compact route' },
  { value: '1-night', label: '1 night', note: 'Short domestic escape' },
  { value: '2-night', label: '2 nights', note: 'Balanced weekend plan' },
  { value: '3-night', label: '3 nights', note: 'Enough for overseas short haul' },
  { value: '4-night-plus', label: '4+ nights', note: 'Longer rest or long haul' },
  { value: 'custom', label: 'Custom', note: 'Use dates as the source of truth' },
];

const companionOptions: Option<CompanionType>[] = [
  { value: 'alone', label: 'Solo', note: 'Flexible and compact' },
  { value: 'partner', label: 'Couple', note: 'Views, food, hotel quality' },
  { value: 'friends', label: 'Friends', note: 'Shared interests and energy' },
  { value: 'parents', label: 'Parents', note: 'Comfort-first movement' },
  { value: 'family', label: 'Family', note: 'Kid-safe pacing and stays' },
  { value: 'group', label: 'Group', note: 'Clear route and easy decisions' },
];

const paceOptions: Option<TravelPace>[] = [
  { value: 'relaxed', label: 'Relaxed', note: 'Fewer stops, more rest' },
  { value: 'balanced', label: 'Balanced', note: 'One strong route per day' },
  { value: 'full', label: 'Full', note: 'Dense schedule, early starts' },
];

const movementOptions: Option<MovementTolerance>[] = [
  { value: 'short', label: 'Short', note: 'Low transfer burden' },
  { value: 'medium', label: 'Medium', note: 'A practical default' },
  { value: 'long', label: 'Long', note: 'Open to bigger routes' },
];

const accommodationOptions: Option<AccommodationPreference>[] = [
  { value: 'value', label: 'Value', note: 'Budget-efficient stays' },
  { value: 'location', label: 'Location', note: 'Near key routes' },
  { value: 'stylish', label: 'Stylish', note: 'Design-led hotels' },
  { value: 'family', label: 'Family', note: 'Space and convenience' },
  { value: 'premium', label: 'Premium', note: 'Resort or higher-end stay' },
];

const consultationLabels = [
  'Ask about this itinerary and booking',
  'Request quotes for the TOP 3',
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
      setShareStatus(`Program link copied: ${PROGRAM_SHARE_URL}`);
    } catch {
      setShareStatus(`Copy was blocked. Use this link: ${PROGRAM_SHARE_URL}`);
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
          <nav className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src="/ctourlogo.jpg"
                alt="Changsoo Travel"
                className="h-10 w-10 rounded-md object-cover"
              />
              <span className="text-sm font-bold uppercase tracking-[0.18em]">
                Changsoo Travel
              </span>
            </div>
            <div className="hidden items-center gap-2 rounded-full bg-white/14 px-4 py-2 text-xs font-semibold backdrop-blur sm:flex">
              <Plane size={16} />
              Board consultation mode
            </div>
          </nav>
          <div className="max-w-3xl pb-3">
            <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/16 px-4 py-2 text-sm font-semibold backdrop-blur">
              <MapPin size={16} />
              TOP 3 realistic travel recommendations
            </p>
            <h1 className="text-4xl font-black leading-tight sm:text-6xl">
              Match a trip to the traveler, not just the destination.
            </h1>
            <p className="mt-4 max-w-2xl text-base font-medium text-white/88 sm:text-lg">
              Answer a guided set of questions, then get three practical routes
              with budget ranges, mini itineraries, consultation actions, and a
              share coupon.
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
                    Step {stepIndex + 1} of {steps.length}
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
                    <Field label="Start date" icon={<CalendarDays size={17} />}>
                      <input
                        type="date"
                        value={answers.startDate}
                        onChange={(event) =>
                          updateAnswers({ startDate: event.target.value })
                        }
                        className="field-input"
                      />
                    </Field>
                    <Field label="End date" icon={<CalendarDays size={17} />}>
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
                    <Field label="Adults" icon={<Users size={17} />}>
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
                    <Field label="Children" icon={<Users size={17} />}>
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
                      <span className="text-sm font-bold">Includes seniors</span>
                    </label>
                  </div>
                </div>
              )}

              {currentStep.key === 'budget' && (
                <div className="max-w-xl">
                  <Field label="Total budget in KRW" icon={<Gift size={17} />}>
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
                    Current per-person budget:{' '}
                    {Math.round(
                      answers.totalBudget /
                        Math.max(
                          1,
                          answers.people.adults + answers.people.children,
                        ),
                    ).toLocaleString('ko-KR')}{' '}
                    KRW
                  </p>
                </div>
              )}

              {currentStep.key === 'style' && (
                <div className="space-y-6">
                  <OptionSection title="Pace">
                    <OptionGrid
                      options={paceOptions}
                      value={answers.pace}
                      onChange={(pace) => updateAnswers({ pace })}
                    />
                  </OptionSection>
                  <OptionSection title="Movement">
                    <OptionGrid
                      options={movementOptions}
                      value={answers.movement}
                      onChange={(movement) => updateAnswers({ movement })}
                    />
                  </OptionSection>
                  <OptionSection title="Accommodation">
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
                  Back
                </button>
                <button
                  type="button"
                  onClick={nextStep}
                  className="inline-flex h-11 items-center gap-2 rounded-md bg-[#256f68] px-5 text-sm font-bold text-white shadow-sm hover:bg-[#1d5d57]"
                >
                  {stepIndex === steps.length - 1 ? 'Show TOP 3' : 'Next'}
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
              Current brief
            </p>
            <dl className="mt-4 space-y-3 text-sm">
              <SummaryRow label="Mood" value={answers.feeling} />
              <SummaryRow label="Purpose" value={answers.purpose} />
              <SummaryRow label="Period" value={answers.period} />
              <SummaryRow label="Companion" value={answers.companion} />
              <SummaryRow
                label="People"
                value={`${answers.people.adults} adults, ${answers.people.children} children`}
              />
              <SummaryRow
                label="Budget"
                value={`${answers.totalBudget.toLocaleString('ko-KR')} KRW`}
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
                Live front-runner
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
          Recommended shortlist
        </p>
        <h2 className="mt-2 text-3xl font-black">TOP 3 trips for this brief</h2>
        <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-[#657067]">
          These results use the answers, per-person budget, travel pace, and
          practical movement constraints. Consultation actions stay neutral
          across trip types.
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
                      Rank {recommendation.rank}
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
                    Mini itinerary
                  </p>
                  <ol className="grid gap-2 text-sm font-bold text-[#35433c] sm:grid-cols-3">
                    {recommendation.itinerary.map((item, index) => (
                      <li key={item} className="flex gap-2">
                        <span className="text-[#256f68]">D{index + 1}</span>
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
            Consultation
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
            Share coupon
          </p>
          <button
            type="button"
            onClick={onShareCoupon}
            className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-[#f0a83b] px-4 text-sm font-black text-[#201307] hover:bg-[#dc9429]"
          >
            <Share2 size={17} />
            Share and get a discount coupon
          </button>
          {coupon && (
            <div className="mt-4 rounded-md bg-[#fff8e8] p-4">
              <div className="flex items-center gap-2 text-lg font-black">
                <Gift size={20} />
                {coupon.amount.toLocaleString('ko-KR')} KRW coupon
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
          Brief saved for {answers.companion} with a{' '}
          {answers.totalBudget.toLocaleString('ko-KR')} KRW total budget.
        </p>
        <button
          type="button"
          onClick={onRestart}
          className="inline-flex h-11 items-center gap-2 rounded-md border border-[#cfd8cc] px-4 text-sm font-bold text-[#35433c]"
        >
          <ArrowLeft size={17} />
          Edit answers
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
