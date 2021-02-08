const Resolvers = require('./resolver.generator.js');

Resolvers.Query('getCars:[car]!',async (parent,args,{models}) => {
    try{
        let cars = await models.cars.find();
        return cars;
    }catch(error){
        console.log(error);
        return [];
    }
});

Resolvers.Query('getUsers:[user]!',async (parent,args,{models}) => {
    try{
        let people = await models.user.find();
        return people;
    }catch(error){
        console.log(error);
        return [];
    }
});

Resolvers.Mutation('createUser(name: String!, age: Int!):user',async (parent,{name,age},{models}) => {
    try{
        let createdUser = await new models.user({
            name,
            age
        }).save();

        return createdUser ? createdUser.toObject() : null;
    }catch(error){
        console.log(error);
        return null;
    }
});

module.exports = Resolvers;