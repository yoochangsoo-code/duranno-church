import assert from 'node:assert/strict';
import {
  COUPON_AMOUNTS,
  PROGRAM_SHARE_URL,
  copyShareLink,
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

let copied = '';
const copiedUrl = await copyShareLink(async (value) => {
  copied = value;
});
assert.equal(copied, PROGRAM_SHARE_URL);
assert.equal(copiedUrl, PROGRAM_SHARE_URL);

console.log('coupon tests passed');
