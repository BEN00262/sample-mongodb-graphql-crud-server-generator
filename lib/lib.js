const mongoose = require('mongoose');
const {ApolloServer,gql,makeExecutableSchema} = require('apollo-server');
const { createComplexityLimitRule } = require("graphql-validation-complexity");
const {applyMiddleware} = require('graphql-middleware');
const consola = require('consola');

const parseYAML = require('./config.parser.js');
const defaultResolvers = require('./default_resolvers.js');

// work on this more --- top priority
let mapper = {
    'Number':'Int',
    'String':'String',
    'ObjectID':'ID'
}

function mongooseTypesToGraphQLTypes(mongooseType){
    return mapper[mongooseType];
}

class GraphQLSchema {
    constructor(mongoose_models){
        this.mongoose_models = mongoose_models;

        // this is only used in scaffolds
        this.generalTypes = `
            type Response {
                success: Boolean!
                message: String
            }
        `;

        this.generalQueries = '';
        this.generalMutations = '';
        this.resolvers = { Query:{}, Mutation:{} }
    }

    getSchema(isScaffold = true){

        let optionalTypes =  `
            type Query {
                ${this.generalQueries}
            }

            type Mutation {
                ${this.generalMutations}
            }
        `;

        return `
            ${this.generalTypes}
            ${isScaffold ? optionalTypes : ''}
        `;
    }

    getResolvers() {
        return this.resolvers;
    }

    // generates both the type stuff and input types
    generateGraphQLTypes(modelName,arrayOfProperties){
        let holder = '';

        let inputHolder = '';

        arrayOfProperties.forEach(({path,instance,isRequired}) => {

            if (!['__v'].includes(path)){
                holder += `
                    ${path}: ${mongooseTypesToGraphQLTypes(instance)}${isRequired ? '!':''}
               `
            }

            if (!['_id','__v'].includes(path)){
                inputHolder += `
                    ${path}: ${mongooseTypesToGraphQLTypes(instance)}${isRequired ? '!':''}
                `
            }
        })

        // take care of this later anyways
        this.generalTypes += `
            type ${modelName} {
                ${holder}
            }
        `;

        this.generalTypes += `
            input ${modelName}Input {
                ${inputHolder}
            } 
        `
    }

    generateDefaultResolvers(typeName){
        let default_resolvers = defaultResolvers(this.getModel(typeName),typeName);
        
        this.resolvers = {
            ...this.resolvers,
            ...default_resolvers
        }

        this.__generateGraphQLQueries(typeName);
        this.__generateGraphQLMutations(typeName);

    }

    __generateGraphQLQueries(typeName){
        this.generalQueries += `
                get${typeName}:[${typeName}]
                get${typeName}ById(id:ID!):${typeName}
        `
    }

    getModel(typeName){
        return this.mongoose_models[typeName];
    }

    __generateGraphQLMutations(typeName){
        this.generalMutations += `
                create${typeName}(${typeName.toLowerCase()}:${typeName}Input!):${typeName}
                remove${typeName}ById(id:ID!):Response!
        `
    }

}

// split this into components
function graphQLFactory(typeDefsType,resolvers,models,permissions = null,PORT,authentication=(req) => ({})){
    let typeDefs = gql`${typeDefsType}`;

    let serverConfig = {
        typeDefs,
        resolvers,
        validationRules:[createComplexityLimitRule(10000)],
        context:(({req}) => {
            return {
                ...req,
                models,
                ...authentication(req)
            };
        })
    };

    let permissionSchema = null;
    
    if (permissions){
        permissionSchema = applyMiddleware(
            makeExecutableSchema({
                typeDefs,
                resolvers
            }),
            permissions
        );

        serverConfig = {
            ...serverConfig,
            schema:permissionSchema
        }
    }

    const server = new ApolloServer(serverConfig);
    server.listen(PORT).then(({url}) => { consola.success(`Server started at ${url}`) });
}

function createServer(yaml_config_file,isScaffold=true){
    const { config, models, resolvers_config,authentication } = parseYAML(yaml_config_file,isScaffold);

    mongoose.connect(config.mongoURI,{
        useNewUrlParser: true,
        useUnifiedTopology: true
    })
        .then(_ => {
            const gSchema = new GraphQLSchema(models);
            const mongooseModels = mongoose.modelNames();
    
            mongooseModels.forEach(sampleModel => {
                const sampleM = Object.entries(mongoose.model(sampleModel).schema.paths).map(([path,{instance,isRequired}]) => {
                    return {
                        path,
                        instance,
                        isRequired: isRequired || false
                    }
                })
    
                gSchema.generateGraphQLTypes(sampleModel,sampleM);

                if (isScaffold){ gSchema.generateDefaultResolvers(sampleModel); }
                
            });

            let typeDefs = gSchema.getSchema(isScaffold);
            let resolvers = gSchema.getResolvers();
            let permissions = null;

            if(!isScaffold){
                const { resolvers:custom_resolvers, types,permissions:local_permissions } = resolvers_config.getResolvers();

                typeDefs += types;
                resolvers = custom_resolvers;
                permissions = local_permissions;
            }

            graphQLFactory(
                typeDefs,
                resolvers,
                models,permissions,
                config.port,
                authentication ? authentication : (req) => ({})
            );
        })
        .catch(consola.error);
}

module.exports = createServer;