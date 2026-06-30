const { app, BrowserWindow, Menu, ipcMain, dialog } = require('electron');
const path = require('path');
const { exec, execFile, spawn } = require('child_process');
const fs = require('fs');
const ffmpegStatic = require('ffmpeg-static');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    title: '오디오 일괄 편집기',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false,
      preload: path.join(__dirname, 'preload.cjs'),
    },
    icon: path.join(__dirname, 'dist', 'favicon.ico'),
  });

  const isDev = process.env.NODE_ENV === 'development';

  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const template = [
    {
      label: '새로고침',
      role: 'reload',
    },
    {
      label: '편집',
      submenu: [
        { label: '실행 취소', role: 'undo' },
        { label: '다시 실행', role: 'redo' },
        { type: 'separator' },
        { label: '잘라내기', role: 'cut' },
        { label: '복사', role: 'copy' },
        { label: '붙여넣기', role: 'paste' },
        { label: '모두 선택', role: 'selectAll' },
      ],
    },
    {
      label: '보기',
      submenu: [
        { label: '전체 화면', role: 'togglefullscreen' },
        { label: '개발자 도구', role: 'toggleDevTools' },
        { type: 'separator' },
        { label: '실제 크기', role: 'resetZoom' },
        { label: '확대', role: 'zoomIn' },
        { label: '축소', role: 'zoomOut' },
      ],
    },
    {
      label: '도움말',
      submenu: [
        {
          label: '정보',
          click: async () => {
            const { dialog } = require('electron');
            dialog.showMessageBox(mainWindow, {
              title: '프로그램 정보',
              message: '여행지 추천 v1.0.0',
              detail:
                '여행 취향, 동행, 기간, 예산을 바탕으로 현실적인 여행지와 상담 연결을 제안하는 프로그램입니다.',
              buttons: ['확인'],
            });
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// Helper to copy credentials and settings to a temporary isolated profile to prevent database lock conflicts
function prepareIsolatedAgyProfile() {
  const appDataPath = app.getPath('userData');
  const tempProfilePath = path.join(appDataPath, 'agy_profile');
  const tempAgyPath = path.join(tempProfilePath, '.gemini', 'antigravity-cli');
  
  const realHome = process.env.USERPROFILE || path.join(process.env.HOMEDRIVE || 'C:', process.env.HOMEPATH || '');
  const realAgyPath = path.join(realHome, '.gemini', 'antigravity-cli');

  try {
    if (!fs.existsSync(tempAgyPath)) {
      fs.mkdirSync(tempAgyPath, { recursive: true });
    }

    // Copy configuration files without database/history locks
    const filesToCopy = ['settings.json', 'installation_id'];
    filesToCopy.forEach(file => {
      const src = path.join(realAgyPath, file);
      const dest = path.join(tempAgyPath, file);
      if (fs.existsSync(src)) {
        fs.copyFileSync(src, dest);
      }
    });

    // Copy implicit credentials folder recursively
    const srcImplicit = path.join(realAgyPath, 'implicit');
    const destImplicit = path.join(tempAgyPath, 'implicit');
    if (fs.existsSync(srcImplicit)) {
      if (!fs.existsSync(destImplicit)) {
        fs.mkdirSync(destImplicit, { recursive: true });
      }
      const files = fs.readdirSync(srcImplicit);
      files.forEach(file => {
        fs.copyFileSync(path.join(srcImplicit, file), path.join(destImplicit, file));
      });
    }
    
    return tempProfilePath;
  } catch (err) {
    console.error("Failed to prepare isolated agy profile:", err);
    return null;
  }
}

// Active child processes list for cancellation
let activeProcesses = [];
let isCancelled = false;

// Helper to run FFmpeg command as a promise with cancellation tracking
function runFFmpeg(args, ffmpegPath, onCreated) {
  return new Promise((resolve, reject) => {
    const child = spawn(ffmpegPath, args);
    if (onCreated) onCreated(child);
    
    let stderr = '';
    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      // Remove process from active list
      activeProcesses = activeProcesses.filter(p => p !== child);
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`FFmpeg exit code ${code}. Error: ${stderr}`));
      }
    });

    child.on('error', (err) => {
      activeProcesses = activeProcesses.filter(p => p !== child);
      reject(err);
    });
  });
}

// Helper to get audio duration using FFmpeg (stderr outputs format info)
function getAudioDuration(filePath, ffmpegPath) {
  return new Promise((resolve) => {
    const child = spawn(ffmpegPath, ['-i', filePath]);
    activeProcesses.push(child);
    
    let stderr = '';
    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', () => {
      activeProcesses = activeProcesses.filter(p => p !== child);
      const match = stderr.match(/Duration:\s*(\d+):(\d+):(\d+)\.(\d+)/);
      if (match) {
        const hours = parseInt(match[1], 10);
        const minutes = parseInt(match[2], 10);
        const seconds = parseInt(match[3], 10);
        const totalSeconds = hours * 3600 + minutes * 60 + seconds;
        resolve(totalSeconds);
      } else {
        resolve(null);
      }
    });
  });
}

// IPC main handlers
ipcMain.handle('select-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });
  if (result.canceled) {
    return null;
  }
  return result.filePaths[0];
});

ipcMain.handle('scan-folder', async (event, folderPath) => {
  try {
    if (!fs.existsSync(folderPath)) {
      return { mp3Count: 0, wavCount: 0, files: [] };
    }
    const files = fs.readdirSync(folderPath);
    const audioFiles = files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ext === '.mp3' || ext === '.wav';
    });
    const mp3Count = audioFiles.filter(file => path.extname(file).toLowerCase() === '.mp3').length;
    const wavCount = audioFiles.filter(file => path.extname(file).toLowerCase() === '.wav').length;
    return {
      mp3Count,
      wavCount,
      files: audioFiles
    };
  } catch (err) {
    console.error("scan-folder error:", err);
    return { mp3Count: 0, wavCount: 0, files: [] };
  }
});

ipcMain.on('cancel-batch-process', () => {
  isCancelled = true;
  mainWindow.webContents.send('process-progress', {
    currentFile: '',
    currentIndex: 0,
    totalFiles: 0,
    percent: 0,
    status: 'cancelled',
    log: '⚠️ 작업이 사용자에 의해 중단되었습니다.'
  });
  
  // Kill all active subprocesses
  activeProcesses.forEach(proc => {
    try {
      proc.kill('SIGKILL');
    } catch (e) {
      console.error(e);
    }
  });
  activeProcesses = [];
});

ipcMain.on('start-batch-process', async (event, config) => {
  const { inputDir, outputDir, mode, startSeconds, endSeconds } = config;
  isCancelled = false;
  activeProcesses = [];

  // Determine ffmpeg.exe path
  const ffmpegPath = app.isPackaged
    ? path.join(process.resourcesPath, 'ffmpeg.exe')
    : ffmpegStatic;

  try {
    if (!fs.existsSync(inputDir)) {
      mainWindow.webContents.send('process-error', '입력 폴더가 존재하지 않습니다.');
      return;
    }

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const files = fs.readdirSync(inputDir).filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ext === '.mp3' || ext === '.wav';
    });

    const totalFiles = files.length;
    if (totalFiles === 0) {
      mainWindow.webContents.send('process-error', '입력 폴더에 MP3 또는 WAV 파일이 없습니다.');
      return;
    }

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < totalFiles; i++) {
      if (isCancelled) break;

      const file = files[i];
      const inputPath = path.join(inputDir, file);
      
      // Prevent overwrite conflict: If outputDir is the same as inputDir, append _trimmed
      let outputFilename = file;
      if (path.resolve(inputDir) === path.resolve(outputDir)) {
        const ext = path.extname(file);
        const name = path.basename(file, ext);
        outputFilename = `${name}_trimmed${ext}`;
      }
      const outputPath = path.join(outputDir, outputFilename);

      mainWindow.webContents.send('process-progress', {
        currentFile: file,
        currentIndex: i + 1,
        totalFiles,
        percent: Math.round(((i) / totalFiles) * 100),
        status: 'processing',
        log: `[${i + 1}/${totalFiles}] "${file}" 편집 시작...`
      });

      try {
        const duration = await getAudioDuration(inputPath, ffmpegPath);
        
        if (duration !== null && startSeconds >= duration) {
          throw new Error(`시작 시간(${startSeconds}초)이 파일 재생 길이(${duration}초)보다 깁니다. 편집을 건너뜁니다.`);
        }

        if (mode === 'keep') {
          // Keep mode: Trim from startSeconds to endSeconds
          // ffmpeg -y -ss [start] -to [end] -i [input] -c:a copy [output]
          const args = ['-y', '-ss', startSeconds.toString()];
          
          // Only apply end time limit if endSeconds is defined and less than actual duration
          if (endSeconds && (duration === null || endSeconds < duration)) {
            args.push('-to', endSeconds.toString());
          }
          
          args.push('-i', inputPath, '-c:a copy', outputPath);
          
          await runFFmpeg(args, ffmpegPath, (child) => {
            activeProcesses.push(child);
          });
        } else {
          // Delete mode: Concatenate Part 1 (0 to startSeconds) and Part 2 (endSeconds to end)
          const tempId = Math.random().toString(36).substring(2, 8);
          const tempPart1 = path.join(outputDir, `_temp_${tempId}_p1${path.extname(file)}`);
          const tempPart2 = path.join(outputDir, `_temp_${tempId}_p2${path.extname(file)}`);
          const tempConcatList = path.join(outputDir, `_temp_${tempId}_list.txt`);

          let partsToConcat = [];

          // 1. Part 1 (0 to startSeconds)
          mainWindow.webContents.send('process-progress', {
            currentFile: file,
            currentIndex: i + 1,
            totalFiles,
            percent: Math.round(((i + 0.3) / totalFiles) * 100),
            status: 'processing',
            log: `[${i + 1}/${totalFiles}] "${file}" - 1단계: 앞 조각 생성 중...`
          });
          const part1Args = ['-y', '-to', startSeconds.toString(), '-i', inputPath, '-c:a copy', tempPart1];
          await runFFmpeg(part1Args, ffmpegPath, (child) => {
            activeProcesses.push(child);
          });
          partsToConcat.push(tempPart1);

          // 2. Part 2 (endSeconds to end) - Only if endSeconds is within file duration
          if (duration === null || endSeconds < duration) {
            mainWindow.webContents.send('process-progress', {
              currentFile: file,
              currentIndex: i + 1,
              totalFiles,
              percent: Math.round(((i + 0.6) / totalFiles) * 100),
              status: 'processing',
              log: `[${i + 1}/${totalFiles}] "${file}" - 2단계: 뒤 조각 생성 중...`
            });
            const part2Args = ['-y', '-ss', endSeconds.toString(), '-i', inputPath, '-c:a copy', tempPart2];
            await runFFmpeg(part2Args, ffmpegPath, (child) => {
              activeProcesses.push(child);
            });
            partsToConcat.push(tempPart2);
          } else {
            mainWindow.webContents.send('process-progress', {
              currentFile: file,
              currentIndex: i + 1,
              totalFiles,
              percent: Math.round(((i + 0.6) / totalFiles) * 100),
              status: 'processing',
              log: `[${i + 1}/${totalFiles}] "${file}" - 2단계 건너뜀 (종료 지점이 오디오 길이를 초과)`
            });
          }

          // 3. Concat parts
          mainWindow.webContents.send('process-progress', {
            currentFile: file,
            currentIndex: i + 1,
            totalFiles,
            percent: Math.round(((i + 0.8) / totalFiles) * 100),
            status: 'processing',
            log: `[${i + 1}/${totalFiles}] "${file}" - 3단계: 두 조각 병합 중...`
          });

          if (partsToConcat.length === 2) {
            // Write list file (use relative paths or file protocols to handle spaces and backslashes)
            // For concat demuxer on Windows, paths must be escaped or relative. Relative is safest.
            const p1Relative = path.basename(tempPart1);
            const p2Relative = path.basename(tempPart2);
            const listContent = `file '${p1Relative}'\nfile '${p2Relative}'\n`;
            fs.writeFileSync(tempConcatList, listContent, 'utf8');

            const concatArgs = ['-y', '-f', 'concat', '-safe', '0', '-i', tempConcatList, '-c:a copy', outputPath];
            
            // Run concat from outputDir CWD so relative paths in list work perfectly
            await new Promise((resolve, reject) => {
              const child = spawn(ffmpegPath, concatArgs, { cwd: outputDir });
              activeProcesses.push(child);
              
              let stderr = '';
              child.stderr.on('data', (data) => stderr += data.toString());
              child.on('close', (code) => {
                activeProcesses = activeProcesses.filter(p => p !== child);
                if (code === 0) resolve();
                else reject(new Error(`FFmpeg concat error: ${stderr}`));
              });
              child.on('error', (err) => {
                activeProcesses = activeProcesses.filter(p => p !== child);
                reject(err);
              });
            });
          } else if (partsToConcat.length === 1) {
            // Just copy Part 1 as final output (since endSeconds was out of range)
            fs.copyFileSync(tempPart1, outputPath);
          }

          // Cleanup temp files
          partsToConcat.forEach(tempFile => {
            if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
          });
          if (fs.existsSync(tempConcatList)) fs.unlinkSync(tempConcatList);
        }

        successCount++;
        mainWindow.webContents.send('process-progress', {
          currentFile: file,
          currentIndex: i + 1,
          totalFiles,
          percent: Math.round(((i + 1) / totalFiles) * 100),
          status: 'success',
          log: `✅ "${file}" 편집 완료!`
        });

      } catch (err) {
        failCount++;
        console.error(`Error processing file ${file}:`, err);
        mainWindow.webContents.send('process-progress', {
          currentFile: file,
          currentIndex: i + 1,
          totalFiles,
          percent: Math.round(((i + 1) / totalFiles) * 100),
          status: 'error',
          log: `❌ "${file}" 실패: ${err.message}`
        });
      }
    }

    if (!isCancelled) {
      mainWindow.webContents.send('process-finished', { successCount, failCount });
    }
  } catch (err) {
    mainWindow.webContents.send('process-error', `치명적 오류 발생: ${err.message}`);
  }
});
