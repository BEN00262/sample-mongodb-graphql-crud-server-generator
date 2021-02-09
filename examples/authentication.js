const authentication = (req) => {
    const AuthorizationHeader = req.headers["authorization"];
    const AuthorizationToken =  AuthorizationHeader ? AuthorizationHeader.split(" ")[1] : null;
    
    if (AuthorizationToken){
        try{
           return {
               user: {
                   name: "John Kerama"
               }
           }
        }catch(error){
            return {
                user: null
            }
        }
    }

    return { user: null }
}

module.exports = authentication;