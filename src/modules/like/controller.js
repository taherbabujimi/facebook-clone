const Models = require("../../models/index");
const {
  errorResponseWithoutData,
  successResponseData,
  successResponseWithoutData,
} = require("../../services/responses");
const { messages } = require("./messages");
const { notificationType, entityType } = require("../../services/constants");
const { sequelize } = require("../../models/index");

module.exports.likeUnlikePost = async (req, res) => {
  let transaction;
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

      return successResponseWithoutData(res, messages.postUnlikedSuccess, 200);
    }

    transaction = await sequelize.transaction();

    await Models.Like.create(
      {
        userId: req.user.id,
        postId,
      },
      { transaction }
    );

    const existingNotification = await Models.Notification.findOne({
      where: {
        recipientId: postExists.createdBy,
        senderId: req.user.id,
        type: notificationType[2],
        entityType: "like",
        entityId: postExists.id,
      },
    });

    let shouldCreateNotification = true;

    if (existingNotification) {
      const differenceInMS =
        new Date() - new Date(existingNotification.createdAt);
      shouldCreateNotification = differenceInMS / (1000 * 60) >= 30;
    }

    if (shouldCreateNotification) {
      await Models.Notification.create(
        {
          recipientId: postExists.createdBy,
          senderId: req.user.id,
          type: notificationType[2],
          entityType: "like",
          entityId: postExists.id,
        },
        { transaction }
      );
    }

    await transaction.commit();
    return successResponseWithoutData(res, messages.postLikedSuccess, 200);
  } catch (error) {
    if (transaction) await transaction.rollback();

    console.log(error);

    return errorResponseWithoutData(
      res,
      `${messages.errorAddLike}: ${error}`,
      400
    );
  }
};
