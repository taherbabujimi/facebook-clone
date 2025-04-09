const commentRoute = require("express").Router();
const {
  addComment,
  getComments,
  updateComment,
  deleteComment,
} = require("./controllers");
const { verifyJWT } = require("../../middlewares/authMiddleware");

commentRoute.post("/addComment", verifyJWT, addComment);
commentRoute.get("/getComments", verifyJWT, getComments);
commentRoute.put("/updateComment", verifyJWT, updateComment);
commentRoute.delete("/deleteComment", verifyJWT, deleteComment);

module.exports = commentRoute;
