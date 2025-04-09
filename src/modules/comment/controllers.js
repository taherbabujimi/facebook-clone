const {
  errorResponseWithoutData,
  successResponseData,
  successResponseWithoutData,
} = require("../../services/responses");
const { messages } = require("./messages");
const {
  addCommentSchema,
  getCommentSchema,
  updateCommentSchema,
  deleteCommentSchema,
} = require("./validations");
const Models = require("../../models/index");

module.exports.addComment = async (req, res) => {
  try {
    const validationResponse = addCommentSchema(req.body, res);
    if (validationResponse !== false) return;

    const { postId, parentId, content } = req.body;

    const postExists = await Models.Post.findByPk(postId);

    if (!postExists) {
      return errorResponseWithoutData(res, messages.postNotExists, 400);
    }

    if (parentId !== undefined) {
      const commentExists = await Models.Comment.findByPk(parentId);

      if (!commentExists) {
        return errorResponseWithoutData(res, messages.commentNotExists, 400);
      }
    }

    const comment = await Models.Comment.create({
      postId,
      parentId,
      content,
      userId: req.user.id,
    });

    if (!comment) {
      return errorResponseWithoutData(res, messages.errorAddingComment, 400);
    }

    return successResponseData(res, comment, 200, messages.addCommentSuccess);
  } catch (error) {
    console.log(error);

    return errorResponseWithoutData(res, messages.errorAddingComment, 400);
  }
};

module.exports.getComments = async (req, res) => {
  try {
    const validationResponse = getCommentSchema(req.body, res);
    if (validationResponse !== false) return;

    const { postId, parentId } = req.body;

    const postExists = await Models.Post.findByPk(postId);

    if (!postExists) {
      return errorResponseWithoutData(res, messages.postNotExists, 400);
    }

    if (parentId !== undefined) {
      const commentExists = await Models.Comment.findByPk(parentId);

      if (!commentExists) {
        return errorResponseWithoutData(res, messages.commentNotExists, 400);
      }

      const comment = await Models.Comment.findAll({
        where: { postId, parentId },
      });

      if (!comment) {
        return errorResponseWithoutData(res, messages.errorGettingComment, 400);
      }

      return successResponseData(
        res,
        comment,
        200,
        messages.commentFetchSuccess
      );
    }

    const comment = await Models.Comment.findAll({
      where: { postId, parentId: null },
    });

    if (!comment) {
      return errorResponseWithoutData(res, messages.errorGettingComment, 400);
    }

    return successResponseData(res, comment, 200, messages.commentFetchSuccess);
  } catch (error) {
    console.log(error);

    return errorResponseWithoutData(res, messages.errorGettingComment, 400);
  }
};

module.exports.updateComment = async (req, res) => {
  try {
    const validationResponse = updateCommentSchema(req.body, res);
    if (validationResponse !== false) return;

    const { commentId } = req.query;

    const commentExists = await Models.Comment.findByPk(commentId);

    if (!commentExists) {
      return errorResponseWithoutData(res, messages.commentNotExists, 400);
    }

    if (commentExists.userId !== req.user.id) {
      return errorResponseWithoutData(res, messages.postIsNotYours, 400);
    }

    const { content } = req.body;

    await Models.Comment.update({ content }, { where: { id: commentId } });

    return successResponseWithoutData(res, messages.updateCommentSuccess, 400);
  } catch (error) {
    console.log(error);
    return errorResponseWithoutData(res, messages.errorUpdateComment, 400);
  }
};

module.exports.deleteComment = async (req, res) => {
  try {
    const validationResponse = deleteCommentSchema(req.query, res);
    if (validationResponse !== false) return;

    const { commentId } = req.query;

    const commentExists = await Models.Comment.findByPk(commentId);

    if (!commentExists) {
      return errorResponseWithoutData(res, messages.commentNotExists, 400);
    }

    successResponseWithoutData(res, messages.commentDeleteSuccess, 200);

    await Models.Comment.destroy({
      where: { id: commentId },
    });
  } catch (error) {
    console.log(error);

    return errorResponseWithoutData(res, messages.errorDeleteComment, 400);
  }
};
