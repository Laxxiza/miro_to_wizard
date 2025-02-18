const { spawn } = require("child_process");

async function runScript(scriptPath, argsObj, logCallback) {
    return new Promise((resolve, reject) => {
        if (!scriptPath || typeof scriptPath !== "string") {
            console.error("Ошибка: scriptPath должен быть строкой", scriptPath);
            return;
        }

        const args = Object.entries(argsObj).map(([key, value]) => `--${key}=${value}`);
        console.log(scriptPath, args);

        const process = spawn("node", [scriptPath, ...args], { encoding: "utf8"});

        let stdoutBuffer = "";
        let stderrBuffer = "";

        process.on('spawn', () => {
            console.log(`Процесс с PID ${process.pid} запущен!`);
        });

        process.stdout.on("data", (data) => {
            stdoutBuffer += data.toString();
            let lines = stdoutBuffer.split(/(?=^!--)/m);
            stdoutBuffer = lines.pop();

            lines.forEach((line) => logCallback(line));
        });

        process.stderr.on("data", (data) => {
            stderrBuffer += data.toString();
            let lines = stderrBuffer.split(/(?=^!--)/m);
            stderrBuffer = lines.pop();

            lines.forEach((line) => logCallback(`Ошибка: ${line}`));
        });

        process.on("close", (code) => {
            if (stdoutBuffer) logCallback(stdoutBuffer);
            if (stderrBuffer) logCallback(`Ошибка: ${stderrBuffer}`);

            logCallback(`Процесс завершен с кодом ${code}`);
            console.log("Process close");
            code === 0 ? resolve() : reject(new Error(`Скрипт завершился с ошибкой (код ${code})`));
        });

        return process;
    });
}

module.exports = { runScript };