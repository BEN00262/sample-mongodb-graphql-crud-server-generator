const { HappyGraphQLResolver } = require('../lib');

const Resolver = HappyGraphQLResolver();

Resolver.Query('getUserByAge(age:Int!):user',async (parent,{age},{models}) => {
    try{
        let person = await models.user.findOne({age});
        return person;
    }catch(error){
        console.log(error);
        return [];
    }
});

module.exports = Resolver;