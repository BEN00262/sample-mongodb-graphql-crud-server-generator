// this must implement the getResolvers method that will the types and the resolvers

class DefaultResolvers {
    constructor(model,typeName){
        this.models = model;
        this.typeName = typeName;
        this.resolvers = { Query:{},Mutation:{} }
    }

    getResolvers(){
        this._generate_query_resolvers();
        this._generate_mutation_resolvers();

        return this.resolvers;
    }

    _generate_mutation_resolvers(){
        let _create = (args) => {
            let modelFound = this.model;
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
            return this.model.deleteOne({
                _id:id
            })
                .then(_ => {
                    return {
                        success: true,
                        message:`successfully deleted ${this.typeName}`
                    }
                })
                .catch((error) => {
                    console.log(error);
                    return {
                        success: false,
                        message:`failed to delete ${this.typeName}`
                    }
                })
        }

        this.resolvers.Mutation = {
            ...this.resolvers.Mutation,
            [`create${this.typeName}`]:(_,args) => _create(args[this.typeName.toLowerCase()]),
            [`remove${this.typeName}ById`]:(_,{id}) => _remove(id)
        }
    }
    
    _generate_query_resolvers(){
        let _get = () => {
            return this.model.find()
                .then(data => data)
                .catch((error) => {
                    console.log(error);
                    return null;
                })
        }

        let _get_by_id = (filter) => {
            return this.model.find(filter)
                .then(data => data.toObject())
                .catch((error) => {
                    console.log(error);
                    return null;
                })
        }

        this.resolvers.Query = {
            ...this.resolvers.Query,
            [`get${this.typeName}`]:() => _get(),
            [`get${this.typeName}ById`]:(_,{id}) => _get_by_id({_id:id})
        }
    }
}


module.exports = (model,typeName) => (new DefaultResolvers(model,typeName)).getResolvers();