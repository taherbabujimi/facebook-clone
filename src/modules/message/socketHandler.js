const jwt = require("jsonwebtoken");
const Models = require("../../models/index");
const Sequelize = require("sequelize");

// Track online users and their socket connections
const userSockets = {}; // Mapping of userId to socket.id

function initializeSocket(io) {
  // Middleware to authenticate socket connections
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error("Authentication error"));
    }

    try {
      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      socket.user = decoded; // Attach user info to the socket
      socket.userId = decoded.id;
      next();
    } catch (error) {
      next(new Error("Invalid token"));
    }
  });

  // Handle socket connection events
  io.on("connection", async (socket) => {
    // Add userId and socket.id to userSockets
    userSockets[socket.userId] = socket.id;

    // Send user details to the client
    socket.emit("userDetails", {
      username: socket.user.username,
      id: socket.user.id,
    });

    // Start a new direct conversation or get existing one
    socket.on("startConversation", async (data, callback) => {
      try {
        const { recipientId } = data;

        if (recipientId === socket.userId) {
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

        // Check if a direct conversation already exists between these users
        const existingRoom = await Models.Room.findOne({
          include: [
            {
              model: Models.RoomParticipant,
              as: "participants",
              where: {
                userId: {
                  [Sequelize.Op.in]: [socket.userId, recipientId],
                },
              },
              required: true,
            },
          ],
          // Use subquery to find rooms with exactly 2 participants with these IDs
          where: {
            id: {
              [Sequelize.Op.in]: Sequelize.literal(`(
                SELECT "roomId"
                FROM "roomParticipants"
                WHERE "userId" IN (:userId, :recipientId)
                GROUP BY "roomId"
                HAVING COUNT(DISTINCT "userId") = 2
              )`),
            },
          },
          replacements: {
            userId: socket.userId,
            recipientId: recipientId,
          },
        });

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

        // Create a new room
        const room = await Models.Room.create({
          name: null, // No name for direct chats
        });

        // Add both users as participants
        await Models.RoomParticipant.create({
          roomId: room.id,
          userId: socket.userId,
        });

        await Models.RoomParticipant.create({
          roomId: room.id,
          userId: recipientId,
        });

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
        console.error("Error starting conversation:", error);
        callback({ success: false, error: "Failed to start conversation" });
      }
    });

    // Send message to a conversation
    socket.on("sendMessage", async (messageData, callback) => {
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

        callback({ success: true, messageId: message.id });
      } catch (error) {
        console.error("Error sending message:", error);
        callback({ success: false, error: "Failed to send message" });
      }
    });

    // Mark messages as read
    socket.on("markAsRead", async (data, callback) => {
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

        callback({ success: true, messagesRead: updatedMessages[0] });
      } catch (error) {
        console.error("Error marking messages as read:", error);
        callback({ success: false, error: "Failed to mark messages as read" });
      }
    });

    // Load messages for a specific conversation
    socket.on("loadMessages", async (data, callback) => {
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
          ],
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

        callback({
          success: true,
          messages: messages.reverse(),
          page: page,
          hasMore: messages.length === limit,
        });
      } catch (error) {
        console.error("Error loading messages:", error);
        callback({ success: false, error: "Failed to load messages" });
      }
    });

    // Handle disconnection
    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.id}`);

      // Remove the user from userSockets
      if (socket.userId && userSockets[socket.userId]) {
        delete userSockets[socket.userId];
      }
    });
  });
}

module.exports = initializeSocket;
