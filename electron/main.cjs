const { app, BrowserWindow } = require('electron');

const WEB_URL = process.env.WEB_URL || 'http://127.0.0.1:4200';

async function waitForWeb(url) {
  const started = Date.now();
  while (Date.now() - started < 60_000) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return;
      }
    } catch {
      // Angular is still booting.
    }
    await new Promise((resolve) => setTimeout(resolve, 400));
  }
  throw new Error(`Borrowed web app did not start at ${url}`);
}

function createWindow() {
  const window = new BrowserWindow({
    width: 420,
    height: 820,
    minWidth: 360,
    minHeight: 640,
    title: 'Borrowed',
    backgroundColor: '#f3ecdf',
    webPreferences: {
      sandbox: true,
    },
  });
  window.loadURL(WEB_URL);
}

app.whenReady().then(async () => {
  await waitForWeb(WEB_URL);
  createWindow();
});

app.on('window-all-closed', () => {
  app.quit();
});
