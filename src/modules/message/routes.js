const messageRoute = require("express").Router();
const { verifyJWT } = require("../../middlewares/authMiddleware");
const { getMessageHistory, sendPostInChat } = require("./controllers");

messageRoute.get("/getMessageHistory", verifyJWT, getMessageHistory);

messageRoute.post("/sendPostToChat", verifyJWT, sendPostInChat);

module.exports = messageRoute;
