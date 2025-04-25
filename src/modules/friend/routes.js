const friendRoute = require("express").Router();
const { verifyJWT } = require("../../middlewares/authMiddleware");
const {
  sendFriendRequest,
  acceptRejectFriendRequest,
  getFriendRequests,
  getRecommendedFriends,
  getFriends,
} = require("./controllers");

friendRoute.post("/sendFriendRequest", verifyJWT, sendFriendRequest);

friendRoute.put(
  "/acceptRejectFriendRequest",
  verifyJWT,
  acceptRejectFriendRequest
);

friendRoute.get("/getFriendRequests", verifyJWT, getFriendRequests);

friendRoute.get("/getFriends", verifyJWT, getFriends);

friendRoute.get("/getRecommendedFriends", verifyJWT, getRecommendedFriends);

module.exports = friendRoute;
