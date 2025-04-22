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
const { notificationType, entityType } = require("../../services/constants");
const { sequelize } = require("../../models/index");

module.exports.addComment = async (req, res) => {
  let transaction;

  try {
    // Validate request
    const validationResponse = addCommentSchema(req.body, res);
    if (validationResponse !== false) return;

    const { postId, parentId, content } = req.body;

    if (parentId !== undefined) {
      const commentExists = await Models.Comment.findByPk(parentId);
      if (!commentExists) {
        return errorResponseWithoutData(
          res,
          messages.parentCommentNotExists,
          400
        );
      }

      if (commentExists.postId !== postId) {
        return errorResponseWithoutData(
          res,
          messages.parentCommentNotBelongsToPost,
          400
        );
      }
    }

    // Check if post exists
    const postExists = await Models.Post.findByPk(postId);
    if (!postExists) {
      return errorResponseWithoutData(res, messages.postNotExists, 400);
    }

    // Start transaction
    transaction = await sequelize.transaction();

    // Create comment
    const comment = await Models.Comment.create(
      {
        postId,
        parentId,
        content,
        userId: req.user.id,
      },
      { transaction }
    );

    if (!comment) {
      await transaction.rollback();
      return errorResponseWithoutData(res, messages.errorAddingComment, 400);
    }

    // Handle notifications
    if (parentId !== undefined) {
      const commentExists = await Models.Comment.findByPk(parentId);
      if (!commentExists) {
        await transaction.rollback();
        return errorResponseWithoutData(res, messages.commentNotExists, 400);
      }

      await Models.Notification.create(
        {
          recipientId: commentExists.userId,
          senderId: req.user.id,
          type: notificationType[4], // reply to comment
          entityType: entityType[2], // comment
          entityId: commentExists.id,
        },
        { transaction }
      );
    } else {
      await Models.Notification.create(
        {
          recipientId: postExists.createdBy,
          senderId: req.user.id,
          type: notificationType[3], // comment on post
          entityType: entityType[2], // comment
          entityId: postExists.id,
        },
        { transaction }
      );
    }

    // Commit transaction
    await transaction.commit();

    return successResponseData(res, comment, 200, messages.addCommentSuccess);
  } catch (error) {
    // Rollback transaction if it exists
    if (transaction) await transaction.rollback();

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
