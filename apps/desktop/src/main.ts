import { app, BrowserWindow, shell, ipcMain } from 'electron';
import { join } from 'node:path';
import { fork, type ChildProcess } from 'node:child_process';

let mainWindow: BrowserWindow | null = null;
let serverProcess: ChildProcess | null = null;

const SERVER_PORT = 3712;
const isDev = process.env['NODE_ENV'] === 'development';

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    title: 'DevOS',
    backgroundColor: '#0a0a0a',
    titleBarStyle: 'hiddenInset', // Clean title bar on macOS
    webPreferences: {
      preload: join(__dirname, 'preload', 'preload.js'),
      // Security: disable dangerous features
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
    },
  });

  // Security: block navigation to external URLs
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith(`http://localhost:${SERVER_PORT}`) && !url.startsWith('http://localhost:5173')) {
      event.preventDefault();
    }
  });

  // Security: block new window creation
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    // Open external URLs in the system browser
    if (url.startsWith('http://') || url.startsWith('https://')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  // Load the app
  if (isDev) {
    // In dev mode, load the Vite dev server
    await mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    // In production, load the built frontend
    await mainWindow.loadURL(`http://localhost:${SERVER_PORT}`);
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

async function startServer(): Promise<void> {
  // In production, start the backend server
  if (!isDev) {
    const serverPath = join(__dirname, '..', '..', '..', 'packages', 'server', 'dist', 'main.js');
    serverProcess = fork(serverPath, [], {
      env: {
        ...process.env,
        DEVOS_PORT: String(SERVER_PORT),
      },
      stdio: 'pipe',
    });

    serverProcess.stdout?.on('data', (data) => {
      console.log(`[server] ${data}`);
    });

    serverProcess.stderr?.on('data', (data) => {
      console.error(`[server] ${data}`);
    });

    // Wait for server to be ready
    await waitForServer();
  }
}

async function waitForServer(maxRetries = 30): Promise<void> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(`http://localhost:${SERVER_PORT}/health`);
      if (response.ok) return;
    } catch {
      // Server not ready yet
    }
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  throw new Error('Server failed to start');
}

function stopServer(): void {
  if (serverProcess) {
    serverProcess.kill();
    serverProcess = null;
  }
}

// IPC handlers
ipcMain.handle('get-version', () => app.getVersion());
ipcMain.handle('get-platform', () => process.platform);
ipcMain.handle('open-external', (_event, url: string) => {
  if (url.startsWith('http://') || url.startsWith('https://')) {
    shell.openExternal(url);
  }
});

// App lifecycle
app.on('ready', async () => {
  await startServer();
  await createWindow();
});

app.on('window-all-closed', () => {
  stopServer();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', async () => {
  if (mainWindow === null) {
    await createWindow();
  }
});

app.on('before-quit', () => {
  stopServer();
});


// Security notes:
// - nodeIntegration is disabled (default)
// - contextIsolation is enabled
// - sandbox is enabled
// - Remote module is no longer available in Electron 33+
