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

export function renderUnyangBulletinCanvas(data: UnyangBulletinData): string {
  if (typeof document === 'undefined') {
    return 'data:image/png;base64,mockCanvasDataUrl';
  }

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
    ctx.fillText(data.date, 950, 105);

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
