const {
  getUploadSignature,
  addRepostPost,
  getSinglePost,
  updatePost,
  deletePost,
  getPosts,
  getUserFeed,
} = require("./controllers");
const { verifyJWT } = require("../../middlewares/authMiddleware");

const postRoute = require("express").Router();

postRoute.get("/getUploadSignature", getUploadSignature);

postRoute.post("/addRepostPost", verifyJWT, addRepostPost);

postRoute.get("/getSinglePost", verifyJWT, getSinglePost);

postRoute.put("/updatePost", verifyJWT, updatePost);

postRoute.delete("/deletePost", verifyJWT, deletePost);

postRoute.get("/getPosts", verifyJWT, getPosts);

postRoute.get("/getUserFeed", verifyJWT, getUserFeed);

module.exports = postRoute;
