import { GoogleGenAI } from "@google/genai";
import { ScriptSegment, EditSuggestion } from "../types";

const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY || "",
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

function getCustomAIClient(customKey: string) {
  return new GoogleGenAI({ 
    apiKey: customKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
}

async function runWithQuotaFallback<T>(
  operation: (client: GoogleGenAI) => Promise<T>
): Promise<T> {
  const customKey = typeof window !== 'undefined' ? localStorage.getItem('user_gemini_api_key') : null;
  
  if (customKey && customKey.trim()) {
    console.info("Using user's custom Gemini API key as primary client...");
    try {
      const customAi = getCustomAIClient(customKey.trim());
      return await operation(customAi);
    } catch (error: any) {
      console.error("Failed with custom API Key:", error);
      const errorMsg = (error && typeof error === 'object' && error.message) ? error.message : String(error);
      throw new Error("CUSTOM_KEY_FAILED:" + errorMsg);
    }
  }

  try {
    return await operation(ai);
  } catch (error: any) {
    console.warn("Default Gemini call failed. Checking for quota or API key configuration issues...", error);
    
    const errorStr = JSON.stringify(error) || String(error) || "";
    const isQuotaError = 
      errorStr.includes("429") || 
      errorStr.includes("RESOURCE_EXHAUSTED") || 
      errorStr.includes("quota") || 
      errorStr.includes("Quota") ||
      (error.status === 429) ||
      (error.code === 429) ||
      (error.message && (
        error.message.includes("429") || 
        error.message.includes("quota") || 
        error.message.includes("Quota") || 
        error.message.includes("RESOURCE_EXHAUSTED")
      ));
      
    const isMissingKey = 
      errorStr.includes("API key is missing") || 
      errorStr.includes("API_KEY_INVALID") || 
      (error.message && (
        error.message.includes("API key is missing") || 
        error.message.includes("provide a valid API key") ||
        error.message.includes("API key not valid")
      ));
      
    if (isQuotaError || isMissingKey) {
      throw new Error("QUOTA_EXHAUSTED_NO_KEY");
    }
    
    throw error;
  }
}

function parseTimeToSeconds(timeStr: string): number {
  if (!timeStr) return 0;
  const clean = timeStr.replace(/[\[\]]/g, '').trim();
  const parts = clean.split(':').map(Number);
  if (parts.length === 3) {
    return (parts[0] * 3600) + (parts[1] * 60) + parts[2];
  } else if (parts.length === 2) {
    return (parts[0] * 60) + parts[1];
  }
  return Number(clean) || 0;
}

function formatSecsToDecimal(s: string): string {
  const num = parseFloat(s);
  const rounded = Math.round(num * 10) / 10;
  const split = rounded.toFixed(1).split('.');
  return `${split[0].padStart(2, '0')}.${split[1]}`;
}

function normalizeScriptForFilters(rawScript: string): string {
  if (!rawScript) return "";
  let processed = rawScript.replace(/\r\n/g, '\n');
  const tsRegex = /(?:\[|\()?\s*(?:(\d{1,2}):)?(\d{1,2}):(\d{2}(?:\.\d+)?)\s*(?:\]|\))?/g;
  
  processed = processed.replace(tsRegex, (match, h, m, s) => {
    const hours = h ? h + ':' : '';
    const minutes = m.padStart(2, '0');
    const seconds = formatSecsToDecimal(s);
    return `\n[${hours}${minutes}:${seconds}] `;
  });
  
  return processed
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join('\n');
}

function verifyAndFilterSuggestions(suggestions: EditSuggestion[], script: string): EditSuggestion[] {
  if (!suggestions || suggestions.length === 0) return [];
  
  const normalized = normalizeScriptForFilters(script);
  const lines = normalized.split('\n');
  
  interface SamplePhrase {
    seconds: number;
    speaker: string;
    text: string;
  }
  
  const phrases: SamplePhrase[] = [];
  const headerTsRegex = /^\[(?:(\d{1,2}):)?(\d{2}):(\d{2}(?:\.\d+)?)\]/;
  const speakerRegex = /\[([^\]]+)\]/;
  
  lines.forEach(line => {
    const tsMatch = headerTsRegex.exec(line);
    if (!tsMatch) return;
    
    const hours = tsMatch[1] ? parseInt(tsMatch[1]) : 0;
    const minutes = parseInt(tsMatch[2]);
    const secs = parseFloat(tsMatch[3]);
    const seconds = (hours * 3600) + (minutes * 60) + secs;
    
    let remainder = line.replace(headerTsRegex, '').trim();
    let speaker = "알수없음";
    
    const spMatch = speakerRegex.exec(remainder);
    if (spMatch && remainder.startsWith('[')) {
      speaker = spMatch[1].trim();
      remainder = remainder.replace(speakerRegex, '').trim().replace(/^[:\-\s\>]+/, '').trim();
    }
    
    phrases.push({
      seconds,
      speaker,
      text: remainder
    });
  });

  return suggestions.filter(s => {
    const cutStart = parseTimeToSeconds(s.start_time);
    const cutEnd = parseTimeToSeconds(s.end_time);
    
    // Simulate removing this edit section
    const remainingPhrases = phrases.filter(p => p.seconds < cutStart || p.seconds >= cutEnd);
    
    for (let i = 0; i < remainingPhrases.length - 1; i++) {
      const current = remainingPhrases[i];
      const next = remainingPhrases[i + 1];
      
      const curIsInterviewer = current.speaker.includes("질문") || current.speaker.includes("사회") || current.speaker.includes("진행");
      const nextIsInterviewer = next.speaker.includes("질문") || next.speaker.includes("사회") || next.speaker.includes("진행");
      
      // Verification rule 1: Question-to-Question adjacency (missing response entirely)
      if (curIsInterviewer && nextIsInterviewer) {
        const originalIdxCur = phrases.findIndex(p => p.seconds === current.seconds && p.text === current.text);
        const originalIdxNext = phrases.findIndex(p => p.seconds === next.seconds && p.text === next.text);
        if (originalIdxCur !== -1 && originalIdxNext !== -1 && (originalIdxNext - originalIdxCur > 1)) {
          return false;
        }
      }
      
      // Verification rule 2: Question followed by a guest reaction that is too short (e.g., leaving only "네." as the full answer)
      if (curIsInterviewer && !nextIsInterviewer) {
        const guestPhrase = next;
        const afterGuestPhrase = remainingPhrases[i + 2];
        if (afterGuestPhrase) {
          const afterIsInterviewer = afterGuestPhrase.speaker.includes("질문") || afterGuestPhrase.speaker.includes("사회") || afterGuestPhrase.speaker.includes("진행");
          if (afterIsInterviewer) {
            const cleanGuestText = guestPhrase.text.replace(/[\s\.\,\!\?]/g, '');
            if (cleanGuestText.length <= 6) { 
              const origGuestIdx = phrases.findIndex(p => p.seconds === guestPhrase.seconds);
              const origAfterGuestIdx = phrases.findIndex(p => p.seconds === afterGuestPhrase.seconds);
              if (origGuestIdx !== -1 && origAfterGuestIdx !== -1 && (origAfterGuestIdx - origGuestIdx > 1)) {
                return false;
              }
            }
          }
        }
      }
    }
    
    return true;
  });
}

export const geminiService = {
  async analyzeScript(
    script: string, 
    targetMinutes: number, 
    originalSeconds?: number,
    criteria?: string,
    specialRules?: string,
    model: string = "gemini-3.5-flash"
  ): Promise<{
    suggestions: EditSuggestion[];
    totalSeconds: number;
  }> {
    const prompt = `
      You are an expert broadcast editor helper. 
      Analyze the following audio script transcript.
      
      Target duration: ${targetMinutes} minutes.
      Original total duration: ${originalSeconds ? originalSeconds + ' seconds' : 'estimate from script'}.
      
      Custom Editing Criteria:
      ${criteria || `
      1. Socially sensitive content (political bias, partisan extremist views).
      2. Slander or legal risk (defaming individuals).
      3. Internal church issues or preacher's personal life not relevant to the main topic.
      4. Other unnecessary/filler redundant parts.
      `}
      
      Special Constraints (Must follow these strictly):
      ${specialRules || 'No special rules provided.'}
      
      Guidelines:
      - 🚨 FRONT/BACK SILENCE & NOISE PRIORITIZATION (파일 앞뒤 묵음/음악 우선 삭제): 파일의 맨 앞이나 맨 뒤(시작부 또는 종료부)에 내용과 성격이 무관한 장기 묵음(Silence), 노래/배경 음악(BGM), 또는 소음(환경 잡음)이 있어 내용 전개가 되지 않는 구간이 발견된다면 다른 조건들보다 최우선적인(Priority 1) 편집 삭제 대상으로 반드시 제안해야 합니다. 이때는 스크립트 대사가 존재하지 않으므로, 'text_chunk'를 비우거나 "[묵음, 노래 또는 소음 구간(대화 내용 없음)]"으로 표기하고 대용 요소를 친절하게 reason에 묘사하십시오.
      - 🚨 FINE-GRAINED SEGMENTATION (촘촘하고 짧은 구절 단위 분할): 하나의 제안 구절이 너무 길어지지 않도록, 긴 한 구절로 묶인 문장이 있다면 이를 여러 개의 작은 단위(최대 5~10초 내외 또는 짧은 문맥 단위)로 잘게 쪼개어 세밀하게 제안하도록 하십시오. 어눌한 반복이나 사족이 있을 때 통째로 30초~1분을 날리는 것 대신 그 안에서도 정밀하게 세분화해서 촘촘히 쪼개진 타임스탬프 기반으로 제안해 주어야 합니다.
      - MAJOR RULE (질문-답변 기형 구조 절대 방지): 질문자(사회자)와 답변자(초대 손님)가 번갈아 말하는 대담/대화 형식일 때, 답변을 완전히 통째로 들어내는 편집 제안을 절대 해서는 안 됩니다! 답변을 통째로 들어내면, 결과적으로 해당 질문 바로 다음에 답이 없이 바로 다음 질문(혹은 다음 질문자의 대사)이 드러나는 기형적이고 자연스럽지 못한 현상이 생깁니다. 따라서 어떤 답변 부분을 날리고 싶을 때는 오직 아래의 두 원칙 중 하나만 엄격히 따르십시오:
         1) [답변의 일부만 삭제]: 절대로 답변 전체를 날려 질문 바로 다음에 다른 질문이 인접하게 만들어서는 안 되며, 답변 전체를 날리는 대신 사회자 본연 질문의 취지에 위배되지 않도록 핵심 기둥 대답(앞부분)은 확실히 노출하여 살리고, 답변자의 마지막 장황한 사설이나 어눌한 사족 부차 설명, 혹은 어구(답변 뒷구간 일부)만 세밀하게 도려내어 이어붙여야 합니다.
         2) [질문과 답변을 통째로 세트 삭제]: 답변이 너무 어색하여 전면 제거해야 마땅하다면, 해당 답변 단독이 아니라 그 답변을 도출했던 직전 '질문자의 질문 구절'과 '답변자의 답변 구절'을 통째로 세트로 묶어서 하나의 단일 삭제 제안으로 처리해 한꺼번에 날리십시오.
         절대로 질문 혼자 외톨이로 남아 바로 다음 질문과 공존 및 접착되는 제안을 하지 마십시오.
      - MAJOR RULE (대명사/비문 방지): 편집 제안 범위 바로 뒤에 남아서 인접해 새로 시작되는 첫 발화의 머리가 "그게", "이게", "그", "저", "그것은", "그렇다면" 등 지시대명사나 명사로 시작하는 경우, 앞선 명확한 지시대상이 삭제되어 단절되면 앞뒤 뜻을 아예 헤아릴 수 없어 의미 전개가 붕괴합니다. 따라서 이와 같이 대명사가 들어갈 때는:
         1) 해당 대명사 문장까지 세트로 통째로 포함하여 같이 제안 구간으로 묶어 제거하거나,
         2) 아예 편집 제외 범위로 단단히 배제하여 앞 문맥(지시대상의 근원 문장)을 적극 살려두고 편집 구역을 더 안전하게 뒤로 이격시키십시오.
      - CRITICAL GUIDELINE: Do NOT restrict yourself to only suggesting cuts that perfectly add up to the target duration. Provide PLENTY of editing candidates and alternatives (aim to suggest more sections than strictly required to meet the target time, covering up to 1.5x to 2x the required duration to be cut, so the user has a rich set of options to choose from). 목표 시간을 맞추는 것보다 더 많이, 사용자에게 선택권을 넓혀주도록 아주 충분하고 풍성하게 편집 후보 구간들을 다양하게 분류해서 제안해주어야 합니다.
      - TIMESTAMP ALIGNMENT RULE: Every suggestion's 'start_time' and 'end_time' MUST align EXACTLY with the bracketed timestamp prefixes present in the script (including the 0.1-second decimal precision! e.g., 00:10.5 or 01:23.7)! For example, if the script has:
        '[00:10.2] [화자 1] 안녕하세요. [00:15.5] [화자 1] 반갑습니다.'
        and you suggest deleting '안녕하세요.', your suggestion's 'start_time' MUST be exactly '00:10.2' and 'end_time' MUST be exactly '00:15.5'. Do NOT estimate or invent arbitrary timestamps that do not appear in the script.
      - The editing should be done in "chunks" (paragraphs or meaningful sections) rather than single words/sentences. 
      - However, if a single word or sentence MUST be removed for legal/sensitivity reasons, flag it as is_fine_edit=true.
      - IMPORTANT: All text in the JSON response (reason, titles, etc.) MUST be in KOREAN (한국어).
      
      Output the analysis as a JSON object with:
      1. suggestions: Array of objects {
          id: unique string,
          start_time: string (e.g. 00:10.2 or 01:23.7),
          end_time: string (e.g. 00:15.5 or 01:25.8),
          context_before: string (1-2 sentences immediately preceding the chunk, if available),
          text_chunk: string (the exact text to be removed, or if it is silence/BGM blank/custom placeholder),
          context_after: string (1-2 sentences immediately following the chunk, if available),
          reason: string (KOREAN explanation why based on criteria),
          priority: number (1, 2, 3, or 4... or based on hierarchy),
          estimated_seconds: number (approximate time this chunk takes),
          is_fine_edit: boolean
      }
      2. total_seconds: number (estimated total length of the original script if not provided, or reflect originalSeconds)
      
      Script:
      ${script}
      
      Respond only with the JSON object.
    `;

    return runWithQuotaFallback(async (client) => {
      const response = await client.models.generateContent({
        model: model,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });
      
      const text = response.text || "{}";
      const parsed = JSON.parse(text);
      const rawSuggestions = parsed.suggestions || [];
      const verifiedSuggestions = verifyAndFilterSuggestions(rawSuggestions, script);
      
      return {
        suggestions: verifiedSuggestions,
        totalSeconds: originalSeconds || parsed.total_seconds || 0,
      };
    }).catch(error => {
      console.error("Gemini Error:", error);
      throw error;
    });
  },

  async getMoreSuggestions(
    script: string,
    existingSuggestions: EditSuggestion[],
    targetMinutes: number,
    originalSeconds?: number,
    criteria?: string,
    specialRules?: string,
    model: string = "gemini-3.5-flash"
  ): Promise<{ suggestions: EditSuggestion[] }> {
    const existingSegmentsStr = existingSuggestions
      .map((s, i) => `${i + 1}. [${s.start_time} ~ ${s.end_time}] text: "${s.text_chunk}"`)
      .join('\n');

    const prompt = `
      You are an expert broadcast editor helper.
      We need MORE editing suggestions from the script transcript that do not duplicate or overlap with the existing suggestions below.
      목표 시간에 맞추기 위해 사용자가 더 과감하거나 다양한 대안을 선택할 수 있도록, 다른 구간의 충분하고 풍성한 편집 후보 구간들을 제안해주어야 합니다.
      
      Target duration: ${targetMinutes} minutes.
      Original total duration: ${originalSeconds ? originalSeconds + ' seconds' : 'estimate from script'}.
      
      Existing Suggestions (Do NOT duplicate or overlap with these):
      ${existingSegmentsStr || 'None'}
      
      Custom Editing Criteria:
      ${criteria || `
      1. Socially sensitive content (political bias, partisan extremist views).
      2. Slander or legal risk (defaming individuals).
      3. Internal church issues or preacher's personal life not relevant to the main topic.
      4. Other unnecessary/filler redundant parts.
      `}
      
      Special Constraints (Must follow these strictly):
      ${specialRules || 'No special rules provided.'}
      
      Guidelines:
      - 🚨 FRONT/BACK SILENCE & NOISE PRIORITIZATION (파일 앞뒤 묵음/음악 우선 삭제): 파일의 맨 앞이나 맨 뒤(시작부 또는 종료부)에 내용과 성격이 무관한 장기 묵음(Silence), 노래/배경 음악(BGM), 또는 소음(환경 잡음)이 있어 내용 전개가 되지 않는 구간이 발견된다면 다른 조건들보다 최우선적인(Priority 1) 편집 삭제 대상으로 반드시 제안해야 합니다. 이때는 스크립트 대사가 존재하지 않으므로, 'text_chunk'를 비우거나 "[묵음, 노래 또는 소음 구간(대화 내용 없음)]"으로 표기하고 대용 요소를 친절하게 reason에 묘사하십시오.
      - 🚨 FINE-GRAINED SEGMENTATION (촘촘하고 짧은 구절 단위 분할): 하나의 제안 구절이 너무 길어지지 않도록, 긴 한 구절로 묶인 문장이 있다면 이를 여러 개의 작은 단위(최대 5~10초 내외 또는 짧은 문맥 단위)로 잘게 쪼개어 세밀하게 제안하도록 하십시오. 어눌한 반복이나 사족이 있을 때 통째로 30초~1분을 날리는 것 대신 그 안에서도 정밀하게 세분화해서 촘촘히 쪼개진 타임스탬프 기반으로 제안해 주어야 합니다.
      - MAJOR RULE (질문-답변 기형 구조 절대 방지): 질문자(사회자)와 답변자(초대 손님)가 번갈아 말하는 대담/대화 형식일 때, 답변을 완전히 통째로 들어내는 편집 제안을 절대 해서는 안 됩니다! 답변을 통째로 들어내면, 결과적으로 해당 질문 바로 다음에 답이 없이 바로 다음 질문(혹은 다음 질문자의 대사)이 드러나는 기형적이고 자연스럽지 못한 현상이 생깁니다. 따라서 어떤 답변 부분을 날리고 싶을 때는 오직 아래의 두 원칙 중 하나만 엄격히 따르십시오:
         1) [답변의 일부만 삭제]: 절대로 답변 전체를 날려 질문 바로 다음에 다른 질문이 인접하게 만들어서는 안 되며, 답변 전체를 날리는 대신 사회자 본연 질문의 취지에 위배되지 않도록 핵심 기둥 대답(앞부분)은 확실히 노출하여 살리고, 답변자의 마지막 장황한 사설이나 어눌한 사족 부차 설명, 혹은 어구(답변 뒷구간 일부)만 세밀하게 도려내어 이어붙여야 합니다.
         2) [질문과 답변을 통째로 세트 삭제]: 답변이 너무 어색하여 전면 제거해야 마땅하다면, 해당 답변 단독이 아니라 그 답변을 도출했던 직전 '질문자의 질문 구절'과 '답변자의 답변 구절'을 통째로 세트로 묶어서 하나의 단일 삭제 제안으로 처리해 한꺼번에 날리십시오.
         절대로 질문 혼자 외톨이로 남아 바로 다음 질문과 공존 및 접착되는 제안을 하지 마십시오.
      - MAJOR RULE (대명사/비문 방지): 편집 제안 범위 바로 뒤에 남아서 인접해 새로 시작되는 첫 발화의 머리가 "그게", "이게", "그", "저", "그것은", "그렇다면" 등 지시대명사나 명사로 시작하는 경우, 앞선 명확한 지시대상이 삭제되어 단절되면 앞뒤 뜻을 아예 헤아릴 수 없어 의미 전개가 붕괴합니다. 따라서 이와 같이 대명사가 들어갈 때는:
         1) 해당 대명사 문장까지 세트로 통째로 포함하여 같이 제안 구간으로 묶어 제거하거나,
         2) 아예 편집 제외 범위로 단단히 배제하여 앞 문맥(지시대상의 근원 문장)을 적극 살려두고 편집 구역을 더 안전하게 뒤로 이격시키십시오.
      - Suggest and discover NEW sections of transcript text to be cut. DO NOT repeat timestamps or chunks of the existing suggestions.
      - TIMESTAMP ALIGNMENT RULE: Every suggestion's 'start_time' and 'end_time' MUST align EXACTLY with the bracketed timestamp prefixes present in the script (including the 0.1-second decimal precision! e.g., 00:10.5 or 01:23.7)! For example, if the script has:
        '[00:10.2] [화자 1] 안녕하세요. [00:15.5] [화자 1] 반갑습니다.'
        and you suggest deleting '안녕하세요.', your suggestion's 'start_time' MUST be exactly '00:10.2' and 'end_time' MUST be exactly '00:15.5'. Do NOT estimate or invent arbitrary timestamps that do not appear in the script.
      - The editing should be done in "chunks" (paragraphs or meaningful sections) rather than single words/sentences.
      - However, if a single word or sentence MUST be removed for legal/sensitivity reasons, flag it as is_fine_edit=true.
      - IMPORTANT: All text in the JSON response (reason, titles, etc.) MUST be in KOREAN (한국어).
      
      Output the analysis as a JSON object with:
      {
        "suggestions": [
          {
            "id": "new_unique_id_" + random index,
            "start_time": "string (e.g. 00:10.2 or 01:23.7)",
            "end_time": "string (e.g. 00:15.5 or 01:25.8)",
            "context_before": "string (1-2 sentences immediately preceding)",
            "text_chunk": "string (exact transcript text for this new section to be removed, or if it is silence/BGM blank/custom placeholder)",
            "context_after": "string (1-2 sentences immediately following)",
            "reason": "string (KOREAN explanation of why)",
            "priority": number (1 to 4),
            "estimated_seconds": number,
            "is_fine_edit": boolean
          }
        ]
      }
      
      Script:
      ${script}
      
      Respond only with the JSON object.
    `;

    return runWithQuotaFallback(async (client) => {
      const response = await client.models.generateContent({
        model: model,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });
      
      const text = response.text || "{}";
      const parsed = JSON.parse(text);
      const rawSuggestions = parsed.suggestions || [];
      const verifiedSuggestions = verifyAndFilterSuggestions(rawSuggestions, script);
      
      return {
        suggestions: verifiedSuggestions,
      };
    }).catch(error => {
      console.error("Gemini More Suggestions Error:", error);
      throw error;
    });
  },

  async generateFinalResults(
    script: string, 
    finalEdits: EditSuggestion[],
    model: string = "gemini-3.5-flash"
  ): Promise<{
    thumbnailTitles: string[];
    shortsSegment: { start: string, end: string, text: string, title: string };
  }> {
    const prompt = `
      Based on this edited script summary, generate:
      1. 5 YouTube thumbnail titles. They should be shocking, attention-grabbing, and provocative. 
      2. One highly impactful "Shorts" segment (15-60 seconds equivalent) from the script. 
      3. Include start/end time, the exact text extracted directly from the original script without any summarization or paraphrasing (토씨 하나 틀리지 않고 원본 그대로 추출), and a recommended title for the Shorts.
      
      IMPORTANT: All generated text MUST be in KOREAN (한국어).
      
      Script Content Summary/Context:
      ${script.substring(0, 3000)}...
      
      (Selected Edits to exclude: ${JSON.stringify(finalEdits.map(e => e.text_chunk))})

      Output as JSON:
      {
        "thumbnailTitles": ["...", "...", ...],
        "shortsSegment": { "start": "...", "end": "...", "text": "...", "title": "..." }
      }
    `;

    return runWithQuotaFallback(async (client) => {
      const response = await client.models.generateContent({
        model: model,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });
      
      const text = response.text || "{}";
      return JSON.parse(text);
    }).catch(error => {
      console.error("Gemini Error:", error);
      throw error;
    });
  },

  async transcribeAudio(file: File, model: string = "gemini-3.5-flash"): Promise<string> {
    const reader = new FileReader();
    const base64Promise = new Promise<string>((resolve, reject) => {
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    const base64Data = await base64Promise;

    // Resolve mimeType to a Gemini-compatible format
    let mimeType = file.type || "";
    const extension = file.name.split('.').pop()?.toLowerCase();

    if (extension === "wav") {
      mimeType = "audio/wav";
    } else if (extension === "mp3") {
      mimeType = "audio/mp3";
    } else if (extension === "m4a") {
      mimeType = "audio/m4a";
    } else if (extension === "ogg") {
      mimeType = "audio/ogg";
    } else if (extension === "flac") {
      mimeType = "audio/flac";
    } else if (extension === "aac") {
      mimeType = "audio/aac";
    } else if (extension === "webm" || extension === "weba") {
      mimeType = "audio/webm";
    } else if (mimeType.includes("wav") || mimeType.includes("wave") || mimeType.includes("x-wav")) {
      mimeType = "audio/wav";
    } else if (mimeType.includes("mp3") || mimeType.includes("mpeg")) {
      mimeType = "audio/mp3";
    } else if (mimeType.includes("m4a") || mimeType.includes("x-m4a")) {
      mimeType = "audio/m4a";
    } else if (mimeType.includes("ogg")) {
      mimeType = "audio/ogg";
    } else if (mimeType.includes("flac") || mimeType.includes("x-flac")) {
      mimeType = "audio/flac";
    } else if (mimeType.includes("aac")) {
      mimeType = "audio/aac";
    } else if (mimeType.includes("webm")) {
      mimeType = "audio/webm";
    } else {
      mimeType = "audio/mp3"; // default fallback
    }

    return runWithQuotaFallback(async (client) => {
      const response = await client.models.generateContent({
        model: model,
        contents: [
          {
            role: "user",
            parts: [
              {
                text: "Please transcribe this audio file accurately in Korean. To ensure precise editing timeline mapping, you MUST insert a timestamp with 0.1-second precision in the bracket format like '[MM:SS.S]' (e.g. [00:04.2], [01:23.7]) at the beginning of EVERY SINGLE sentence, or even clause when a speaker pauses. If the audio is an interview, dialogue, panel talk, Q&A, or has multiple participants speaking, you MUST clearly distinguish between them by identifying and prepending speaker labels. For example: '[00:00.0] [질문자] 오늘 날씨가 아주 좋네요. [00:03.2] [답변자] 맞습니다, 산책하기 좋습니다. [00:07.8] [답변자] 같이 걸으실까요?' Place timestamps strictly at the beginning of virtually every single sentence with 0.1-second decimal precision. Do not skip any sentence without a timestamp prefix. 또한, 하나의 한글 구절이나 화자의 발언 마디가 너무 길어지지 않도록, 연속된 발언이더라도 약 5~10초 간격 또는 의미 있는 절(Clause) 단위로 촘촘하고 잘게 쪼개어 각각 고유의 타임스탬프를 줄바꿈과 함께 기입하여 주세요. 한 구절만으로 10~15초 이상 타임스탬프 없이 지나가지 않도록 매우 조밀하고 촘촘하게 타임라인 자막 목록을 분절 형식으로 생성하는 것이 핵심입니다. This extreme spacing density allows precise sentence-by-sentence timeline editing. Deliver only the transcribed Korean text with these dense timestamps. Do not output metadata or custom tags like [Speech] or [Music]."
              },
              {
                inlineData: {
                  mimeType: mimeType,
                  data: base64Data
                }
              }
            ]
          }
        ]
      });

      return response.text || "";
    }).catch(error => {
      console.error("Transcribe Error:", error);
      throw error;
    });
  }
};
