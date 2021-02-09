const authentication = (req,models) => {
    const AuthorizationHeader = req.headers["authorization"];
    const AuthorizationToken =  AuthorizationHeader ? AuthorizationHeader.split(" ")[1] : null;
    
    if (AuthorizationToken){
        try{
           return {
               user: {
                   name: "John Doe"
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