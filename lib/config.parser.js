const yaml = require('yaml');
const { write } = require('yaml-import');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const consola = require('consola');

function resolveImports(CONFIG_FILE_NAME,dir_name){
    let actualFile = path.join(dir_name,"__happy_graphql_config.yml");
    write(
        CONFIG_FILE_NAME,
        actualFile
    );
    return actualFile;
}

function parseYAML(CONFIG_FILE_NAME,isScaffold = true){
    if (!fs.existsSync(CONFIG_FILE_NAME)){
        consola.error(`${CONFIG_FILE_NAME} does not exist`);
        process.exit(1);
    }

    let dir_name = path.dirname(CONFIG_FILE_NAME);

    let current_file_path = resolveImports(CONFIG_FILE_NAME,dir_name);

    const file = fs.readFileSync(current_file_path,'utf8');
    const { schemas,config, resolvers,authentication } = yaml.parse(file);

    if (!schemas || !config){
        consola.error('Invalid configuration file.\nCheck the docs at http://localhost:5000/');
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
        config,
        resolvers_config: isScaffold ? null : require(path.join(dir_name,resolvers)),
        authentication: isScaffold ? null : authentication ? require(path.join(dir_name,authentication)) : null
    }
}

// lazy eval it
module.exports = parseYAML;