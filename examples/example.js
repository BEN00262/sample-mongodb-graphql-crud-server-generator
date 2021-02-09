const { HappyGraphQL } = require('../lib');
const path = require('path');

// we need to get the full path here
HappyGraphQL(path.join(__dirname,'sample.yaml'),false);