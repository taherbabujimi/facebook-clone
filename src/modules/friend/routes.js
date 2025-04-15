const friendRoute = require("express").Router();
const { verifyJWT } = require("../../middlewares/authMiddleware");
const {
  sendFriendRequest,
  acceptRejectFriendRequest,
  getFriendRequests,
  getRecommendedFriends,
} = require("./controllers");

friendRoute.post("/sendFriendRequest", verifyJWT, sendFriendRequest);

friendRoute.put(
  "/acceptRejectFriendRequest",
  verifyJWT,
  acceptRejectFriendRequest
);

friendRoute.get("/getFriendRequests", verifyJWT, getFriendRequests);

friendRoute.get("/getRecommendedFriends", verifyJWT, getRecommendedFriends);

module.exports = friendRoute;
