const { Op } = require("sequelize");
const {
  errorResponseWithoutData,
  successResponseData,
  successResponseWithoutData,
} = require("../../services/responses");
const { messages } = require("./messages");
const { sendAcceptRejectRequestSchema } = require("./validations");
const Models = require("../../models/index");
const { cloudinary } = require("../../config/cloudinary");

module.exports.sendFriendRequest = async (req, res) => {
  try {
    const validationResponse = sendAcceptRejectRequestSchema(req.query, res);
    if (validationResponse !== false) return;

    const { friendId } = req.query;

    const alreadyFriend = await Models.Friend.findOne({
      where: {
        [Op.or]: [
          { userId: req.user.id, friendId, status: "confirm" },
          { friendId: req.user.id, userId: friendId, status: "confirm" },
        ],
      },
    });

    if (alreadyFriend) {
      return errorResponseWithoutData(res, messages.alreadyFriend, 400);
    }

    const requestExist = await Models.Friend.findOne({
      where: { friendId: req.user.id, userId: friendId },
    });

    if (requestExist) {
      return errorResponseWithoutData(res, messages.requestAlreadyExist, 400);
    }

    const userExists = await Models.User.findOne({
      where: { id: friendId, isVerified: true },
    });

    if (!userExists) {
      return errorResponseWithoutData(res, messages.userNotExists, 400);
    }

    const friendRequest = await Models.Friend.create({
      userId: req.user.id,
      friendId,
    });

    if (!friendRequest) {
      return errorResponseWithoutData(
        res,
        messages.errorSendingFriendRequest,
        400
      );
    }

    return successResponseData(
      res,
      friendRequest,
      200,
      messages.friendRequestSent
    );
  } catch (error) {
    console.log(error);

    if (error.original.constraint === "custom_unique_constraint_friends") {
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

module.exports.acceptFriendRequest = async (req, res) => {
  try {
    const validationResponse = sendAcceptRejectRequestSchema(req.query);
    if (validationResponse !== false) return;

    const { friendId } = req.query;

    const requestExists = await Models.Friend.findOne({
      where: { friendId, userId: req.user.id },
    });

    if (!requestExists) {
      return errorResponseWithoutData(res, messages.requestNotExists, 400);
    }

    if (requestExists.status === "confirm") {
      return errorResponseWithoutData(
        res,
        messages.requestAlreadyAccepted,
        400
      );
    }

    const userExists = await Models.User.findOne({
      where: { userId: req.user.id, friendId },
    });

    if (!userExists) {
      return errorResponseWithoutData(res, messages.userNotExists, 400);
    }

    await Models.Friend.update(
      {
        status: "confirm",
      },
      { where: { friendId, userId: req.user.id } }
    );

    return successResponseWithoutData(res, messages.requestAcceptSuccess, 400);
  } catch (error) {
    console.log(error);

    errorResponseWithoutData(res, messages);
  }
};

module.exports.rejectFriendRequest = async (req, res) => {
  try {
    const validationResponse = sendAcceptRejectRequestSchema(req.query, res);
    if (validationResponse !== false) return;

    const { friendId } = req.query;

    const requestExist = await Models.Friend.findOne({
      where: { userId: req.user.id, friendId },
    });

    if (!requestExist) {
      return errorResponseWithoutData(res, messages.requestNotExists, 400);
    }

    await Models.Friend.destroy({
      where: { userId: req.user.id, friendId },
    });

    successResponseWithoutData(res, messages.requestRejectSuccess, 400);
  } catch (error) {
    console.log(error);

    return errorResponseWithoutData(res, messages.errorRejectingRequest, 400);
  }
};
