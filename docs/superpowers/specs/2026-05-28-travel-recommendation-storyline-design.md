# Travel Recommendation Storyline Design

## Purpose

Build a board-attachable travel recommendation program that asks a short set of questions and recommends realistic destinations, travel methods, budgets, and mini itineraries. The experience should feel useful first, then naturally lead to consultation or booking.

The program recommends both domestic and international destinations. It should not look like a hard-sell advertisement. It should provide enough value before showing consultation actions.

## Product Positioning

The core promise is:

> Tell us what kind of trip you want now, and we will suggest the TOP 3 destinations and travel methods that fit your people, budget, schedule, and pace.

The result should be practical enough for the user to imagine booking the trip. Consultation and booking buttons appear after the recommendation content.

## User Flow

1. The user starts with an emotion-based question about what they want from this trip.
2. The user answers practical trip conditions: period, optional dates, companions, people count, and total budget.
3. The user answers preference questions: purpose, pace, movement tolerance, accommodation style, and interests.
4. The program calculates an estimated per-person budget from total budget and people count.
5. The program recommends a TOP 3 set of destinations.
6. Each recommendation includes why it fits, how to travel, a mini itinerary, and an estimated budget range.
7. The result ends with consultation/booking buttons and a share coupon button.

## Question Flow

### 1. Desired Travel Feeling

Question:

> What do you need most from this trip?

Options:

- I want to rest deeply.
- I want to eat great food.
- I want to walk through an unfamiliar city.
- I want to be close to nature.
- I want photo-worthy places.
- I want a comfortable trip with my companions.

### 2. Travel Purpose

Question:

> What do you most want to do on this trip?

Options:

- Rest
- Food
- Shopping
- Nature
- Activity
- History and culture
- Travel with children
- Travel with parents

### 3. Travel Period

Question:

> How long are you planning to travel?

Options:

- Same day
- 2 days, 1 night
- 3 days, 2 nights
- 4 days, 3 nights
- 5 days, 4 nights or more
- Enter dates directly

If the user chooses direct date input, ask for departure and return dates.

### 4. Companion Type

Question:

> Who are you traveling with?

Options:

- Alone
- Partner or spouse
- Friends
- Parents
- Family with children
- Group

### 5. People Count

Fields:

- Number of adults
- Number of children
- Whether seniors are traveling together

This is used with total budget to calculate estimated per-person budget.

### 6. Total Travel Budget

Question:

> What is the total budget you can spend for this trip?

Guidance:

> Include transportation or flights, accommodation, food, and major activities.

The program uses total budget divided by people count as the internal per-person budget. The UI should still show the user-facing budget as a total trip budget to match how families and groups naturally plan.

### 7. Travel Pace

Question:

> What pace feels right for this trip?

Options:

- Relaxed: 1-2 places per day, plenty of rest
- Balanced: key places with breaks in between
- Full: many places, frequent movement is fine

### 8. Movement Tolerance

Question:

> How much travel time between places is acceptable?

Options:

- Short movement is best.
- 1-2 hours is okay.
- Long movement is okay if the destination is worth it.

### 9. Accommodation Preference

Question:

> What kind of accommodation do you prefer?

Options:

- Value accommodation
- Best location
- Stylish accommodation
- Family-friendly accommodation
- Premium resort or hotel

## Recommendation Output

The result page should show:

1. User travel profile summary
2. First-choice destination
3. Two alternative destinations
4. Recommended travel method
5. Period-matched mini itinerary
6. Estimated budget range
7. Consultation and booking calls to action
8. Share coupon call to action

## Travel Method Options

The recommendation may include:

- Independent travel
- Package travel
- Rental car travel
- Public transportation travel
- Resort and rest-focused travel
- Theme travel with celebrities, specialists, guides, or experts

## Theme Travel Weighting

Theme travel with celebrities, specialists, guides, or experts should appear more often than other travel methods, but it must not make the program feel like a theme-travel advertisement.

The program should give theme travel higher recommendation weight when these conditions are present:

- The user travels alone, with friends, or with a group.
- The user chooses history, culture, food, photography, nature, or activity.
- The user wants to walk through unfamiliar places or wants a special experience.
- The travel pace is balanced or full.
- The budget is not extremely tight.
- The result is likely to benefit from guided context, easier decisions, or a curated route.

Theme travel may appear as the main method or as a note inside the recommendation. The call-to-action buttons must remain identical to other travel types.

Example result wording:

> This trip will likely feel better when it has a clear theme rather than only moving quickly between famous spots. A route built around food, history, photography, or nature interpretation can make the same destination feel more memorable. A companion program can also reduce the burden of choosing routes and handling movement.

Avoid CTA labels such as:

- Book a theme trip
- Ask about expert-led travel
- Reserve a celebrity travel program

Use only common CTA labels for all recommendation types.

## Consultation And Booking CTA

After all recommendation content is shown, display common buttons:

- This itinerary looks good. Ask for consultation or booking.
- Request a quote for my TOP 3 candidates.

The buttons should not change wording when the recommendation includes theme travel.

## Share Coupon CTA

Add a final button:

> Share and get a discount coupon

On click:

1. Copy a temporary program link to the clipboard.
2. Randomly choose one coupon amount from 10,000 KRW, 20,000 KRW, 30,000 KRW, 40,000 KRW, and 50,000 KRW.
3. Generate a coupon code.
4. Show the copied link message, coupon amount, and coupon code on screen.

Temporary link:

```text
https://changsoo-travel.example.com/recommend
```

Coupon code format:

```text
ctour + random string + amount digit
```

Amount digit mapping:

- 10,000 KRW: `1`
- 20,000 KRW: `2`
- 30,000 KRW: `3`
- 40,000 KRW: `4`
- 50,000 KRW: `5`

Example:

```text
ctourK7Q2M5
```

This means a 50,000 KRW coupon.

The coupon is display-only in the first version. Real validation, duplicate prevention, expiration, and CRM integration are outside this storyline scope and should be handled during implementation planning if needed.

## Tone

The program should sound helpful, specific, and practical. It should avoid language that feels like a forced product pitch.

Good:

> Based on your budget and pace, this destination gives you enough room for meals and movement without making the trip feel rushed.

Avoid:

> This is the best package and you should book now.

## Success Criteria

- The user can finish the questionnaire without feeling it is too long.
- The result provides TOP 3 destinations with concrete reasons.
- Budget and travel period visibly affect the recommendation.
- Theme travel appears frequently but does not dominate the visible sales language.
- Consultation and booking actions appear only after useful results.
- The share coupon button copies the program link and shows a valid-looking coupon code.

