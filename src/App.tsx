import {
  Sparkles,
  BookOpen,
  User,
  ArrowLeft,
  ArrowRight,
  Search,
  FileText,
  Download,
  RefreshCw,
  Settings,
  Key,
  AlertCircle,
  CheckCircle2,
  Tv,
  HelpCircle,
  MessageSquare
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { geminiService } from './services/geminiService';
import type { Issue, BiblicalEvent, BiblicalFigure } from './types';

// TypeScript interface declaration for Electron IPC Bridge
declare global {
  interface Window {
    electronAPI?: {
      runAgyPrompt: (prompt: string) => Promise<string>;
      saveFile: (filename: string, content: string) => Promise<string | null>;
    };
  }
}

type AppStep =
  | 'KEY_INPUT'
  | 'ISSUE_SELECTION'
  | 'ISSUE_DETAIL'
  | 'BIBLE_SELECTION'
  | 'CHARACTER_SELECTION'
  | 'ARTICLE_REVIEW'
  | 'SCRIPT_REVIEW'
  | 'COMPLETED';

export default function App() {
  // Authentication & Configuration
  const [useAgyAuth, setUseAgyAuth] = useState<boolean>(false);
  const [apiKey, setApiKey] = useState<string>('');
  const [tempApiKey, setTempApiKey] = useState<string>('');
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [selectedModel, setSelectedModel] = useState<string>('gemini-1.5-pro');

  // App State Flow
  const [step, setStep] = useState<AppStep>('KEY_INPUT');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Data
  const [issues, setIssues] = useState<Issue[]>([]);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [bibleEvents, setBibleEvents] = useState<BiblicalEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<BiblicalEvent | null>(null);
  const [selectedFigure, setSelectedFigure] = useState<BiblicalFigure | null>(null);
  
  const [article, setArticle] = useState<string>('');
  const [articleFeedback, setArticleFeedback] = useState<string>('');
  
  const [script, setScript] = useState<string>('');
  const [scriptFeedback, setScriptFeedback] = useState<string>('');

  // Initial Load Check
  useEffect(() => {
    // If running in Electron, default to Antigravity CLI authentication
    if (window.electronAPI) {
      setUseAgyAuth(true);
      setStep('ISSUE_SELECTION');
      fetchIssues(true, '');
    } else {
      const savedKey = localStorage.getItem('user_gemini_api_key');
      if (savedKey) {
        setApiKey(savedKey);
        setTempApiKey(savedKey);
        setStep('ISSUE_SELECTION');
        fetchIssues(false, savedKey);
      } else {
        setStep('KEY_INPUT');
      }
    }
  }, []);

  const saveApiKey = (key: string) => {
    const trimmed = key.trim();
    if (trimmed) {
      localStorage.setItem('user_gemini_api_key', trimmed);
      setApiKey(trimmed);
      setUseAgyAuth(false);
      setShowSettings(false);
      setError(null);
      if (step === 'KEY_INPUT') {
        setStep('ISSUE_SELECTION');
        fetchIssues(false, trimmed);
      }
    } else {
      localStorage.removeItem('user_gemini_api_key');
      setApiKey('');
      setStep('KEY_INPUT');
    }
  };

  const handleToggleAuthMode = (mode: 'agy' | 'key') => {
    if (mode === 'agy') {
      if (!window.electronAPI) {
        setError('Antigravity CLI 로그인 정보는 데스크톱 앱(.exe) 환경에서만 활성화됩니다.');
        return;
      }
      setUseAgyAuth(true);
      setError(null);
      setShowSettings(false);
      if (step === 'KEY_INPUT') {
        setStep('ISSUE_SELECTION');
        fetchIssues(true, '');
      }
    } else {
      setUseAgyAuth(false);
      const savedKey = localStorage.getItem('user_gemini_api_key') || '';
      setApiKey(savedKey);
      setTempApiKey(savedKey);
      if (!savedKey && step !== 'KEY_INPUT') {
        setStep('KEY_INPUT');
      }
    }
  };

  // Helper function to call Gemini (supports both Direct SDK and CLI command fallback)
  const callAI = async (prompt: string, expectJson = false) => {
    if (useAgyAuth && window.electronAPI) {
      const res = await window.electronAPI.runAgyPrompt(prompt);
      if (expectJson) {
        // Strip markdown block formatting if present
        const cleanJson = res.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleanJson);
      }
      return res;
    } else {
      // Direct API path (already configured in geminiService)
      return null; // Fallback to normal service calls if not in CLI mode
    }
  };

  const fetchIssues = async (isCliMode = useAgyAuth, keyToUse = apiKey) => {
    setLoading(true);
    setError(null);
    try {
      if (isCliMode && window.electronAPI) {
        const prompt = `
          현재 시간은 ${new Date().toISOString()}입니다. Google 검색(Google Search)을 사용하여 최근 뉴스 기사를 찾고, 최근 가장 대중적으로 뜨거운 시사/사회/뉴스 이슈 10개를 선정해주세요.
          각 이슈마다 고유 ID(1~10), 제목(title), 그리고 해당 이슈에 대한 3-4문장 분량의 객관적인 배경 및 설명(summary)을 제공해 주세요.
          반드시 다음 JSON 포맷으로 응답해야 합니다:
          {
            "issues": [
              {
                "id": 1,
                "title": "이슈 제목",
                "summary": "이슈 설명..."
              }
            ]
          }
        `;
        const parsed = await callAI(prompt, true);
        setIssues(parsed.issues || []);
      } else {
        localStorage.setItem('user_gemini_api_key', keyToUse);
        const fetchedIssues = await geminiService.fetchHottestIssues('gemini-1.5-flash');
        setIssues(fetchedIssues);
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.message?.includes('CUSTOM_KEY_FAILED') 
        ? '입력하신 API Key가 올바르지 않거나 권한이 없습니다. 상단 설정을 확인해 주세요.' 
        : '최신 뉴스를 가져오는 데 실패했습니다. 네트워크를 확인하거나 나중에 다시 시도해 주세요.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectIssue = (issue: Issue) => {
    setSelectedIssue(issue);
    setStep('ISSUE_DETAIL');
  };

  const handleConfirmIssue = async () => {
    if (!selectedIssue) return;
    setLoading(true);
    setError(null);
    try {
      if (useAgyAuth && window.electronAPI) {
        const prompt = `
          최근 핫이슈: '${selectedIssue.title}' (${selectedIssue.summary})
          
          이 사회적 이슈와 연관하여 깊이 생각해볼 수 있는 성경 속 사건들을 최대한 많이(최소 4개 이상) 찾아주세요.
          각 사건에 대한 자세한 설명과 그 사건의 주요 등장인물들에 대한 간략한 설명을 포함해야 합니다.
          반드시 다음 JSON 포맷으로 응답해야 합니다:
          {
            "events": [
              {
                "id": 1,
                "title": "성경 속 사건 제목",
                "description": "이 사건에 대한 설명 및 이슈와의 연관성/교훈적 고리 설명",
                "figures": [
                  {
                    "name": "인물 이름",
                    "description": "사건 속에서의 인물 역할 및 특징에 대한 간략한 설명"
                  }
                ]
              }
            ]
          }
        `;
        const parsed = await callAI(prompt, true);
        setBibleEvents(parsed.events || []);
        setStep('BIBLE_SELECTION');
      } else {
        const events = await geminiService.fetchBiblicalEvents(
          selectedIssue.title,
          selectedIssue.summary,
          selectedModel
        );
        setBibleEvents(events);
        setStep('BIBLE_SELECTION');
      }
    } catch (err: any) {
      console.error(err);
      setError('성경 속 사건을 매핑하는 과정에서 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectEvent = (event: BiblicalEvent) => {
    setSelectedEvent(event);
    setSelectedFigure(null);
    setStep('CHARACTER_SELECTION');
  };

  const handleConfirmCharacter = async (figure: BiblicalFigure) => {
    if (!selectedIssue || !selectedEvent) return;
    setSelectedFigure(figure);
    setLoading(true);
    setError(null);
    try {
      if (useAgyAuth && window.electronAPI) {
        const prompt = `
          선택된 사회적 이슈: '${selectedIssue.title}'
          선택된 성경 속 사건: '${selectedEvent.title}'
          주목할 인물: '${figure.name}' (${figure.description})
          
          이 인물을 중심으로 성경 속 사건 '${selectedEvent.title}'을 흥미롭고 감동적인 서사로 생생하게 묘사하고, 이를 통해 오늘날 우리가 마주한 이슈 '${selectedIssue.title}'와 관련하여 깊이 성찰하고 배울 점(적용점 및 교훈)을 다루는 완성도 높은 글(해설 에세이)을 작성해 주세요. 문단 구분을 명확히 하고, 정중하고 은혜로운 톤으로 읽기 쉽게 작성해 주세요.
        `;
        const res = await callAI(prompt, false);
        setArticle(res);
        setStep('ARTICLE_REVIEW');
      } else {
        const generatedArticle = await geminiService.generateInitialArticle(
          selectedIssue.title,
          selectedEvent.title,
          figure.name,
          figure.description,
          selectedModel
        );
        setArticle(generatedArticle);
        setStep('ARTICLE_REVIEW');
      }
    } catch (err: any) {
      console.error(err);
      setError('스토리 초안을 생성하는 도중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefineArticle = async () => {
    if (!selectedIssue || !selectedEvent || !selectedFigure || !articleFeedback.trim()) return;
    setLoading(true);
    setError(null);
    try {
      if (useAgyAuth && window.electronAPI) {
        const prompt = `
          선택된 사회적 이슈: '${selectedIssue.title}'
          선택된 성경 속 사건: '${selectedEvent.title}'
          주목할 인물: '${selectedFigure.name}'
          
          이전 작성된 본문:
          ${article}
          
          사용자의 피드백/보충 요청 사항:
          "${articleFeedback}"
          
          이 피드백을 깊이 있게 반영하여 인물 '${selectedFigure.name}'과 사건 '${selectedEvent.title}'을 중심으로 이전 글을 보완/수정하여 다시 작성해 주세요.
        `;
        const res = await callAI(prompt, false);
        setArticle(res);
        setArticleFeedback('');
      } else {
        const refined = await geminiService.refineArticle(
          selectedIssue.title,
          selectedEvent.title,
          selectedFigure.name,
          article,
          articleFeedback,
          selectedModel
        );
        setArticle(refined);
        setArticleFeedback('');
      }
    } catch (err: any) {
      console.error(err);
      setError('글을 보완하는 도중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateScript = async () => {
    if (!selectedIssue || !selectedEvent || !selectedFigure || !article) return;
    setLoading(true);
    setError(null);
    try {
      if (useAgyAuth && window.electronAPI) {
        const prompt = `
          아래의 본문 내용을 바탕으로, 방송에서 사용할 질문과 답변(Q&A) 형태의 약 20분 분량 방송 원고를 작성해 주세요.
          
          [본문 내용]
          ${article}
          
          [작성 규칙]
          1. 질문자(MC)와 답변자(초대 손님/목회자/전문가)의 2인 대담 형식입니다.
          2. 질문자는 성경 내용이나 이슈에 대해 어느 정도 사전 지식을 갖추고 있지만, 자신이 직접 설명하기보다는 답변자가 핵심 내용과 은혜로운 이야기를 풍성하게 풀어내고 주도적으로 설명할 수 있도록 이끌고 유도 질문하는 역할을 충실히 수행해야 합니다.
          3. 답변자는 성경 속 '${selectedEvent.title}' 사건과 인물 '${selectedFigure.name}'의 흥미진진한 비하인드 스토리부터, 이것이 오늘날의 이슈 '${selectedIssue.title}'를 마주하는 우리에게 주는 교훈과 적용점을 깊이 있고 생생하게 이야기해야 합니다.
          4. 실제 방송 대본처럼 친근하고 자연스러운 구어체 말투(하십시오/해요/죠 등)를 사용해 오프닝 인사, 중간 리액션, 그리고 감동적인 클로징 멘트까지 포함한 매끄러운 방송 흐름으로 구성해 주세요.
          5. 분량은 20분 가량 진행할 수 있도록 매우 상세하고 풍성한 대사량으로 구성해 주세요.
        `;
        const res = await callAI(prompt, false);
        setScript(res);
        setStep('SCRIPT_REVIEW');
      } else {
        const generatedScript = await geminiService.generateScript(
          selectedIssue.title,
          selectedEvent.title,
          selectedFigure.name,
          article,
          selectedModel
        );
        setScript(generatedScript);
        setStep('SCRIPT_REVIEW');
      }
    } catch (err: any) {
      console.error(err);
      setError('방송 원고를 생성하는 도중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefineScript = async () => {
    if (!selectedIssue || !selectedEvent || !selectedFigure || !scriptFeedback.trim()) return;
    setLoading(true);
    setError(null);
    try {
      if (useAgyAuth && window.electronAPI) {
        const prompt = `
          선택된 사회적 이슈: '${selectedIssue.title}'
          선택된 성경 속 사건: '${selectedEvent.title}'
          주목할 인물: '${selectedFigure.name}'
          
          이전 작성된 방송 원고:
          ${script}
          
          사용자의 피드백/보충 요청 사항:
          "${scriptFeedback}"
          
          이 피드백을 반영하여 오프닝, Q&A 내용, 클로징 등을 적절히 보완하고 매끄러운 방송 원고로 다시 작성해 주세요.
        `;
        const res = await callAI(prompt, false);
        setScript(res);
        setScriptFeedback('');
      } else {
        const refined = await geminiService.refineScript(
          selectedIssue.title,
          selectedEvent.title,
          selectedFigure.name,
          script,
          scriptFeedback,
          selectedModel
        );
        setScript(refined);
        setScriptFeedback('');
      }
    } catch (err: any) {
      console.error(err);
      setError('원고를 보완하는 도중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToFile = async () => {
    if (!selectedFigure || !selectedIssue || !script) return;
    
    // Create clean file name (인물+이슈.txt)
    const cleanFigure = selectedFigure.name.replace(/[\s\/\:\*\?\"\<\>\|]/g, '');
    const cleanIssue = selectedIssue.title.replace(/[\s\/\:\*\?\"\<\>\|]/g, '');
    const filename = `${cleanFigure}+${cleanIssue}.txt`;

    if (window.electronAPI) {
      // Use native Save File Dialog inside Electron
      try {
        const savedPath = await window.electronAPI.saveFile(filename, script);
        if (savedPath) {
          setStep('COMPLETED');
        }
      } catch (err) {
        console.error("Failed to save file natively:", err);
        setError("파일을 저장하는 도중 오류가 발생했습니다.");
      }
    } else {
      // Web fallback
      const blob = new Blob([script], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
      setStep('COMPLETED');
    }
  };

  const handleRestart = () => {
    setSelectedIssue(null);
    setSelectedEvent(null);
    setSelectedFigure(null);
    setArticle('');
    setArticleFeedback('');
    setScript('');
    setScriptFeedback('');
    setStep('ISSUE_SELECTION');
    fetchIssues();
  };

  // Helper component to render script content beautifully
  const renderScriptContent = (scriptText: string) => {
    const lines = scriptText.split('\n');
    return (
      <div className="space-y-4">
        {lines.map((line, idx) => {
          const trimmed = line.trim();
          if (!trimmed) return null;

          // Simple parsing for Host (Q) and Guest (A) dialogues
          const isQuestion = trimmed.startsWith('질문자') || trimmed.startsWith('질문') || trimmed.startsWith('MC') || trimmed.startsWith('Q:') || trimmed.startsWith('[질문');
          const isAnswer = trimmed.startsWith('답변자') || trimmed.startsWith('답변') || trimmed.startsWith('패널') || trimmed.startsWith('A:') || trimmed.startsWith('[답변');

          if (isQuestion) {
            return (
              <div key={idx} className="flex items-start gap-3 justify-start">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white font-bold text-xs">
                  질문
                </div>
                <div className="rounded-lg bg-slate-800/80 px-4 py-3 text-sm leading-relaxed text-slate-100 max-w-[85%] border border-slate-700/50">
                  {trimmed}
                </div>
              </div>
            );
          } else if (isAnswer) {
            return (
              <div key={idx} className="flex items-start gap-3 justify-start flex-row-reverse">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white font-bold text-xs">
                  답변
                </div>
                <div className="rounded-lg bg-emerald-950/40 px-4 py-3 text-sm leading-relaxed text-slate-200 max-w-[85%] border border-emerald-900/30">
                  {trimmed}
                </div>
              </div>
            );
          } else {
            return (
              <p key={idx} className="text-slate-300 text-sm pl-12 leading-relaxed">
                {trimmed}
              </p>
            );
          }
        })}
      </div>
    );
  };

  // Render Progress Stepper
  const getProgressWidth = () => {
    switch (step) {
      case 'KEY_INPUT': return '0%';
      case 'ISSUE_SELECTION': return '15%';
      case 'ISSUE_DETAIL': return '30%';
      case 'BIBLE_SELECTION': return '50%';
      case 'CHARACTER_SELECTION': return '65%';
      case 'ARTICLE_REVIEW': return '80%';
      case 'SCRIPT_REVIEW': return '95%';
      case 'COMPLETED': return '100%';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-slate-100 font-sans antialiased pb-12">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-lg bg-slate-900/70 border-b border-slate-800/80 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Tv className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-indigo-200 to-indigo-400 bg-clip-text text-transparent">
              성경 기반 방송 원고 생성기
            </h1>
            <p className="text-xs text-slate-400 font-medium">Auto Broadcasting Script Assistant</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Auth State Badge */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs font-semibold text-slate-300">
            <div className={`h-2 w-2 rounded-full ${useAgyAuth ? 'bg-emerald-500' : 'bg-indigo-500'}`} />
            {useAgyAuth ? 'Antigravity CLI 로그인 사용 중' : 'Gemini API Key 사용 중'}
          </div>

          {!useAgyAuth && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-semibold">사용 모델:</span>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="bg-slate-800 border border-slate-700/80 rounded-lg text-xs px-3 py-1.5 font-medium outline-none text-slate-200 focus:border-indigo-500 transition"
              >
                <option value="gemini-1.5-pro">Gemini 1.5 Pro (고품질 글쓰기)</option>
                <option value="gemini-1.5-flash">Gemini 1.5 Flash (빠른 속도)</option>
              </select>
            </div>
          )}
          
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 rounded-lg bg-slate-800/80 border border-slate-700/60 hover:bg-slate-700/80 hover:text-white transition"
            title="인증 및 API 키 설정"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Progress Indicator */}
      <div className="w-full h-1 bg-slate-800">
        <div 
          className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-500 ease-out" 
          style={{ width: getProgressWidth() }}
        />
      </div>

      <div className="max-w-6xl mx-auto px-6 mt-8">
        {/* API Settings Panel (Expandable) */}
        {showSettings && (
          <div className="mb-6 p-6 rounded-2xl bg-slate-900/90 border border-indigo-900/30 shadow-xl backdrop-blur-xl animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Settings className="h-5 w-5 text-indigo-400" />
                <h3 className="font-bold text-slate-200">인증 및 환경 설정</h3>
              </div>
              <button
                onClick={() => setShowSettings(false)}
                className="text-xs text-slate-400 hover:text-white font-bold"
              >
                닫기
              </button>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              {/* Left Column: Auth Mode Toggle */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide">인증 방식 선택</h4>
                <div className="space-y-2">
                  <button
                    onClick={() => handleToggleAuthMode('agy')}
                    className={`w-full text-left p-3.5 rounded-xl border transition flex items-center justify-between ${
                      useAgyAuth 
                        ? 'border-emerald-600 bg-emerald-950/25 text-white' 
                        : 'border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <p className="text-sm font-bold">Antigravity CLI 로그인 정보 사용</p>
                      <p className="text-[11px] text-slate-400 mt-1">로그인된 agy CLI 세션을 사용해 API 키 입력 없이 연동합니다.</p>
                    </div>
                    {useAgyAuth && <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 ml-2" />}
                  </button>

                  <button
                    onClick={() => handleToggleAuthMode('key')}
                    className={`w-full text-left p-3.5 rounded-xl border transition flex items-center justify-between ${
                      !useAgyAuth 
                        ? 'border-indigo-600 bg-indigo-950/25 text-white' 
                        : 'border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <p className="text-sm font-bold">개별 Gemini API Key 사용</p>
                      <p className="text-[11px] text-slate-400 mt-1">Google AI Studio에서 발급받은 API 키를 직접 등록하여 통신합니다.</p>
                    </div>
                    {!useAgyAuth && <CheckCircle2 className="h-5 w-5 text-indigo-400 shrink-0 ml-2" />}
                  </button>
                </div>
              </div>

              {/* Right Column: Key Config (Visible only in API key mode) */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide">API Key 세부 설정</h4>
                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    개별 API Key 모드를 사용하시는 경우 아래에 키를 붙여넣어 주세요. 
                    키는 브라우저 내부 LocalStorage에 안전하게 격리 보관됩니다.
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      placeholder="Gemini API Key 입력..."
                      value={tempApiKey}
                      onChange={(e) => setTempApiKey(e.target.value)}
                      disabled={useAgyAuth}
                      className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100 outline-none focus:border-indigo-500 transition disabled:opacity-40"
                    />
                    <button
                      onClick={() => saveApiKey(tempApiKey)}
                      disabled={useAgyAuth}
                      className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 px-4 py-1.5 rounded-lg font-bold text-xs text-white transition"
                    >
                      적용
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Global Error Notice */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-950/40 border border-red-900/40 flex items-start gap-3 text-red-200 text-sm">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5 text-red-400" />
            <div className="flex-1">
              <p className="font-semibold">문제가 발생했습니다</p>
              <p className="text-xs text-red-300/90 mt-1 leading-relaxed">{error}</p>
            </div>
            <button 
              onClick={() => setError(null)} 
              className="text-xs text-red-400 font-bold hover:underline"
            >
              닫기
            </button>
          </div>
        )}

        {/* LOADING SCREEN */}
        {loading && (
          <div className="min-h-[50vh] flex flex-col items-center justify-center py-12">
            <div className="relative flex items-center justify-center">
              <div className="h-16 w-16 rounded-full border-4 border-slate-800 border-t-indigo-600 animate-spin" />
              <Sparkles className="h-6 w-6 text-indigo-400 absolute animate-pulse" />
            </div>
            <h3 className="font-bold text-lg text-slate-200 mt-6 animate-pulse">Gemini 인공지능 분석 중</h3>
            <p className="text-xs text-slate-400 mt-2 font-medium">데이터를 분석하고 풍성한 원고 요소를 가공하는 중입니다. 잠시만 기다려주세요.</p>
          </div>
        )}

        {/* STEP 1: KEY INPUT (Onboarding) */}
        {!loading && step === 'KEY_INPUT' && (
          <div className="max-w-md mx-auto my-12 p-8 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-2xl backdrop-blur-xl flex flex-col items-center text-center">
            <div className="h-16 w-16 rounded-2xl bg-indigo-950/80 border border-indigo-800/30 flex items-center justify-center mb-6 shadow-xl shadow-indigo-900/10">
              <Key className="h-8 w-8 text-indigo-400" />
            </div>
            <h2 className="text-2xl font-black text-slate-100">원고 생성기 설정</h2>
            <p className="text-xs text-slate-400 mt-2.5 leading-relaxed max-w-sm">
              방송 원고 자동 생성기를 시작할 인증 수단을 설정해 주세요. 
              현재 실행된 컴퓨터의 Antigravity CLI 로그인 정보를 자동으로 가져올 수 있습니다.
            </p>
            
            <div className="w-full mt-8 space-y-4">
              {window.electronAPI && (
                <button
                  onClick={() => handleToggleAuthMode('agy')}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 py-3.5 rounded-xl font-bold text-sm text-white shadow-lg shadow-emerald-600/10 hover:shadow-emerald-500/20 transition flex items-center justify-center gap-2"
                >
                  <Tv className="h-4 w-4" />
                  Antigravity 로그인 정보로 즉시 시작
                </button>
              )}

              <div className="relative py-2 flex items-center justify-center">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-800" /></div>
                <span className="relative bg-[#0b0f19] px-3 text-xs text-slate-500 font-bold">또는 API 키로 직접 시작</span>
              </div>

              <div className="text-left">
                <label className="text-xs text-slate-400 font-bold block mb-2">Gemini API Key</label>
                <input
                  type="password"
                  placeholder="AI Studio API Key 입력..."
                  value={tempApiKey}
                  onChange={(e) => setTempApiKey(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 outline-none focus:border-indigo-500 transition"
                />
              </div>
              <button
                onClick={() => saveApiKey(tempApiKey)}
                className="w-full bg-indigo-600 hover:bg-indigo-500 py-3.5 rounded-xl font-bold text-sm text-white shadow-lg shadow-indigo-600/10 hover:shadow-indigo-500/20 transition flex items-center justify-center gap-2"
              >
                API 키로 등록하여 시작하기
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            <p className="text-[11px] text-slate-500 mt-6 leading-relaxed">
              API 키가 없으신가요? 무료로 발급받으세요. <br />
              <a href="https://aistudio.google.com" target="_blank" rel="noreferrer" className="text-indigo-400 underline hover:text-indigo-300">Google AI Studio 바로가기</a>
            </p>
          </div>
        )}

        {/* STEP 2: ISSUE SELECTION */}
        {!loading && step === 'ISSUE_SELECTION' && (
          <div className="animate-in fade-in duration-300">
            <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 bg-indigo-950/60 px-3 py-1 rounded-full border border-indigo-900/30">Step 1</span>
                <h2 className="text-3xl font-black text-slate-100 mt-3">최근 핫이슈 선정</h2>
                <p className="text-xs text-slate-400 mt-1.5">실시간 구글 뉴스를 통해 찾아낸 최신 핵심 시사 이슈 10가지 중 하나를 선택해 주세요.</p>
              </div>
              <button
                onClick={() => fetchIssues()}
                className="shrink-0 flex items-center gap-2 text-xs font-bold px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700/60 hover:bg-slate-700/80 hover:text-white transition"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                뉴스 다시 검색하기
              </button>
            </div>

            {issues.length === 0 ? (
              <div className="p-12 rounded-2xl bg-slate-900/20 border border-slate-800/80 text-center flex flex-col items-center">
                <Search className="h-10 w-10 text-slate-500 mb-4 animate-bounce" />
                <p className="font-semibold text-slate-300">뉴스를 로딩하고 있습니다...</p>
                <p className="text-xs text-slate-500 mt-1">API Key를 처음 등록하셨거나 네트워크 요청 중이면 시간이 다소 걸릴 수 있습니다.</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {issues.map((issue) => (
                  <div
                    key={issue.id}
                    onClick={() => handleSelectIssue(issue)}
                    className="p-5 rounded-2xl bg-slate-900/50 hover:bg-slate-900/85 border border-slate-800/80 hover:border-indigo-500/50 transition duration-200 cursor-pointer flex gap-4 group"
                  >
                    <div className="h-10 w-10 shrink-0 rounded-xl bg-slate-800 flex items-center justify-center font-black text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition">
                      {issue.id}
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-bold text-slate-200 group-hover:text-white transition leading-snug">{issue.title}</h3>
                      <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">{issue.summary}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* STEP 3: ISSUE DETAIL */}
        {!loading && step === 'ISSUE_DETAIL' && selectedIssue && (
          <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
            <button
              onClick={() => setStep('ISSUE_SELECTION')}
              className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white mb-6 transition"
            >
              <ArrowLeft className="h-4 w-4" />
              이슈 목록으로 돌아가기
            </button>

            <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-2xl backdrop-blur-xl">
              <span className="text-[10px] font-black tracking-wider text-indigo-400 bg-indigo-950/60 px-3 py-1 rounded-full border border-indigo-900/30 uppercase">Selected Issue</span>
              <h2 className="text-3xl font-black text-slate-100 mt-4 leading-tight">{selectedIssue.title}</h2>
              
              <div className="h-px bg-slate-800 my-6" />

              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide">이슈 요약 및 설명</h4>
                <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">{selectedIssue.summary}</p>
              </div>

              <div className="mt-8 flex gap-4">
                <button
                  onClick={() => setStep('ISSUE_SELECTION')}
                  className="flex-1 bg-slate-800 hover:bg-slate-700/80 border border-slate-700/60 text-slate-200 py-3 rounded-xl font-bold text-sm transition"
                >
                  다른 이슈 고르기
                </button>
                <button
                  onClick={handleConfirmIssue}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl font-bold text-sm shadow-lg shadow-indigo-600/10 hover:shadow-indigo-500/20 transition flex items-center justify-center gap-2"
                >
                  이 이슈 확정하기
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: BIBLE SELECTION */}
        {!loading && step === 'BIBLE_SELECTION' && selectedIssue && (
          <div className="animate-in fade-in duration-300">
            <div className="mb-6">
              <button
                onClick={() => setStep('ISSUE_DETAIL')}
                className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white mb-4 transition"
              >
                <ArrowLeft className="h-4 w-4" />
                이전 단계로 (이슈 확인)
              </button>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 bg-indigo-950/60 px-3 py-1 rounded-full border border-indigo-900/30">Step 2</span>
                  <h2 className="text-3xl font-black text-slate-100 mt-3">성경 속 관련 사건 매핑</h2>
                  <p className="text-xs text-slate-400 mt-1.5">
                    이슈: <span className="text-indigo-400 font-bold">"{selectedIssue.title}"</span>에 비추어 볼 성경 이야기들을 가져왔습니다. 비교해 본 뒤 하나를 선택해 주세요.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {bibleEvents.map((event) => (
                <div
                  key={event.id}
                  onClick={() => handleSelectEvent(event)}
                  className="p-6 rounded-2xl bg-slate-900/60 hover:bg-slate-900/90 border border-slate-800/80 hover:border-indigo-500/50 cursor-pointer flex flex-col justify-between transition duration-200 group"
                >
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-indigo-950/80 border border-indigo-900/30 flex items-center justify-center font-bold text-indigo-400">
                        {event.id}
                      </div>
                      <h3 className="font-extrabold text-slate-200 group-hover:text-white transition">{event.title}</h3>
                    </div>
                    
                    <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">{event.description}</p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-800/60">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-2">사건 주요 인물</span>
                    <div className="flex flex-wrap gap-1.5">
                      {event.figures.map((fig, idx) => (
                        <span 
                          key={idx}
                          className="text-[10px] font-semibold bg-slate-800/60 text-slate-300 px-2.5 py-1 rounded-md border border-slate-700/40"
                        >
                          {fig.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 5: CHARACTER SELECTION */}
        {!loading && step === 'CHARACTER_SELECTION' && selectedIssue && selectedEvent && (
          <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
            <button
              onClick={() => setStep('BIBLE_SELECTION')}
              className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white mb-6 transition"
            >
              <ArrowLeft className="h-4 w-4" />
              성경 사건 목록으로 돌아가기
            </button>

            <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-2xl backdrop-blur-xl">
              <span className="text-[10px] font-black tracking-wider text-indigo-400 bg-indigo-950/60 px-3 py-1 rounded-full border border-indigo-900/30 uppercase">Step 3</span>
              <h2 className="text-2xl font-black text-slate-100 mt-4 leading-tight">주목할 성경 인물 선택</h2>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                사건: <span className="font-semibold text-slate-200">"{selectedEvent.title}"</span> 속 등장인물 중 방송 원고에서 주인공으로 주목해 볼 인물을 선택해 주세요.
              </p>

              <div className="h-px bg-slate-800 my-6" />

              <div className="space-y-4">
                {selectedEvent.figures.map((figure, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleConfirmCharacter(figure)}
                    className="p-5 rounded-xl bg-slate-950/80 hover:bg-indigo-950/20 border border-slate-800 hover:border-indigo-500/50 cursor-pointer flex gap-4 items-start transition"
                  >
                    <div className="h-10 w-10 shrink-0 rounded-xl bg-slate-900 flex items-center justify-center border border-slate-800">
                      <User className="h-5 w-5 text-indigo-400" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-extrabold text-slate-200">{figure.name}</h4>
                      <p className="text-xs text-slate-400 leading-relaxed">{figure.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 6: ARTICLE REVIEW & REFINEMENT */}
        {!loading && step === 'ARTICLE_REVIEW' && selectedIssue && selectedEvent && selectedFigure && (
          <div className="grid gap-6 lg:grid-cols-[1fr_380px] animate-in fade-in duration-300">
            {/* Left Column: Document Viewer */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setStep('CHARACTER_SELECTION')}
                  className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition"
                >
                  <ArrowLeft className="h-4 w-4" />
                  이전 단계 (인물 재선택)
                </button>
                <span className="text-[10px] font-bold text-indigo-400 bg-indigo-950/60 px-3 py-1 rounded-full border border-indigo-900/30">
                  Step 4: 글감 초안 검토
                </span>
              </div>

              <div className="p-8 rounded-2xl bg-slate-900/40 border border-slate-800/80 shadow-xl max-h-[70vh] overflow-y-auto scrollbar-thin">
                <div className="space-y-2 mb-6">
                  <h3 className="text-3xl font-black text-slate-100">{selectedFigure.name}과 {selectedIssue.title}</h3>
                  <p className="text-xs text-slate-400 font-medium">사건: {selectedEvent.title}</p>
                </div>
                
                <div className="h-px bg-slate-800/80 my-6" />

                <div className="prose prose-invert max-w-none text-slate-200 text-sm leading-relaxed whitespace-pre-wrap space-y-4">
                  {article}
                </div>
              </div>
            </div>

            {/* Right Column: Feedback Panel */}
            <div className="space-y-6">
              <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-xl space-y-6">
                <div>
                  <h4 className="font-extrabold text-slate-200">글감 내용 피드백 및 보완</h4>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    본문에 반영하거나 보충하고 싶은 구체적인 성경 세부 사항이나 교훈, 추가 요청 사항을 남겨주시면 바로 수정해 드립니다.
                  </p>
                </div>

                <div className="space-y-3">
                  <textarea
                    rows={6}
                    placeholder="예시: '요셉의 감옥 생활 속 고난과 인내의 비하인드 스토리를 더 생생하게 강조하고 오늘날 청년들의 좌절감과 연결해줘...'"
                    value={articleFeedback}
                    onChange={(e) => setArticleFeedback(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 outline-none focus:border-indigo-500 transition resize-none leading-relaxed"
                  />
                  <button
                    onClick={handleRefineArticle}
                    disabled={!articleFeedback.trim()}
                    className="w-full bg-slate-800 hover:bg-slate-700/80 border border-slate-700/60 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold text-slate-100 py-3 rounded-xl transition flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    본문에 피드백 반영하기
                  </button>
                </div>

                <div className="h-px bg-slate-800/60" />

                <div className="space-y-3">
                  <div className="p-3 bg-indigo-950/20 border border-indigo-900/30 rounded-xl text-[11px] text-slate-400 leading-relaxed">
                    현재 완성된 글감 본문이 마음에 드신다면, 아래 버튼을 눌러 방송 형식의 Q&A 20분 원고 제작으로 진행해 주세요.
                  </div>
                  <button
                    onClick={handleGenerateScript}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3.5 rounded-xl font-bold text-sm shadow-lg shadow-indigo-600/10 hover:shadow-indigo-500/20 transition flex items-center justify-center gap-2"
                  >
                    <FileText className="h-4 w-4" />
                    20분 Q&A 원고 만들기
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 7: SCRIPT REVIEW & REFINEMENT */}
        {!loading && step === 'SCRIPT_REVIEW' && selectedIssue && selectedEvent && selectedFigure && (
          <div className="grid gap-6 lg:grid-cols-[1fr_380px] animate-in fade-in duration-300">
            {/* Left Column: Script Viewer */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setStep('ARTICLE_REVIEW')}
                  className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition"
                >
                  <ArrowLeft className="h-4 w-4" />
                  이전 단계 (글감 검토)
                </button>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-900/30">
                  Step 5: 방송 원고 편집
                </span>
              </div>

              <div className="p-8 rounded-2xl bg-slate-900/40 border border-slate-800/80 shadow-xl max-h-[75vh] overflow-y-auto scrollbar-thin">
                <div className="space-y-2 mb-6">
                  <div className="flex items-center gap-3">
                    <span className="text-xs bg-emerald-600 text-white font-bold px-2 py-0.5 rounded">Q&A 대본</span>
                    <h3 className="text-2xl font-black text-slate-100">{selectedFigure.name}과 {selectedIssue.title} 원고</h3>
                  </div>
                  <p className="text-xs text-slate-400 font-medium">시간 분량: 약 20분 방송 분량</p>
                </div>
                
                <div className="h-px bg-slate-800/80 my-6" />

                {renderScriptContent(script)}
              </div>
            </div>

            {/* Right Column: Feedback and Save Panel */}
            <div className="space-y-6">
              <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-xl space-y-6">
                <div>
                  <h4 className="font-extrabold text-slate-200">원고 세부 조율 피드백</h4>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    질문자의 대사 톤, 답변자의 예시 비중, 대본의 구성 추가 사항을 아래 남겨서 실시간으로 대본을 수정할 수 있습니다.
                  </p>
                </div>

                <div className="space-y-3">
                  <textarea
                    rows={6}
                    placeholder="예시: '질문자(MC)의 리액션을 좀 더 자연스럽게 하고, 성경 낭독 파트를 오프닝 바로 뒤에 추가해줘...'"
                    value={scriptFeedback}
                    onChange={(e) => setScriptFeedback(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 outline-none focus:border-indigo-500 transition resize-none leading-relaxed"
                  />
                  <button
                    onClick={handleRefineScript}
                    disabled={!scriptFeedback.trim()}
                    className="w-full bg-slate-800 hover:bg-slate-700/80 border border-slate-700/60 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold text-slate-100 py-3 rounded-xl transition flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    원고 대본에 피드백 반영하기
                  </button>
                </div>

                <div className="h-px bg-slate-800/60" />

                <div className="space-y-3">
                  <div className="p-3 bg-emerald-950/20 border border-emerald-900/30 rounded-xl text-[11px] text-slate-400 leading-relaxed">
                    원고 작성이 완성되었습니다. 버튼을 누르면 인물명과 이슈명이 매핑된 텍스트 파일로 내보내어 다운로드합니다.
                  </div>
                  <button
                    onClick={handleSaveToFile}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3.5 rounded-xl font-bold text-sm shadow-lg shadow-emerald-600/10 hover:shadow-emerald-500/20 transition flex items-center justify-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    파일로 저장하기
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 8: COMPLETED SCREEN */}
        {!loading && step === 'COMPLETED' && selectedFigure && selectedIssue && (
          <div className="max-w-md mx-auto my-12 p-8 rounded-2xl bg-slate-900/60 border border-emerald-900/30 shadow-2xl backdrop-blur-xl flex flex-col items-center text-center animate-in zoom-in-95 duration-300">
            <div className="h-16 w-16 rounded-2xl bg-emerald-950/80 border border-emerald-800/30 flex items-center justify-center mb-6 shadow-xl shadow-emerald-900/10">
              <CheckCircle2 className="h-8 w-8 text-emerald-400" />
            </div>
            
            <h2 className="text-2xl font-black text-slate-100">원고 내보내기 완료!</h2>
            <p className="text-xs text-slate-400 mt-2.5 leading-relaxed max-w-sm">
              인물 '{selectedFigure.name}'과 이슈 '{selectedIssue.title}'를 중심으로 작성된 20분 분량의 방송 원고가 텍스트 파일로 컴퓨터에 안전하게 저장되었습니다.
            </p>

            <div className="w-full mt-8 p-4 bg-slate-950/80 border border-slate-800 rounded-xl text-left space-y-1.5 font-mono text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">저장 파일:</span>
                <span className="text-slate-300 font-bold">{selectedFigure.name.replace(/\s/g, '')}+{selectedIssue.title.replace(/\s/g, '')}.txt</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">인증 모드:</span>
                <span className="text-indigo-400">{useAgyAuth ? 'Antigravity CLI Session' : 'Custom API Key'}</span>
              </div>
            </div>

            <button
              onClick={handleRestart}
              className="w-full mt-6 bg-indigo-600 hover:bg-indigo-500 py-3 rounded-xl font-bold text-sm text-white shadow-lg shadow-indigo-600/10 hover:shadow-indigo-500/20 transition"
            >
              새로운 원고 만들기
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
