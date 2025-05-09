const jwt = require("jsonwebtoken");
const {
  startConversation,
  sendMessage,
  deleteMessage,
  markAsRead,
  loadMessages,
  addReaction,
  removeReaction,
} = require("./controllers");

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
        const response = await startConversation(
          data,
          socket,
          callback,
          userSockets,
          io
        );

        return response;
      } catch (error) {
        console.error("Error starting conversation:", error);
        callback({ success: false, error: "Failed to start conversation" });
      }
    });

    // Send message to a conversation
    socket.on("sendMessage", async (messageData, callback) => {
      try {
        const response = await sendMessage(
          messageData,
          socket,
          callback,
          userSockets,
          io
        );

        return response;
      } catch (error) {
        console.error("Error sending message:", error);
        callback({ success: false, error: "Failed to send message" });
      }
    });

    // Delete a message
    socket.on("deleteMessage", async (data, callback) => {
      try {
        const response = await deleteMessage(data, callback, io, socket);

        return response;
      } catch (error) {
        console.error("Error deleting message:", error);
        callback({ success: false, error: "Failed to delete message" });
      }
    });

    // Mark messages as read
    socket.on("markAsRead", async (data, callback) => {
      try {
        const response = await markAsRead(
          data,
          callback,
          io,
          socket,
          userSockets
        );

        return response;
      } catch (error) {
        console.error("Error marking messages as read:", error);

        callback({ success: false, error: "Failed to mark messages as read" });
      }
    });

    // Load messages for a specific conversation
    socket.on("loadMessages", async (data, callback) => {
      try {
        const response = await loadMessages(
          data,
          callback,
          io,
          socket,
          userSockets
        );

        return response;
      } catch (error) {
        console.error("Error loading messages:", error);
        callback({ success: false, error: "Failed to load messages" });
      }
    });

    socket.on("addReaction", async (data, callback) => {
      try {
        const response = await addReaction(data, callback, io);

        return response;
      } catch (error) {
        console.error("Error adding reaction to the message: ", error);

        callback({
          success: false,
          error: "Failed to add reaction to the message",
        });
      }
    });

    socket.on("removeReaction", async (data, callback) => {
      try {
        const response = await removeReaction(data, callback, io);

        return response;
      } catch (error) {
        console.error("Error removing reaction from the message: ", error);
        callback({
          success: false,
          error: "Failed to remove reaction from the message",
        });
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
