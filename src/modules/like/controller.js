const Models = require("../../models/index");
const {
  errorResponseWithoutData,
  successResponseData,
  successResponseWithoutData,
} = require("../../services/responses");
const { messages } = require("./messages");

module.exports.likeUnlikePost = async (req, res) => {
  try {
    const { postId } = req.query;

    if (!postId) {
      return errorResponseWithoutData(res, messages.postIdNotProvided, 400);
    }

    const postExists = await Models.Post.findByPk(postId);

    if (!postExists) {
      return errorResponseWithoutData(res, messages.postnotExists, 400);
    }

    const likeExists = await Models.Like.findOne({
      where: { userId: req.user.id, postId },
    });

    if (likeExists) {
      await Models.Like.destroy({
        where: { userId: req.user.id, postId },
      });

      return successResponseWithoutData(res, messages.postUnlikedSuccess, 400);
    }

    await Models.Like.create({
      userId: req.user.id,
      postId,
    });

    return successResponseWithoutData(res, messages.postLikedSuccess, 400);
  } catch (error) {
    console.log(error);
    return errorResponseWithoutData(res, messages.errorAddLike, 400);
  }
};
