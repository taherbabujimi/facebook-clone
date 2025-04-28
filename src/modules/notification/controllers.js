const {
  errorResponseWithoutData,
  successResponseData,
  successResponseWithoutData,
} = require("../../services/responses");
const { messages } = require("./messages");
const Models = require("../../models/index");
const { notificationStatus } = require("../../services/constants");
const { cloudinary } = require("../../config/cloudinary");
const { markNotificationsReadSchema } = require("./validations");
const { Op } = require("sequelize");

module.exports.getAllNotifications = async (req, res) => {
  try {
    const notification = await Models.Notification.findAll({
      where: { recipientId: req.user.id, status: notificationStatus[0] },
      include: [
        {
          model: Models.User,
          as: "sender",
          attributes: ["username", "profilePublicId"],
        },
      ],
    });

    const data = [];

    notification.map((item) => {
      let middleMessage = "";

      if (item.dataValues.type === "postLike") {
        middleMessage = "liked on your post";
      } else if (item.dataValues.type === "postComment") {
        middleMessage = "commented on your post";
      } else if (item.dataValues.type === "commentReply") {
        middleMessage = "replied on your comment";
      } else if (item.dataValues.type === "friendRequest") {
        middleMessage = "sent you a friend request";
      } else if (item.dataValues.type === "friendAccept") {
        middleMessage = "accepted your friend request";
      } else if (item.dataValues.type === "friendReject") {
        middleMessage = "rejected your friend request";
      }

      data.push({
        message: `${item.dataValues.sender.dataValues.username} ${middleMessage}`,
        senderProfilePic: item.dataValues.sender.dataValues.profilePublicId
          ? cloudinary.url(item.dataValues.sender.dataValues.profilePublicId)
          : null,
        createdAt: item.dataValues.createdAt,
        entityId: item.dataValues.entityId,
        entityType: item.dataValues.entityType,
      });
    });

    return successResponseData(
      res,
      data,
      200,
      messages.fetchNotificationSuccess
    );
  } catch (error) {
    console.log(error);

    return errorResponseWithoutData(
      res,
      `${messages.errorGettingNotification}: ${error}`,
      400
    );
  }
};

module.exports.markNotificationsRead = async (req, res) => {
  try {
    const validationResponse = markNotificationsReadSchema(req.body, res);
    if (validationResponse !== false) return;

    const { notificationIds } = req.body;

    const promiseArray = [];

    notificationIds.map((item) => {
      promiseArray.push(
        Models.Notification.findOne({
          where: { id: item, recipientId: req.user.id },
        })
      );
    });

    const promiseData = await Promise.all(promiseArray);

    if (promiseData.includes(null)) {
      return errorResponseWithoutData(res, messages.notificationNotExists, 400);
    }

    await Models.Notification.update(
      {
        status: "read",
      },
      {
        where: {
          id: { [Op.in]: notificationIds },
          recipientId: req.user.id,
        },
      }
    );

    return successResponseWithoutData(
      res,
      messages.markNotificationsReadSuccess,
      200
    );
  } catch (error) {
    console.log(error);

    return errorResponseWithoutData(
      res,
      `${messages.errorMarkingAllNotificationsRead}: ${error}`,
      400
    );
  }
};
