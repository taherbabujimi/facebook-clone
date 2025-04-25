const followerRoute = require("express").Router();
const { verifyJWT } = require("../../middlewares/authMiddleware");
const {
  followUnfollowUser,
  getFollowers,
  getFollowings,
} = require("./controllers");

followerRoute.post("/followUnfollowUser", verifyJWT, followUnfollowUser);

followerRoute.get("/getFollowers", verifyJWT, getFollowers);

followerRoute.get("/getFollowings", verifyJWT, getFollowings);

module.exports = followerRoute;
