const {
  registerUser,
  userLogin,
  forgotPassword,
  resetPassword,
  verifyEmail,
  searchUser,
  updateUserProfile,
  blockUser,
  unblockUser,
  getUserBlockList,
} = require("./controllers");
const { verifyJWT } = require("../../middlewares/authMiddleware");

const userRoute = require("express").Router();

userRoute.post("/registerUser", registerUser);

userRoute.post("/userLogin", userLogin);

userRoute.post("/forgotPassword", forgotPassword);

userRoute.post("/resetPassword", resetPassword);

userRoute.get("/verifyEmail", verifyEmail);

userRoute.get("/searchUser", verifyJWT, searchUser);

userRoute.put("/updateUserProfile", verifyJWT, updateUserProfile);

userRoute.post("/blockUser", verifyJWT, blockUser);

userRoute.delete("/unblockUser", verifyJWT, unblockUser);

userRoute.get("/getUserBlockList", verifyJWT, getUserBlockList);

module.exports = userRoute;
