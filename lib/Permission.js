const { rule,or:orShieldRule,and:andShieldRule } = require('graphql-shield');

class Permission{
    constructor(permission,cacheType = 'contextual'){ 
        this.permission = permission;
        this.cacheType = cacheType;
        this._generated_permission = this._generate_permission();
    }

    _generate_permission(){
        let our_permission = this.permission;

        return rule({cache:this.cacheType})(
            async (parent,args,ctx,info) => {
                return our_permission(ctx);
            }
        )
    }

    getPermission(){
        return this._generated_permission;
    }
    
    or(...permissions){
        this._generated_permission = orShieldRule(this._generated_permission,...permissions.map(permission => permission._generated_permission));
        return this;
    }

    and(...permissions){
        this._generated_permission = andShieldRule(this._generated_permission,...permissions.map(permission => permission._generated_permission));
        return this;
    }
}

module.exports = {
    Permission: (permission) => new Permission(permission)
}