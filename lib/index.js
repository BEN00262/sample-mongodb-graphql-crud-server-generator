module.exports = {
    HappyGraphQL: require('./lib.js'),
    ...require('./resolver.generator.js'),
    ...require('./Permission.js')
}