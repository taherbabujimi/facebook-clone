const { verifyJWT } = require("../../middlewares/authMiddleware");
const { likeUnlikePost } = require("./controller");
const likeRoute = require("express").Router();

likeRoute.post("/likeUnlikePost", verifyJWT, likeUnlikePost);

module.exports = likeRoute;
