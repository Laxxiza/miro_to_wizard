const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const shell = require('electron').shell;

const https = require('https');
const path = require('path');
const fs = require('fs');
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

    //mainWindow.webContents.openDevTools();
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

ipcMain.handle('save-output-file', async (event, fileName) => {
    dialog.showOpenDialog({
        properties: ['openDirectory'], // Открытие только папки
        title: 'Выберите папку для сохранения',
    }).then(result => {
        if (!result.canceled) {
            const folderPath = result.filePaths[0]; // Путь выбранной папки
            const outputFile = path.join(folderPath, fileName); // Путь файла с выбранным именем

            // Копирование файла
            fs.copyFile(fileName, outputFile, (err) => {
                if (err) {
                    console.error('Ошибка при копировании файла:', err);
                    event.sender.send('log-update', fileName, `Ошибка при копировании файла: ${err}`);
                } else {
                    console.log(`Файл успешно скопирован в: ${outputFile}`);
                    event.sender.send('log-update', fileName, `Файл успешно скопирован в: ${outputFile}`);
                }
            });
        }
    }).catch(err => {
        console.error('Ошибка при выборе папки:', err);
    });
});

ipcMain.handle('open-link-in-browser', async (event, url) => {
    shell.openExternal(url);
    console.log("Open browser");
});

ipcMain.handle('check-updates', async (event) => {
    let check = await checkForUpdates();
    if(check.isUpdate) {
        check["REPO_OWNER"] = REPO_OWNER;
        check["REPO_NAME"] = REPO_NAME;
        event.sender.send('update-app', check);
    }
});

async function checkForUpdates() {
    const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases/latest`;

    return new Promise((resolve, reject) => {
        const options = {
            headers: {
                'User-Agent': 'Electron-App',
            }
        };

        https.get(url, options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    const releaseData = JSON.parse(data);
                    const latestVersion = releaseData.tag_name;

                    if (isNewVersionAvailable(CURRENT_VERSION, latestVersion)) {
                        resolve(showUpdateNotification(latestVersion));
                    } else {
                        resolve({ isUpdate: false });
                    }
                } catch (error) {
                    console.error('Ошибка при разборе JSON с GitHub:', error);
                    reject(error);
                }
            });
        }).on('error', (err) => {
            console.error('Ошибка запроса к GitHub:', err);
            reject(err);
        });
    });
}

function isNewVersionAvailable(current, latest) {
    const [cMajor, cMinor, cPatch] = current.slice(1).split('.').map(Number);
    const [lMajor, lMinor, lPatch] = latest.slice(1).split('.').map(Number);
    
    return (
        lMajor > cMajor ||
        lMinor > cMinor ||
        lPatch > cPatch
    );
}

function showUpdateNotification(latestVersion) {
    return { isUpdate: true, text: latestVersion };
}