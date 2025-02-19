let token;
let board;
let frame;

function addLog(filePath, message, clear = false) {
    if (clear) $("#log-container").empty();
    let logContainer = $("#log-container");

    if (filePath == "miro-export" && $("#miro-export").next().length) {
        let miroExportLog = $("#miro-export").next();
        miroExportLog.html(
            $("<span>").addClass("text-danger fw-medium").text(filePath)
        ).append(" " + message);
        return;
    }

    let logLine = $("<div>")
        .attr("id", filePath)
        .append(
            $("<span>").addClass("text-danger fw-medium").text(filePath),
            " " + message
        );

    logContainer.append(logLine);
    logContainer.scrollTop(logContainer[0].scrollHeight);
}

async function startProcess() {
    let filePath = "";
    let args = {};

    let mainform = $("#mainform")[0];

    if (!mainform.checkValidity()) {
        mainform.reportValidity();
        return false;
    }

    const modal = new bootstrap.Modal(document.querySelector("#logs-modal"));
    modal.show();

    token = $("#miro_token").val();
    board = $("#miro_board").val();
    frame = $("#miro_frame").val();

    filePath = "miro-export";
    args = {
        token: token,
        "board-id": board,
        "frame-names": frame,
        "output-file": "data.json",
        "export-format": "json",
    };

    addLog(filePath, "Запуск выгрузки из Miro");
    await startScript(filePath, args);

    filePath = "miro_auto_graph";
    args = {
        "path-file": "data.json",
        "entry-point": 1,
        "output-path": "output.json",
    };

    addLog(filePath, "Запуск конвертации из Miro в Wizard");
    await startScript(filePath, args);
    window.electronAPI.saveOutputFile("output.json");
}

async function startScript(filePath, args) {
    try {
        const result = await window.electronAPI.startScript(
            "log1",
            filePath,
            args
        );
        if (!result.success) {
            addLog(filePath, `Ошибка: ${result.error}`);
            return;
        }
        console.log(`Скрипт ${filePath} успешно завершен`);
    } catch (error) {
        addLog(filePath, "Ошибка во время выполнения скриптов");
        console.error("Ошибка во время выполнения скриптов:", error);
        process.exit(1);
    }
}

$(document).ready(function () {
    window.electronAPI.checkUpdates();

    window.electronAPI.onLogUpdate((filePath, message) => {
        addLog(filePath, message);
    });

    window.electronAPI.updateApp((check) => {
        let urlUpdate = `https://github.com/${check.REPO_OWNER}/${check.REPO_NAME}/releases/latest`;
        $("#updatePos").show();
        $("#updateBut").append(check.text).on( "click", function() {
            window.electronAPI.openLinkInBrowser(urlUpdate);
          });
    });
});
