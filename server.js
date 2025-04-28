require("dotenv").config();
const { client } = require("./src/config/redis");
const helmet = require("helmet");
const IndexRoute = require("./src/routers/IndexRoute");
const Express = require("express");
const http = require("http"); // Add this
const app = Express();
const server = http.createServer(app); // Create HTTP server
const { Server } = require("socket.io");
const io = new Server(server); // Attach Socket.IO to HTTP server
const { connectQueue } = require("./src/config/queue-config");
const path = require("path");

// defining port
const port = process.env.PORT || 7000;

// Serve static files from your message view directory
app.use(
  "/static",
  Express.static(path.join(__dirname, "src", "modules", "message", "view"))
);

app.get("/chat", (req, res) => {
  res.sendFile(
    path.join(__dirname, "src", "modules", "message", "view", "chat.html")
  );
});

// For parsing the express payloads
app.use(helmet());
app.use(Express.json());
app.use(Express.urlencoded({ extended: true }));

// CORS permission
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  next();
});

app.use("/", IndexRoute);

// Handle Socket.IO connections
io.on("connection", (socket) => {
  console.log("A user connected");

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });

  socket.on("chat message", (msg) => {
    console.log("message: " + msg);
    io.emit("chat message", msg);
  });
});

// Connect to Redis first, then start the server
client
  .connect()
  .then(() => {
    server.listen(port, () => {
      // Listen on the HTTP server
      console.log("Server started on port", port);
      console.log("DB connected to", process.env.DB_HOST);
      connectQueue();
    });
  })
  .catch((err) => {
    console.log("Error while connecting to redis:", err);
  });
