const { verifyJWT } = require("../middlewares/authMiddleware");

const IndexRoute = require("express").Router();
const userRoute = require("../modules/user/routes");
const postRoute = require("../modules/post/routes");
const likeRoute = require("../modules/like/routes");
const commentRoute = require("../modules/comment/routes");
const friendRoute = require("../modules/friend/routes");
const notificationRoute = require("../modules/notification/routes");
const pageRoute = require("../modules/page/routes");
const followerRoute = require("../modules/follower/routes");
const messageRoute = require("../modules/message/routes");

IndexRoute.use("/v1/user", userRoute);
IndexRoute.use("/v1/post", postRoute);
IndexRoute.use("/v1/like", likeRoute);
IndexRoute.use("/v1/comment", commentRoute);
IndexRoute.use("/v1/friend", friendRoute);
IndexRoute.use("/v1/notification", notificationRoute);
IndexRoute.use("/v1/page", pageRoute);
IndexRoute.use("/v1/follower", followerRoute);
IndexRoute.use("/v1/message", messageRoute);
IndexRoute.get("/verifyToken", verifyJWT, (req, res) => {
  res.status(200).json({ userId: req.user.id, email: req.user.email });
});

module.exports = IndexRoute;
