const { app, BrowserWindow, ipcMain } = require('electron');
const https = require('https');
const path = require('path');
const { runScript } = require('./script');

const REPO_OWNER = 'laxxiza';
const REPO_NAME = 'miro_to_wizard';
const CURRENT_VERSION = app.getVersion();

let mainWindow;

app.whenReady().then(() => {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        resizable: false,
        frame: true,
        autoHideMenuBar: true,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            enableRemoteModule: false,
            nodeIntegration: false
        }
    });

    mainWindow.loadFile('public/index.html');

    mainWindow.webContents.openDevTools();
});

ipcMain.handle('start-script', async (event, column, filePath, args) => {
    if (!filePath) return 'Ошибка: файл не выбран';

    try {
        await runScript(filePath, args, (message) => {
            event.sender.send('log-update', filePath, message);
        });
        return { success: true };
    } catch (error) {
        event.sender.send('log-update', filePath, `Ошибка: ${error.message}`);
        return { success: false, error: error.message };
    }
    return 'Процесс запущен';
});

ipcMain.handle('check-updates', (event) => {
    let check = checkForUpdates();
    if(check.isUpdate) {
        event.sender.send('update-app', check.isUpdate, check.text);
    }
});


function checkForUpdates() {
    const url = `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/main/package.json`;

    https.get(url, (res) => {
        let data = '';

        res.on('data', (chunk) => {
            data += chunk;
        });

        res.on('end', () => {
            try {
                const remotePackage = JSON.parse(data);
                const latestVersion = remotePackage.version;

                if (isNewVersionAvailable(CURRENT_VERSION, latestVersion)) {
                    return showUpdateNotification(latestVersion);
                }
                return { isUpdate: false }
            } catch (error) {
                console.error('Ошибка при разборе JSON с GitHub:', error);
            }
        });
    }).on('error', (err) => {
        console.error('Ошибка запроса к GitHub:', err);
    });
}

function isNewVersionAvailable(current, latest) {
    const [cMajor, cMinor, cPatch] = current.split('.').map(Number);
    const [lMajor, lMinor, lPatch] = latest.split('.').map(Number);
    
    return (
        lMajor > cMajor ||
        (lMajor === cMajor && lMinor > cMinor) ||
        (lMajor === cMajor && lMinor === cMinor && lPatch > cPatch)
    );
}

function showUpdateNotification(latestVersion) {
    // dialog.showMessageBox({
    //     type: 'info',
    //     title: 'Обновление доступно',
    //     message: `Доступна новая версия: ${latestVersion}\nТекущая версия: ${CURRENT_VERSION}\nОбновите программу!`
    // });
    console.log(latestVersion);
    return { isUpdate: true, text: "Апдейт" };
}