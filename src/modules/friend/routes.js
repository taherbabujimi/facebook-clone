const friendRoute = require("express").Router();
const { verifyJWT } = require("../../middlewares/authMiddleware");
const {
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  getFriendRequests,
} = require("./controllers");

friendRoute.post("/sendFriendRequest", verifyJWT, sendFriendRequest);

friendRoute.put("/acceptFriendRequest", verifyJWT, acceptFriendRequest);

friendRoute.delete("/rejectFriendRequest", verifyJWT, rejectFriendRequest);

friendRoute.get("/getFriendRequests", verifyJWT, getFriendRequests);

module.exports = friendRoute;
