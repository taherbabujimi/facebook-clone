const {
  registerUser,
  userLogin,
  forgotPassword,
  resetPassword,
  verifyEmail,
  searchUser,
} = require("./controllers");
const { verifyJWT } = require("../../middlewares/authMiddleware");

const userRoute = require("express").Router();

userRoute.post("/registerUser", registerUser);

userRoute.post("/userLogin", userLogin);

userRoute.post("/forgotPassword", forgotPassword);

userRoute.post("/resetPassword", resetPassword);

userRoute.get("/verifyEmail", verifyEmail);

userRoute.get("/searchUser", verifyJWT, searchUser);

module.exports = userRoute;
