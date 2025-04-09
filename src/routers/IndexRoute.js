const IndexRoute = require("express").Router();
const userRoute = require("../modules/user/routes");
const postRoute = require("../modules/post/routes");
const likeRoute = require("../modules/like/routes");
const commentRoute = require("../modules/comment/route");

IndexRoute.use("/v1/user", userRoute);
IndexRoute.use("/v1/post", postRoute);
IndexRoute.use("/v1/like", likeRoute);
IndexRoute.use("/v1/comment", commentRoute);

module.exports = IndexRoute;
