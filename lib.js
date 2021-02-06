const mongoose = require('mongoose');
const {ApolloServer,gql} = require('apollo-server');

const parseYAML = require('./config.parser.js');

// work on this more
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
        this.generalTypes = `
            type Response {
                success: Boolean!
                message: String
            }
        `;
        this.generalQueries = '';
        this.generalMutations = '';
        this.resolvers = {
            Query:{},
            Mutation:{}
        }
    }

    getSchema(){
        return `
            ${this.generalTypes}

            type Query {
                ${this.generalQueries}
            }

            type Mutation {
                ${this.generalMutations}
            }
        
        `
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

    // create resolvers for this
    generateGraphQLQueries(typeName){
        this.generalQueries += `
                get${typeName}:[${typeName}]
                get${typeName}ById(id:ID!):${typeName}
        `

        // create the resolvers here
        let _get = () => {
            return this.getModel(typeName).find()
                .then(data => data)
                .catch((error) => {
                    console.log(error);
                    return null;
                })
        }

        let _get_by_id = (filter) => {
            return this.getModel(typeName).find(filter)
                .then(data => data.toObject())
                .catch((error) => {
                    console.log(error);
                    return null;
                })
        }

        this.resolvers.Query = {
            ...this.resolvers.Query,
            [`get${typeName}`]:() => _get(),
            [`get${typeName}ById`]:(_,{id}) => _get_by_id({_id:id})
        }
    }

    getModel(typeName){
        return this.mongoose_models[typeName];
    }

    generateGraphQLMutation(typeName){
        this.generalMutations += `
                create${typeName}(${typeName.toLowerCase()}:${typeName}Input!):${typeName}
                remove${typeName}ById(id:ID!):Response!
        `

        // create the resolvers here
        let _create = (args) => {
            let modelFound = this.getModel(typeName);
            return modelFound(args)
                .save()
                .then(saved => {
                    return saved.toObject();
                })
                .catch((error) => {
                    console.log(error);
                    return null;
                })
        }

        let _remove = (id) => {
            return this.getModel(typeName).deleteOne({
                _id:id
            })
                .then(_ => {
                    return {
                        success: true,
                        message:`successfully deleted ${typeName}`
                    }
                })
                .catch((error) => {
                    console.log(error);
                    return {
                        success: false,
                        message:`failed to delete ${typeName}`
                    }
                })
        }

        this.resolvers.Mutation = {
            ...this.resolvers.Mutation,
            [`create${typeName}`]:(_,args) => _create(args[typeName.toLowerCase()]),
            [`remove${typeName}ById`]:(_,{id}) => _remove(id)
        }
    }

}


// create a graphql factory
function graphQLFactory(typeDefsType,resolvers,PORT){

    const server = new ApolloServer({
        typeDefs: gql`${typeDefsType}`,
        resolvers
    });

    server.listen(PORT).then(({url}) => {
        console.log(`Server started at ${url}`);
    });
}

function createServer(yaml_config_file){
    const { config, models } = parseYAML(yaml_config_file);

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
                gSchema.generateGraphQLQueries(sampleModel);
                gSchema.generateGraphQLMutation(sampleModel);
            });
    
            let typeDefs = gSchema.getSchema();
            let resolvers = gSchema.getResolvers();
            graphQLFactory(typeDefs,resolvers,config.port);
        })
        .catch(console.log);
}

module.exports = createServer;