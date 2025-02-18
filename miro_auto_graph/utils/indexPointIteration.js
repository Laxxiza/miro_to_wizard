module.exports = (index, newStep = false, offset = 1) => {
    let newIndex = index.toString();
    if (!newStep) {
        let indexArray = newIndex.split("_");
        let lastIndex = +indexArray.pop() + 1;
        indexArray.push(lastIndex);
        newIndex = indexArray.join("_");
    } else newIndex += "_" + offset;
    return newIndex;
}