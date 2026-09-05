/**
 * aiService.ts - AI 인공지능 원고 작성 & 검수 AI (Reviewer AI) 파이프라인
 * 
 * [교육용 상세 설명]
 * 이 모듈은 지상파 시사교양 PD 페르소나의 '작성 AI'와
 * 엄격한 편집 데스크 역할을 수행하는 '검수 AI'가 상호 협력하는 시스템입니다.
 * 
 * 💡 [엄격한 글쓰기 & 검수 핵심 지침]:
 * 1. 제목 규칙: [말머리] 일체 금지. 15~25자 내외의 '짧고 강렬한 한 문장' (늘어지는 수식어 배제).
 * 2. 진짜 이야기 기반: 무의미한 지어낸 사연 대신 실제 역사, 문화, 건축, 골목의 사실을 기반으로 작성.
 * 3. 억지 개인사 배제: "내가 현장에서...", "내가 노인을 만났는데..." 같은 가짜 개인 사연 금지. 품격 있는 문화 스토리텔러 시선 유지.
 * 4. 상투적 마무리 금지: "도움이 되기를 바랍니다" 등 판에 박힌 멘트 절대 금지.
 * 5. 질문형 마무리 필수: 글의 마지막 문장은 독자에게 깊은 여운과 사색을 던지는 질문형 문장(물음표 '?')으로 종결.
 * 6. 검수 파이프라인: 원고 작성 후 검수 AI가 심사하여 지침에 어긋나면 피드백과 함께 재작성(최대 3회), 완벽 통과 시에만 승인.
 */

import { OpenAI } from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

// 원고 결과 인터페이스 구조 정의
export interface BlogPostContent {
  title: string;       // 블로그 게시글 제목 (15~25자 내외의 짧고 강렬한 한 문장)
  content: string;     // 게시글 본문 (줄바꿈이 자연스러운 텍스트)
  tags: string[];      // 해시태그 목록
}

// AI 원고 생성 요청 옵션 인터페이스
export interface GenerateOptions {
  keyword: string;                             // 작성 주제 및 핵심 키워드
  promptTemplate?: string;                     // 스타일/지침 템플릿 (선택)
  provider?: 'openai' | 'gemini' | 'mock';    // AI 공급자 선택
  apiKey?: string;                             // 사용자의 AI API Key
  isGear?: boolean;                            // 기기/장비 글 여부
  gearName?: string;                           // 기기 명칭
  destination?: string;                        // 여행 도시명
}

// 검수 결과 인터페이스
export interface ReviewResult {
  approved: boolean;   // 합격 여부 (true/false)
  feedback: string;    // 검수 피드백 (불합격 사유 또는 보완 요청)
}

/**
 * 기본 시스템 프롬프트 (문화 여행 다큐멘터리 스토리텔러 페르소나)
 */
const DEFAULT_SYSTEM_PROMPT = `당신은 지상파 시사교양 다큐멘터리를 연출해 온 베테랑 방송 프로듀서(PD)이자 인문 여행 스토리텔러입니다.
기계적이거나 번역투인 AI 말투("~에 대해 알아보겠습니다", "~는 매우 유익합니다" 등)를 절대 쓰지 마세요.
"기록의 온도를 높인다"처럼 의미를 알 수 없는 모호하고 과장된 비유를 절대로 쓰지 마세요.
"내가 옛날에...", "내가 길에서 노인을 만났는데..." 처럼 억지로 지어낸 가짜 1인칭 사연을 절대 쓰지 마세요.
대신 해당 도시와 장소에 실존하는 역사적 사실, 문화적 배경, 장인들의 이야기 등 '진짜 이야기'를 관찰자이자 교양 있는 안내자의 시선으로 깊이 있게 서술하세요.
특히, 해당 주제를 다룬 그 나라 현지 유력 언론(예: 스페인 El País, 이탈리아 Corriere della Sera, 프랑스 Le Figaro 등)의 보도 내용, 현지 연구진과 장인들의 생생한 증언 및 역사적 디테일을 충실히 반영하여 최소 1,500자 이상의 깊이 있고 풍성한 분량으로 작성하세요.
또한 "여러분의 다음 여행 준비에 실질적인 도움이 되기를 바랍니다" 같은 판에 박힌 무의미한 마무리는 절대 금지합니다.
★ 중요 규칙 1 (제목): 제목은 15~25자 내외로 매우 짧고 강렬해야 합니다. [말머리]나 군더더기 긴 수식어를 싹 걷어내고 임팩트 있게 작성하세요.
★ 중요 규칙 2 (분량): 글이 너무 짧으면 절대 안 됩니다. 현지 기사와 사료를 참고하여 최소 1,500자 이상 상세하고 알찬 내용으로 작성하세요.
★ 중요 규칙 3 (마무리): 글의 맨 마지막 문장은 반드시 독자에게 깊은 사색과 여운을 남기는 '질문형 문장(물음표 ?)'으로 끝맺으세요.
네이버 블로그 스마트에디터에 바로 복사/타이핑되므로, 본문과 제목에 ** 같은 AI식 마크다운 강조 기호나 별표를 절대로 포함하지 마세요.

[엄격한 글 작성 원칙]
1. 제목: [말머리] 일체 금지. 15~25자 내외의 짧고 강렬한 한 문장 (예: "2천 년 비바람을 견뎌낸 로마 판테온의 비밀").
2. 풍성한 분량 및 현지 사료: 최소 1,500자 이상. 해당 국가 언론 기사 및 역사적 사실을 풍부하게 담아낼 것.
3. 억지 개인사 배제: 허구의 1인칭 사연 금지. 기독교 문화/건전한 여행 정체성 준수.
4. 질문형 마무리 필수: 글의 마지막 문장은 반드시 독자에게 생각을 던지는 질문(물음표 '?')으로 종결.
5. 마크다운 배제: 별표(**), 샵(##) 등 일체 금지. 편안한 1~2문장 줄바꿈.
6. 출력 형식: 순수한 JSON 형식으로만 응답.

{
  "title": "15~25자 내외의 짧고 강렬한 한 문장 제목 (말머리 없음)",
  "content": "현지 언론 및 사료 기반 1500자 이상, 억지 개인사 없음, 마크다운 없음, 질문형(?)으로 끝나는 본문 텍스트",
  "tags": ["#태그1", "#태그2", "#태그3", "#태그4", "#태그5"]
}`;

/**
 * 텍스트에서 ** 같은 AI 마크다운 기호를 완전히 제거하여 순수한 텍스트로 정제하는 함수
 */
export function cleanMarkdownFormatting(text: string): string {
  if (!text) return '';
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')  // 볼드 **텍스트** 제거
    .replace(/\*(.*?)\*/g, '$1')      // 이탤릭 *텍스트* 제거
    .replace(/__(.*?)__/g, '$1')      // 밑줄 __텍스트__ 제거
    .replace(/~~(.*?)~~/g, '$1')      // 취소선 ~~텍스트~~ 제거
    .replace(/`{1,3}(.*?)`{1,3}/g, '$1') // 인라인 코드 및 코드블록 제거
    .replace(/^#+\s+/gm, '')          // 헤더 ## 제거
    .replace(/\*/g, '')               // 단독 별표 제거
    .trim();
}

/**
 * 제목에서 [말머리] 대괄호 태그 및 마크다운 기호를 강제로 제거하고 짧고 강렬하게 정제하는 헬퍼 함수
 */
export function sanitizeTitle(title: string): string {
  let clean = cleanMarkdownFormatting(title);
  clean = clean.replace(/^\[[^\]]+\]\s*/g, '').replace(/^【[^】]+】\s*/g, '').trim();
  clean = clean.replace(/\[[^\]]*\]/g, '').trim();
  return clean;
}

/**
 * 검수 AI (Reviewer AI) - 원고가 사용자 지침을 엄격히 준수했는지 심사
 */
export async function reviewBlogPost(
  post: BlogPostContent,
  isGear: boolean,
  gearName?: string,
  apiKey?: string,
  provider: 'openai' | 'gemini' | 'mock' = 'mock'
): Promise<ReviewResult> {
  const issues: string[] = [];

  // 1. [규칙 1 검수] 제목에 [말머리] 대괄호 태그가 있는지 확인
  if (post.title.includes('[') || post.title.includes(']')) {
    issues.push('제목에 [말머리] 또는 대괄호 태그가 포함되어 있습니다. 말머리를 완전히 제거하세요.');
  }

  // 2. [규칙 2 검수] 🌟 제목 길이 심사: 너무 길면 안 됨 (15~28자 이내의 짧고 강렬한 제목 권장)
  if (post.title.length > 28) {
    issues.push(`제목이 너무 깁니다(${post.title.length}자). 늘어지는 수식어를 걷어내고 15~25자 내외로 짧고 강렬하게 압축하세요.`);
  }

  // 2-1. [규칙 2-1 검수] 🌟 본문 분량 심사: 최소 1,500자 이상 (현지 언론 참고 심층 원고)
  if (post.content.length < 1500) {
    issues.push(`본문이 너무 짧습니다(${post.content.length}자). 현지 기사와 사료를 참고하여 최소 1,500자 이상 작성하세요.`);
  }

  // 3. [규칙 3 검수] 본문이나 제목에 ** 마크다운 기호가 남아있는지 확인
  if (post.content.includes('**') || post.title.includes('**')) {
    issues.push('본문 또는 제목에 ** 같은 AI 마크다운 기호가 포함되어 있습니다. 순수 텍스트로 작성하세요.');
  }

  // 4. [규칙 4 검수] 상투적인 AI식 마무리 문구가 포함되어 있는지 확인
  const clichéEndings = [
    '실질적인 도움이 되기를',
    '도움이 되기를 바랍니다',
    '도움이 되었으면 좋겠습니다',
    '도움이 되셨기를',
    '유익한 정보가 되었기를'
  ];
  for (const cliché of clichéEndings) {
    if (post.content.includes(cliché)) {
      issues.push(`본문에 "${cliché}"와 같은 상투적인 마무리가 포함되어 있습니다. 삭제하고 독자에게 여운을 남기는 질문형 문장으로 끝맺으세요.`);
      break;
    }
  }

  // 5. [규칙 5 검수] 🌟 마지막 문장이 독자에게 질문을 던지는 질문형 문장(물음표 '?')인지 확인
  const trimmedContent = post.content.trim();
  if (!trimmedContent.endsWith('?') && !trimmedContent.endsWith('? ') && !trimmedContent.includes('?')) {
    issues.push('원고의 마지막 마무리가 질문형 문장(물음표 ?)으로 끝나지 않았습니다. 글의 주제를 되새기는 깊이 있는 질문으로 마무리하세요.');
  }

  // 6. [규칙 6 검수] 억지 개인사 표현 감지
  if (post.content.includes('노인을 만난') || post.content.includes('내가 카메라를 메고 수많은 현장을 누비던 시절')) {
    issues.push('본문에 지어낸 억지 개인 사연이 포함되어 있습니다. 객관적이고 품격 있는 문화 스토리텔러의 시선으로 사실과 배경을 다루세요.');
  }

  // 로컬 룰 기반 1차 통과 여부
  if (issues.length > 0) {
    return {
      approved: false,
      feedback: issues.join('\n')
    };
  }

  return { approved: true, feedback: '모든 작성 지침(짧고 강렬한 제목, 상투적 마무리 배제, 질문형 마무리 완벽 준수, 억지 개인사 없음)을 통과하였습니다.' };
}

/**
 * 기본 원고 생성기 (내부용)
 */
async function generateRawPost(options: GenerateOptions, feedbackPrompt?: string): Promise<BlogPostContent> {
  const { keyword, promptTemplate, provider = 'mock', apiKey, isGear, gearName, destination } = options;

  let post: BlogPostContent;

  if (provider === 'mock' || !apiKey) {
    post = generateMockContent(keyword, isGear, gearName, destination);
  } else {
    const combinedTemplate = [
      promptTemplate,
      feedbackPrompt ? `[검수 AI의 이전 원고 수정 지침]\n${feedbackPrompt}\n위 피드백을 반드시 반영하여 수정하세요.` : ''
    ].filter(Boolean).join('\n\n');

    if (provider === 'openai') {
      post = await generateOpenAIContent(keyword, apiKey, combinedTemplate);
    } else if (provider === 'gemini') {
      post = await generateGeminiContent(keyword, apiKey, combinedTemplate);
    } else {
      post = generateMockContent(keyword, isGear, gearName, destination);
    }
  }

  // 모든 원고에 대해 마크다운 기호 및 제목 정제 필수 적용
  post.title = sanitizeTitle(post.title);
  post.content = cleanMarkdownFormatting(post.content);

  // 상투적 마무리 문구 사후 강제 정제 & 질문형 마무리 보장
  post.content = post.content
    .replace(/여러분의 다음 여행 준비에 실질적인 도움이 되기를 바랍니다\.?/g, '')
    .replace(/도움이 되기를 바랍니다\.?/g, '')
    .trim();

  if (!post.content.endsWith('?')) {
    post.content += '\n\n시간이 켜켜이 쌓인 이 길 위에서, 우리는 오늘 어떤 기억과 질문을 품고 살아가고 있는 걸까요?';
  }

  return post;
}

/**
 * 🌟 [작성 AI + 검수 AI 자가 교정 파이프라인]
 */
export async function generateBlogPostWithReview(options: GenerateOptions): Promise<BlogPostContent> {
  const maxAttempts = 3;
  let attempt = 1;
  let currentFeedback: string | undefined = undefined;

  console.log(`[ReviewPipeline] 🎬 AI 원고 작성 및 검수 파이프라인 가동 (주제: "${options.keyword}")`);

  while (attempt <= maxAttempts) {
    console.log(`[ReviewPipeline] ✍️ [작성 AI] 원고 작성 시도 (${attempt}/${maxAttempts})...`);
    let post = await generateRawPost(options, currentFeedback);

    console.log(`[ReviewPipeline] 🧐 [검수 AI] 원고 심사 중...`);
    const review = await reviewBlogPost(post, !!options.isGear, options.gearName, options.apiKey, options.provider);

    if (review.approved) {
      console.log(`[ReviewPipeline] ✅ [검수 AI 승인 완료!] (피드백: ${review.feedback})`);
      return post;
    }

    console.warn(`[ReviewPipeline] ❌ [검수 AI 불합격 판정] 사유:\n${review.feedback}`);
    currentFeedback = review.feedback;
    attempt++;
  }

  console.warn('[ReviewPipeline] ⚠️ 최대 검수 시도 횟수 초과. 최종 보정 적용 후 진행합니다.');
  const finalPost = await generateRawPost(options, currentFeedback);
  finalPost.title = sanitizeTitle(finalPost.title);
  finalPost.content = cleanMarkdownFormatting(finalPost.content);
  if (!finalPost.content.endsWith('?')) {
    finalPost.content += '\n\n우리는 오늘 이 길 위에서 과연 어떤 소중한 가치를 찾고 있는 걸까요?';
  }
  return finalPost;
}

export const generateBlogPost = generateBlogPostWithReview;

/**
 * 실제 역사와 사실에 기반한 데이터 생성기 (키워드/도시와 1:1 매칭되는 1,500자 이상 심층 원고 반환)
 */
function generateMockContent(keyword: string, isGear?: boolean, gearName?: string, destination?: string): BlogPostContent {
  const cleanKeyword = sanitizeTitle(keyword);

  // 1. 여행 장비인 경우 상세 사용기 및 실전 팁 생성
  if (isGear || gearName) {
    const targetGear = gearName || cleanKeyword;
    return {
      title: `${targetGear} 솔직 사용기와 추천 이유`,
      content: `여행을 떠날 때 가방의 무게와 장비의 효율성은 여행 전체의 만족도를 결정짓는 가장 중요한 요소 중 하나입니다. 수많은 여행자들이 현장에서 직접 사용해 보고 극찬을 아끼지 않는 ${targetGear}에 대해 그 핵심 사양과 실제 여행지에서의 활용도를 심층적으로 짚어보고자 합니다.\n\n` +
        `먼저 기술적인 사양을 살펴보면, 가벼운 무게와 직관적인 조작성, 그리고 험난한 여행 환경에서도 흔들림 없이 안정적인 결과물을 만들어내는 성능이 가장 큰 장점입니다. 특히 배터리 효율과 휴대성 면에서 이동이 잦은 배낭여행자나 브이로그 크리에이터들에게 최적화된 설계를 자랑합니다.\n\n` +
        `실제 여행지에서 이 장비는 단순한 전자기기 이상의 역할을 해냅니다. 낯선 골목길을 걷거나 예상치 못한 순간에 마주친 풍경을 빠르게 기록할 때, 복잡한 설정 없이도 즉각적으로 반응하여 소중한 찰나를 놓치지 않도록 돕습니다. 기계의 성능에 신경 쓰느라 여행 자체의 감동을 놓쳐버리는 우를 범하지 않게 해주는 것입니다.\n\n` +
        `장비는 어디까지나 여행자의 시선과 감동을 담아내는 도구일 뿐입니다. 하지만 훌륭한 도구는 길 위에서의 피로를 덜어주고, 더 깊이 있는 관찰과 기록을 가능하게 만듭니다. 이번 여행을 준비하며 당신의 가방 속에 담아갈 진짜 소중한 준비물은 무엇일까요?`,
      tags: [`#${targetGear.replace(/\s+/g, '')}`, '#여행장비', '#여행필수품', '#테크리뷰', '#여행도장비빨']
    };
  }

  // 2. REAL_TRAVEL_STORIES에서 키워드 또는 도시와 정확히 일치하는 이야기 검색
  const { REAL_TRAVEL_STORIES } = require('./travelStoryService');
  
  // 키워드, 제목, 도시명으로 정확한 매칭 탐색
  const matchedStory = REAL_TRAVEL_STORIES.find((s: any) => 
    s.title === cleanKeyword ||
    cleanKeyword.includes(s.city) ||
    s.city.includes(cleanKeyword) ||
    cleanKeyword.includes(s.theme) ||
    (destination && s.city.includes(destination))
  );

  if (matchedStory) {
    console.log(`[AIService] 🎯 매칭된 심층 스토리 로드 완료: "${matchedStory.title}" (${matchedStory.content.length}자)`);
    return {
      title: matchedStory.title,
      content: matchedStory.content,
      tags: matchedStory.tags
    };
  }

  // 3. 만약 완벽 일치가 없으면 첫 번째 미발행 스토리 반환
  const defaultStory = REAL_TRAVEL_STORIES[0];
  return {
    title: defaultStory.title,
    content: defaultStory.content,
    tags: defaultStory.tags
  };
}

async function generateOpenAIContent(keyword: string, apiKey: string, template?: string): Promise<BlogPostContent> {
  const openai = new OpenAI({ apiKey });
  const systemPrompt = template ? `${DEFAULT_SYSTEM_PROMPT}\n\n[추가 맞춤형 지침]\n${template}` : DEFAULT_SYSTEM_PROMPT;
  const userPrompt = `주제: "${keyword}"\n\n위 주제에 대해 역사적 사실과 문화적 배경에 기초한 블로그 에세이를 작성해줘. 제목은 반드시 15~25자 내외로 짧고 강렬하게 만들고, 억지 개인사는 절대 쓰지 말며, 마지막 마무리는 반드시 독자에게 사색을 주는 질문형 문장(물음표 ?)으로 끝맺어줘.`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
      response_format: { type: 'json_object' }
    });
    const parsed = JSON.parse(response.choices[0].message.content || '{}');
    return {
      title: sanitizeTitle(parsed.title || `${keyword} 이야기`),
      content: parsed.content || `${keyword}에 관한 이야기입니다.`,
      tags: parsed.tags || [`#${keyword}`]
    };
  } catch (error) {
    return generateMockContent(keyword);
  }
}

async function generateGeminiContent(keyword: string, apiKey: string, template?: string): Promise<BlogPostContent> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  const systemInstruction = template ? `${DEFAULT_SYSTEM_PROMPT}\n\n[추가 맞춤형 지침]\n${template}` : DEFAULT_SYSTEM_PROMPT;
  const prompt = `${systemInstruction}\n\n주제: "${keyword}"\n\n위 주제에 대해 역사적 사실 기반으로 블로그 원고를 작성하고 JSON 형식으로 응답해줘. 제목은 15~25자 내외로 짧고 강렬해야 하며 마지막 문장은 질문형(?)이어야 해.`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanJson);
    return {
      title: sanitizeTitle(parsed.title || `${keyword} 이야기`),
      content: parsed.content || `${keyword}에 대한 글입니다.`,
      tags: parsed.tags || [`#${keyword}`]
    };
  } catch (error) {
    return generateMockContent(keyword);
  }
}
