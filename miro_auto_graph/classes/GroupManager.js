const Manager = require("./Manager");

class GroupManager extends Manager{
    add(item) {
        if (item.type == "group" && !this.findById(item.id)) {
            this.list.push(item);
        }
    }

    findByItemId(id){
        return this.list.find(item => item.itemsIds.includes(id));
    }
}

module.exports = GroupManager;