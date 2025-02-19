const { app } = require('electron');
const { spawn } = require("child_process");
const path = require('path');

async function runScript(scriptPath, argsObj, logCallback) {
    return new Promise((resolve, reject) => {
        if (!scriptPath || typeof scriptPath !== "string") {
            console.error("Ошибка: scriptPath должен быть строкой", scriptPath);
            return reject(new Error("Неверный путь к скрипту"));
        }

        const args = Object.entries(argsObj).map(([key, value]) => `--${key}=${value}`);

        let nodePath = process.execPath;
        
        if (app.isPackaged) {
            nodePath = path.join(process.resourcesPath, "app", "resources", "node", "node.exe"); 
        }

        let scriptFullPath = scriptPath;
        if (app.isPackaged) {
            scriptFullPath = path.join(process.resourcesPath, "app", "scripts", scriptPath);
        } else {
            scriptFullPath = path.join(__dirname, "scripts", scriptPath);
        }

        const childProcess = spawn("node", [scriptFullPath, ...args], { encoding: "utf8" });

        let stdoutBuffer = "";
        let stderrBuffer = "";

        childProcess.stdout.on("data", (data) => {
            stdoutBuffer += data.toString();
            let lines = stdoutBuffer.split(/(?=^!--)/m);
            stdoutBuffer = lines.pop();

            lines.forEach((line) => logCallback(line));
        });

        childProcess.stderr.on("data", (data) => {
            stderrBuffer += data.toString();
            let lines = stderrBuffer.split(/(?=^!--)/m);
            stderrBuffer = lines.pop();

            lines.forEach((line) => logCallback(`Ошибка: ${line}`));
        });

        childProcess.on("close", (code) => {
            if (stdoutBuffer) logCallback(stdoutBuffer);
            if (stderrBuffer) logCallback(`Ошибка: ${stderrBuffer}`);
        
            if (code === 0) {
                logCallback(`Процесс завершен успешно (код ${code})`);
                console.log("Process close");
                resolve();
            } else {
                const errorMessage = stderrBuffer || `Неизвестная ошибка (код ${code})`;
                logCallback(`Скрипт завершился с ошибкой (код ${code}): ${errorMessage}`);
                reject(new Error(`Скрипт завершился с ошибкой (код ${code}): ${errorMessage}`));
            }
        });

        return childProcess;
    });
}

module.exports = { runScript };