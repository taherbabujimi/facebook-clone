const notificationRoute = require("express").Router();
const { getAllNotifications, markNotificationsRead } = require("./controllers");
const { verifyJWT } = require("../../middlewares/authMiddleware");

notificationRoute.get("/getAllNotifications", verifyJWT, getAllNotifications);

notificationRoute.put(
  "/markNotificationsRead",
  verifyJWT,
  markNotificationsRead
);

module.exports = notificationRoute;
