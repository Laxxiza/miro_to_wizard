const colors = require('colors');
const fs = require("fs");
const he = require("he");
const JSONStream = require("JSONStream");
const {
    entryPoint,
    pathFile,
    macrosEnable,
    outputPath,
    fakeFinish,
    defects
} = require("./options");
const { indexPointIteration } = require("./utils");

const Shape = require("./classes/Shape");
const Connector = require("./classes/Connector");
const Group = require("./classes/Group");
const Node = require("./classes/Node");

const ShapeManager = require("./classes/ShapeManager");
const ConnectorManager = require("./classes/ConnectorManager");
const GroupManager = require("./classes/GroupManager");
const NodeManager = require("./classes/NodeManager");

const Shapes = new ShapeManager();
const Connectors = new ConnectorManager();
const Groups = new GroupManager();
const Nodes = new NodeManager();

function runProgram(customOptions = {}) {
    const config = { ...{
        entryPoint,
        pathFile,
        macrosEnable,
        outputPath,
        fakeFinish,
        defects
    }, ...customOptions };
    const jsonStream = fs.createReadStream(config.pathFile);
    const ENTRYPOINT = config.entryPoint;
    let tempIter = 1;

    jsonStream
        .pipe(JSONStream.parse(["", { emitKey: true }]))
        .on("data", (data) => {
            switch (data.type) {
                case "shape":
                    data.content = he.decode(data.content);
                    Shapes.add(new Shape(data));
                    break;
                case "connector":
                    Connectors.add(new Connector(data));
                    break;
                case "group":
                    Groups.add(new Group(data));
                    break;
            }
        })
        .on("end", () => {
            Shapes.sort();
            Shapes.checkDefect(Connectors.all);
            console.log("!-- JSONStream serialization complete --!");
            console.log(`!-- Shapes: ${Shapes.all.length} --!`);
            console.log(`!-- Conns: ${Connectors.all.length} --!`);
            console.log(`!-- Groups: ${Groups.all.length} --!`);
            console.log(`!-- Дефектные шейпы --!: ${Shapes.allDefect.length}`);
            if(Shapes.allDefect.length > 0){
                console.log("!-- --!");
                console.log(Shapes.allDefect);
                console.log("!-- Процесс прерван!\nПоправь дефекты и попробуй снова --!");
                if(defects) return false;
            }
            console.log("!-- Start --!");
            createNode();
            console.log("!-- Stop --!");
            console.log(`!-- Nodes: ${Nodes.all.length} --!`);
            saveToFile();
        });

    function createNode(shape = Shapes.findByType("start"), toPoint) {
        tempIter++;
        if (!shape) return;

        if (config.fakeFinish && Nodes.findToIdById(2).length > 0 && !Nodes.findById(2)) {
            console.log("!-- Добавлен фейк-финиш --!".blue);
            let finishNode = new Node({ nodeId: 2, type: "finish" });
            finishNode.fillExample();
            Nodes.add(finishNode);
        }

        if (!shape.groupId) {
            if (shape.type !== "start") return;
            let connector = Connectors.findById(shape.connectorIds[0]);
            shape.isNode = true;
            createNode(Shapes.findById(connector.end));
            return;
        }

        let node = new Node(shape);
        Nodes.add(node);
        shape.isNode = true;
        node.id = toPoint || ENTRYPOINT;
        let groupShapes = Shapes.findByGroupId(shape.groupId).filter(g => g.id !== shape.id);

        groupShapes.forEach((gShape, index) => {
            let nextShapeId = Connectors.findById(gShape.connectorIds?.shift())?.end;
            let nextShape = Shapes.findById(nextShapeId);
            if (nextShapeId && !nextShape?.isNode) createNode(nextShape, indexPointIteration(node.id, true, index + 1));
            node.addAction({ shape, groupShape: gShape, point: nextShape?.nodeId, macrosEnable: config.macrosEnable });
        });

        if (groupShapes.length <= 1) node.fillExample();
    }

    function saveToFile() {
        fs.writeFile(config.outputPath.includes(".json") ? config.outputPath : config.outputPath + ".json",
            JSON.stringify({ entrypoint: config.entryPoint, nodes: Nodes.getJson() }, null, 4),
            (err) => {
                if (err) console.log(err);
                else console.log(`!-- Файл успешно сохранен: ${config.outputPath} --!`);
            });
    }
}

if (require.main === module) {
    runProgram();
} else {
    module.exports = runProgram;
}