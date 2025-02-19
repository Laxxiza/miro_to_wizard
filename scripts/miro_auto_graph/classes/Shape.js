class Shape {
    nodeId;

    constructor(data) {
        this.id = data.id;
        this.type = this.determineTypeFromColor(data.style.fillColor) || this.determineTypeFromText(this.clearContent(data.content));
        this.content = this.clearContent(data.content);
        Object.assign(this, this.clearContent(data.content));
        this.shapeType = data.type;
        this.isDisabled = false; //data.style.borderColor == "#f24726" ? true : false;
        this.connectorIds = data.connectorIds;
        this.groupId = data.groupId;
        this.isNode = false;
    }

    clearContent(content) {
        let REGEX = {
            htmlTags: /<(?:"[^"]*"['"]*|'[^']*'['"]*|[^'">])+>/gi,
            extra: /(?<=\*)[\s\S]*?.*(?=\*)/gi,
            amper: /(?<=\&)[\s\S]*?.*(?=\&)/gi,
            pTag: /<\/p>/gi,
            macros: /macro_var_\w+/gi
        };

        if (this.type == "finish") {
            return undefined;
        }

        content = content.replace(REGEX.pTag, (match, offset, fullText) => {
            const lastOccurrence = fullText.lastIndexOf(match);
            return offset === lastOccurrence ? '' : "\n";
        });
        //content = REGEX.extra.exec(content)?.shift() || (this.type === "macros" ? content.replace(REGEX.macros, "") : content); Подставляем текст если не нашли текст в звездочках
        content = content?.replace(REGEX.htmlTags, "");
        
        let title = REGEX.extra.exec(content)?.shift() || (this.type === "macros" ? (content?.replace(REGEX.macros, ""), undefined) : content);
        title = title?.replace(REGEX.amper, "").replaceAll("&", "");

        let description = REGEX.amper.exec(content)?.shift();
        let macros = REGEX.macros.exec(content)?.shift() || undefined;

        return { title: title, description: description, macros: macros };
    }

    determineTypeFromColor(color) {
        const colors = {
            "#fac710": "start",
            "#12cdd4": "condition",
            "#fef445": "goto",
            "#f24726": "instruction",
            "#cee741": "macros",
            "#1a1a1a": "action",
            "#2d9bf0": "description",
            "#652cb3": "finish",
            //"#9510ac": "finish-option",
        };
        return colors[color] || undefined;
    }

    determineTypeFromText(text) {
        const texts = {
            "Только отправить": "only_send",
            "Выполнить": "apply",
            "В другую линию": "forward",
            "Отложить": "postpone",
            "Повторить": "restart",
        };
        return texts[text] || undefined;
    }
}

module.exports = Shape;
