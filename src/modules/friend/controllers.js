const { Op } = require("sequelize");
const {
  errorResponseWithoutData,
  successResponseData,
  successResponseWithoutData,
} = require("../../services/responses");
const { messages } = require("./messages");
const {
  sendRequestSchema,
  acceptRejectRequestSchema,
} = require("./validations");
const Models = require("../../models/index");
const { cloudinary } = require("../../config/cloudinary");
const { requestTypes } = require("./constants");
const { notificationType, entityType } = require("../../services/constants");
const { sequelize } = require("../../models/index");

module.exports.sendFriendRequest = async (req, res) => {
  let transaction;
  try {
    const validationResponse = sendRequestSchema(req.body, res);
    if (validationResponse !== false) return;

    const { friendId } = req.body;

    if (friendId === req.user.id) {
      return errorResponseWithoutData(
        res,
        messages.cannotSendRequestToYourself,
        400
      );
    }

    const alreadyFriend = await Models.Friend.findOne({
      where: {
        [Op.or]: [
          { userId: req.user.id, friendId, status: "confirm" },
          { friendId: req.user.id, userId: friendId, status: "confirm" },
        ],
      },
    });

    console.log("ALREADY FRIEND: ", alreadyFriend);

    if (alreadyFriend) {
      return errorResponseWithoutData(res, messages.alreadyFriend, 400);
    }

    const requestExist = await Models.Friend.findOne({
      where: { friendId: req.user.id, userId: friendId },
    });

    if (requestExist) {
      return errorResponseWithoutData(res, messages.requestAlreadyExist, 400);
    }

    console.log("REQUEST EXIST: ", requestExist);

    const user = await Models.User.findOne({
      where: { id: friendId, isVerified: true },
    });

    console.log("USER: ", user);

    if (!user) {
      return errorResponseWithoutData(res, messages.userNotExists, 400);
    }

    transaction = await sequelize.transaction();

    const friendRequest = await Models.Friend.create(
      {
        userId: req.user.id,
        friendId,
      },
      { transaction }
    );

    console.log("FRIEND: ", friendRequest);

    if (!friendRequest) {
      await transaction.rollback();

      return errorResponseWithoutData(
        res,
        messages.errorSendingFriendRequest,
        400
      );
    }

    await Models.Notification.create(
      {
        recipientId: friendId,
        senderId: req.user.id,
        type: notificationType[0],
        entityType: entityType[0],
        entityId: friendRequest.id,
      },
      { transaction }
    );

    await transaction.commit();

    return successResponseData(
      res,
      friendRequest,
      200,
      messages.friendRequestSent
    );
  } catch (error) {
    await transaction.rollback();

    console.log(error);

    if (
      error.original &&
      error.original.constraint === "custom_unique_constraint_friends"
    ) {
      return errorResponseWithoutData(res, messages.requestAlreadySent, 400);
    }

    return errorResponseWithoutData(
      res,
      messages.errorSendingFriendRequest,
      400
    );
  }
};

module.exports.getFriendRequests = async (req, res) => {
  try {
    const { page, pageSize } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(pageSize) || 0;
    const limit = parseInt(pageSize || 8);

    const friendRequests = await Models.Friend.findAll({
      where: { friendId: req.user.id, status: "pending" },
      include: [{ model: Models.User, as: "User" }],
      limit,
      offset,
    });

    const data = [];

    friendRequests.map((item) => {
      data.push({
        username: item.dataValues.User.dataValues.username,
        url: cloudinary.url(item.dataValues.User.dataValues.profilePublicId),
        requestDateTime: item.dataValues.createdAt,
      });
    });

    if (!friendRequests) {
      return errorResponseWithoutData(res, messages.errorGettingRequests, 400);
    }

    return successResponseData(res, data, 200, messages.successGettingRequests);
  } catch (error) {
    console.log(error);

    return errorResponseWithoutData(res, messages.errorGettingRequests, 400);
  }
};

module.exports.acceptRejectFriendRequest = async (req, res) => {
  let transaction;
  try {
    const validationResponse = acceptRejectRequestSchema(req.body, res);
    if (validationResponse !== false) return;

    const { friendId, requestType } = req.body;

    const request = await Models.Friend.findOne({
      where: { friendId: req.user.id, userId: friendId },
    });

    if (!request) {
      return errorResponseWithoutData(res, messages.requestNot, 400);
    }

    if (request.status === "confirm") {
      if (requestType === requestTypes[0]) {
        return errorResponseWithoutData(
          res,
          messages.requestAlreadyAccepted,
          400
        );
      } else {
        return errorResponseWithoutData(
          res,
          messages.cannotRejectAcceptedRequest,
          400
        );
      }
    }

    if (requestType === requestTypes[0]) {
      const user = await Models.User.findOne({
        where: { id: friendId },
      });

      if (!user) {
        return errorResponseWithoutData(res, messages.userNot, 400);
      }

      transaction = await sequelize.transaction();

      await Models.Friend.update(
        {
          status: "confirm",
        },
        { where: { friendId: req.user.id, userId: friendId } },
        { transaction }
      );

      await Models.Notification.create(
        {
          recipientId: friendId,
          senderId: req.user.id,
          type: notificationType[1],
          entityType: entityType[0],
          entityId: req.user.id,
        },
        { transaction }
      );

      await transaction.commit();

      return successResponseWithoutData(
        res,
        messages.requestAcceptSuccess,
        200
      );
    }

    await Models.Friend.destroy({
      where: { userId: friendId, friendId: req.user.id },
    });

    return successResponseWithoutData(res, messages.requestRejectSuccess, 200);
  } catch (error) {
    await transaction.rollback();

    console.log(error);

    return errorResponseWithoutData(
      res,
      messages.errorAcceptRejectRequest,
      400
    );
  }
};
