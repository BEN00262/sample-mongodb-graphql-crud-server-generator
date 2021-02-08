// current supported types
const QUERY_TYPE = 'Query';
const MUTATION_TYPE = 'Mutation';


class Resolver {
    constructor(){
        this.resolvers = { Query:{}, Mutation:{} }
        this.QueryTypes = '';
        this.MutationTypes = '';
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

        return {
            types: finalTypes,
            resolvers
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

    Query(resolverSig,resolverFunc){ this._base_resolver(QUERY_TYPE,resolverSig,resolverFunc);}
    Mutation(resolverSig,resolverFunc){ this._base_resolver(MUTATION_TYPE,resolverSig,resolverFunc); }
}

const ResolverMerge = (first,...resolvers) => {
    return first._merge(...resolvers);
}

module.exports = {
    HappyGraphQLResolver:() => new Resolver(),
    ResolverMerge
}