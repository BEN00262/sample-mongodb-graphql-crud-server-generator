const { Permission } = require('../lib');

const isAuthenticated = Permission((context) => {
    return context.user ? true : false;
});

const isAuthor = Permission((context) => {
    return context.user.isAuthor;
});

module.exports = {
    isAuthenticated,
    isAuthor
}