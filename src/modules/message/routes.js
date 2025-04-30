const messageRoute = require("express").Router();
const { verifyJWT } = require("../../middlewares/authMiddleware");
const { getMessageHistory } = require("./controllers");

messageRoute.get("/getMessageHistory", verifyJWT, getMessageHistory);

module.exports = messageRoute;
