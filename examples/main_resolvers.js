const { ResolverMerge } = require('../lib');

const filterResolver = require('./filter_resolver');
const custom_resolvers = require('./custom_resolvers');

module.exports = ResolverMerge(filterResolver,custom_resolvers);