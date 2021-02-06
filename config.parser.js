const yaml = require('yaml');
const fs = require('fs');
const mongoose = require('mongoose');


function parseYAML(CONFIG_FILE_NAME){
    const file = fs.readFileSync(CONFIG_FILE_NAME,'utf8');
    const {schemas,config} = yaml.parse(file); // ensure it is not null --> if it is quit early
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