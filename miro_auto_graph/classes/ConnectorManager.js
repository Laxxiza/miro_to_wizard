const Manager = require("./Manager");

class ConnectorManager extends Manager{
    add(item) {
        if (item.type == "connector" && !this.findById(item.id)) {
            this.list.push(item);
        }
    }
}

module.exports = ConnectorManager;