const { program } = require("commander");

const parseBool = (val) => {
    re = /^(true|1|on)$/i;
    return re.test(val);
};

program
    .requiredOption(
        "-p, --path-file <string>",
        "Путь до файла с бордом Миро в json формате. Если файл в папке со скриптом, то просто имя и расширение. Пример: data.json"
    )
    .option(
        "-e, --entry-point <number>",
        "Стартовый id ноды. Укажите свой, если нужно дополнить граф, но определенной ноды. Стартовый id должен быть обязательно новый, несуществующий в вашем графе.",
        1
    )
    .option(
        "-o, --output-path <string>",
        "Путь к месту сохранения файла и его имя. Пример: output.json",
        "output.json"
    )
    .option(
        "-s, --start-shape <string>",
        "Имя стартовой шейпа(ноды) в Миро.",
        "Старт"
    )
    .option(
        "-m, --macros-enable <true/false>",
        "Вписывать id макроса в ноду или нет? True/False. Необходимо для отладки в линии без проектов макросов.",
        parseBool,
        true
    )
    .option(
        "-f, --fake-finish <true/false>",
        "Фейк-финиш, если у вас на графе нет финиша. True/False. Необходимо для последующей корректной загрузки в граф.",
        parseBool,
        false
    )
    .option(
        "-d, --defects <true/false>",
        "Выводить в консоль дефектрые ноды?",
        parseBool,
        false
    )
    .parse();

module.exports = program.opts();