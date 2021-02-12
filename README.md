# The Happy GraphQL Backend framework

### Scaffolded server
```yaml
#sample.config.yaml
schemas:
  car:
    name:
      type: String
      required: true

config:
  port: 5000
  mongoURI: 'mongodb://127.0.0.1:27017/sampleMe'
```

```javascript
const { HappyGraphQL } = require('../lib');

HappyGraphQL('sample.yaml',true);
```

### Custom resolver server
```yaml
schemas:
  car:
    name:
      type: String
      required: true

  user:
    name:
      type: String
      required: true
    age:
      type: Number
      required: true
    position:
      type: String
      default: junior
      enum:
        - junior
        - 'mid-level'
        - senior

resolvers: './custom_resolvers.js' #filename containing the resolvers

config:
  port: 5000
  mongoURI: 'mongodb://127.0.0.1:27017/sampleMe'
```

```javascript
// custom_resolver.js
const { HappyGraphQLResolver } = require('../lib');

const Resolver = HappyGraphQLResolver();

Resolver.Query('getCars:[car]!',async (parent,args,{models}) => {
    try{
        let cars = await models.car.find();
        return cars;
    }catch(error){
        console.log(error);
        return [];
    }
});

Resolver.Query('getUsers:[user]!',async (parent,args,{models}) => {
    try{
        let people = await models.user.find();
        return people;
    }catch(error){
        console.log(error);
        return [];
    }
});

Resolver.Mutation('createUser(name: String!, age: Int!):user',async (parent,{name,age},{models}) => {
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
```

```javascript
const { HappyGraphQL } = require('../lib');

HappyGraphQL('sample.yaml',false);
```

thats all it takes to bootstrap a graphql server using mongodb in javascript