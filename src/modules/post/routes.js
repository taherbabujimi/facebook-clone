const {
  getUploadSignature,
  addRepostPost,
  getPost,
  updatePost,
  deletePost,
} = require("./controllers");
const { verifyJWT } = require("../../middlewares/authMiddleware");

const postRoute = require("express").Router();

postRoute.get("/getUploadSignature", getUploadSignature);

postRoute.post("/addRepostPost", verifyJWT, addRepostPost);

postRoute.get("/getPost", verifyJWT, getPost);

postRoute.put("/updatePost", verifyJWT, updatePost);

postRoute.delete("/deletePost", verifyJWT, deletePost);

module.exports = postRoute;
