const { HappyGraphQLResolver } = require('../lib');
const { isAuthenticated } = require('./permissions.js');

const Resolver = HappyGraphQLResolver();


Resolver.Query('getCars:[car]!',[isAuthenticated],async (parent,args,{models}) => {
    try{
        let cars = await models.car.find();
        return cars;
    }catch(error){
        console.log(error);
        return [];
    }
});

Resolver.Query('getUsers:[user]!',[isAuthenticated],async (parent,args,{models}) => {
    try{
        let people = await models.user.find();
        return people;
    }catch(error){
        console.log(error);
        return [];
    }
});

Resolver.Mutation('createUser(name: String!, age: Int!):user',[isAuthenticated],async (parent,{name,age},{models}) => {
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

module.exports = Resolver;