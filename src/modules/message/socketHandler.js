const jwt = require("jsonwebtoken");
const Models = require("../../models/index");

const userSockets = {}; // A mapping of userId to socket.id

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
  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);

    if (socket.userId) {
      userSockets[socket.userId] = socket.id;
    }

    // Send user details to the client
    socket.emit("userDetails", {
      username: socket.user.username, // Replace with the username field from the JWT
      id: socket.user.id,
    });

    // Listen for 'sendMessage' event
    socket.on("sendMessage", async (message, callback) => {
      const { receiverId, content } = message;

      if (!socket.userId) {
        return callback({ error: "Unauthorized: User ID not registered." });
      }

      const receiverSocketId = userSockets[receiverId];

      if (receiverSocketId) {
        io.to(receiverSocketId).emit("receiveMessage", {
          sender: socket.user,
          content: content,
        });

        await Models.Message.create({
          senderId: socket.userId,
          receiverId: receiverId,
          content: content,
          isRead: true,
        });

        callback({ success: true });
      } else {
        await Models.Message.create({
          senderId: socket.userId,
          receiverId: receiverId,
          content: content,
        });
        callback({ success: true });
      }
    });

    // Handle disconnection
    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.id}`);
      if (socket.userId && userSockets[socket.userId]) {
        delete userSockets[socket.userId]; // Remove the userId mapping
      }
    });
  });
}

module.exports = initializeSocket;