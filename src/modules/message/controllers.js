const {
  errorResponseWithoutData,
  successResponseData,
} = require("../../services/responses");
const { messages } = require("./messages");
const {
  getMessageHistorySchema,
  sendPostInChatSchema,
} = require("./validations");
const Models = require("../../models/index");
const { Op } = require("sequelize");
const { cloudinary } = require("../../config/cloudinary");

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

module.exports.sendPostInChat = async (req, res) => {
  try {
    const validationResponse = sendPostInChatSchema(req.body);
    if (validationResponse !== false) return;

    const { roomId, postId } = req.body;

    const roomExists = await Models.Room.findByPk(roomId);

    if (!roomExists) {
      return errorResponseWithoutData(res, messages.roomNotExists, 400);
    }

    const postExists = await Models.Post.findByPk(postId);

    if (!postExists) {
      return errorResponseWithoutData(res, messages.postNotExists, 400);
    }

    const message = await Models.Message.create({
      roomId,
      senderId: req.user.id,
      content: "message content is the shared post",
      postId: postId,
    });

    return successResponseData(res, message, 200, messages.postSendSuccess);
  } catch (error) {
    console.log(error);

    return errorResponseWithoutData(res, messages.errorSendingPost, 400);
  }
};

module.exports.startConversation = async (
  data,
  socket,
  callback,
  userSockets,
  io
) => {
  // Start a transaction to ensure data consistency
  let transaction;

  try {
    const { recipientId } = data;

    // Basic validation checks
    if (recipientId == socket.userId) {
      return callback({
        success: false,
        error: "Cannot start conversation with yourself",
      });
    }

    // Check if recipient exists
    const recipient = await Models.User.findByPk(recipientId);
    if (!recipient) {
      return callback({ success: false, error: "Recipient not found" });
    }

    // Check if either user has blocked the other
    const blockedUser = await Models.BlockedUser.findOne({
      where: {
        [Op.or]: [
          { blockedBy: recipientId, blockedUser: socket.userId },
          { blockedBy: socket.userId, blockedUser: recipientId },
        ],
      },
    });

    if (blockedUser) {
      return callback({
        success: false,
        error:
          "Either user with provided ID has blocked you or user is in your blocked list.",
      });
    }

    // Find rooms where both users are participants (safer approach)
    const userRooms = await Models.RoomParticipant.findAll({
      where: {
        userId: socket.userId,
      },
      attributes: ["roomId"],
    });

    const userRoomIds = userRooms.map((room) => room.roomId);

    // If the user has no rooms, we can skip this check
    let existingRoom = null;
    if (userRoomIds.length > 0) {
      // Find rooms where the recipient is also a participant
      const commonRooms = await Models.RoomParticipant.findAll({
        where: {
          roomId: { [Op.in]: userRoomIds },
          userId: recipientId,
        },
        include: [
          {
            model: Models.Room,
            as: "room",
          },
        ],
      });

      // For direct messages, we want a room with exactly 2 participants
      for (const roomParticipant of commonRooms) {
        // Count participants in this room
        const participantCount = await Models.RoomParticipant.count({
          where: { roomId: roomParticipant.roomId },
        });

        if (participantCount === 2) {
          existingRoom = roomParticipant.room;
          break;
        }
      }
    }

    if (existingRoom) {
      // If a room exists, join it
      socket.join(`room:${existingRoom.id}`);

      // Return the existing room
      return callback({
        success: true,
        roomId: existingRoom.id,
        recipient: {
          id: recipient.id,
          username: recipient.username,
        },
      });
    }

    transaction = await Models.sequelize.transaction();

    // Create a new room
    const room = await Models.Room.create(
      {
        name: null, // No name for direct chats
      },
      { transaction }
    );

    // Add both users as participants
    await Models.RoomParticipant.create(
      {
        roomId: room.id,
        userId: socket.userId,
      },
      { transaction }
    );

    await Models.RoomParticipant.create(
      {
        roomId: room.id,
        userId: recipientId,
      },
      { transaction }
    );

    // Commit the transaction
    await transaction.commit();

    // Subscribe the current user to this room
    socket.join(`room:${room.id}`);

    // If the recipient is online, subscribe them too
    const recipientSocketId = userSockets[recipientId];
    if (recipientSocketId) {
      const recipientSocket = io.sockets.sockets.get(recipientSocketId);
      if (recipientSocket) {
        recipientSocket.join(`room:${room.id}`);
      }
    }

    callback({
      success: true,
      roomId: room.id,
      recipient: {
        id: recipient.id,
        username: recipient.username,
      },
    });
  } catch (error) {
    // Rollback transaction in case of error
    if (transaction) {
      await transaction.rollback();
    }

    console.log(error);
    return callback({ success: false, error: error });
  }
};

module.exports.sendMessage = async (
  messageData,
  socket,
  callback,
  userSockets,
  io
) => {
  try {
    const { roomId, content } = messageData;

    // Check if user is part of the room
    const participation = await Models.RoomParticipant.findOne({
      where: {
        roomId: roomId,
        userId: socket.userId,
      },
    });

    if (!participation) {
      return callback({
        success: false,
        error: "You are not a participant of this conversation",
      });
    }

    // Create message in database
    const message = await Models.Message.create({
      roomId: roomId,
      senderId: socket.userId,
      content: content,
      isRead: false, // Initialize as unread
    });

    // Find the other participant
    const otherParticipant = await Models.RoomParticipant.findOne({
      where: {
        roomId: roomId,
        userId: { [Models.Sequelize.Op.ne]: socket.userId },
      },
    });

    // Broadcast message to the room (which includes both participants if online)
    io.to(`room:${roomId}`).emit("receiveMessage", {
      id: message.id,
      roomId: roomId,
      senderId: socket.userId,
      senderName: socket.user.username,
      content: content,
      createdAt: message.createdAt,
      isRead: false,
    });

    // If the other participant is online, mark as delivered
    const recipientSocketId = userSockets[otherParticipant.userId];
    if (recipientSocketId) {
      // Message is delivered but not yet read
    } else {
      // Recipient is offline, message will be marked as delivered when they connect
    }

    return callback({ success: true, messageId: message.id });
  } catch (error) {
    return callback({ success: false, error: error });
  }
};

module.exports.deleteMessage = async (data, callback, io, socket) => {
  let transaction;
  try {
    const { messageId } = data;

    // Check if message exists and belongs to the user
    const message = await Models.Message.findOne({
      where: {
        id: messageId,
        senderId: socket.userId,
      },
      include: [
        {
          model: Models.Room,
          as: "room",
          attributes: ["id"],
        },
      ],
    });

    if (!message) {
      return callback({
        success: false,
        error: "Message not found or you don't have permission to delete it",
      });
    }

    transaction = await Models.sequelize.transaction();

    await Models.MessageReaction.destroy({
      where: { messageId },
      transaction,
    });

    // Delete message from database
    await Models.Message.destroy({
      where: { id: messageId, senderId: socket.userId },
      transaction,
    });

    await transaction.commit();

    // Notify room about the deleted message
    io.to(`room:${message.room.id}`).emit("messageDeleted", {
      messageId: messageId,
      roomId: message.room.id,
      deletedBy: socket.userId,
    });

    return callback({ success: true });
  } catch (error) {
    await transaction.rollback();

    console.log("ERROR: ", error);

    return callback({ success: false, error: error });
  }
};

module.exports.markAsRead = async (data, callback, io, socket, userSockets) => {
  try {
    const { roomId } = data;

    // Update all unread messages in this room sent by the other participant
    const updatedMessages = await Models.Message.update(
      { isRead: true },
      {
        where: {
          roomId: roomId,
          senderId: { [Models.Sequelize.Op.ne]: socket.userId },
          isRead: false,
        },
        returning: true,
      }
    );

    // Find the other participant
    const otherParticipant = await Models.RoomParticipant.findOne({
      where: {
        roomId: roomId,
        userId: { [Models.Sequelize.Op.ne]: socket.userId },
      },
    });

    // Notify other participant that messages were read if they're online
    const recipientSocketId = userSockets[otherParticipant.userId];
    if (recipientSocketId) {
      io.to(recipientSocketId).emit("messagesRead", {
        roomId,
        readBy: socket.userId,
      });
    }

    return callback({ success: true, messagesRead: updatedMessages[0] });
  } catch (error) {
    console.log(error);

    return callback({ success: false, error: error });
  }
};

module.exports.loadMessages = async (
  data,
  callback,
  io,
  socket,
  userSockets
) => {
  try {
    const { roomId, page = 1, limit = 20 } = data;

    // Check if user is part of the room
    const participation = await Models.RoomParticipant.findOne({
      where: {
        roomId: roomId,
        userId: socket.userId,
      },
    });

    if (!participation) {
      return callback({
        success: false,
        error: "You are not a participant of this conversation",
      });
    }

    // Get messages with pagination
    const offset = (page - 1) * limit;

    const messages = await Models.Message.findAll({
      where: { roomId: roomId },
      limit: limit,
      offset: offset,
      order: [["id", "DESC"]],
      include: [
        {
          model: Models.User,
          as: "sender",
          attributes: ["id", "username"],
        },
        {
          model: Models.MessageReaction,
          as: "reactions",
        },
        {
          model: Models.Post,
          as: "post",
        },
      ],
    });

    messages.map((message) => {
      if (message.dataValues.post) {
        message.dataValues.post.dataValues = {
          ...message.dataValues.post.dataValues,
          fileUrl: cloudinary.url(
            message.dataValues.post.dataValues.filePublicId,
            {
              resource_type:
                message.dataValues.post.dataValues.fileResourceType,
            } // Add this option
          ),
        };
      }
    });

    // Mark messages from other user as read
    await Models.Message.update(
      { isRead: true },
      {
        where: {
          roomId: roomId,
          senderId: { [Models.Sequelize.Op.ne]: socket.userId },
          isRead: false,
        },
      }
    );

    // Find the other participant to notify them
    const otherParticipant = await Models.RoomParticipant.findOne({
      where: {
        roomId: roomId,
        userId: { [Models.Sequelize.Op.ne]: socket.userId },
      },
    });

    // Notify other participant that messages were read if they're online
    const recipientSocketId = userSockets[otherParticipant.userId];
    if (recipientSocketId) {
      io.to(recipientSocketId).emit("messagesRead", {
        roomId,
        readBy: socket.userId,
      });
    }

    return callback({
      success: true,
      messages: messages.reverse(),
      page: page,
      hasMore: messages.length === limit,
    });
  } catch (error) {
    console.log(error);

    return callback({
      success: false,
      error: error,
    });
  }
};

module.exports.addReaction = async (data, callback, io) => {
  try {
    const { messageId, reaction, userId } = data;

    // Check if the user has already reacted
    const alreadyReactedByUser = await Models.MessageReaction.findOne({
      where: { messageId, userId, reactionType: reaction },
    });

    if (alreadyReactedByUser) {
      console.error("User already reacted to the message");

      return callback({
        success: false,
        error: "User already reacted to the message",
      });
    }

    // Add the reaction
    await Models.MessageReaction.create({
      messageId,
      userId,
      reactionType: reaction,
    });

    // Fetch updated reactions for the message
    const updatedReactions = await Models.MessageReaction.findAll({
      where: { messageId },
      attributes: ["reactionType", "userId"],
    });

    // Notify all participants in the room about the updated reactions
    const message = await Models.Message.findByPk(messageId, {
      attributes: ["roomId"],
    });

    io.to(`room:${message.roomId}`).emit("messageReactionUpdated", {
      messageId,
      roomId: message.roomId,
      reactions: updatedReactions,
    });

    return callback({ success: true });
  } catch (error) {
    console.log(error);

    return callback({ success: false, error: error });
  }
};

module.exports.removeReaction = async (data, callback, io) => {
  try {
    const { messageId, reaction, userId } = data;

    // Remove the reaction
    await Models.MessageReaction.destroy({
      where: { messageId, userId, reactionType: reaction },
    });

    // Fetch updated reactions for the message
    const updatedReactions = await Models.MessageReaction.findAll({
      where: { messageId },
      attributes: ["reactionType", "userId"],
    });

    // Notify all participants in the room about the updated reactions
    const message = await Models.Message.findByPk(messageId, {
      attributes: ["roomId"],
    });

    io.to(`room:${message.roomId}`).emit("messageReactionUpdated", {
      messageId,
      roomId: message.roomId,
      reactions: updatedReactions,
    });

    return callback({ success: true });
  } catch (error) {
    console.log(error);

    return callback({ success: false, error: error });
  }
};
