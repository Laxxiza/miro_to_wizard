class Connector {
    constructor(data) {
        this.id = data.id;
        this.type = data.type;
        this.start = data.start.item;
        this.end = data.end.item;
    }
}

module.exports = Connector;