const { verifyAuth: verifyJWT, verifyAdmin: verifyAdminJWT } = require('../utils/jwt');


module.exports = {
    verifyAuth: verifyJWT,
    verifyAdmin: verifyAdminJWT
};
