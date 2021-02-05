const createServer = require('./lib.js');
const userModel = require('./model.js');

createServer('mongodb://127.0.0.1:27017/sampleMe',5000);