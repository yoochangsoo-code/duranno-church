import type { CouponResult } from './types';

export const PROGRAM_SHARE_URL = 'https://changsoo-travel.example.com/recommend';
export const COUPON_AMOUNTS = [10000, 20000, 30000, 40000, 50000] as const;

export function getAmountDigit(
  amount: CouponResult['amount'],
): CouponResult['amountDigit'] {
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
  const amountIndex = Math.min(
    COUPON_AMOUNTS.length - 1,
    Math.floor(random() * COUPON_AMOUNTS.length),
  );
  const amount = COUPON_AMOUNTS[amountIndex];
  const amountDigit = getAmountDigit(amount);

  return {
    amount,
    amountDigit,
    code: `ctour${randomToken(random)}${amountDigit}`,
  };
}

export async function copyShareLink(
  writeText: (value: string) => Promise<void>,
): Promise<string> {
  await writeText(PROGRAM_SHARE_URL);
  return PROGRAM_SHARE_URL;
}
