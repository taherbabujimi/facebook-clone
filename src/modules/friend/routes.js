const friendRoute = require("express").Router();
const { verifyJWT } = require("../../middlewares/authMiddleware");
const {
  sendFriendRequest,
  acceptRejectFriendRequest,
  rejectFriendRequest,
  getFriendRequests,
} = require("./controllers");

friendRoute.post("/sendFriendRequest", verifyJWT, sendFriendRequest);

friendRoute.put(
  "/acceptRejectFriendRequest",
  verifyJWT,
  acceptRejectFriendRequest
);

// friendRoute.delete("/rejectFriendRequest", verifyJWT, rejectFriendRequest);

friendRoute.get("/getFriendRequests", verifyJWT, getFriendRequests);

module.exports = friendRoute;
