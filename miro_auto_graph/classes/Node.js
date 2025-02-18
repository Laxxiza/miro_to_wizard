class Node {
    id;
    type;
    title;
    shapeId;
    description;
    actions = [];

    constructor(data) {
        this.id = data?.nodeId;
        this.type = data?.type;
        this.title = data?.type !== "action" ? data?.title : undefined;
        this.description = data?.description;
    }

    addAction({ shape, groupShape, point, macrosEnable }) {
        let action = {};

        action.type = groupShape.type;
        action.to_id = point || "2";
        action.title = groupShape?.title || "";
        action.description = groupShape?.description;

        if (groupShape.type == "instruction") {
            // action = {
            //     ...action,
            //     title: shape?.content,
            //     description: groupShape?.content,
            // };
            action.title = shape?.title || "";
            action.description = groupShape?.title;
        }

        if (groupShape.type == "macros") {
            // action = {
            //     ...action,
            //     title: groupShape?.content,
            //     value: macrosEnable ? groupShape?.macros : "",
            // };
            action.value = macrosEnable ? groupShape?.macros || "" : "";
        }

        if (["only_send", "apply", "forward", "postpone"].includes(groupShape.type)) {
            action.to_id = undefined;
            //console.log({ shape, groupShape, point, macrosEnable });
        }
        
        action.is_disabled = groupShape?.isDisabled || undefined;

        // let action = {
        //     type: groupShape.type,
        //     ...(groupShape.type == "instruction"
        //         ? { title: shape?.content, description: groupShape?.content }
        //         : { title: groupShape?.content }),
        //     ...(groupShape.type == "macros"
        //         ? {
        //               title: groupShape?.content,
        //               to_id: point || "2",
        //               value: macrosEnable ? groupShape?.macros : "",
        //           }
        //         : { to_id: point || "2" }),
        //     is_disabled: groupShape?.isDisabled || undefined,
        // };

        this.actions = [...this.actions, action];
    }

    fillExample() {
        if (this.type == "finish") {
            const texts = {
                "Только отправить": "only_send",
                "Выполнить": "apply",
                "В другую линию": "forward",
                "Отложить": "postpone",
                "В ожидание": "pending"
            };
            Object.keys(texts).forEach(key => {
                this.actions.push({ 
                    type: texts[key],
                    title: key
                 });
            });
            //console.log("fillExample Для Finish");
        }

        if (this.type == "condition") {
            this.actions.push({
                type: "goto",
                to_id: "2",
                title: "PlaceHolder",
                is_disabled: true
            });
            //console.log("fillExample Для Condition");
        }
    }
}

module.exports = Node;
