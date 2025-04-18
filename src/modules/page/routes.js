const { createPage, getPage } = require("./controllers");
const { verifyJWT } = require("../../middlewares/authMiddleware");

const pageRoute = require("express").Router();

pageRoute.post("/createPage", verifyJWT, createPage);

pageRoute.get("/getPage", verifyJWT, getPage);

module.exports = pageRoute;
