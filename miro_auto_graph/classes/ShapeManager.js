const Manager = require("./Manager");

class ShapeManager extends Manager {
    add(item) {
        if (!(item.groupId || item.type == "finish" || item.type == "start") && (!item.groupId || item.shapeType != "shape")) {
            //console.log(item);
            this.addDefect(item, "Нет группы или неправильный тип ноды");
            //throw Error(`Нода БЕЗ ГРУППЫ или НЕПРАВИЛЬНЫЙ ТИП НОДЫ, исправь перед загрузкой`);
        }
        
        if ((item.groupId || item.type == "finish" || item.type == "start") && !this.findById(item.id)) {
            this.list.push(item);
        }
    }

    checkDefect(conns) {
        this.list.forEach((item) => {
            if(conns){
                if (["goto", "instruction", "macros", "start"].includes(item.type)) {
                    let connectors = item?.connectorIds;
    
                    if (connectors.length > 0) {
                        let res = connectors?.reduce((acc, curr, index, arr) => {
                            let conn = conns.find((x) => x.id == curr);
    
                            if (conn?.end == item?.id) {
                                acc += 1;
                            }
    
                            return acc;
                        }, 0);
    
                        if(res > 0) {
                            this.addDefect(item, `Коннектор не может быть у: goto/instruction/macros/start. Текущая нода явялется ${item.type} типом`);
                        }
                    }
                }

                if (["goto", "instruction", "macros", "start"].includes(item.type)) {
                    let connectors = item?.connectorIds;
    
                    if (connectors.length > 0) {
                        let res = connectors?.reduce((acc, curr, index, arr) => {
                            let conn = conns.find((x) => x.id == curr);
    
                            if (conn?.start == item?.id) {
                                acc += 1;
                            }
    
                            return acc;
                        }, 0);
    
                        if(res > 1) {
                            this.addDefect(item, "Есть лишние коннекторы");
                        }
                    }
                }
    
                if (["action", "condition", "finish"].includes(item.type)) {
                    let connectors = item?.connectorIds;
    
                    if (connectors.length > 0) {
                        let res = connectors?.reduce((acc, curr, index, arr) => {
                            let conn = conns.find((x) => x.id == curr);
    
                            if (conn?.end == item?.id || conn?.start == item?.id) {
                                acc += 1;
                            }
    
                            return acc;
                        }, 0);
    
                        if(res == 0) {
                            this.addDefect(item, "Нет или не может быть Стартовго/Конечного коннектора");
                        }
                    }
                }
            }
        });
    }

    findByNodeId(id) {
        return this.list.find((item) => item.nodeId === id);
    }

    findByName(name) {
        return this.list.find((item) => item.content === name);
    }

    findByType(type) {
        return this.list.find((item) => item.type === type);
    }

    findByGroupId(id) {
        let includeTypes = [
            "condition",
            "goto",
            "instruction",
            "macros",
            "action",
            "finish",
            "only_send",
            "apply",
            "forward",
            "postpone",
            "restart",
        ];
        return this.list.filter(
            (item) => includeTypes.includes(item.type) && item.groupId === id
        );
    }

    findByTypeAndGroupId(type, id) {
        return this.list.filter(
            (item) => item.type === type && item.groupId === id
        );
    }

    findByTypesAndGroupId(types, id) {
        return this.list.filter(
            (item) => types.includes(item.type) && item.groupId === id
        );
    }

    findByGroup(id) {
        return this.list.filter((item) => item.groupId === id);
    }

    findIsNodeById(id) {
        return this.list
            .filter((item) => item.id === id && item.isNode === true)
            ?.shift();
    }
}

module.exports = ShapeManager;
