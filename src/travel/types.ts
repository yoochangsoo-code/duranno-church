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

export type TravelRegionPreference =
  | 'domestic'
  | 'southeast-asia'
  | 'china'
  | 'japan'
  | 'middle-east'
  | 'other-asia'
  | 'western-europe'
  | 'eastern-europe'
  | 'americas'
  | 'latin-america'
  | 'oceania'
  | 'africa'
  | 'no-preference';

export interface PeopleCount {
  adults: number;
  children: number;
  includesSeniors: boolean;
}

export interface TravelAnswers {
  preferredRegion: TravelRegionPreference;
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
  regions: TravelRegionPreference[];
  summary: string;
  imageUrl: string;
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
