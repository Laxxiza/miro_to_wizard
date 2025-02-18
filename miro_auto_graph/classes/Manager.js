class Manager {
    constructor() {
        this.list = [];
        this.defectList = [];
    }

    get all() {
        return this.list;
    }

    get allDefect() {
        return this.defectList.map((el) => { return {id: el.id, content: el.content, defect: el.defectDesc} });
    }

    add(item) {
        if (!this.findById(item.id) && item.type) {
            this.list.push(item);
        }
    }

    addDefect(item, info="") {
        if (item.type) {
            item.defectDesc = info;
            this.defectList.push(item);
        }
    }

    findById(id) {
        return this.list.find(item => item.id === id);
    }

    findByType(type) {
        return this.list.find(item => item.type === type);
    }

    sort(){
        this.list.sort((a, b) => {
            return a.id.localeCompare(b.id)
        });
    }
}

module.exports = Manager;