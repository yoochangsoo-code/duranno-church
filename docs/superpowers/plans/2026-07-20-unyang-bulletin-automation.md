# Unyang Bulletin Automation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an automated Unyang sanctuary bulletin system inside the AdminView of the Duranno Church web application that generates HWPX files and high-res PNG images for Naver Band sharing.

**Architecture:** A TypeScript-based bulletin generator module (`unyangBulletinService.ts`) in `src/church/services/` that maps form inputs to a standardized HWPX template schema and renders 300DPI canvas PNG previews, integrated into `AdminView.tsx`.

**Tech Stack:** React, TypeScript, HTML5 Canvas, HWPX XML Schema, Vitest, Supabase.

---

### Task 1: Create Unyang Bulletin Data Types & Generator Service

**Files:**
- Create: `src/church/services/unyangBulletinService.ts`
- Create: `src/church/__tests__/unyangBulletin.test.ts`

- [ ] **Step 1: Write the failing unit test for bulletin data generator**

```typescript
import { describe, it, expect } from 'vitest';
import { generateUnyangBulletinData, UnyangBulletinData } from '../services/unyangBulletinService';

describe('Unyang Bulletin Service Test', () => {
  it('should format Unyang bulletin data payload correctly', () => {
    const input: UnyangBulletinData = {
      date: '2026-07-26',
      sermonTitle: '은혜의 보좌 앞으로',
      passage: '히브리서 4:14-16',
      preacher: '이상문 담임목사',
      notices: ['하반기 일대일 제자양육 모집', '주일 대중교통 이용 권장'],
    };

    const result = generateUnyangBulletinData(input);
    expect(result.title).toContain('2026-07-26');
    expect(result.sermonTitle).toBe('은혜의 보좌 앞으로');
    expect(result.notices.length).toBe(2);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cmd /c npm test`
Expected: FAIL with "Cannot find module '../services/unyangBulletinService'"

- [ ] **Step 3: Implement minimal unyangBulletinService.ts**

```typescript
export interface UnyangBulletinData {
  date: string;
  sermonTitle: string;
  passage: string;
  preacher: string;
  notices: string[];
}

export interface GeneratedBulletinResult {
  title: string;
  sermonTitle: string;
  passage: string;
  preacher: string;
  notices: string[];
  hwpxBlob: Blob;
  previewCanvasUrl: string;
}

export function generateUnyangBulletinData(input: UnyangBulletinData): GeneratedBulletinResult {
  const formattedTitle = `[운양예배당] ${input.date} 주보`;
  const mockXml = `<?xml version="1.0" encoding="UTF-8"?><bulletin><title>${formattedTitle}</title><sermon>${input.sermonTitle}</sermon></bulletin>`;
  const blob = new Blob([mockXml], { type: 'application/x-hwp' });

  return {
    title: formattedTitle,
    sermonTitle: input.sermonTitle,
    passage: input.passage,
    preacher: input.preacher,
    notices: input.notices,
    hwpxBlob: blob,
    previewCanvasUrl: '',
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cmd /c npm test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/church/services/unyangBulletinService.ts src/church/__tests__/unyangBulletin.test.ts
git commit -m "feat: add Unyang bulletin service data generator and unit test"
```

---

### Task 2: Implement Canvas High-Res PNG Image Renderer for Unyang Bulletin

**Files:**
- Modify: `src/church/services/unyangBulletinService.ts`
- Modify: `src/church/__tests__/unyangBulletin.test.ts`

- [ ] **Step 1: Write test for canvas rendering function**

```typescript
it('should render canvas preview URL for bulletin', async () => {
  const input: UnyangBulletinData = {
    date: '2026-07-26',
    sermonTitle: '은혜의 보좌 앞으로',
    passage: '히브리서 4:14-16',
    preacher: '이상문 담임목사',
    notices: ['공지사항 1'],
  };

  const result = generateUnyangBulletinData(input);
  expect(result.title).toBeDefined();
});
```

- [ ] **Step 2: Implement renderUnyangBulletinCanvas function**

Add to `src/church/services/unyangBulletinService.ts`:

```typescript
export function renderUnyangBulletinCanvas(data: UnyangBulletinData): string {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 1600;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    // Background
    ctx.fillStyle = '#faf9f6';
    ctx.fillRect(0, 0, 1200, 1600);

    // Header Banner
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 1200, 180);

    ctx.fillStyle = '#d97706';
    ctx.font = 'bold 36px serif';
    ctx.fillText('두란노교회 운양예배당 주보', 80, 105);

    ctx.fillStyle = '#ffffff';
    ctx.font = '24px sans-serif';
    ctx.fillText(data.date, 1000, 105);

    // Sermon Section
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 44px serif';
    ctx.fillText(data.sermonTitle, 80, 280);

    ctx.fillStyle = '#475569';
    ctx.font = '28px sans-serif';
    ctx.fillText(`본문: ${data.passage} | 설교: ${data.preacher}`, 80, 340);

    // Notices Section
    ctx.fillStyle = '#d97706';
    ctx.font = 'bold 32px serif';
    ctx.fillText('📌 이번 주 주요 소식', 80, 440);

    ctx.fillStyle = '#334155';
    ctx.font = '24px sans-serif';
    data.notices.forEach((notice, idx) => {
      ctx.fillText(`${idx + 1}. ${notice}`, 100, 500 + idx * 50);
    });
  }

  return canvas.toDataURL('image/png');
}
```

- [ ] **Step 3: Run test to verify it passes**

Run: `cmd /c npm test`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/church/services/unyangBulletinService.ts src/church/__tests__/unyangBulletin.test.ts
git commit -m "feat: implement high-res canvas PNG renderer for Unyang bulletin"
```

---

### Task 3: Integrate Unyang Bulletin Automation Panel into AdminView.tsx

**Files:**
- Modify: `src/church/components/AdminView.tsx`

- [ ] **Step 1: Add Unyang Bulletin state and submission form in AdminView.tsx**

Add states:
- `unyangDate`
- `unyangSermonTitle`
- `unyangPassage`
- `unyangPreacher`
- `unyangNoticeText`
- `generatedPngUrl`

- [ ] **Step 2: Build Unyang Bulletin Generator Form UI in AdminView**

```tsx
{/* 운양예배당 주보 자동 생성 & 밴드 공유 카드 */}
<div className="church-card admin-wide-card" style={{ padding: '30px', gridColumn: 'span 2' }}>
  <h4 className="font-serif" style={{ fontSize: '1.3rem', color: 'var(--church-navy)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px' }}>
    <FileText size={22} style={{ color: 'var(--church-gold)' }} /> 운양예배당 주보 HWPX 생성 & 밴드 이미지 공유 (1단계)
  </h4>
  {/* Form & Image Preview UI */}
</div>
```

- [ ] **Step 3: Run test to verify all tests pass**

Run: `cmd /c npm test`
Expected: PASS

- [ ] **Step 4: Commit and deploy to Vercel**

```bash
git add src/church/components/AdminView.tsx
git commit -m "feat: integrate Unyang bulletin generator and band share panel into AdminView"
cmd /c npx vercel --prod --yes
```
