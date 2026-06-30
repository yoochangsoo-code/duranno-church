import React, { useState, useEffect, useRef } from 'react';
import { 
  FolderOpen, 
  Play, 
  Square, 
  Activity, 
  FileAudio, 
  Trash2, 
  Scissors, 
  CheckCircle, 
  AlertTriangle, 
  Terminal,
  Volume2
} from 'lucide-react';

interface ProgressData {
  currentFile: string;
  currentIndex: number;
  totalFiles: number;
  percent: number;
  status: 'processing' | 'success' | 'error' | 'cancelled';
  log: string;
}

interface FinalResult {
  successCount: number;
  failCount: number;
}

// Global declaration for Electron APIs exposed via preload
declare global {
  interface Window {
    electronAPI: {
      selectFolder: () => Promise<string | null>;
      scanFolder: (folderPath: string) => Promise<{ mp3Count: number; wavCount: number; files: string[] }>;
      startBatchProcess: (config: {
        inputDir: string;
        outputDir: string;
        mode: 'keep' | 'delete';
        startSeconds: number;
        endSeconds: number;
      }) => void;
      cancelBatchProcess: () => void;
      onProgress: (callback: (data: ProgressData) => void) => () => void;
      onFinished: (callback: (result: FinalResult) => void) => () => void;
      onError: (callback: (errorMsg: string) => void) => () => void;
    };
  }
}

export default function App() {
  // Folder states
  const [inputDir, setInputDir] = useState<string>('');
  const [outputDir, setOutputDir] = useState<string>('');
  const [mp3Count, setMp3Count] = useState<number>(0);
  const [wavCount, setWavCount] = useState<number>(0);
  const [detectedFiles, setDetectedFiles] = useState<string[]>([]);

  // Config states
  const [mode, setMode] = useState<'keep' | 'delete'>('keep');
  const [startMin, setStartMin] = useState<number>(53);
  const [startSec, setStartSec] = useState<number>(0);
  const [endMin, setEndMin] = useState<number>(57);
  const [endSec, setEndSec] = useState<number>(45);

  // Execution states
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [finalResult, setFinalResult] = useState<FinalResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // File status tracking map
  const [fileStatuses, setFileStatuses] = useState<Record<string, 'pending' | 'processing' | 'success' | 'error'>>({});

  const consoleEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of log terminal
  useEffect(() => {
    if (consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  // Subscribe to Electron IPC events
  useEffect(() => {
    if (!window.electronAPI) return;

    const unsubscribeProgress = window.electronAPI.onProgress((data) => {
      setProgress(data);
      if (data.log) {
        setLogs((prev) => [...prev, data.log]);
      }
      if (data.currentFile) {
        setFileStatuses((prev) => ({
          ...prev,
          [data.currentFile]: data.status === 'success' || data.status === 'error' ? data.status : 'processing'
        }));
      }
      if (data.status === 'cancelled') {
        setIsProcessing(false);
      }
    });

    const unsubscribeFinished = window.electronAPI.onFinished((result) => {
      setFinalResult(result);
      setIsProcessing(false);
      setLogs((prev) => [...prev, `🎉 일괄 편집이 모두 완료되었습니다! (성공: ${result.successCount}개, 실패: ${result.failCount}개)`]);
    });

    const unsubscribeError = window.electronAPI.onError((msg) => {
      setErrorMsg(msg);
      setIsProcessing(false);
      setLogs((prev) => [...prev, `❌ 에러: ${msg}`]);
    });

    return () => {
      unsubscribeProgress();
      unsubscribeFinished();
      unsubscribeError();
    };
  }, []);

  const handleSelectInputDir = async () => {
    if (isProcessing) return;
    try {
      const path = await window.electronAPI.selectFolder();
      if (path) {
        setInputDir(path);
        // Automatically default output directory to [input]_edited
        if (!outputDir) {
          setOutputDir(`${path}_edited`);
        }
        // Scan audio files
        const scan = await window.electronAPI.scanFolder(path);
        setMp3Count(scan.mp3Count);
        setWavCount(scan.wavCount);
        setDetectedFiles(scan.files);
        
        // Initialize file status
        const initialStatus: Record<string, 'pending'> = {};
        scan.files.forEach(file => {
          initialStatus[file] = 'pending';
        });
        setFileStatuses(initialStatus);
        
        setErrorMsg(null);
        setFinalResult(null);
        setLogs([`📂 입력 폴더 선택됨: ${path}`, `🔍 감지된 파일: MP3 ${scan.mp3Count}개, WAV ${scan.wavCount}개`]);
      }
    } catch (err: any) {
      setErrorMsg(`폴더 선택 실패: ${err.message}`);
    }
  };

  const handleSelectOutputDir = async () => {
    if (isProcessing) return;
    try {
      const path = await window.electronAPI.selectFolder();
      if (path) {
        setOutputDir(path);
        setLogs((prev) => [...prev, `📂 출력 폴더 지정됨: ${path}`]);
      }
    } catch (err: any) {
      setErrorMsg(`폴더 선택 실패: ${err.message}`);
    }
  };

  const handleStartProcess = () => {
    if (isProcessing) return;
    if (!inputDir) {
      setErrorMsg('입력 폴더를 선택해 주세요.');
      return;
    }
    if (!outputDir) {
      setErrorMsg('출력 저장 폴더를 선택해 주세요.');
      return;
    }
    if (detectedFiles.length === 0) {
      setErrorMsg('입력 폴더에 편집할 MP3 또는 WAV 파일이 존재하지 않습니다.');
      return;
    }

    const startSecTotal = startMin * 60 + startSec;
    const endSecTotal = endMin * 60 + endSec;

    if (startSecTotal >= endSecTotal) {
      setErrorMsg('시작 시간이 종료 시간보다 크거나 같을 수 없습니다.');
      return;
    }

    // Reset status
    setErrorMsg(null);
    setFinalResult(null);
    setIsProcessing(true);
    setLogs([
      `🚀 일괄 무손실 편집 프로세스 가동`,
      `설정: 구간 ${mode === 'keep' ? '남기기' : '지우기'} (${startMin}분 ${startSec}초 ~ ${endMin}분 ${endSec}초)`,
      `대상 파일 수: ${detectedFiles.length}개`,
      `-----------------------------------------`
    ]);

    const initialStatus: Record<string, 'pending'> = {};
    detectedFiles.forEach(file => {
      initialStatus[file] = 'pending';
    });
    setFileStatuses(initialStatus);

    window.electronAPI.startBatchProcess({
      inputDir,
      outputDir,
      mode,
      startSeconds: startSecTotal,
      endSeconds: endSecTotal
    });
  };

  const handleCancelProcess = () => {
    if (!isProcessing) return;
    window.electronAPI.cancelBatchProcess();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none antialiased">
      {/* Header */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-30 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-violet-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-violet-500/20">
            <Volume2 className="h-5 w-5 text-white animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-violet-400 via-purple-300 to-cyan-400 bg-clip-text text-transparent">
              Audio Batch Trimmer
            </h1>
            <p className="text-xs text-slate-500 font-semibold tracking-wide">무손실 오디오 일괄 편집 유틸리티</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 bg-slate-900 border border-slate-800 px-2 py-1 rounded-md">
            v1.0.0
          </span>
          <span className="text-[10px] uppercase font-bold tracking-widest text-cyan-400 bg-cyan-950/50 border border-cyan-800/30 px-2 py-1 rounded-md">
            FFMPEG ENGINE
          </span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-hidden">
        
        {/* Left Side: Configuration & Controls */}
        <section className="lg:col-span-7 flex flex-col gap-6">
          
          {/* Folder Path Config Card */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm flex flex-col gap-5">
            <h2 className="text-sm font-semibold tracking-wider text-slate-400 uppercase flex items-center gap-2">
              <FolderOpen className="h-4 w-4 text-violet-400" /> 경로 설정
            </h2>
            
            {/* Input Folder Path */}
            <div className="flex flex-col gap-2">
              <label className="text-xs text-slate-500 font-semibold">음성 파일이 있는 폴더 (Input)</label>
              <div className="flex gap-2">
                <div className="flex-1 bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-sm text-slate-300 font-mono overflow-x-auto whitespace-nowrap scrollbar-none shadow-inner min-h-[44px]">
                  {inputDir || <span className="text-slate-600">폴더를 선택해 주세요...</span>}
                </div>
                <button
                  onClick={handleSelectInputDir}
                  disabled={isProcessing}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-3 rounded-xl transition duration-200 font-medium text-sm flex items-center gap-2 active:scale-95"
                >
                  <FolderOpen className="h-4 w-4" /> 선택
                </button>
              </div>
              {detectedFiles.length > 0 && (
                <div className="flex gap-2 mt-1">
                  <span className="text-[11px] bg-violet-950/60 border border-violet-800/40 text-violet-400 px-2 py-0.5 rounded-full font-semibold">
                    MP3: {mp3Count}개
                  </span>
                  <span className="text-[11px] bg-cyan-950/60 border border-cyan-800/40 text-cyan-400 px-2 py-0.5 rounded-full font-semibold">
                    WAV: {wavCount}개
                  </span>
                </div>
              )}
            </div>

            {/* Output Folder Path */}
            <div className="flex flex-col gap-2">
              <label className="text-xs text-slate-500 font-semibold">저장할 폴더 (Output)</label>
              <div className="flex gap-2">
                <div className="flex-1 bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-sm text-slate-300 font-mono overflow-x-auto whitespace-nowrap scrollbar-none shadow-inner min-h-[44px]">
                  {outputDir || <span className="text-slate-600">폴더를 선택해 주세요...</span>}
                </div>
                <button
                  onClick={handleSelectOutputDir}
                  disabled={isProcessing}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-3 rounded-xl transition duration-200 font-medium text-sm flex items-center gap-2 active:scale-95"
                >
                  <FolderOpen className="h-4 w-4" /> 선택
                </button>
              </div>
              {inputDir && outputDir === `${inputDir}_edited` && (
                <p className="text-[11px] text-slate-500 font-medium">※ 지정하지 않을 시 입력 폴더 하위에 '_edited'가 붙어서 자동 저장됩니다.</p>
              )}
            </div>
          </div>

          {/* Audio Range Trimming Option Card */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm flex flex-col gap-5">
            <h2 className="text-sm font-semibold tracking-wider text-slate-400 uppercase flex items-center gap-2">
              <Activity className="h-4 w-4 text-cyan-400" /> 작업 및 시간 설정
            </h2>

            {/* Processing Mode Toggle */}
            <div className="flex flex-col gap-2">
              <label className="text-xs text-slate-500 font-semibold">편집 동작 선택</label>
              <div className="grid grid-cols-2 gap-3 bg-slate-950 p-1 rounded-xl border border-slate-850">
                <button
                  onClick={() => setMode('keep')}
                  disabled={isProcessing}
                  className={`py-3 rounded-lg text-sm font-semibold transition flex items-center justify-center gap-2 ${
                    mode === 'keep'
                      ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-md shadow-violet-500/10'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Scissors className="h-4 w-4" /> 구간 남기기 (Keep)
                </button>
                <button
                  onClick={() => setMode('delete')}
                  disabled={isProcessing}
                  className={`py-3 rounded-lg text-sm font-semibold transition flex items-center justify-center gap-2 ${
                    mode === 'delete'
                      ? 'bg-gradient-to-r from-cyan-600 to-teal-600 text-white shadow-md shadow-cyan-500/10'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Trash2 className="h-4 w-4" /> 구간 지우기 (Delete)
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-1 font-medium leading-relaxed">
                {mode === 'keep' 
                  ? '💡 설정한 구간 안의 오디오만 추출하여 남기고, 앞/뒤는 버립니다.' 
                  : '💡 설정한 구간만 잘라서 도려내고, 나머지 앞부분과 뒷부분을 무손실 결합합니다.'}
              </p>
            </div>

            {/* Time Settings Inputs */}
            <div className="flex flex-col gap-4">
              <label className="text-xs text-slate-500 font-semibold">구간 설정 (분 / 초)</label>
              <div className="grid grid-cols-2 gap-4">
                
                {/* Start Time Picker */}
                <div className="bg-slate-950 border border-slate-850 rounded-xl p-4 flex flex-col gap-2">
                  <span className="text-xs text-slate-400 font-semibold">시작 시간</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      max={999}
                      value={startMin}
                      onChange={(e) => setStartMin(Math.max(0, parseInt(e.target.value) || 0))}
                      disabled={isProcessing}
                      className="w-16 bg-slate-900 border border-slate-800 rounded-lg py-2 px-3 text-center text-lg font-mono font-bold text-slate-100 focus:outline-none focus:border-violet-500"
                    />
                    <span className="text-sm font-medium text-slate-500">분</span>
                    <input
                      type="number"
                      min={0}
                      max={59}
                      value={startSec}
                      onChange={(e) => setStartSec(Math.min(59, Math.max(0, parseInt(e.target.value) || 0)))}
                      disabled={isProcessing}
                      className="w-16 bg-slate-900 border border-slate-800 rounded-lg py-2 px-3 text-center text-lg font-mono font-bold text-slate-100 focus:outline-none focus:border-violet-500"
                    />
                    <span className="text-sm font-medium text-slate-500">초</span>
                  </div>
                </div>

                {/* End Time Picker */}
                <div className="bg-slate-950 border border-slate-850 rounded-xl p-4 flex flex-col gap-2">
                  <span className="text-xs text-slate-400 font-semibold">종료 시간</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      max={999}
                      value={endMin}
                      onChange={(e) => setEndMin(Math.max(0, parseInt(e.target.value) || 0))}
                      disabled={isProcessing}
                      className="w-16 bg-slate-900 border border-slate-800 rounded-lg py-2 px-3 text-center text-lg font-mono font-bold text-slate-100 focus:outline-none focus:border-cyan-500"
                    />
                    <span className="text-sm font-medium text-slate-500">분</span>
                    <input
                      type="number"
                      min={0}
                      max={59}
                      value={endSec}
                      onChange={(e) => setEndSec(Math.min(59, Math.max(0, parseInt(e.target.value) || 0)))}
                      disabled={isProcessing}
                      className="w-16 bg-slate-900 border border-slate-800 rounded-lg py-2 px-3 text-center text-lg font-mono font-bold text-slate-100 focus:outline-none focus:border-cyan-500"
                    />
                    <span className="text-sm font-medium text-slate-500">초</span>
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* Action Trigger Controls */}
          <div className="flex gap-4">
            {!isProcessing ? (
              <button
                onClick={handleStartProcess}
                className="flex-1 bg-gradient-to-r from-violet-600 via-purple-600 to-cyan-500 hover:brightness-110 active:scale-[0.98] text-white font-bold text-base py-4 px-6 rounded-2xl transition duration-200 flex items-center justify-center gap-2 shadow-lg shadow-violet-500/10 cursor-pointer"
              >
                <Play className="h-5 w-5 fill-current" /> 일괄 편집 시작 (Start Batch)
              </button>
            ) : (
              <button
                onClick={handleCancelProcess}
                className="flex-1 bg-red-950 border border-red-800/40 hover:bg-red-900 text-red-200 font-bold text-base py-4 px-6 rounded-2xl transition duration-200 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Square className="h-4 w-4 fill-current" /> 작업 중단 (Cancel)
              </button>
            )}
          </div>

          {/* Alert messages */}
          {errorMsg && (
            <div className="bg-red-950/40 border border-red-900/60 p-4 rounded-xl flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
              <p className="text-sm text-red-200 font-medium leading-relaxed">{errorMsg}</p>
            </div>
          )}
        </section>

        {/* Right Side: Batch Status & Logs */}
        <section className="lg:col-span-5 flex flex-col gap-6 overflow-hidden">
          
          {/* Progress overview */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm flex flex-col gap-4">
            <h2 className="text-sm font-semibold tracking-wider text-slate-400 uppercase flex items-center gap-2">
              <Activity className="h-4 w-4 text-violet-400" /> 전체 진행률
            </h2>
            
            {/* Gradient progress bar */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-xs font-semibold text-slate-400">
                <span>
                  {progress 
                    ? `완료됨: ${progress.currentIndex} / ${progress.totalFiles}` 
                    : `대기 중...`}
                </span>
                <span>{progress ? progress.percent : 0}%</span>
              </div>
              <div className="w-full bg-slate-950 h-3 rounded-full border border-slate-850 overflow-hidden shadow-inner">
                <div 
                  className="bg-gradient-to-r from-violet-600 via-purple-500 to-cyan-400 h-full rounded-full transition-all duration-300 shadow shadow-cyan-400/20"
                  style={{ width: `${progress ? progress.percent : 0}%` }}
                />
              </div>
            </div>

            {/* Target Files List */}
            <div className="flex flex-col gap-2 flex-1 min-h-[160px] max-h-[220px] overflow-y-auto pr-1 scrollbar-thin">
              <span className="text-xs font-semibold text-slate-500">대기 중인 오디오 목록 ({detectedFiles.length}개)</span>
              <div className="flex flex-col gap-1.5">
                {detectedFiles.length === 0 ? (
                  <div className="text-center py-6 text-slate-600 text-xs font-medium">감지된 오디오 파일이 없습니다.</div>
                ) : (
                  detectedFiles.map((file) => {
                    const status = fileStatuses[file];
                    return (
                      <div 
                        key={file} 
                        className={`flex items-center justify-between text-xs py-2 px-3 rounded-lg border transition ${
                          status === 'processing'
                            ? 'bg-violet-950/20 border-violet-850 text-violet-300'
                            : status === 'success'
                            ? 'bg-slate-950/40 border-slate-850 text-slate-400'
                            : status === 'error'
                            ? 'bg-red-950/20 border-red-900/30 text-red-300'
                            : 'bg-slate-950/20 border-transparent text-slate-500'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <FileAudio className={`h-3.5 w-3.5 shrink-0 ${status === 'processing' ? 'text-violet-400 animate-bounce' : 'text-slate-500'}`} />
                          <span className="truncate">{file}</span>
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider">
                          {status === 'pending' && '대기'}
                          {status === 'processing' && '편집 중'}
                          {status === 'success' && <span className="text-emerald-400">완료</span>}
                          {status === 'error' && <span className="text-red-400">실패</span>}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Live Terminal Log Board */}
          <div className="flex-1 bg-slate-950 border border-slate-900 rounded-2xl p-5 flex flex-col gap-3 min-h-[200px] overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-900 pb-2">
              <span className="text-xs font-bold tracking-wider text-slate-500 uppercase flex items-center gap-1.5">
                <Terminal className="h-3.5 w-3.5 text-cyan-400" /> 상세 콘솔 로그
              </span>
              <button 
                onClick={() => setLogs([])}
                className="text-[10px] uppercase tracking-wider text-slate-600 hover:text-slate-400 font-semibold"
              >
                비우기
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto font-mono text-xs text-slate-300 space-y-1.5 scrollbar-thin">
              {logs.length === 0 ? (
                <div className="text-slate-600 italic py-2">대기 중입니다. 일괄 편집 시작 시 여기에 실시간 진행 기록이 출력됩니다.</div>
              ) : (
                logs.map((log, idx) => {
                  let isSuccess = log.includes('✅') || log.includes('성공:');
                  let isFail = log.includes('❌') || log.includes('실패:');
                  let isCancel = log.includes('⚠️');
                  return (
                    <div 
                      key={idx} 
                      className={`${isSuccess ? 'text-emerald-400' : isFail ? 'text-red-400' : isCancel ? 'text-amber-400 font-bold' : 'text-slate-300'}`}
                    >
                      {log}
                    </div>
                  );
                })
              )}
              <div ref={consoleEndRef} />
            </div>
          </div>
          
        </section>
      </main>
    </div>
  );
}
