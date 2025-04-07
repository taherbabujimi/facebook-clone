const IndexRoute = require("express").Router();
const userRoute = require("../modules/user/routes");
const postRoute = require("../modules/post/routes");
const likeRoute = require("../modules/like/routes");

IndexRoute.use("/v1/user", userRoute);
IndexRoute.use("/v1/post", postRoute);
IndexRoute.use("/v1/like", likeRoute);

module.exports = IndexRoute;
