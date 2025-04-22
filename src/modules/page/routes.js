const { createPage, getPage, deletePage } = require("./controllers");
const { verifyJWT } = require("../../middlewares/authMiddleware");

const pageRoute = require("express").Router();

pageRoute.post("/createPage", verifyJWT, createPage);

pageRoute.get("/getPage", verifyJWT, getPage);

pageRoute.delete("/deletePage", verifyJWT, deletePage);

module.exports = pageRoute;
