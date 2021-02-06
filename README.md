## mongodb graphql crud server generator

## sample config file
```yaml:
schemas:
  car:
    name:
      type: String
      required: true

config:
  port: 5000
  mongoURI: 'mongodb://127.0.0.1:27017/sampleMe'
```

```javascript:
require('./lib.js')('sample.config.yaml');
```

thats all it takes to bootstrap a graphql server using mongodb in javascript