/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Scissors, 
  Clock, 
  Trash2, 
  CheckCircle2, 
  Download, 
  RefreshCcw, 
  Video, 
  Layout, 
  ChevronRight,
  AlertTriangle,
  Play,
  Square,
  FileText,
  Upload,
  FileAudio,
  Key,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { geminiService } from './services/geminiService';
import { EditSuggestion } from './types';
import { cn } from './lib/utils';

type AppState = 'input-script' | 'input-criteria' | 'analyzing' | 'editing' | 'speed-adjust' | 'results';

const DEFAULT_CRITERIA = `1. 사회적인 물의를 일으킬 수 있는 민감한 내용 (특히 동성애나 현실 정치의 특정 진영에 관한 내용)
2. 특정 개인을 비방하는 내용 (방송이 될 경우 법적 부담을 질 수도 있는 내용)
3. 전체 내용과 큰 관련이 없는 개별 교회 내부적인 내용, 혹은 설교자의 사생활과 관련한 내용
4. 비슷한 내용이 반복되면 그 중에 설명이 부족하거나 어눌한 부분
5. 1인의 설교가 아닌 대담 형식이라면 답변에서 문제가 될 경우 필요시엔 질문까지 함께 편집 고려
6. 파일의 맨 앞이나 맨 뒤(시작부 또는 종료부)에 내용과 성격이 무관한 장기 묵음(Silence), 노래/배경 음악(BGM), 또는 소음(환경 잡음)이 발생하여 내용 전개가 되지 않는 구간 (해당 부분은 삭제 최우선 대상이며 자막이 표현되지 않음)
7. 그밖에 흐름상 불필요한 내용`;

const GOLDEN_RULES = `[편집의 대원칙]
1. 배경 음악이 있는 부분은 일부를 잘라내면 연결이 매끄럽지 않기 때문에 편집하면 안됨.
2. 편집할 때는 문장이 끝나는 부분, 혹은 말을 멈추는 부분 등에서 편집해서 편집 후에도 자연스럽게 연결이 되도록 해야 함.
3. 편집 제안한 부분을 삭제한 뒤에 앞뒤의 내용이 자연스럽게 연결되는지 확인
4. 자연스러운 연결을 위해 추가 편집해야 하는 부분이 있다면 편집 제안할 때 그 부분을 포함해서 제안
5. 대담 형식에서 답변을 편집하고 나면 질문 다음에 답이 없이 다시 질문이 나오게 되는 경우가 있는데 그런 경우는 피해야 함.`;

function formatSecsToDecimal(s: string): string {
  const num = parseFloat(s);
  const rounded = Math.round(num * 10) / 10;
  const split = rounded.toFixed(1).split('.');
  return `${split[0].padStart(2, '0')}.${split[1]}`;
}

// Normalize script structure to insert newlines before every timestamp
// and guarantee unified bracket formatting [MM:SS.S] or [HH:MM:SS.S]
function normalizeScript(rawScript: string): string {
  if (!rawScript) return "";
  
  // Replace carriage returns and handle backslashes
  let processed = rawScript.replace(/\r\n/g, '\n');
  
  // Detect various formatted timestamps, with or without brackets, and pad them correctly
  // Examples: [00:44.2], [1:23:45.6], (00:44.1), [ 00:44 ], 00:44
  const tsRegex = /(?:\[|\()?\s*(?:(\d{1,2}):)?(\d{1,2}):(\d{2}(?:\.\d+)?)\s*(?:\]|\))?/g;
  
  processed = processed.replace(tsRegex, (match, h, m, s) => {
    const hours = h ? h + ':' : '';
    const minutes = m.padStart(2, '0');
    const seconds = formatSecsToDecimal(s);
    return `\n[${hours}${minutes}:${seconds}] `;
  });
  
  // Clean redundant newlines and whitespace
  return processed
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join('\n');
}

function parseTimeToSeconds(timeStr: string): number {
  if (!timeStr) return 0;
  const clean = timeStr.replace(/[\[\]]/g, '').trim();
  const parts = clean.split(':').map(Number);
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  } else {
    return Number(clean) || 0;
  }
}

// Client Side WAV Encoder
function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numOfChan = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // raw LPCM
  const bitDepth = 16;
  
  let result;
  if (numOfChan === 2) {
    result = interleave(buffer.getChannelData(0), buffer.getChannelData(1));
  } else {
    result = buffer.getChannelData(0);
  }
  
  const bufferLen = result.length * 2;
  const wavBuffer = new ArrayBuffer(44 + bufferLen);
  const view = new DataView(wavBuffer);
  
  /* RIFF identifier */
  writeString(view, 0, 'RIFF');
  /* file length */
  view.setUint32(4, 36 + bufferLen, true);
  /* RIFF type */
  writeString(view, 8, 'WAVE');
  /* format chunk identifier */
  writeString(view, 12, 'fmt ');
  /* format chunk length */
  view.setUint32(16, 16, true);
  /* sample format (raw PCM) */
  view.setUint16(20, format, true);
  /* channel count */
  view.setUint16(22, numOfChan, true);
  /* sample rate */
  view.setUint32(24, sampleRate, true);
  /* byte rate (sample rate * block align) */
  view.setUint32(28, sampleRate * numOfChan * (bitDepth / 8), true);
  /* block align (channel count * bytes per sample) */
  view.setUint16(32, numOfChan * (bitDepth / 8), true);
  /* bits per sample */
  view.setUint16(34, bitDepth, true);
  /* data chunk identifier */
  writeString(view, 36, 'data');
  /* data chunk length */
  view.setUint32(40, bufferLen, true);
  
  floatTo16BitPCM(view, 44, result);
  
  return new Blob([view.buffer], { type: 'audio/wav' });
}

function interleave(inputL: Float32Array, inputR: Float32Array): Float32Array {
  const length = inputL.length + inputR.length;
  const result = new Float32Array(length);
  let index = 0;
  let inputIndex = 0;
  
  while (index < length) {
    result[index++] = inputL[inputIndex];
    result[index++] = inputR[inputIndex];
    inputIndex++;
  }
  return result;
}

function floatTo16BitPCM(output: DataView, offset: number, input: Float32Array) {
  for (let i = 0; i < input.length; i++, offset += 2) {
    let s = Math.max(-1, Math.min(1, input[i]));
    output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

function downsampleAudioBufferToMono16kHz(audioBuffer: AudioBuffer, targetSampleRate: number = 16000): Float32Array {
  const numChannels = audioBuffer.numberOfChannels;
  const originalSampleRate = audioBuffer.sampleRate;
  
  let monoData: Float32Array;
  if (numChannels === 1) {
    monoData = audioBuffer.getChannelData(0);
  } else {
    const left = audioBuffer.getChannelData(0);
    const right = audioBuffer.getChannelData(1);
    const len = left.length;
    monoData = new Float32Array(len);
    for (let i = 0; i < len; i++) {
      monoData[i] = (left[i] + right[i]) / 2;
    }
  }
  
  if (originalSampleRate === targetSampleRate) {
    return monoData;
  }
  
  const ratio = originalSampleRate / targetSampleRate;
  const newLength = Math.round(monoData.length / ratio);
  const result = new Float32Array(newLength);
  
  for (let i = 0; i < newLength; i++) {
    const nextOffset = i * ratio;
    const index = Math.floor(nextOffset);
    const fraction = nextOffset - index;
    const nextIndex = Math.min(index + 1, monoData.length - 1);
    
    result[i] = (1 - fraction) * monoData[index] + fraction * monoData[nextIndex];
  }
  
  return result;
}

function encodeMono16BitWav(pcmData: Float32Array, sampleRate: number = 16000): Blob {
  const bufferLen = pcmData.length * 2;
  const wavBuffer = new ArrayBuffer(44 + bufferLen);
  const view = new DataView(wavBuffer);
  
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + bufferLen, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // raw PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 1 * 2, true);
  view.setUint16(32, 1 * 2, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, 'data');
  view.setUint32(40, bufferLen, true);
  
  floatTo16BitPCM(view, 44, pcmData);
  
  return new Blob([view.buffer], { type: 'audio/wav' });
}

function loadLameJs(): Promise<any> {
  return new Promise((resolve, reject) => {
    if ((window as any).lamejs) {
      resolve((window as any).lamejs);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/lamejs/1.2.1/lame.min.js';
    script.onload = () => {
      resolve((window as any).lamejs);
    };
    script.onerror = () => {
      reject(new Error('lamejs 라이브러리를 로드하지 못했습니다.'));
    };
    document.head.appendChild(script);
  });
}

function audioBufferToMp3Async(
  buffer: AudioBuffer,
  lamejsInstance: any,
  onProgress: (percent: number) => void
): Promise<Blob> {
  return new Promise((resolve) => {
    const channels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const kbps = 128; // standard kbps
    const mp3encoder = new lamejsInstance.Mp3Encoder(channels, sampleRate, kbps);
    const mp3Data: any[] = [];
    
    // Process in blocks of size 1152
    const sampleBlockSize = 1152;
    // Process multiple blocks of sampleBlockSize per tick to balance speed and UI responsiveness
    const tickChunks = 200; 
    
    if (channels === 1) {
      const samples = buffer.getChannelData(0);
      const len = samples.length;
      const samplesInt16 = new Int16Array(len);
      for (let i = 0; i < len; i++) {
        const s = Math.max(-1, Math.min(1, samples[i]));
        samplesInt16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
      }
      
      let offset = 0;
      function encodeTick() {
        const end = Math.min(offset + sampleBlockSize * tickChunks, len);
        for (let i = offset; i < end; i += sampleBlockSize) {
          const chunk = samplesInt16.subarray(i, i + sampleBlockSize);
          const mp3buf = mp3encoder.encodeBuffer(chunk);
          if (mp3buf.length > 0) {
            mp3Data.push(mp3buf);
          }
        }
        offset = end;
        const pct = Math.floor((offset / len) * 100);
        onProgress(pct);
        
        if (offset < len) {
          setTimeout(encodeTick, 0); // yield control to main UI thread
        } else {
          const mp3buf = mp3encoder.flush();
          if (mp3buf.length > 0) {
            mp3Data.push(mp3buf);
          }
          resolve(new Blob(mp3Data, { type: 'audio/mp3' }));
        }
      }
      encodeTick();
    } else {
      // Stereo
      const samplesL = buffer.getChannelData(0);
      const samplesR = buffer.numberOfChannels > 1 ? buffer.getChannelData(1) : buffer.getChannelData(0);
      const len = samplesL.length;
      
      const samplesLInt16 = new Int16Array(len);
      const samplesRInt16 = new Int16Array(len);
      
      for (let i = 0; i < len; i++) {
        const sL = Math.max(-1, Math.min(1, samplesL[i]));
        samplesLInt16[i] = sL < 0 ? sL * 0x8000 : sL * 0x7FFF;
        
        const sR = Math.max(-1, Math.min(1, samplesR[i]));
        samplesRInt16[i] = sR < 0 ? sR * 0x8000 : sR * 0x7FFF;
      }
      
      let offset = 0;
      function encodeTick() {
        const end = Math.min(offset + sampleBlockSize * tickChunks, len);
        for (let i = offset; i < end; i += sampleBlockSize) {
          const leftChunk = samplesLInt16.subarray(i, i + sampleBlockSize);
          const rightChunk = samplesRInt16.subarray(i, i + sampleBlockSize);
          const mp3buf = mp3encoder.encodeBuffer(leftChunk, rightChunk);
          if (mp3buf.length > 0) {
            mp3Data.push(mp3buf);
          }
        }
        offset = end;
        const pct = Math.floor((offset / len) * 100);
        onProgress(pct);
        
        if (offset < len) {
          setTimeout(encodeTick, 0); // yield control to main UI thread
        } else {
          const mp3buf = mp3encoder.flush();
          if (mp3buf.length > 0) {
            mp3Data.push(mp3buf);
          }
          resolve(new Blob(mp3Data, { type: 'audio/mp3' }));
        }
      }
      encodeTick();
    }
  });
}

function secondsToTimeStr(totalSecs: number): string {
  const positiveSecs = Math.max(0, totalSecs);
  const hrs = Math.floor(positiveSecs / 3600);
  const mins = Math.floor((positiveSecs % 3600) / 60);
  
  const secsFormatted = (positiveSecs % 60).toFixed(1);
  const [wholeSecs, frac] = secsFormatted.split('.');
  const padWhole = wholeSecs.padStart(2, '0');
  
  if (hrs > 0) {
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${padWhole}.${frac}`;
  }
  return `${String(mins).padStart(2, '0')}:${padWhole}.${frac}`;
}

/**
 * High-quality WSOLA (Waveform Similarity Overlap-Add) pitch-preserving time-domain vocoder for speech speed scaling.
 * Finds the optimal overlap offset (delta) using sum of absolute differences (SAD) to align soundwaves perfectly,
 * completely preventing the robotic/metallic phase-cancellation and keeping the perfect natural voice characteristics.
 */
function timeStretch(audioBuffer: AudioBuffer, rate: number, audioCtx: AudioContext): AudioBuffer {
  if (Math.abs(rate - 1.0) < 0.005) return audioBuffer;
  
  const numChannels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const numSamples = audioBuffer.length;
  
  // WSOLA Parameters
  // A frame size of 1024 (approx 23ms at 44.1kHz) is ideal for tracking standard human speech frequencies.
  const W = 1024;
  const H = 512; // Hop size (overlap is W - H = 512)
  const searchRange = 256; // Standard search range for best-match correlation alignment
  
  const destLength = Math.max(100, Math.floor(numSamples / rate));
  const stretchedBuffer = audioCtx.createBuffer(numChannels, destLength, sampleRate);
  
  // Cache channel access arrays
  const inputChannels: Float32Array[] = [];
  const outputChannels: Float32Array[] = [];
  for (let c = 0; c < numChannels; c++) {
    inputChannels.push(audioBuffer.getChannelData(c));
    outputChannels.push(stretchedBuffer.getChannelData(c));
  }
  
  // Symmetric raised-cosine fade window for smooth linear blending of overlaps
  const fade = new Float32Array(H);
  for (let i = 0; i < H; i++) {
    fade[i] = 0.5 * (1 - Math.cos((Math.PI * i) / (H - 1)));
  }
  
  // Keep track of the active overlap templates for each channel
  const overlapBuffers: Float32Array[] = [];
  for (let c = 0; c < numChannels; c++) {
    overlapBuffers.push(new Float32Array(H));
  }
  
  // Seed first segment directly
  for (let c = 0; c < numChannels; c++) {
    const input = inputChannels[c];
    const output = outputChannels[c];
    const copyLen = Math.min(W, destLength, numSamples);
    for (let i = 0; i < copyLen; i++) {
      output[i] = input[i];
    }
    // Record first trailing overlap template
    for (let i = 0; i < H; i++) {
      const idx = H + i;
      overlapBuffers[c][i] = idx < numSamples ? input[idx] : 0;
    }
  }
  
  let outPos = H;
  
  // Use the primary/first channel (left or mono) for pitch period tracking alignment search
  // to maintain absolute phase synchrony across stereo channels without audio panning drift.
  const searchChan = inputChannels[0];
  
  while (outPos + W < destLength) {
    // Ideal theoretical input target position without alignment
    const inTarget = Math.round(outPos * rate);
    
    // WSOLA Alignment search: search for the optimal shift 'delta' in range [-searchRange, searchRange]
    // that minimizes Wav similarity difference (SAD) with the previously generated output's trailing segment.
    let bestDelta = 0;
    let minSAD = Infinity;
    
    const template = overlapBuffers[0]; // Reference overlap from previous window
    const startDelta = -searchRange;
    const endDelta = searchRange;
    
    for (let delta = startDelta; delta <= endDelta; delta++) {
      const candidatePos = inTarget + delta;
      if (candidatePos < 0 || candidatePos + W >= numSamples) continue;
      
      let sad = 0;
      // Index stride of 4 for highly optimal speed during execution in the browser thread
      for (let i = 0; i < H; i += 4) {
        sad += Math.abs(searchChan[candidatePos + i] - template[i]);
      }
      
      if (sad < minSAD) {
        minSAD = sad;
        bestDelta = delta;
      }
    }
    
    const alignedInPos = inTarget + bestDelta;
    
    // Multi-channel overlap add utilizing the synchronized alignment shift 'bestDelta'
    for (let c = 0; c < numChannels; c++) {
      const input = inputChannels[c];
      const output = outputChannels[c];
      const overlapBuf = overlapBuffers[c];
      
      const realInPos = (alignedInPos >= 0 && alignedInPos + W < numSamples) 
        ? alignedInPos 
        : Math.min(numSamples - W - 1, Math.max(0, inTarget)); // Fallback if near boundaries
        
      // Blend current overlap region using the smooth raised cosine window
      for (let i = 0; i < H; i++) {
        const w = fade[i];
        output[outPos + i] = overlapBuf[i] * (1 - w) + input[realInPos + i] * w;
      }
      
      // Write remainder non-overlapped part of the window
      for (let i = H; i < W; i++) {
        output[outPos + i] = input[realInPos + i];
      }
      
      // Buffer the next trailing segment to serve as template for the next window
      for (let i = 0; i < H; i++) {
        overlapBuf[i] = input[realInPos + H + i];
      }
    }
    
    outPos += H;
  }
  
  return stretchedBuffer;
}

export default function App() {
  const [appState, setAppState] = useState<AppState>('input-script');
  const [script, setScript] = useState('');
  
  // Target
  const [targetMinutes, setTargetMinutes] = useState(15);
  const [targetSecondsInput, setTargetSecondsInput] = useState(0);
  
  // Original (Optional)
  const [originalMinutes, setOriginalMinutes] = useState<number | ''>('');
  const [originalSeconds, setOriginalSeconds] = useState<number | ''>('');

  // Criteria & Rules
  const [criteria, setCriteria] = useState(DEFAULT_CRITERIA);
  const [mustDelete, setMustDelete] = useState('');
  const [mustKeep, setMustKeep] = useState('');

  const [suggestions, setSuggestions] = useState<EditSuggestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [decisions, setDecisions] = useState<Record<string, boolean>>({});
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [results, setResults] = useState<{
    thumbnailTitles: string[];
    shortsSegment: { start: string, end: string, text: string, title: string };
  } | null>(null);
  const [isGeneratingShorts, setIsGeneratingShorts] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [uploadedAudioFile, setUploadedAudioFile] = useState<File | null>(null);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [outputAudioFormat, setOutputAudioFormat] = useState<'wav' | 'mp3'>('wav');
  const [encodingProgress, setEncodingProgress] = useState<number | null>(null);
  const [isRequestingMore, setIsRequestingMore] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Speed Adjustment states
  const [isSpeedAdjustEnabled, setIsSpeedAdjustEnabled] = useState(false);
  const [playbackRateFactor, setPlaybackRateFactor] = useState(1.0);

  // Gemini API Key fallback states
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState(() => (typeof window !== 'undefined' ? localStorage.getItem('user_gemini_api_key') || '' : ''));
  const [hasCustomKey, setHasCustomKey] = useState(() => (typeof window !== 'undefined' ? !!localStorage.getItem('user_gemini_api_key') : false));

  const handleSaveApiKey = (key: string) => {
    const trimmed = key.trim();
    if (trimmed) {
      localStorage.setItem('user_gemini_api_key', trimmed);
      setHasCustomKey(true);
    } else {
      localStorage.removeItem('user_gemini_api_key');
      setHasCustomKey(false);
    }
    setApiKeyInput(trimmed);
    setIsApiKeyModalOpen(false);
    alert('개인 API Key가 등록 및 저장되었습니다.');
  };

  const handleClearApiKey = () => {
    localStorage.removeItem('user_gemini_api_key');
    setApiKeyInput('');
    setHasCustomKey(false);
    setIsApiKeyModalOpen(false);
    alert('개인 API Key가 성공적으로 제거되었습니다. 공용 할당량(Quota)을 다시 사용합니다.');
  };

  const handleGeminiError = (error: any, fallbackMessage: string) => {
    console.error("Gemini Error Caught:", error);
    if (error?.message === "QUOTA_EXHAUSTED_NO_KEY") {
      alert("기본 공용 할당량(Quota)이 부족합니다.\n계속 진행을 원하시면 보유하고 계신 Gemini API Key를 등록하여 이용해 주십시오.");
      setIsApiKeyModalOpen(true);
    } else if (error?.message?.startsWith("CUSTOM_KEY_FAILED")) {
      const errMsg = error.message.replace("CUSTOM_KEY_FAILED:", "");
      alert(`입력하신 개인 API Key가 올바르지 않거나 호출 중 오류가 발생했습니다.\n오류 정보: ${errMsg}`);
      setIsApiKeyModalOpen(true);
    } else {
      const errorDetail = (error && typeof error === 'object' && error.message) ? error.message : String(error);
      alert(`${fallbackMessage}\n상세 에러: ${errorDetail}`);
    }
  };

  // Convert full script to structured phrase sequence with timestamps
  const transcriptPhrases = useMemo(() => {
    const normalized = normalizeScript(script);
    if (!normalized) return [];
    
    const lines = normalized.split('\n');
    const result: { index: number; seconds: number; timeStr: string; text: string }[] = [];
    
    // Pattern to match regulated header timestamp: [00:44.2] or [01:23:45.6]
    const headerTsRegex = /^\[(?:(\d{1,2}):)?(\d{2}):(\d{2}(?:\.\d+)?)\]/;
    let currentSec = 0;
    let phraseId = 0;
    
    lines.forEach((line) => {
      const match = headerTsRegex.exec(line);
      let seconds = currentSec;
      let timeStr = secondsToTimeStr(currentSec);
      let cleanText = line;
      
      if (match) {
        const hours = match[1] ? parseInt(match[1]) : 0;
        const minutes = parseInt(match[2]);
        const secs = parseFloat(match[3]);
        seconds = (hours * 3600) + (minutes * 60) + secs;
        timeStr = secondsToTimeStr(seconds);
        cleanText = line.replace(headerTsRegex, '').trim().replace(/^[:\-\s\>]+/, '').trim();
        currentSec = seconds;
      }
      
      if (cleanText.length > 0) {
        result.push({
          index: phraseId++,
          seconds,
          timeStr,
          text: cleanText,
        });
      }
    });
    
    return result;
  }, [script]);

  // Audio Context & Playback States for Preview
  const [decodedAudioBuffer, setDecodedAudioBuffer] = useState<AudioBuffer | null>(null);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const [activePlaybackSource, setActivePlaybackSource] = useState<AudioBufferSourceNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Auto clean up playback when suggestion index or mode changes
  useEffect(() => {
    if (activePlaybackSource) {
      try {
        activePlaybackSource.stop();
      } catch (e) {}
      setActivePlaybackSource(null);
      setIsPreviewPlaying(false);
    }
  }, [currentIndex, appState]);

  // Find index of the phrase matching the given time
  const findPhraseIndexByTime = (timeStr: string, phrases: typeof transcriptPhrases) => {
    const secs = parseTimeToSeconds(timeStr);
    let closestIndex = 0;
    let minDiff = Infinity;
    for (let i = 0; i < phrases.length; i++) {
      const diff = Math.abs(phrases[i].seconds - secs);
      if (diff < minDiff) {
        minDiff = diff;
        closestIndex = i;
      }
    }
    return closestIndex;
  };

  const getPhraseDuration = (i: number, phrases: typeof transcriptPhrases, fileDuration: number) => {
    if (i < 0 || i >= phrases.length) return 0;
    const start = phrases[i].seconds;
    const end = (i + 1 < phrases.length) ? phrases[i + 1].seconds : fileDuration;
    return end - start;
  };

  const resolveDeletedAndRetainedIndices = (s: any, phrases: typeof transcriptPhrases) => {
    if (!s || phrases.length === 0) return { startIdx: -1, endIdx: -1, firstRetainedIdx: -1 };
    
    const startIdx = findPhraseIndexByTime(s.start_time, phrases);
    const matchEndIdx = findPhraseIndexByTime(s.end_time, phrases);
    
    let firstRetainedIdx = matchEndIdx;
    if (s.text_chunk && matchEndIdx < phrases.length) {
      const phraseText = phrases[matchEndIdx].text;
      const cleanPhrase = phraseText.replace(/[\s\r\n\t\.\,\!\?\(\)\[\]\'\"]/g, '');
      const cleanChunk = s.text_chunk.replace(/[\s\r\n\t\.\,\!\?\(\)\[\]\'\"]/g, '');
      
      if (cleanPhrase.length > 0 && cleanChunk.includes(cleanPhrase)) {
        firstRetainedIdx = matchEndIdx + 1;
      }
    }
    
    const endIdx = Math.max(startIdx, firstRetainedIdx - 1);
    return { startIdx, endIdx, firstRetainedIdx };
  };

  // Adjust suggestion bounds phrase unit-by-unit (guarantees text_chunk matching)
  const handleAdjustPhrase = (boundary: 'start' | 'end', direction: 'prev' | 'next') => {
    if (transcriptPhrases.length === 0) return;
    
    setSuggestions(prev => prev.map((s, idx) => {
      if (idx !== currentIndex) return s;
      
      const { startIdx, endIdx } = resolveDeletedAndRetainedIndices(s, transcriptPhrases);
      
      let nextStartIdx = startIdx;
      let nextEndIdx = endIdx;
      
      if (boundary === 'start') {
        const delta = direction === 'prev' ? -1 : 1;
        nextStartIdx = Math.max(0, Math.min(endIdx, startIdx + delta));
      } else {
        const delta = direction === 'prev' ? -1 : 1;
        nextEndIdx = Math.max(startIdx, Math.min(transcriptPhrases.length - 1, endIdx + delta));
      }
      
      const newStartPhrase = transcriptPhrases[nextStartIdx];
      const newEndPhrase = transcriptPhrases[nextEndIdx];
      
      const newStartStr = newStartPhrase.timeStr;
      
      const nextRetIdx = nextEndIdx + 1;
      const newEndStr = (nextRetIdx < transcriptPhrases.length)
        ? transcriptPhrases[nextRetIdx].timeStr
        : secondsToTimeStr(Math.ceil(decodedAudioBuffer ? decodedAudioBuffer.duration : newEndPhrase.seconds + 5));
      
      // Exact context-slice re-computation of text_chunk directly from source phrases array
      const activePhrases = transcriptPhrases.slice(nextStartIdx, nextEndIdx + 1);
      const newTextChunk = activePhrases.map(p => `[${p.timeStr}] ${p.text}`).join('\n');
      
      const nextRetSecs = (nextRetIdx < transcriptPhrases.length)
        ? transcriptPhrases[nextRetIdx].seconds
        : (decodedAudioBuffer ? decodedAudioBuffer.duration : newEndPhrase.seconds + 5);
      const newEstimatedSecs = Math.max(0, nextRetSecs - newStartPhrase.seconds);
      
      // Dynamically calculate adjusted context_before and context_after based on new idx
      const contextBeforePhrases = transcriptPhrases.slice(Math.max(0, nextStartIdx - 3), nextStartIdx);
      const newContextBefore = contextBeforePhrases.map(p => p.text).join(' ');

      const contextAfterPhrases = transcriptPhrases.slice(nextEndIdx + 1, Math.min(transcriptPhrases.length, nextEndIdx + 4));
      const newContextAfter = contextAfterPhrases.map(p => p.text).join(' ');

      return {
        ...s,
        start_time: newStartStr,
        end_time: newEndStr,
        text_chunk: newTextChunk,
        estimated_seconds: newEstimatedSecs,
        context_before: newContextBefore,
        context_after: newContextAfter,
        custom_rA_start: undefined,
        custom_rA_end: undefined,
        custom_rB_start: undefined,
        custom_rB_end: undefined
      };
    }));
  };

  const handleDirectTimeInput = (field: 'start' | 'end', value: string) => {
    setSuggestions(prev => prev.map((s, idx) => {
      if (idx !== currentIndex) return s;
      const isFieldStart = field === 'start';
      const nextVal = value;
      
      let updated = { ...s };
      if (isFieldStart) {
        updated.start_time = nextVal;
      } else {
        updated.end_time = nextVal;
      }

      delete updated.custom_rA_start;
      delete updated.custom_rA_end;
      delete updated.custom_rB_start;
      delete updated.custom_rB_end;

      const tL = parseTimeToSeconds(updated.start_time);
      const tR = parseTimeToSeconds(updated.end_time);
      if (tR >= tL) {
        updated.estimated_seconds = tR - tL;

        const { startIdx, endIdx } = resolveDeletedAndRetainedIndices(updated, transcriptPhrases);
        const activePhrases = transcriptPhrases.slice(startIdx, endIdx + 1);
        if (activePhrases.length > 0) {
          updated.text_chunk = activePhrases.map(p => `[${p.timeStr}] ${p.text}`).join('\n');
        }
      }
      return updated;
    }));
  };

  // Helper to retrieve the current fine-tuned (or default) preview boundaries
  const getPreviewRangeBounds = (s: any) => {
    if (!s) return { rA_start: 0, rA_end: 0, rB_start: 0, rB_end: 0 };
    const { startIdx, firstRetainedIdx } = resolveDeletedAndRetainedIndices(s, transcriptPhrases);
    const fileDuration = decodedAudioBuffer ? decodedAudioBuffer.duration : 1000;

    // Use custom fine-tuned bounds if saved in suggestion
    if (
      s.custom_rA_start !== undefined &&
      s.custom_rA_end !== undefined &&
      s.custom_rB_start !== undefined &&
      s.custom_rB_end !== undefined
    ) {
      return {
        rA_start: s.custom_rA_start,
        rA_end: s.custom_rA_end,
        rB_start: s.custom_rB_start,
        rB_end: s.custom_rB_end
      };
    }

    // Default calculations (no cushions)
    let rB_start = fileDuration;
    let rB_end = fileDuration;
    if (firstRetainedIdx < transcriptPhrases.length && firstRetainedIdx >= 0) {
      const p1_idx = firstRetainedIdx;
      const p1_dur = getPhraseDuration(p1_idx, transcriptPhrases, fileDuration);
      
      let nextPhrasesCount = 1;
      if (p1_dur < 5.0 && p1_idx + 1 < transcriptPhrases.length) {
        nextPhrasesCount = 2;
      }
      
      rB_start = transcriptPhrases[firstRetainedIdx].seconds;
      const lastEndIdx = firstRetainedIdx + nextPhrasesCount;
      rB_end = (lastEndIdx < transcriptPhrases.length) 
        ? transcriptPhrases[lastEndIdx].seconds 
        : fileDuration;
    } else {
      rB_start = parseTimeToSeconds(s.end_time);
      rB_end = Math.min(fileDuration, rB_start + 10);
    }

    let rA_start = 0;
    let rA_end = rB_start;
    if (startIdx > 0 && transcriptPhrases.length > 0) {
      const p1_idx = startIdx - 1;
      const p1_dur = getPhraseDuration(p1_idx, transcriptPhrases, fileDuration);
      
      let prevPhrasesCount = 1;
      if (p1_dur < 5.0 && startIdx - 2 >= 0) {
        prevPhrasesCount = 2;
      }
      
      rA_start = transcriptPhrases[startIdx - prevPhrasesCount].seconds;
      rA_end = transcriptPhrases[startIdx].seconds;
    } else if (startIdx === 0 && transcriptPhrases.length > 0) {
      rA_start = 0;
      rA_end = transcriptPhrases[0].seconds;
    } else {
      rA_end = parseTimeToSeconds(s.start_time);
      rA_start = Math.max(0, rA_end - 10);
    }

    return { rA_start, rA_end, rB_start, rB_end };
  };

  const handleAdjustCustomSeconds = (boundType: 'rA_start' | 'rA_end' | 'rB_start' | 'rB_end', delta: number) => {
    setSuggestions(prev => prev.map((s, idx) => {
      if (idx !== currentIndex) return s;
      const fileDuration = decodedAudioBuffer ? decodedAudioBuffer.duration : 9999;
      
      const bounds = getPreviewRangeBounds(s);
      let nextVal = bounds[boundType] + delta;
      if (nextVal < 0) nextVal = 0;
      if (nextVal > fileDuration) nextVal = fileDuration;
      
      let updatedBounds = { ...bounds, [boundType]: Math.round(nextVal * 10) / 10 };
      
      if (boundType === 'rA_start') {
        updatedBounds.rA_start = Math.min(updatedBounds.rA_start, updatedBounds.rA_end);
      } else if (boundType === 'rA_end') {
        updatedBounds.rA_end = Math.max(updatedBounds.rA_start, Math.min(updatedBounds.rA_end, updatedBounds.rB_start));
      } else if (boundType === 'rB_start') {
        updatedBounds.rB_start = Math.max(updatedBounds.rA_end, Math.min(updatedBounds.rB_start, updatedBounds.rB_end));
      } else if (boundType === 'rB_end') {
        updatedBounds.rB_end = Math.max(updatedBounds.rB_start, updatedBounds.rB_end);
      }

      const newEstimatedSecs = Math.max(0, updatedBounds.rB_start - updatedBounds.rA_end);

      return {
        ...s,
        custom_rA_start: updatedBounds.rA_start,
        custom_rA_end: updatedBounds.rA_end,
        custom_rB_start: updatedBounds.rB_start,
        custom_rB_end: updatedBounds.rB_end,
        estimated_seconds: newEstimatedSecs,
        start_time: secondsToTimeStr(updatedBounds.rA_end),
        end_time: secondsToTimeStr(updatedBounds.rB_start)
      };
    }));
  };

  // Preview Playback: join preceding phrase(s) with following phrase(s) using exact user adjusted bounds
  const handlePlayPreview = () => {
    if (isPreviewPlaying && activePlaybackSource) {
      try {
        activePlaybackSource.stop();
      } catch (e) {}
      setActivePlaybackSource(null);
      setIsPreviewPlaying(false);
      return;
    }

    if (!decodedAudioBuffer) {
      alert("미리듣기용 오디오를 준비하는 중입니다. 오디오 업로드 후 약 5~10초 가량 소요될 수 있습니다.");
      return;
    }

    const s = suggestions[currentIndex];
    if (!s) return;

    try {
      const audioCtx = audioCtxRef.current || new (window.AudioContext || (window as any).webkitAudioContext)();
      audioCtxRef.current = audioCtx;

      const bounds = getPreviewRangeBounds(s);
      const rA_start = bounds.rA_start;
      const rA_end = bounds.rA_end;
      const rB_start = bounds.rB_start;
      const rB_end = bounds.rB_end;

      console.log(
        "Calculated Playback Preview Bounds:",
        `Range A: [${rA_start.toFixed(2)}s ~ ${rA_end.toFixed(2)}s]`,
        `Range B: [${rB_start.toFixed(2)}s ~ ${rB_end.toFixed(2)}s]`,
        `Original Cut Gap: [${rA_end.toFixed(2)}s ~ ${rB_start.toFixed(2)}s]`
      );

      const sampleRate = decodedAudioBuffer.sampleRate;
      const samplesA = Math.floor((rA_end - rA_start) * sampleRate);
      const samplesB = Math.floor((rB_end - rB_start) * sampleRate);
      const totalSamples = samplesA + samplesB;

      if (totalSamples <= 0) {
        alert("재생할 수 있는 구간 데이터가 존재하지 않습니다.");
        return;
      }

      const previewBuffer = audioCtx.createBuffer(
        decodedAudioBuffer.numberOfChannels,
        totalSamples,
        sampleRate
      );

      for (let channel = 0; channel < decodedAudioBuffer.numberOfChannels; channel++) {
        const originalData = decodedAudioBuffer.getChannelData(channel);
        const previewData = previewBuffer.getChannelData(channel);

        // Copy Range A
        if (samplesA > 0) {
          const startSample = Math.floor(rA_start * sampleRate);
          const segmentA = originalData.subarray(startSample, startSample + samplesA);
          previewData.set(segmentA, 0);
        }

        // Copy Range B
        if (samplesB > 0) {
          const startSample = Math.floor(rB_start * sampleRate);
          const segmentB = originalData.subarray(startSample, startSample + samplesB);
          previewData.set(segmentB, samplesA);
        }
      }

      const source = audioCtx.createBufferSource();
      source.buffer = previewBuffer;
      source.connect(audioCtx.destination);

      source.onended = () => {
        setIsPreviewPlaying(false);
        setActivePlaybackSource(null);
      };

      source.start(0);
      setActivePlaybackSource(source);
      setIsPreviewPlaying(true);
    } catch (error) {
      console.error("Preview play failed:", error);
      alert("미리듣기를 재생하는 도중 에러가 생겼습니다: " + (error as Error).message);
    }
  };

  // Time calculations
  const targetSecondsTotal = (targetMinutes * 60) + (Number(targetSecondsInput) || 0);
  const originalSecondsTotal = (Number(originalMinutes) * 60) + (Number(originalSeconds) || 0);
  
  const acceptedEdits = useMemo(() => {
    return suggestions.filter(s => decisions[s.id] === true);
  }, [suggestions, decisions]);

  const currentReduction = acceptedEdits.reduce((acc, curr) => acc + curr.estimated_seconds, 0);
  const remainingToCutExact = (totalSeconds - targetSecondsTotal) - currentReduction;
  const isTargetReached = (totalSeconds > 0) && (remainingToCutExact <= 0);
  const isAllDecided = suggestions.length > 0 && Object.keys(decisions).length === suggestions.length;

  // Derived active phrase objects for current suggestion fine-tuning
  const currentStartPhrase = useMemo(() => {
    const s = suggestions[currentIndex];
    if (!s || transcriptPhrases.length === 0) return null;
    const { startIdx } = resolveDeletedAndRetainedIndices(s, transcriptPhrases);
    return transcriptPhrases[startIdx];
  }, [suggestions, currentIndex, transcriptPhrases]);

  const currentEndPhrase = useMemo(() => {
    const s = suggestions[currentIndex];
    if (!s || transcriptPhrases.length === 0) return null;
    const { endIdx } = resolveDeletedAndRetainedIndices(s, transcriptPhrases);
    return transcriptPhrases[endIdx];
  }, [suggestions, currentIndex, transcriptPhrases]);

  const handleStartAnalysis = async () => {
    const normalizedScript = normalizeScript(script);
    setScript(normalizedScript);
    setAppState('analyzing');
    try {
      const specialRules = `[반드시 삭제해야 할 부분]\n${mustDelete || '없음'}\n\n[삭제하면 안 되는 부분]\n${mustKeep || '없음'}\n\n[언제나 적용되는 편집 대원칙]\n${GOLDEN_RULES}`;
      
      const { suggestions: s, totalSeconds: t } = await geminiService.analyzeScript(
        normalizedScript, 
        targetSecondsTotal / 60,
        originalSecondsTotal > 0 ? originalSecondsTotal : undefined,
        criteria,
        specialRules
      );
      setSuggestions(s);
      setTotalSeconds(t);
      setAppState('editing');
      setCurrentIndex(0);
      setDecisions({});
    } catch (error) {
      handleGeminiError(error, "분석 중 오류가 발생했습니다.");
      setAppState('input-script');
    }
  };

  const handleRequestMoreSuggestions = async () => {
    if (isRequestingMore) return;
    setIsRequestingMore(true);
    try {
      const specialRules = `[반드시 삭제해야 할 부분]\n${mustDelete || '없음'}\n\n[삭제하면 안 되는 부분]\n${mustKeep || '없음'}\n\n[언제나 적용되는 편집 대원칙]\n${GOLDEN_RULES}`;
      
      const result = await geminiService.getMoreSuggestions(
        script,
        suggestions,
        targetSecondsTotal / 60,
        totalSeconds,
        criteria,
        specialRules
      );

      if (result.suggestions && result.suggestions.length > 0) {
        // Enforce uniqueness by ID
        const existingIds = new Set(suggestions.map(s => s.id));
        const filteredNew = result.suggestions.filter(s => !existingIds.has(s.id));

        if (filteredNew.length === 0) {
          alert("새로운 유형의 고유 편집 제안이 더 이상 존재하지 않습니다.");
        } else {
          setSuggestions(prev => [...prev, ...filteredNew]);
          setCurrentIndex(suggestions.length); // auto select first new one
          alert(`새로운 ${filteredNew.length}개의 추가 편집 제안이 활성화되었습니다.`);
        }
      } else {
        alert("추가 편집 제안을 발견하지 못했습니다.");
      }
    } catch (error) {
      handleGeminiError(error, "추가 제안을 발급받는 중 문제가 생겼습니다.");
    } finally {
      setIsRequestingMore(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedAudioFile(file);
    setIsTranscribing(true);
    setScript("오디오 파일을 디코딩 중입니다. 잠시만 기다려주세요...");

    try {
      // 1. Load file arraybuffer
      const arrayBuffer = await file.arrayBuffer();
      
      // 2. Decode AudioBuffer in browser
      setScript("오디오 데이터를 인식 및 압축 처리 중입니다...");
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const decodedBuf = await audioCtx.decodeAudioData(arrayBuffer);
      setDecodedAudioBuffer(decodedBuf);

      // Set original duration details from the decoded buffer
      const durationSec = Math.floor(decodedBuf.duration);
      const mins = Math.floor(durationSec / 60);
      const secs = durationSec % 60;
      setOriginalMinutes(mins);
      setOriginalSeconds(secs);

      // 3. Compress to Mono 16kHz WAV
      setScript("업로드용 최적성능 16kHz 모노 WAV로 압축 중...");
      const pcmData = downsampleAudioBufferToMono16kHz(decodedBuf, 16000);
      const compressedBlob = encodeMono16BitWav(pcmData, 16000);
      
      const compressedFile = new File(
        [compressedBlob], 
        `${file.name.substring(0, file.name.lastIndexOf('.')) || file.name}_16k.wav`, 
        { type: "audio/wav" }
      );

      console.info("오디오 초고속 압축 완료:", {
        originalSize: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
        compressedSize: `${(compressedFile.size / (1024 * 1024)).toFixed(2)} MB`,
        reductionPercent: `${((1 - compressedFile.size / file.size) * 100).toFixed(1)}%`
      });

      setScript("인공지능(AI) 엔진으로 전송하여 전사(Transcription)를 진행하고 있습니다...");
      
      // 4. Send compressed file to Gemini transcription service
      const text = await geminiService.transcribeAudio(compressedFile);
      const normalizedText = normalizeScript(text);
      
      // Ensure script UI reacts appropriately by scheduling text update across ticks
      setScript(normalizedText);
      setTimeout(() => {
        setScript(prev => {
          if (!prev || prev.startsWith("오디오 파일을") || prev.includes("압축 중") || prev.includes("디코딩 중") || prev.includes("전사(Transcription)")) {
            return normalizedText;
          }
          return prev;
        });
      }, 50);

      // Automatically download transcript text file immediately
      const blob = new Blob([normalizedText], { type: 'text/plain;charset=utf-8' });
      const txtUrl = URL.createObjectURL(blob);
      const tempLink = document.createElement('a');
      tempLink.href = txtUrl;
      tempLink.download = `voice_transcript_${new Date().toLocaleDateString().replace(/\./g, '').trim().replace(/\s/g, '_')}.txt`;
      tempLink.click();
      
      // Defer URL revocation so Windows/Electron has ample time to complete the Save As dialog write safely
      setTimeout(() => {
        URL.revokeObjectURL(txtUrl);
      }, 300000); // 5 minutes
    } catch (error) {
      console.warn("브라우저 디코딩 또는 압축 실패 - 원본 파일로 직접 전사 시도:", error);
      
      // Fallback: decode metadata from visual Audio element if the Web Audio API context failed
      try {
        const audioUrl = URL.createObjectURL(file);
        const audioObj = new Audio(audioUrl);
        audioObj.addEventListener('loadedmetadata', () => {
          const durationSec = Math.floor(audioObj.duration);
          const mins = Math.floor(durationSec / 60);
          const secs = durationSec % 60;
          setOriginalMinutes(mins);
          setOriginalSeconds(secs);
          URL.revokeObjectURL(audioUrl);
        });
      } catch (metaErr) {
        console.error("원본 메타데이터 읽기 실패:", metaErr);
      }

      try {
        setScript("네트워크 속도에 따라 원본 대용량 오디오 전사에 시간이 더 오래 걸릴 수 있습니다...");
        const text = await geminiService.transcribeAudio(file);
        const normalizedText = normalizeScript(text);
        setScript(normalizedText);
      } catch (fbError) {
        handleGeminiError(fbError, "오디오 인식 중 오류가 발생했습니다.");
        setScript("");
        setUploadedAudioFile(null);
      }
    } finally {
      setIsTranscribing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDecision = (accepted: boolean) => {
    const currentId = suggestions[currentIndex].id;
    setDecisions(prev => ({ ...prev, [currentId]: accepted }));

    // Find the next undecided suggestion
    let nextIndex = suggestions.findIndex((s, i) => i > currentIndex && decisions[s.id] === undefined);
    
    // If none found after current, loop around from the beginning
    if (nextIndex === -1) {
      nextIndex = suggestions.findIndex(s => decisions[s.id] === undefined && s.id !== currentId);
    }
    
    if (nextIndex !== -1) {
      setCurrentIndex(nextIndex);
    } else {
      // All decided, but user explicitly clicked so maybe stay here or move to next
      if (currentIndex < suggestions.length - 1) {
        setCurrentIndex(currentIndex + 1);
      }
    }
  };

  const handleSkipToResults = async () => {
    setAppState('analyzing'); // Neutral state for final gen
    try {
      const res = await geminiService.generateFinalResults(script, []);
      setResults(res);
      setAppState('results');
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (error) {
      handleGeminiError(error, "최종 결과 도출 중 오류가 발생했습니다.");
      setAppState('input-script');
    }
  };

  const handlePreResultsCheck = async () => {
    const editedDurationValue = totalSeconds - currentReduction;
    const factor = editedDurationValue / Math.max(1, targetSecondsTotal);
    const diffRatio = Math.abs(editedDurationValue - targetSecondsTotal) / Math.max(1, targetSecondsTotal);
    
    // Suggest if the difference is <= 10% (0.10) and has actual time difference
    if (diffRatio <= 0.10 && Math.abs(factor - 1.0) > 0.005) {
      setPlaybackRateFactor(factor);
      setAppState('speed-adjust');
    } else {
      setIsSpeedAdjustEnabled(false);
      setPlaybackRateFactor(1.0);
      await finalizeEdits();
    }
  };

  const finalizeEdits = async () => {
    setAppState('analyzing'); // Neutral state for final gen
    try {
      const res = await geminiService.generateFinalResults(script, acceptedEdits);
      setResults(res);
      setAppState('results');
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (error) {
      handleGeminiError(error, "최종 결과 도출 중 오류가 발생했습니다.");
      setAppState('editing');
    }
  };

  const handleRecommendMoreShorts = async () => {
    setIsGeneratingShorts(true);
    try {
      const res = await geminiService.generateFinalResults(script, acceptedEdits);
      setResults(prev => prev ? { ...prev, shortsSegment: res.shortsSegment } : null);
    } catch (error) {
      handleGeminiError(error, "추천 쇼츠 결과 생성 중 오류가 발생했습니다.");
    } finally {
      setIsGeneratingShorts(false);
    }
  };

  const downloadResults = () => {
    if (!results) return;

    let content = `Changsoo's 방송 편집 도우미 - 편집 결과\n\n`;
    content += `[원 스크립트 정보]\n목표 시간: ${targetMinutes}분\n원래 총 시간(추정): ${Math.floor(totalSeconds / 60)}분 ${totalSeconds % 60}초\n\n`;
    
    content += `[편집 제안 수긍 내역]\n`;
    acceptedEdits.forEach((edit, i) => {
      content += `${i + 1}. 구간: ${edit.start_time} - ${edit.end_time} (${Math.floor(edit.estimated_seconds)}초)\n`;
      content += `내용: ${edit.text_chunk}\n`;
      content += `사유: ${edit.reason}\n\n`;
    });

    content += `[유튜브 썸네일 제목 제안]\n`;
    results.thumbnailTitles.forEach((t, i) => content += `${i + 1}. ${t}\n`);
    content += `\n`;

    content += `[쇼츠 추천 구간]\n`;
    content += `제목: ${results.shortsSegment.title}\n`;
    content += `구간: ${results.shortsSegment.start} - ${results.shortsSegment.end}\n`;
    content += `내용: ${results.shortsSegment.text}\n`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `editing_result_${new Date().getTime()}.txt`;
    a.click();
  };

  const handleGenerateEditedAudio = async () => {
    if (!uploadedAudioFile) return;
    setIsGeneratingAudio(true);
    try {
      const arrayBuffer = await uploadedAudioFile.arrayBuffer();
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      const originalBuffer = await audioCtx.decodeAudioData(arrayBuffer);
      const sampleRate = originalBuffer.sampleRate;
      const fileDuration = originalBuffer.duration;

      // Map accepted cuts strictly to exact phrase unit boundaries (구절 단위 잘라내기)
      const cuts = acceptedEdits.map(edit => {
        if (edit.custom_rA_end !== undefined && edit.custom_rB_start !== undefined) {
          return { start: edit.custom_rA_end, end: edit.custom_rB_start };
        }
        
        const { startIdx, firstRetainedIdx } = resolveDeletedAndRetainedIndices(edit, transcriptPhrases);
        if (startIdx !== -1 && transcriptPhrases[startIdx]) {
          const cutStart = transcriptPhrases[startIdx].seconds;
          const cutEnd = (firstRetainedIdx < transcriptPhrases.length && firstRetainedIdx >= 0)
            ? transcriptPhrases[firstRetainedIdx].seconds
            : fileDuration;
          return { start: cutStart, end: cutEnd };
        } else {
          return {
            start: parseTimeToSeconds(edit.start_time),
            end: parseTimeToSeconds(edit.end_time)
          };
        }
      }).sort((a, b) => a.start - b.start);

      // Merge overlap cuts
      const mergedCuts: { start: number, end: number }[] = [];
      for (const cut of cuts) {
        if (mergedCuts.length === 0) {
          mergedCuts.push(cut);
        } else {
          const last = mergedCuts[mergedCuts.length - 1];
          if (cut.start <= last.end) {
            last.end = Math.max(last.end, cut.end);
          } else {
            mergedCuts.push(cut);
          }
        }
      }

      // Invert cuts to get kept ranges
      const keptRanges: { start: number; end: number }[] = [];
      let lastEnd = 0;
      for (const cut of mergedCuts) {
        if (cut.start > lastEnd) {
          keptRanges.push({ start: lastEnd, end: Math.min(cut.start, fileDuration) });
        }
        lastEnd = Math.max(lastEnd, cut.end);
      }
      if (lastEnd < fileDuration) {
        keptRanges.push({ start: lastEnd, end: fileDuration });
      }

      // Calculate total samples required
      let totalSamples = 0;
      const rangesWithSamples = keptRanges.map(r => {
        const startSample = Math.floor(r.start * sampleRate);
        const endSample = Math.floor(Math.min(r.end, fileDuration) * sampleRate);
        const numSamples = Math.max(0, endSample - startSample);
        totalSamples += numSamples;
        return { startSample, endSample, numSamples };
      });

      // Construct a new AudioBuffer of correct length
      const editedBuffer = audioCtx.createBuffer(
        originalBuffer.numberOfChannels,
        totalSamples,
        sampleRate
      );

      // Slice channel data
      for (let channel = 0; channel < originalBuffer.numberOfChannels; channel++) {
        const originalData = originalBuffer.getChannelData(channel);
        const editedData = editedBuffer.getChannelData(channel);
        let writeOffset = 0;

        for (const range of rangesWithSamples) {
          if (range.numSamples > 0) {
            const segment = originalData.subarray(range.startSample, range.endSample);
            editedData.set(segment, writeOffset);
            writeOffset += range.numSamples;
          }
        }
      }

      // Stretch speech speed if requested (pitch-preserved)
      let finalEditedBuffer = editedBuffer;
      if (isSpeedAdjustEnabled && Math.abs(playbackRateFactor - 1.0) >= 0.005) {
        finalEditedBuffer = timeStretch(editedBuffer, playbackRateFactor, audioCtx);
      }

      // Convert buffer based on selected format
      let finalBlob: Blob;
      let extension = "wav";

      if (outputAudioFormat === 'mp3') {
        const lamejsInstance = await loadLameJs();
        setEncodingProgress(0);
        finalBlob = await audioBufferToMp3Async(finalEditedBuffer, lamejsInstance, (pct) => {
          setEncodingProgress(pct);
        });
        extension = "mp3";
      } else {
        finalBlob = audioBufferToWav(finalEditedBuffer);
        extension = "wav";
      }

      const downloadUrl = URL.createObjectURL(finalBlob);
      const downloadAnchor = document.createElement('a');
      downloadAnchor.href = downloadUrl;
      const baseName = uploadedAudioFile.name.substring(0, uploadedAudioFile.name.lastIndexOf('.')) || "audio";
      downloadAnchor.download = `${baseName}_edited_${new Date().getTime()}.${extension}`;
      downloadAnchor.click();
      
      // Defer URL revocation so Windows/Electron has ample time to complete the Save As dialog write safely
      setTimeout(() => {
        URL.revokeObjectURL(downloadUrl);
      }, 300000); // 5 minutes
    } catch (error) {
      console.error("Audio generation failed:", error);
      alert("편집된 오디오 생성 중 오류가 발생했습니다: " + (error as Error).message);
    } finally {
      setIsGeneratingAudio(false);
      setEncodingProgress(null);
    }
  };

  return (
    <div className="flex flex-col h-screen w-full bg-[#F8F9FA] text-[#1A1A1A] font-sans overflow-hidden">
      {/* Top Header */}
      <header className="flex items-center justify-between px-8 py-4 bg-white border-b border-gray-200 shadow-sm shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">C</div>
          <h1 className="text-xl font-bold tracking-tight text-gray-800">Changsoo's 방송 편집 도우미</h1>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsApiKeyModalOpen(true)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer",
              hasCustomKey 
                ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100" 
                : "bg-amber-50/70 text-amber-700 border-amber-200/60 hover:bg-amber-100"
            )}
          >
            <Key size={13} className={hasCustomKey ? "text-emerald-600" : "text-amber-500"} />
            <span>{hasCustomKey ? "개인 API Key 연결됨" : "API Key 설정 (공용 Quota)"}</span>
          </button>
          <span className="text-sm text-gray-500 hidden md:block">v1.2.0 - Analysis Active</span>
          <button 
            onClick={() => alert("도움말: 스크립트와 목표 시간을 입력하면 AI가 민감한 내용, 사생활, 불필요한 부분을 찾아 편집을 제안합니다.")}
            className="px-4 py-2 bg-gray-900 text-white rounded-md text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            가이드 보기
          </button>
        </div>
      </header>

      {/* Main Interface */}
      <main className="flex-1 overflow-y-auto p-6 md:p-8">
        <div className="max-w-5xl mx-auto h-full">
          <AnimatePresence mode="wait">
            {appState === 'input-script' && (
              <motion.div 
                key="input-script"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full"
              >
                {/* Left Panel: Inputs */}
                <div className="md:col-span-2 flex flex-col space-y-6">
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col flex-1 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center">
                      <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">스크립트 입력</span>
                      <div className="flex items-center gap-4">
                        <span className="text-xs text-gray-400">약 {script.length}자</span>
                        <input 
                          type="file" 
                          accept="audio/*, .mp3, .wav, .m4a, .ogg, .flac, .aac, .webm" 
                          ref={fileInputRef} 
                          onChange={handleFileUpload} 
                          className="hidden" 
                        />
                        <button 
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isTranscribing}
                          className="flex items-center gap-1.5 text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded-md font-bold hover:bg-blue-100 transition-colors disabled:opacity-50"
                        >
                          {isTranscribing ? <RefreshCcw size={14} className="animate-spin" /> : <FileAudio size={14} />}
                          <span>오디오 파일로 입력</span>
                        </button>
                      </div>
                    </div>
                    <textarea 
                      value={script}
                      onChange={(e) => setScript(e.target.value)}
                      disabled={isTranscribing}
                      className="flex-1 p-6 focus:outline-none resize-none font-mono text-sm leading-relaxed text-gray-700 disabled:bg-gray-50 disabled:text-gray-400"
                      placeholder="분석할 오디오 스크립트를 이곳에 붙여넣거나, '오디오 파일로 입력'을 눌러서 파일을 업로드해주세요..."
                    />
                  </div>
                </div>

                {/* Right Panel: Config & Action */}
                <div className="space-y-6">
                  {/* Original Duration (Optional) */}
                  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">원본 영상 시간 (선택)</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="relative">
                        <input 
                          type="number" 
                          value={originalMinutes}
                          onChange={(e) => setOriginalMinutes(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value) || 0))}
                          className="w-full pl-4 pr-10 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 transition-all font-bold text-xl"
                          placeholder="0"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 font-bold uppercase">분</span>
                      </div>
                      <div className="relative">
                        <input 
                          type="number" 
                          value={originalSeconds}
                          onChange={(e) => setOriginalSeconds(e.target.value === '' ? '' : Math.min(59, Math.max(0, parseInt(e.target.value) || 0)))}
                          className="w-full pl-4 pr-10 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 transition-all font-bold text-xl"
                          placeholder="0"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 font-bold uppercase">초</span>
                      </div>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-2 italic">* 입력하지 않으면 스크립트 분량으로 추정합니다.</p>
                  </div>

                  {/* Target Duration */}
                  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">목표 방송 시간</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="relative">
                        <input 
                          type="number" 
                          value={targetMinutes}
                          onChange={(e) => setTargetMinutes(Math.max(0, parseInt(e.target.value) || 0))}
                          className="w-full pl-4 pr-10 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 transition-all font-bold text-xl"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 font-bold uppercase">분</span>
                      </div>
                      <div className="relative">
                        <input 
                          type="number" 
                          max="59"
                          value={targetSecondsInput}
                          onChange={(e) => setTargetSecondsInput(Math.min(59, Math.max(0, parseInt(e.target.value) || 0)))}
                          className="w-full pl-4 pr-10 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 transition-all font-bold text-xl"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 font-bold uppercase">초</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <button 
                      onClick={() => setAppState('input-criteria')}
                      disabled={!script.trim()}
                      className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl hover:bg-blue-700 transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      다음 단계: 편집 기준 설정 <ChevronRight size={20} />
                    </button>
                    <button 
                      onClick={handleSkipToResults}
                      disabled={!script.trim()}
                      className="w-full bg-white border border-gray-200 text-gray-700 font-bold py-4 rounded-xl hover:bg-gray-50 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
                    >
                      <span>제목 및 쇼츠 제안 바로 가기</span> <Video size={18} />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {appState === 'input-criteria' && (
              <motion.div 
                key="input-criteria"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="max-w-3xl mx-auto space-y-6"
              >
                <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-xl space-y-8">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                       <Scissors size={20} className="text-blue-600" /> 기본 편집 기준 검토
                    </h3>
                    <p className="text-sm text-gray-500 mb-3">AI가 이 기준들을 바탕으로 삭제할 구간을 찾아냅니다.</p>
                    <textarea 
                      value={criteria}
                      onChange={(e) => setCriteria(e.target.value)}
                      className="w-full h-40 p-4 rounded-xl border border-gray-100 bg-gray-50/50 focus:ring-2 focus:ring-blue-500 transition-all text-sm leading-relaxed"
                    />
                  </div>

                  {/* Golden Rules Advisory Panel */}
                  <div className="bg-amber-50 border border-amber-200/70 p-5 rounded-2xl space-y-2">
                    <h4 className="text-amber-900 font-bold text-sm flex items-center gap-2">
                      ⚠️ 편집의 대원칙 (수정 불가 가이드라인)
                    </h4>
                    <p className="text-xs text-amber-800 leading-relaxed">
                      이 원칙은 자연스러운 방송 연결 및 내용 보존을 위해 AI 분석 엔진이 상시 준수하고 제안합니다:
                    </p>
                    <ul className="text-xs text-amber-900/90 list-disc list-inside space-y-1.5 bg-white/65 p-3.5 rounded-xl border border-amber-100">
                      <li><strong>배경음 무시 구역</strong>: 배경 음악이 있는 부분은 급격한 전환 오류를 예방하려 편집 제안에서 원천 제외합니다.</li>
                      <li><strong>문맥 멈춤 포착</strong>: 문장의 종결점 또는 화자의 미세한 호흡 멈춤부를 찾아 소리가 튀지 않는 매끄러운 단층면에서 자릅니다.</li>
                      <li><strong>앞뒤 자연성 교차 검증</strong>: 특정 파트를 소거한 후, 남은 앞뒤 텍스트가 국어학적·맥락적으로 매끄러운지 확인합니다.</li>
                      <li><strong>질의응답 보존 조건</strong>: 대담 인터뷰 시 질문만 남고 이에 연결된 응답이 없이 지나치는 기형적 문장 구조를 차단합니다.</li>
                    </ul>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                          <Trash2 size={16} className="text-red-500" /> 반드시 삭제해야 할 부분
                        </label>
                        <textarea 
                          value={mustDelete}
                          onChange={(e) => setMustDelete(e.target.value)}
                          className="w-full h-32 p-4 rounded-xl border border-gray-100 bg-gray-50/50 focus:ring-2 focus:ring-red-500 transition-all text-sm"
                          placeholder="예: 성경 말씀을 읽는 부분은 반드시 삭제"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                          <CheckCircle2 size={16} className="text-emerald-500" /> 절대 삭제하면 안 되는 부분
                        </label>
                        <textarea 
                          value={mustKeep}
                          onChange={(e) => setMustKeep(e.target.value)}
                          className="w-full h-32 p-4 rounded-xl border border-gray-100 bg-gray-50/50 focus:ring-2 focus:ring-emerald-500 transition-all text-sm"
                          placeholder="예: 예수님의 말씀은 삭제하면 안 됨"
                        />
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <button 
                      onClick={() => setAppState('input-script')}
                      className="flex-1 py-4 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-all"
                    >
                      이전으로
                    </button>
                    <button 
                      onClick={handleStartAnalysis}
                      className="flex-[2] py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 active:scale-95"
                    >
                      분석 및 편집 제안 시작하기
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {appState === 'analyzing' && (
              <motion.div 
                key="analyzing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-20 h-full"
              >
                <div className="w-16 h-16 border-4 border-gray-100 border-t-blue-600 rounded-full animate-spin mb-6" />
                <p className="text-xl font-bold text-gray-800 tracking-tight">AI 엔진이 스크립트를 분석 중입니다</p>
                <p className="text-gray-400 mt-2 text-sm">Deep Analysis Option Enabled</p>
              </motion.div>
            )}

            {appState === 'editing' && suggestions.length > 0 && (
              <motion.div 
                key="editing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-6"
              >
                {/* Left: Script & Progress */}
                <div className="md:col-span-2 space-y-6">
                  {/* Progress Card */}
                  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-end mb-4">
                      <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">편집 진행 현황</p>
                        <h2 className="text-2xl font-semibold">
                          목표 시간까지 <span className={remainingToCutExact < 0 ? "text-emerald-600" : "text-blue-600"}>
                            {remainingToCutExact < 0 ? "-" : ""}{Math.floor(Math.abs(remainingToCutExact) / 60) > 0 ? `${Math.floor(Math.abs(remainingToCutExact) / 60)}분 ` : ""}{Math.floor(Math.abs(remainingToCutExact) % 60)}초
                          </span> 남음
                        </h2>
                      </div>
                      <div className="text-right text-sm text-gray-500 font-medium">
                        제안 {currentIndex + 1} / {suggestions.length}
                      </div>
                    </div>
                    <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, (currentReduction / Math.max(1, totalSeconds - targetSecondsTotal)) * 100)}%` }}
                        className="h-full bg-blue-500 transition-all"
                      />
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col overflow-hidden min-h-[400px]">
                    <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/50 flex justify-between">
                      <span className="text-sm font-medium text-gray-600">선택된 구간 미리보기</span>
                      <span className="text-xs text-blue-600 font-bold uppercase">제안 하이라이트</span>
                    </div>
                    <div className="p-8 text-lg leading-relaxed text-gray-700 font-sans">
                      {suggestions[currentIndex].context_before && (
                        <p className="opacity-50 mb-4 whitespace-pre-wrap leading-relaxed text-sm">
                          ...{suggestions[currentIndex].context_before}
                        </p>
                      )}

                      <div className="bg-red-50 border-l-4 border-red-500 p-6 -mx-4 rounded-r-xl">
                        <p className="text-xs font-bold text-red-600 uppercase tracking-widest mb-2">
                          [구간: {suggestions[currentIndex].start_time} - {suggestions[currentIndex].end_time}]
                        </p>
                        <p className="text-red-900 font-medium italic whitespace-pre-wrap text-base">
                          {suggestions[currentIndex].text_chunk && suggestions[currentIndex].text_chunk.trim() && !suggestions[currentIndex].text_chunk.includes("묵음") ? (
                            `"${suggestions[currentIndex].text_chunk}"`
                          ) : (
                            <span className="inline-flex items-center gap-2 bg-amber-50 text-amber-800 border border-amber-200 px-3 py-1.5 rounded-lg text-sm font-sans not-italic">
                              🎵 [구간 설명: 묵음, 찬양/배경 음악, 또는 녹음된 소음 구간 (자막 없음)]
                            </span>
                          )}
                        </p>
                        {suggestions[currentIndex].is_fine_edit && (
                          <div className="mt-3 flex items-center gap-1.5 text-xs font-black text-red-700">
                             <AlertTriangle size={14} /> 단어/문장 단위의 주의 깊은 편집이 필요합니다.
                          </div>
                        )}
                      </div>

                      {suggestions[currentIndex].context_after && (
                        <p className="opacity-50 mt-4 whitespace-pre-wrap leading-relaxed text-sm">
                          {suggestions[currentIndex].context_after}...
                        </p>
                      )}

                      {/* Deletion Audio Preview player */}
                      <div className="mt-6 p-4 rounded-xl border border-blue-100 bg-blue-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="space-y-1 text-center sm:text-left">
                          <h4 className="text-sm font-bold text-blue-900 flex items-center justify-center sm:justify-start gap-1.5">
                            <span>✂️ 이 구절을 삭제했을 때 어떻게 들릴까요?</span>
                          </h4>
                          <p className="text-xs text-blue-700 leading-normal">
                            제안 구간을 완전히 건너뛴 상태에서 <strong>삭제 구간 앞뒤 구절을 자연스럽게 연결해서</strong> 미리 들어봅니다.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={handlePlayPreview}
                          className={cn(
                            "w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all duration-200 active:scale-[0.97]",
                            isPreviewPlaying 
                              ? "bg-red-600 hover:bg-red-700 text-white animate-pulse" 
                              : "bg-blue-600 hover:bg-blue-700 text-white"
                          )}
                        >
                          {isPreviewPlaying ? (
                            <>
                              <Square size={14} className="fill-current" />
                              <span>미리듣기 종료</span>
                            </>
                          ) : (
                            <>
                              <Play size={14} className="fill-current" />
                              <span>삭제 제외 미리 듣기</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Precise 0.1s Fine-tuning Controls */}
                      <div className="mt-8 pt-6 border-t border-dashed border-gray-200 space-y-4">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                          <p className="text-xs font-bold text-gray-550 flex items-center gap-1.5 uppercase tracking-wider">
                            ⏱️ 0.1초 단위 편집/미리듣기 지점 정밀 조율
                          </p>
                          <span className="text-[11px] font-semibold text-red-600 bg-red-50 px-2.5 py-1 rounded-full">
                            삭제되는 전체 시간: {suggestions[currentIndex].estimated_seconds.toFixed(1)}초
                          </span>
                        </div>

                        {(() => {
                          const bounds = getPreviewRangeBounds(suggestions[currentIndex]);
                          return (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              {/* Range A controls (Preceding Phrase End / Cut Start) */}
                              <div className="bg-blue-50/45 border border-blue-100 p-5 rounded-2xl flex flex-col justify-between">
                                <div className="mb-4">
                                  <span className="text-xs font-bold text-blue-700 block uppercase tracking-wider mb-1">🔊 앞구간 끝점 (삭제 시작 지점)</span>
                                  <p className="text-xs text-gray-500">이 시점 직전까지 앞부분 코멘트가 유지됩니다.</p>
                                </div>
                                <div className="bg-white p-4 rounded-xl border border-blue-100 flex flex-col justify-between gap-3 shadow-sm">
                                  <div className="flex justify-between items-center">
                                    <span className="text-[11px] font-semibold text-gray-400">설정된 편집 시작점</span>
                                    <span className="font-mono font-extrabold text-blue-900 text-sm sm:text-base">
                                      {secondsToTimeStr(bounds.rA_end)} <span className="text-xs text-blue-600 font-normal">({bounds.rA_end.toFixed(1)}초)</span>
                                    </span>
                                  </div>
                                  <div className="flex gap-2">
                                    <button
                                      type="button"
                                      onClick={() => handleAdjustCustomSeconds('rA_end', -0.1)}
                                      className="flex-1 py-1.5 font-bold text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors active:scale-95 flex items-center justify-center cursor-pointer"
                                    >
                                      -0.1초
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleAdjustCustomSeconds('rA_end', 0.1)}
                                      className="flex-1 py-1.5 font-bold text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-sm active:scale-95 flex items-center justify-center cursor-pointer"
                                    >
                                      +0.1초
                                    </button>
                                  </div>
                                </div>
                              </div>

                              {/* Range B controls (Following Phrase Start / Cut End) */}
                              <div className="bg-red-50/45 border border-red-100 p-5 rounded-2xl flex flex-col justify-between">
                                <div className="mb-4">
                                  <span className="text-xs font-bold text-red-700 block uppercase tracking-wider mb-1">🔊 뒷구간 시작점 (삭제 종료 지점)</span>
                                  <p className="text-xs text-gray-500">이 시점부터 뒷부분 코멘트가 이어서 나옵니다.</p>
                                </div>
                                <div className="bg-white p-4 rounded-xl border border-red-100 flex flex-col justify-between gap-3 shadow-sm">
                                  <div className="flex justify-between items-center">
                                    <span className="text-[11px] font-semibold text-gray-400">설정된 편집 종료점</span>
                                    <span className="font-mono font-extrabold text-red-900 text-sm sm:text-base">
                                      {secondsToTimeStr(bounds.rB_start)} <span className="text-xs text-red-650 font-normal">({bounds.rB_start.toFixed(1)}초)</span>
                                    </span>
                                  </div>
                                  <div className="flex gap-2">
                                    <button
                                      type="button"
                                      onClick={() => handleAdjustCustomSeconds('rB_start', -0.1)}
                                      className="flex-1 py-1.5 font-bold text-xs bg-red-50 hover:bg-red-100 text-red-700 rounded-lg transition-colors active:scale-95 flex items-center justify-center cursor-pointer"
                                    >
                                      -0.1초
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleAdjustCustomSeconds('rB_start', 0.1)}
                                      className="flex-1 py-1.5 font-bold text-xs bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors shadow-sm active:scale-95 flex items-center justify-center cursor-pointer"
                                    >
                                      +0.1초
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                        
                        {/* Coarse phrase-by-phrase unit tuning */}
                        <div className="pt-4 border-t border-gray-100">
                          <span className="text-[11px] font-bold text-gray-400 block mb-2">💡 대략적인 구절 단위로 조환하기</span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="flex justify-between gap-1.5">
                              <button 
                                type="button"
                                onClick={() => handleAdjustPhrase('start', 'prev')}
                                className="flex-1 py-2 text-[10px] sm:text-xs font-bold bg-white hover:bg-gray-50 text-gray-600 border border-gray-200 rounded-lg transition-colors shadow-xs"
                                title="한 구절 이전으로 시작 시간을 당깁니다."
                              >
                                ◀ 앞 구절 포함 (확장)
                              </button>
                              <button 
                                type="button"
                                onClick={() => handleAdjustPhrase('start', 'next')}
                                className="flex-1 py-2 text-[10px] sm:text-xs font-bold bg-white hover:bg-gray-50 text-gray-600 border border-gray-200 rounded-lg transition-colors shadow-xs"
                                title="한 구절 다음으로 시작 시간을 밉니다."
                              >
                                뒷 구절 제외 (축소) ▶
                              </button>
                            </div>
                            <div className="flex justify-between gap-1.5">
                              <button 
                                type="button"
                                onClick={() => handleAdjustPhrase('end', 'prev')}
                                className="flex-1 py-1.5 text-[10px] sm:text-xs font-bold bg-white hover:bg-gray-50 text-gray-600 border border-gray-200 rounded-lg transition-colors shadow-xs"
                                title="한 구절 이전으로 종료 시간을 줄입니다."
                              >
                                ◀ 앞 구절 제외 (축소)
                              </button>
                              <button 
                                type="button"
                                onClick={() => handleAdjustPhrase('end', 'next')}
                                className="flex-1 py-1.5 text-[10px] sm:text-xs font-bold bg-white hover:bg-gray-50 text-gray-600 border border-gray-200 rounded-lg transition-colors shadow-xs"
                                title="한 구절 다음으로 종료 시간을 늘립니다."
                              >
                                뒷 구절 포함 (확장) ▶
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="space-y-6">
                  <div className="flex flex-wrap gap-2">
                    {suggestions.map((s, idx) => {
                      const isDecided = decisions[s.id] !== undefined;
                      const isAccepted = decisions[s.id] === true;
                      const isCurrent = idx === currentIndex;
                      
                      return (
                        <button 
                          key={s.id}
                          onClick={() => setCurrentIndex(idx)}
                          className={cn(
                            "w-10 h-10 rounded-xl font-bold flex items-center justify-center transition-all",
                            isCurrent 
                              ? "bg-blue-600 text-white shadow-md ring-2 ring-blue-200 ring-offset-2" 
                              : isDecided 
                                ? (isAccepted ? "bg-red-50 text-red-600 border border-red-200" : "bg-gray-100 text-gray-400 border border-gray-200") 
                                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                          )}
                          title={isDecided ? (isAccepted ? "삭제 제안 수락됨" : "삭제 제안 거부됨") : "미결정 (클릭하여 이동)"}
                        >
                          {idx + 1}
                        </button>
                      );
                    })}
                  </div>

                  {/* Request more suggestions button block */}
                  <div className="bg-gray-50 border border-gray-100 p-4 rounded-2xl flex flex-col items-center justify-center space-y-2 text-center shadow-sm">
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest leading-none">
                      편집 제안이 부족한가요?
                    </p>
                    <button
                      type="button"
                      onClick={handleRequestMoreSuggestions}
                      disabled={isRequestingMore}
                      className="w-full py-2.5 bg-white text-blue-600 hover:bg-blue-50 border border-blue-200 hover:border-blue-300 font-bold text-xs rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 active:scale-[0.98] disabled:opacity-50"
                    >
                      {isRequestingMore ? (
                        <>
                          <RefreshCcw size={13} className="animate-spin text-blue-500" />
                          <span>추가 제안 불러오는 중...</span>
                        </>
                      ) : (
                        <>
                          <Scissors size={13} />
                          <span>AI 편집 제안 추가로 받기 (+추가)</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="bg-blue-600 text-white p-6 rounded-2xl shadow-lg">
                    <h3 className="text-sm font-bold uppercase tracking-wider opacity-90 mb-2 flex justify-between items-center">
                      <span>현재 편집 제안</span>
                      {decisions[suggestions[currentIndex].id] === true && (
                        <span className="bg-red-500 text-white px-2 py-0.5 rounded-full text-xs">수락됨</span>
                      )}
                      {decisions[suggestions[currentIndex].id] === false && (
                        <span className="bg-gray-400 text-white px-2 py-0.5 rounded-full text-xs">거절됨</span>
                      )}
                    </h3>
                    <p className="text-lg font-medium leading-snug mb-6">
                      {suggestions[currentIndex].reason}
                    </p>
                    <div className="flex gap-3">
                      <button 
                        onClick={() => handleDecision(true)}
                        className="flex-1 bg-white text-blue-600 font-bold py-4 rounded-xl hover:bg-blue-50 transition-all active:scale-95"
                      >
                        네, 삭제합니다
                      </button>
                      <button 
                        onClick={() => handleDecision(false)}
                        className="flex-1 bg-blue-700 text-white font-bold py-4 rounded-xl hover:bg-blue-800 border border-blue-400/30 transition-all active:scale-95"
                      >
                        아니오
                      </button>
                    </div>
                    <p className="mt-4 text-xs text-blue-100 italic text-center">
                      이 구간 삭제 시 <span className="font-bold">{Math.floor(suggestions[currentIndex].estimated_seconds / 60) > 0 ? `${Math.floor(suggestions[currentIndex].estimated_seconds / 60)}분 ` : ""}{Math.floor(suggestions[currentIndex].estimated_seconds % 60)}초</span> 절감
                    </p>
                  </div>

                  {(isTargetReached || isAllDecided) && (
                    <button 
                      onClick={handlePreResultsCheck}
                      className={cn(
                        "w-full py-4 text-white font-bold rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2",
                        isTargetReached ? "bg-emerald-600 hover:bg-emerald-700" : "bg-blue-800 hover:bg-blue-900"
                      )}
                    >
                      {isTargetReached ? "편집 종료 및 결과 보기" : "모든 제안 검토 완료 (결과 보기)"} <CheckCircle2 size={20} />
                    </button>
                  )}
                </div>
              </motion.div>
            )}

            {appState === 'speed-adjust' && (
              <motion.div
                key="speed-adjust"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="max-w-xl mx-auto bg-white border border-gray-150 p-8 rounded-3xl shadow-xl space-y-6 my-12"
              >
                <div className="text-center space-y-2">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-50 text-blue-600 rounded-full mb-2">
                    <Clock size={24} />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 font-sans">⏱️ 오디오 재생 속도 미세 조절 제안</h2>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    목표 시간과 편집 후 예상 시간이 10% 범위 이내입니다.<br />
                    음정(Pitch) 변화 없이 재생 속도만 정밀 보정하여 exact 목표 시간에 맞추시겠습니까?
                  </p>
                </div>

                <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 flex flex-col gap-4">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="bg-white p-3 rounded-xl border border-gray-100">
                      <p className="text-xs text-gray-400 font-bold uppercase">목표 시간</p>
                      <p className="text-lg font-black text-blue-600 font-mono mt-1">
                        {Math.floor(targetSecondsTotal / 60)}분 {targetSecondsTotal % 60}초
                      </p>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-gray-100">
                      <p className="text-xs text-gray-400 font-bold uppercase">편집 후 예상 시간</p>
                      <p className="text-lg font-black text-amber-600 font-mono mt-1">
                        {Math.floor((totalSeconds - currentReduction) / 60)}분 {Math.floor((totalSeconds - currentReduction) % 60)}초
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-gray-100 pt-4 flex flex-col items-center justify-center gap-1.5 align-middle">
                    <p className="text-xs text-gray-650 font-bold">필요 계산 속도 배율</p>
                    <p className="text-3xl font-black text-slate-800 font-mono">
                      {playbackRateFactor.toFixed(2)}x
                    </p>
                    <p className="text-xs text-amber-700 font-semibold bg-amber-50 px-3 py-1 rounded-full border border-amber-100">
                      {playbackRateFactor > 1.0 
                        ? `약 ${((playbackRateFactor - 1.0) * 100).toFixed(1)}% 더 빠르게 재생` 
                        : `약 ${((1.0 - playbackRateFactor) * 100).toFixed(1)}% 더 느리게 재생`
                      }
                    </p>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <button
                    onClick={() => {
                      setIsSpeedAdjustEnabled(true);
                      finalizeEdits();
                    }}
                    className="w-full flex items-center justify-center gap-2 bg-blue-650 hover:bg-blue-750 text-white font-bold py-4 px-6 rounded-2xl transition-all shadow-md active:scale-[0.98]"
                  >
                    🚀 배속 제안 적용하기 ({playbackRateFactor.toFixed(2)}배속 출력)
                  </button>
                  <button
                    onClick={() => {
                      setIsSpeedAdjustEnabled(false);
                      finalizeEdits();
                    }}
                    className="w-full flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-4 px-6 rounded-2xl transition-all active:scale-[0.98]"
                  >
                    ⏱️ 배속 조정 없이 그대로 진행 (원래 속도 유지)
                  </button>
                </div>
              </motion.div>
            )}

            {appState === 'results' && results && (
              <motion.div 
                key="results"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-12"
              >
                {/* Result Summary */}
                <div className="md:col-span-2 space-y-6">
                  <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-8 py-6 border-b border-gray-50 bg-gray-50/50 flex items-center justify-between">
                      <h2 className="text-xl font-bold text-gray-800">최종 편집본 결과</h2>
                      <div className="flex items-center gap-2">
                        <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
                          목표 달성
                        </span>
                      </div>
                    </div>
                    <div className="p-8 space-y-6 max-h-[600px] overflow-y-auto">
                      {acceptedEdits.map((edit, idx) => (
                        <div key={idx} className="relative pl-6 border-l-2 border-gray-100 pb-6 last:pb-0">
                          <div className="absolute -left-[5px] top-0 w-2 h-2 rounded-full bg-blue-500" />
                          <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
                            [{edit.start_time} - {edit.end_time}]
                          </div>
                          <p className="text-gray-700 leading-relaxed italic mb-2">
                            {edit.text_chunk && edit.text_chunk.trim() && !edit.text_chunk.includes("묵음") ? (
                              `"${edit.text_chunk}"`
                            ) : (
                              <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 border border-amber-150 px-2 py-1 rounded text-xs not-italic">
                                🎵 [묵음 / 찬양 / 외부 소음 구간]
                              </span>
                            )}
                          </p>
                          <p className="text-sm font-bold text-blue-600">{edit.reason}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Marketing Side */}
                <div className="space-y-6">
                  {/* YouTube Titles */}
                  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <h4 className="text-sm font-bold text-gray-800 mb-4 flex items-center">
                      <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span> 유튜브 썸네일 추천
                    </h4>
                    <div className="space-y-3">
                      {results.thumbnailTitles.map((title, i) => (
                        <div key={i} className="text-sm p-4 bg-gray-50 rounded-xl border border-gray-100 text-gray-800 font-medium leading-snug">
                          <span className="text-gray-400 mr-2">{i+1}.</span> {title}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Shorts Recommendation */}
                  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <h4 className="text-sm font-bold text-gray-800 mb-4 flex items-center">
                      <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span> 쇼츠 구간 추천
                    </h4>
                    <div className="p-4 bg-orange-50 border border-orange-100 rounded-2xl mb-4">
                      <p className="text-sm font-bold text-orange-800 mb-1">[{results.shortsSegment.start} ~ {results.shortsSegment.end}]</p>
                      <h5 className="text-base font-black text-orange-950 mb-2 leading-tight">{results.shortsSegment.title}</h5>
                      <p className="text-sm text-orange-800 font-medium whitespace-pre-wrap leading-relaxed">"{results.shortsSegment.text}"</p>
                    </div>
                    
                    <div className="space-y-3">
                      <p className="text-xs font-bold text-center text-gray-500">쇼츠 구간을 다시 추천할까요?</p>
                      <div className="flex gap-2">
                        <button 
                          onClick={handleRecommendMoreShorts}
                          disabled={isGeneratingShorts}
                          className="flex-1 py-3 text-xs font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          {isGeneratingShorts ? <RefreshCcw size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                          예 (다른 구간 추천)
                        </button>
                        <button 
                          onClick={() => alert("쇼츠 선정이 완료되었습니다.")}
                          className="flex-1 py-3 text-xs font-bold text-gray-500 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all"
                        >
                          아니오
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Edited Audio File Export Option (Show only if uploadedAudioFile is present) */}
                  {uploadedAudioFile && (
                    <div className="bg-blue-50 border border-blue-100 p-5 rounded-2xl shadow-sm space-y-4">
                      <p className="text-xs font-bold text-blue-800 uppercase tracking-widest flex items-center gap-1.5">
                        <FileAudio size={16} /> 오디오 편집 기능 활성화됨
                      </p>

                      <p className="text-xs text-blue-700 leading-normal">
                        수락하신 편집 구간들을 제외하여 깨끗하게 이어 붙인 오디오 결과물 파일을 생성하고 다운로드 하실 수 있습니다.
                      </p>

                      {/* Format Selector */}
                      <div className="flex items-center justify-between border-t border-blue-100/50 pt-3">
                        <span className="text-xs font-bold text-blue-800">출력 파일 포맷</span>
                        <div className="bg-blue-100 p-0.5 rounded-lg flex gap-1">
                          <button
                            type="button"
                            onClick={() => setOutputAudioFormat('wav')}
                            className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${outputAudioFormat === 'wav' ? 'bg-white text-blue-700 shadow-sm' : 'text-blue-600 hover:text-blue-800'}`}
                          >
                            WAV
                          </button>
                          <button
                            type="button"
                            onClick={() => setOutputAudioFormat('mp3')}
                            className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${outputAudioFormat === 'mp3' ? 'bg-white text-blue-700 shadow-sm' : 'text-blue-600 hover:text-blue-800'}`}
                          >
                            MP3
                          </button>
                        </div>
                      </div>

                      {/* Encoding Progress Bar */}
                      {encodingProgress !== null && (
                        <div className="space-y-1.5 border-t border-blue-100/50 pt-3">
                          <div className="flex justify-between text-xs font-bold text-blue-800">
                            <span>MP3 인코딩 압축 중...</span>
                            <span>{encodingProgress}%</span>
                          </div>
                          <div className="w-full h-2 bg-blue-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-blue-600 transition-all duration-150"
                              style={{ width: `${encodingProgress}%` }}
                            />
                          </div>
                        </div>
                      )}

                      <button 
                        onClick={handleGenerateEditedAudio}
                        disabled={isGeneratingAudio}
                        className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all flex items-center justify-center space-x-2 active:scale-95 disabled:opacity-50"
                      >
                        {isGeneratingAudio ? (
                          <>
                            <RefreshCcw size={18} className="animate-spin" />
                            <span>
                              {encodingProgress !== null 
                                ? `MP3 변환 압축 중 (${encodingProgress}%)` 
                                : "편집된 오디오 생성 및 병합 중..."
                              }
                            </span>
                          </>
                        ) : (
                          <>
                            <FileAudio size={18} />
                            <span>편집된 오디오 파일 생성하기 ({outputAudioFormat.toUpperCase()})</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {/* Final Export */}
                  <button 
                    onClick={downloadResults}
                    className="w-full py-5 bg-emerald-600 text-white font-bold rounded-2xl shadow-lg hover:bg-emerald-700 transition-all flex items-center justify-center space-x-2 active:scale-95"
                  >
                    <Download size={20} />
                    <span>최종 편집본 결과 다운로드 (.txt)</span>
                  </button>

                  <button 
                    onClick={() => { setAppState('input-script'); setScript(''); setDecisions({}); setResults(null); }}
                    className="w-full py-3 text-sm font-bold text-gray-400 hover:text-gray-600 flex items-center justify-center gap-2"
                  >
                    <RefreshCcw size={16} /> 다시 시작하기
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Bottom Status Bar */}
      <footer className="px-8 py-2 bg-white border-t border-gray-200 flex justify-between items-center shrink-0">
        <div className="flex space-x-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
          <span className="flex items-center">
            <div className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></div> AI Engine Ready
          </span>
          <span className="hidden sm:inline">Analysis Depth: Deep</span>
          <span className="hidden sm:inline">Safety Filter: Active</span>
        </div>
        <div className="text-[10px] text-gray-400 italic">Designed for High Impact Content Production</div>
      </footer>

      {/* API Key Modal */}
      {isApiKeyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xl max-w-md w-full mx-4 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-md font-bold text-gray-800 flex items-center gap-2">
                <Key size={18} className="text-yellow-500" />
                Gemini API 키 설정
              </h2>
              <button 
                onClick={() => setIsApiKeyModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <p className="text-xs text-gray-600 leading-relaxed">
                공용 할당량(Quota) 초과로 인한 API 에러가 발생할 경우, 소지 중이신 <strong className="text-gray-800">개인 Gemini API Key</strong>를 입력해주시면 안정적으로 서비스를 계속 이용하실 수 있습니다. (Key는 안전하게 사용자의 브라우저 로컬 저장소에만 보관됩니다.)
              </p>
              
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block font-mono">Gemini API Key</label>
                <input 
                  type="password"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all font-mono text-sm text-gray-800 shadow-xs"
                />
              </div>
              
              {hasCustomKey && (
                <div className="text-xs text-emerald-600 flex items-center gap-1.5 bg-emerald-50 px-3 py-2 rounded-lg font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  현재 개인 API Key가 설정되어 활성화 상태입니다.
                </div>
              )}
            </div>
            
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-2">
              {hasCustomKey && (
                <button 
                  onClick={handleClearApiKey}
                  className="px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-200"
                >
                  제거하기
                </button>
              )}
              <button 
                onClick={() => setIsApiKeyModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                취소
              </button>
              <button 
                onClick={() => handleSaveApiKey(apiKeyInput)}
                className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
              >
                저장하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
