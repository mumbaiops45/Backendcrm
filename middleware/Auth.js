
const jwt = require('jsonwebtoken');
// const JWT_SECRETE = "NNCMumbai@1232!"

// const Auth = (req, res, next) =>{
//     const token = req.header('auth-token') || req.header('Authorization')?.replace('Bearer', '');
//     if(!token){
//         return res.status(401).send({error: "Please Authenticate Using a valid token"});
//     }
//     try {
//         const data = jwt.verify(token, JWT_SECRETE);
//         console.log('Decoded token:', data.user);
//         req.user = data.user;
//         next();
//     } catch (error) {
//         console.log("Token verification error:", error.message);
//         return res.status(401).send({error: "PLease authenticate using  a valid token"});
//     }
// };

const Auth = (req, res, next) => {
    const authHeader = req.header('Authorization');
    const token = req.header('auth-token') || 
                  (authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null);

    if (!token) {
        return res.status(401).send({ error: "Please authenticate using a valid token" });
    }
    try {
        const data = jwt.verify(token, process.env.JWT_SECRETE);
        console.log('Decoded token:', data.user);
        req.user = data.user;
        next();
    } catch (error) {
        console.log("Token verification error:", error.message);
        return res.status(401).send({ error: "Please authenticate using a valid token" });
    }
};

const authorizeRoles = (...roles) =>{
    return (req, res, next) =>{
         console.log("User from token:", req.user); 
         if(!req.user){
            return res.status(401).send({error: "User not authenticated"});
         }
        console.log("Required roles:", roles);
        console.log("User role:", req.user.role);
        if(!roles.includes(req.user.role)){
            return res.status(403).send({error: "Access denied : insufficient permissions"});
        }
        next();
    }
}

module.exports = {Auth, authorizeRoles};