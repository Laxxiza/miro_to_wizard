"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const promises_1 = require("fs/promises");
const puppeteer_1 = __importDefault(require("puppeteer"));
const extra_typings_1 = require("@commander-js/extra-typings");
const { token, boardId, frameNames, outputFile, exportFormat } = extra_typings_1.program
    .requiredOption("-t, --token <token>", "Miro token")
    .requiredOption("-b, --board-id <boardId>", "The board ID")
    .option("-f, --frame-names <frameNames...>", "The frame name(s), leave empty to export entire board")
    .option("-o, --output-file <filename>", "A file to output the SVG to (stdout if not supplied)")
    .option("-e, --export-format <format>", "'svg' or 'json' (default: 'svg')")
    .parse()
    .opts();
(async () => {
    const browser = await puppeteer_1.default.launch({ headless: true, timeout: 600000, protocolTimeout: 600000, executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' });
    const page = await browser.newPage();
    await page.setCookie({
        name: "token",
        value: token,
        domain: "miro.com"
    });
    await page.setViewport({ width: 1080, height: 1024 });
    await page.goto(`https://miro.com/app/board/${boardId}/`, {
        waitUntil: "domcontentloaded",
        timeout: 600000
    });

    page.on('console', msg => {
        if (msg.type() === 'log') {
            console.log(`!-- ${msg.text()} --!`);
        }
    });

    await page.evaluate(() => new Promise((resolve) => {
        const interval = setInterval(() => {
            try {
                if (typeof window.miro?.board !== "undefined") {
                    resolve();
                    clearInterval(interval);
                }
            }
            catch (e) {
                // ignored
            }
        }, 100);
    }));

    const delayFunction = ms => new Promise(resolve => setTimeout(resolve, ms));

    const evaluateWithRetry = async (page, fn, ...args) => {
        const maxRetries = 3;
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return await page.evaluate(fn, ...args);
            } catch (error) {
                console.log(`Error: ${error}`);
                console.log(`Attempt ${attempt} failed, retrying...`);
                throw error;
                // if (attempt === maxRetries) 
                // await delayFunction(1000);
            }
        }
    };

    const getSvgForFrames = (frameNames) => page.evaluate(async (frameNames) => {
        if (frameNames) {
            const frames = await window.miro.board.get({ type: ["frame"] });
            const selectedFrames = frames.filter((frame) => frameNames.includes(frame.title));
            if (selectedFrames.length !== frameNames.length) {
                throw Error(`${frameNames.length - selectedFrames.length} frame(s) could not be found on the board.`);
            }
            await window.miro.board.deselect();
            for (const { id } of selectedFrames) {
                await window.miro.board.select({ id });
            }
        }
        return await window.cmd.board.api.export.makeVector();
    }, frameNames);

    const getJsonForFrames = (frameNames) => evaluateWithRetry(page, async (frameNames) => {
        const delayFunction = ms => new Promise(resolve => setTimeout(resolve, ms));
        const chunkSize = 30;
        const delay = 1000;

        const getBoardElements = async (elementIds, chunkSize, delay) => {
            const results = [];
            let totalProcessed = 0;
            const totalElements = elementIds.length;

            for (let i = 0; i < elementIds.length; i += chunkSize) {
                const chunk = elementIds.slice(i, i + chunkSize);
                const children = await window.miro.board.get({ id: chunk });
                results.push(...children);
                totalProcessed += chunk.length;

                console.log(`Processed ${totalProcessed} out of ${totalElements} elements`);

                if (i + chunkSize < elementIds.length) {
                    await delayFunction(delay);
                }
            }
                
            return results;
        };

        if (frameNames) {
            const frames = await window.miro.board.get({ type: ["frame"] });
            const selectedFrames = frames.filter((frame) => frameNames.includes(frame.title));
            if (selectedFrames.length !== frameNames.length) {
                throw Error(`${frameNames.length - selectedFrames.length} frame(s) could not be found on the board.`);
            }
            const elementIds = selectedFrames.flatMap((frame) => frame.childrenIds);
            const children = await getBoardElements(elementIds, chunkSize, delay);

            const groupChildrenIds = children.filter((child) => child.type === "group").flatMap((child) => child.itemsIds);
            const groupChildren = await getBoardElements(groupChildrenIds, chunkSize, delay);
            // const children = await window.miro.board.get({
            //     id: selectedFrames.flatMap((frame) => frame.childrenIds)
            // });
            // const groupChildren = await window.miro.board.get({
            //     id: children
            //         .filter((child) => child.type === "group")
            //         .flatMap((child) => child.itemsIds)
            // });
            return JSON.stringify([...children, ...groupChildren].sort((a, b) => b.y - a.y)); //return JSON.stringify([...frames, ...children, ...groupChildren]);
        }
        return JSON.stringify(await window.miro.board.get({}));
    }, frameNames);
    const getFn = exportFormat === "json" ? getJsonForFrames : getSvgForFrames;
    if (outputFile?.includes("{frameName}")) {
        if (!frameNames) {
            throw Error("Expected frame names to be given when the output file name format expects a frame name.");
        }
        for (const frameName of frameNames) {
            const svg = await getFn([frameName]);
            await (0, promises_1.writeFile)(outputFile.replace("{frameName}", frameName), svg);
        }
    }
    else {
        const svg = await getFn(frameNames);
        if (outputFile) {
            await (0, promises_1.writeFile)(outputFile, svg);
        }
        else {
            process.stdout.write(svg);
        }
    }
    await page.close();
    await browser.close();
})();
