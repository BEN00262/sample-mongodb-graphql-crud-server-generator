const yaml = require('yaml');
const fs = require('fs');
const mongoose = require('mongoose');
const chalk = require('chalk');

function parseYAML(CONFIG_FILE_NAME){
    if (!fs.existsSync(CONFIG_FILE_NAME)){
        console.log(chalk.redBright(`${chalk.bgGreenBright(chalk.white(CONFIG_FILE_NAME))} does not exist`));
        process.exit(1);
    }

    const file = fs.readFileSync(CONFIG_FILE_NAME,'utf8');
    const {schemas,config} = yaml.parse(file);

    if (!schemas || !config){
        console.log(chalk.redBright('Invalid configuration file.\nCheck the docs at http://localhost:5000/'));
        process.exit(1);
    }


    let models = {}

    Object.entries(schemas).forEach(([schemaName,schemaDesc]) => {
        const generatedSchema = new mongoose.Schema(schemaDesc);

        models = {
            ...models,
            [schemaName]:mongoose.model(schemaName,generatedSchema)
        }
    })

    return {
        models,
        config
    }
}

// lazy eval it
module.exports = parseYAML;