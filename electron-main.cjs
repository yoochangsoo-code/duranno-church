const { app, BrowserWindow, Menu, ipcMain, dialog } = require('electron');
const path = require('path');
const { exec, execFile } = require('child_process');
const fs = require('fs');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    title: '방송 원고 생성기',
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

// IPC main handlers
ipcMain.handle('run-agy-prompt', async (event, payload) => {
  return new Promise((resolve, reject) => {
    let prompt = '';
    let model = '';
    if (typeof payload === 'string') {
      prompt = payload;
    } else if (payload && typeof payload === 'object') {
      prompt = payload.prompt || '';
      model = payload.model || '';
    }

    // Resolve agy.exe path
    const localAppData = process.env.LOCALAPPDATA || path.join(process.env.USERPROFILE || '', 'AppData', 'Local');
    const defaultAgyPath = path.join(localAppData, 'agy', 'bin', 'agy.exe');
    const agyCommand = fs.existsSync(defaultAgyPath) ? defaultAgyPath : 'agy';

    const args = [];
    args.push('--dangerously-skip-permissions');
    if (model) {
      args.push('--model', model);
    }
    args.push('--print', prompt);

    let stdoutData = '';
    let stderrData = '';

    const child = execFile(agyCommand, args, { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
      clearTimeout(timeoutId);
      if (error) {
        if (error.killed) {
          reject(new Error(`CLI 실행 시간 초과 (30초).\n\n[표준 출력]:\n${stdoutData || '(없음)'}\n\n[표준 에러]:\n${stderrData || '(없음)'}`));
        } else {
          console.error("agy execFile error:", error);
          reject(new Error(stderr || error.message));
        }
      } else {
        resolve(stdout);
      }
    });

    child.stdout.on('data', (data) => {
      stdoutData += data;
    });

    child.stderr.on('data', (data) => {
      stderrData += data;
    });

    // 30 seconds timeout to prevent indefinite hangs
    const timeoutId = setTimeout(() => {
      child.kill();
    }, 30000);
  });
});

ipcMain.handle('save-file', async (event, { filename, content }) => {
  const { filePath } = await dialog.showSaveDialog(mainWindow, {
    defaultPath: filename,
    filters: [{ name: 'Text Files', extensions: ['txt'] }]
  });
  if (filePath) {
    fs.writeFileSync(filePath, content, 'utf8');
    return filePath;
  }
  return null;
});
