const Manager = require("./Manager");

class NodeManager extends Manager{
    add(item) {
        if (!this.findById(item.id) && item.type) {
            this.list.push(item);
        }
        else console.log("ALARM! Повторная нода!");
    }

    getJson(){
        let result = {};
        this.list.forEach(node => {
            result[node.id] = node;
            node.id = undefined;
        });
        return result;
    }

    findToIdById(id) {
        return this.list.filter(node => node.actions?.find(action => action.to_id === id.toString()));
    }
}

module.exports = NodeManager;