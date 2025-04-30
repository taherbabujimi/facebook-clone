const {
  errorResponseWithoutData,
  successResponseData,
} = require("../../services/responses");
const { messages } = require("./messages");
const { getMessageHistorySchema } = require("./validations");
const Models = require("../../models/index");
const { Op } = require("sequelize");

module.exports.getMessageHistory = async (req, res) => {
  try {
    const validationResponse = getMessageHistorySchema(req.query, res);
    if (validationResponse !== false) return;

    const { receiverId } = req.query;

    const userExists = await Models.User.findByPk(receiverId);

    if (!userExists) {
      return errorResponseWithoutData(res, messages.userNotExists, 400);
    }

    // Fetch messages along with the sender's username
    const messages = await Models.Message.findAll({
      where: {
        [Op.or]: [
          { senderId: req.user.id, receiverId: receiverId },
          { senderId: receiverId, receiverId: req.user.id },
        ],
      },
      include: [
        {
          model: Models.User, // Assuming User model is associated with Message
          as: "sender", // Alias for the sender
          attributes: ["username"], // Fetch only the username
        },
      ],
      order: [["createdAt", "ASC"]],
    });

    // Map messages to include the username
    const formattedMessages = messages.map((message) => ({
      id: message.id,
      content: message.content,
      senderId: message.senderId,
      receiverId: message.receiverId,
      username: message.sender?.username || "Unknown", // Use "Unknown" if username is missing
      createdAt: message.createdAt,
    }));

    return successResponseData(
      res,
      formattedMessages,
      200,
      messages.historyFetchedSuccess
    );
  } catch (error) {
    console.log(error);

    return errorResponseWithoutData(
      res,
      `${messages.errorGettingHistory}: ${error}`,
      400
    );
  }
};
