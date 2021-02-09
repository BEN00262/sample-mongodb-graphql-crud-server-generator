const { shield } = require('graphql-shield');

// current supported types
const QUERY_TYPE = 'Query';
const MUTATION_TYPE = 'Mutation';


class Resolver {
    constructor(){
        this.resolvers = { Query:{}, Mutation:{} }
        this.QueryTypes = '';
        this.MutationTypes = '';
        this.Permissions = { Query:{}, Mutation:{} }
    }

    // FIXME: think about this later
    getResolvers(){
        let finalTypes = `
            type Query { 
                ${this.QueryTypes} 
            }
            type Mutation { 
                ${this.MutationTypes} 
            }
        `
        let resolvers = this.resolvers;
        let permissions = shield(this.Permissions);

        return {
            types: finalTypes,
            resolvers,
            permissions
        }
    }

    _query_builder(resolverSig,resolverFunc){
        this.QueryTypes += `
            ${resolverSig}
        `;

        this.resolvers.Query = {
            ...this.resolvers.Query,
            [resolverSig.split(/[:(]/)[0]]:resolverFunc
        }
    }

    _mutation_builder(resolverSig,resolverFunc){
        this.MutationTypes += `
            ${resolverSig}
        `;

        this.resolvers.Mutation = {
            ...this.resolvers.Mutation,
            [resolverSig.split(/[:(]/)[0]]:resolverFunc
        }
    }  
    

    _base_resolver(resolverType,resolverSig,resolverFunc){
        switch(resolverType){
            case MUTATION_TYPE:
                this._mutation_builder(resolverSig,resolverFunc);
                break;
            case QUERY_TYPE:
                this._query_builder(resolverSig,resolverFunc);
                break;
            default:
                throw new Error(`Invalid GraphQL Type: ${resolverType}`)
        }
    }

    _merge(...resolvers){
        for(const resolver of resolvers){
            // merge the queries
            this.QueryTypes += `
                ${resolver.QueryTypes}
            `;

            // merge the Query resolvers
            this.resolvers.Query = {
                ...this.resolvers.Query,
                ...resolver.resolvers.Query
            }

            // merge the mutations
            this.MutationTypes += `
                ${resolver.MutationTypes}
            `;

            // merge the Mutation resolvers
            this.resolvers.Mutation = {
                ...this.resolvers.Mutation,
                ...resolver.resolvers.Mutation
            }
        }

        return this;
    }

    _permissions_builder(queryType,resolverName,permission) {
        this.Permissions[queryType] = {
            ...this.Permissions[queryType],
            [resolverName]:permission.getPermission()
        }
    }

    // clean up this function later
    Query(resolverSig,permission_middlewares,resolverFunc){
        if (arguments.length < 3){
            if (!(typeof permission_middlewares === 'function')){ throw new Error('Invalid resolver function'); }
            resolverFunc = permission_middlewares;
        }else{
            let resolverName = resolverSig.split(/[:(]/)[0];

            if(Array.isArray(permission_middlewares)){
                if(permission_middlewares.length > 1){
                    let basePermission = permission_middlewares.splice(0,1);
                    this._permissions_builder(QUERY_TYPE,resolverName,basePermission.and(...permission_middlewares));
                }else{
                    this._permissions_builder(QUERY_TYPE,resolverName,permission_middlewares[0])
                }
            }else{
                this._permissions_builder(QUERY_TYPE,resolverName,permission_middlewares);
            }
        }

        this._base_resolver(QUERY_TYPE,resolverSig,resolverFunc);
    }

    Mutation(resolverSig,permission_middlewares,resolverFunc){ 
        if (arguments.length < 3){
            if (!(typeof permission_middlewares === 'function')){ throw new Error('Invalid resolver function'); }
            resolverFunc = permission_middlewares;
        }else{
            let resolverName = resolverSig.split(/[:(]/)[0];

            if(Array.isArray(permission_middlewares)){
                if(permission_middlewares.length > 1){
                    let basePermission = permission_middlewares.splice(0,1);
                    this._permissions_builder(MUTATION_TYPE,resolverName,basePermission.and(...permission_middlewares));
                }else{
                    this._permissions_builder(MUTATION_TYPE,resolverName,permission_middlewares[0])
                }
            }else{
                this._permissions_builder(MUTATION_TYPE,resolverName,permission_middlewares);
            }
        }

        this._base_resolver(MUTATION_TYPE,resolverSig,resolverFunc); 
    }

    // we also generate the permissions required
}

const ResolverMerge = (first,...resolvers) => {
    return first._merge(...resolvers);
}

module.exports = {
    HappyGraphQLResolver:() => new Resolver(),
    ResolverMerge
}