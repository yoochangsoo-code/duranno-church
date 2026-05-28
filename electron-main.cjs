const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    title: "Changsoo's 방송 편집 도우미",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false, // Allows flexible playback in local file environments
    },
    icon: path.join(__dirname, 'dist', 'favicon.ico')
  });

  // Check if we are running in dev mode or prod mode
  const isDev = process.env.NODE_ENV === 'development';

  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
    // Open Developer Tools in developer mode
    mainWindow.webContents.openDevTools();
  } else {
    // Load local built html file
    mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Create standard menu template
  const template = [
    {
      label: '새로고침',
      role: 'reload'
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
        { label: '모두 선택', role: 'selectAll' }
      ]
    },
    {
      label: '보기',
      submenu: [
        { label: '전체화면', role: 'togglefullscreen' },
        { label: '개발자 도구', role: 'toggleDevTools' },
        { type: 'separator' },
        { label: '실제 크기', role: 'resetZoom' },
        { label: '확대', role: 'zoomIn' },
        { label: '축소', role: 'zoomOut' }
      ]
    },
    {
      label: '도움말',
      submenu: [
        {
          label: '정보',
          click: async () => {
            const { dialog } = require('electron');
            dialog.showMessageBox(mainWindow, {
              title: "이 프로그램 정보",
              message: "Changsoo's 방송 편집 도우미 v1.0.0",
              detail: "AI 기반 오디오 분석, 정밀 전사 및 구간 전조율 편집 보조 도구입니다.",
              buttons: ["확인"]
            });
          }
        }
      ]
    }
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
